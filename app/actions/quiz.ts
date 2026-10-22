"use server";

import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { findLesson, getMySubscriptions } from "@/lib/data";
import { demo2 } from "@/lib/demo-store";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { QuizResult } from "@/lib/types";

export type QuizState = { result?: QuizResult; error?: string };

export async function submitQuiz(lessonId: string, _prev: QuizState, fd: FormData): Promise<QuizState> {
  const s = await requireRole("student");
  const count = Number(fd.get("count"));
  const answers = Array.from({ length: count }, (_, i) => {
    const v = fd.get(`q${i}`);
    return v === null ? -1 : Number(v);
  });
  if (answers.includes(-1)) return { error: "جاوب على كل الأسئلة قبل ما تسلّم." };

  if (DEMO_MODE) {
    const found = await findLesson(lessonId);
    const subs = await getMySubscriptions(s.userId);
    if (!found || !(found.lesson.isFree || subs.some((x) => x.teacherId === found.teacher.id))) return { error: "ما عندك صلاحية على هالاختبار." };
    const qs = demo2.quizzes[lessonId] ?? [];
    const correct = qs.map((q) => q.answer);
    const result = { score: correct.filter((c, i) => c === answers[i]).length, total: qs.length, correct, answers };
    demo2.attempts[`${s.userId}:${lessonId}`] = result;
    return { result };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("submit_quiz", { p_lesson: lessonId, p_answers: answers });
  if (error) return { error: "ما قدرنا نسلّم الاختبار. جرّب كمان مرة." };
  revalidatePath("/student", "layout");
  const r = data as { score: number; total: number; correct: number[] };
  return { result: { ...r, answers } };
}

// Teacher side ---------------------------------------------------------------

export type EditState = { ok?: string; error?: string };

async function ownQuizLesson(lessonId: string) {
  const s = await requireRole("teacher");
  const found = await findLesson(lessonId);
  if (!found || found.teacher.id !== s.teacherId || found.lesson.type !== "quiz") throw new Error("Not your quiz");
  return found;
}

const metaFor = (n: number) => (n === 1 ? "سؤال واحد" : n === 2 ? "سؤالين" : n <= 10 ? `${n} أسئلة` : `${n} سؤال`);

export async function addQuestion(lessonId: string, _prev: EditState, fd: FormData): Promise<EditState> {
  await ownQuizLesson(lessonId);
  const prompt = String(fd.get("prompt") ?? "").trim();
  const options = [0, 1, 2, 3].map((i) => String(fd.get(`o${i}`) ?? "").trim()).filter(Boolean);
  const answer = Number(fd.get("answer"));
  if (prompt.length < 3) return { error: "اكتب نص السؤال." };
  if (options.length < 2) return { error: "لازم خيارين على الأقل." };
  if (!(answer >= 0 && answer < options.length)) return { error: "اختار الجواب الصح من الخيارات المكتوبة." };

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
    if (error) return { error: "ما قدرنا نحفظ السؤال." };
    total = (count ?? 0) + 1;
    await supabase.from("lessons").update({ meta: metaFor(total) }).eq("id", lessonId);
  }
  revalidatePath("/", "layout");
  return { ok: `انضاف السؤال. صار بالاختبار ${metaFor(total)}.` };
}

export async function deleteQuestion(lessonId: string, questionId: string) {
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
