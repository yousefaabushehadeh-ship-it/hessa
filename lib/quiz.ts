import { DEMO_MODE } from "@/lib/env";
import { demo2 } from "@/lib/demo-store";
import { supabaseServer } from "@/lib/supabase/server";
import type { QuizQuestion, QuizQuestionFull, QuizResult } from "@/lib/types";

/** Questions without answers. The caller has already checked lesson access. */
export async function getQuizForStudent(lessonId: string): Promise<QuizQuestion[]> {
  if (DEMO_MODE) return (demo2.quizzes[lessonId] ?? []).map(({ id, prompt, options }) => ({ id, prompt, options }));
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("quiz_for_student", { p_lesson: lessonId });
  if (error) return [];
  return (data as { id: string; prompt: string; options: string[] }[]).map(({ id, prompt, options }) => ({ id, prompt, options }));
}

export async function getLastAttempt(userId: string, lessonId: string): Promise<QuizResult | null> {
  if (DEMO_MODE) return demo2.attempts[`${userId}:${lessonId}`] ?? null;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("score, total, answers")
    .eq("student_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  // Right answers are only revealed after an attempt, through submit_quiz; here we
  // just show the score.
  return { score: data.score, total: data.total, answers: data.answers, correct: [] };
}

/** For the teacher's own quiz editor (RLS limits this to their lessons). */
export async function getQuizFull(lessonId: string): Promise<QuizQuestionFull[]> {
  if (DEMO_MODE) return demo2.quizzes[lessonId] ?? [];
  const supabase = await supabaseServer();
  const { data } = await supabase.from("quiz_questions").select("id, prompt, options, answer").eq("lesson_id", lessonId).order("position");
  return (data ?? []) as QuizQuestionFull[];
}

export type QuizStats = { attempts: number; average: number | null };

export async function getQuizStats(lessonId: string): Promise<QuizStats> {
  const rows = DEMO_MODE
    ? Object.entries(demo2.attempts).filter(([k]) => k.endsWith(`:${lessonId}`)).map(([, v]) => v)
    : (((await (await supabaseServer()).from("quiz_attempts").select("score, total").eq("lesson_id", lessonId)).data ?? []) as { score: number; total: number }[]);
  if (!rows.length) return { attempts: 0, average: null };
  const avg = rows.reduce((a, r) => a + r.score / r.total, 0) / rows.length;
  return { attempts: rows.length, average: Math.round(avg * 100) };
}
