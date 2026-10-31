"use server";

import { getT } from "@/lib/i18n-server";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { findLesson, getMySubscriptions } from "@/lib/data";
import { DEMO_MAX_TRIES, demo2 } from "@/lib/demo-store";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { QuizResult } from "@/lib/types";

export type QuizState = { result?: QuizResult; error?: string };

export async function submitQuiz(lessonId: string, _prev: QuizState, fd: FormData): Promise<QuizState> {
  const t = await getT();
  const s = await requireRole("student");
  const count = Number(fd.get("count"));
  const answers = Array.from({ length: count }, (_, i) => {
    const v = fd.get(`q${i}`);
    return v === null ? -1 : Number(v);
  });
  if (answers.includes(-1)) return { error: t("Answer every question before you submit.") };

  if (DEMO_MODE) {
    const found = await findLesson(lessonId);
    const subs = await getMySubscriptions(s.userId);
    if (!found || !(found.lesson.isFree || subs.some((x) => x.teacherId === found.teacher.id))) return { error: t("You don't have access to this quiz.") };
    const key = `${s.userId}:${lessonId}`;
    const tries = (demo2.tries ??= {});
    const used = tries[key] ?? 0;
    if (used >= DEMO_MAX_TRIES) return { error: t("You've used all your tries for this quiz.") };
    tries[key] = used + 1;
    const qs = demo2.quizzes[lessonId] ?? [];
    const answerKey = qs.map((q) => q.answer);
    const score = answerKey.filter((c, i) => c === answers[i]).length;
    const left = DEMO_MAX_TRIES - tries[key];
    const result = { score, total: qs.length, correct: left === 0 || score === qs.length ? answerKey : [], answers, left };
    demo2.attempts[key] = result;
    return { result };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("submit_quiz", { p_lesson: lessonId, p_answers: answers });
  if (error)
    return { error: error.message.includes("no_attempts_left") ? t("You've used all your tries for this quiz.") : t("We couldn't submit the quiz. Please try again.") };
  revalidatePath("/student", "layout");
  const r = data as { score: number; total: number; correct: number[] | null; left: number };
  return { result: { score: r.score, total: r.total, correct: r.correct ?? [], left: r.left, answers } };
}

// Teacher side ---------------------------------------------------------------

export type EditState = { ok?: string; error?: string };

async function ownQuizLesson(lessonId: string) {
  const s = await requireRole("teacher");
  const found = await findLesson(lessonId);
  if (!found || found.teacher.id !== s.teacherId || found.lesson.type !== "quiz") throw new Error("Not your quiz");
  return found;
}

// Stored in lessons.meta, so it is written in English like the rest of the new data.
const metaFor = (n: number) => (n === 1 ? "1 question" : `${n} questions`);

export async function addQuestion(lessonId: string, _prev: EditState, fd: FormData): Promise<EditState> {
  const t = await getT();
  await ownQuizLesson(lessonId);
  const prompt = String(fd.get("prompt") ?? "").trim();
  const options = [0, 1, 2, 3].map((i) => String(fd.get(`o${i}`) ?? "").trim()).filter(Boolean);
  const answer = Number(fd.get("answer"));
  if (prompt.length < 3) return { error: t("Write the question.") };
  if (options.length < 2) return { error: t("You need at least two options.") };
  if (!(answer >= 0 && answer < options.length)) return { error: t("Choose the correct answer from the options you wrote.") };

  let total: number;
  if (DEMO_MODE) {
    const list = (demo2.quizzes[lessonId] ??= []);
    list.push({ id: `q${Date.now()}`, prompt, options, answer });
    total = list.length;
    const lesson = TEACHERS.flatMap((t) => t.units.flatMap((u) => u.lessons)).find((l) => l.id === lessonId);
    if (lesson) lesson.meta = metaFor(total);
  } else {
    const supabase = await supabaseServer();
    const { count } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId);
    const { error } = await supabase.from("quiz_questions").insert({ lesson_id: lessonId, position: count ?? 0, prompt, options, answer });
    if (error) return { error: t("We couldn't save the question.") };
    total = (count ?? 0) + 1;
    await supabase.from("lessons").update({ meta: metaFor(total) }).eq("id", lessonId);
  }
  revalidatePath("/", "layout");
  return { ok: t("The question was added. The quiz now has {meta}.", { meta: metaFor(total) }) };
}

export async function deleteQuestion(lessonId: string, questionId: string) {
  const t = await getT();
  await ownQuizLesson(lessonId);
  if (DEMO_MODE) {
    const list = demo2.quizzes[lessonId] ?? [];
    demo2.quizzes[lessonId] = list.filter((q) => q.id !== questionId);
  } else {
    const supabase = await supabaseServer();
    await supabase.from("quiz_questions").delete().eq("id", questionId).eq("lesson_id", lessonId);
    const { count } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId);
    await supabase.from("lessons").update({ meta: metaFor(count ?? 0) }).eq("id", lessonId);
  }
  revalidatePath("/", "layout");
}
