import { DEMO_MODE } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import type { StudentRow, Teacher } from "@/lib/types";

const DEMO_ROWS: StudentRow[] = [
  ["ليان الخوالدة", "term", "2027-01-10", 92, "3/3"],
  ["عبدالرحمن بني هاني", "term", "2027-01-02", 78, "3/3"],
  ["محمد الشريف", "monthly", "2026-11-12", 68, "2/3"],
  ["تالا العبادي", "monthly", "2026-11-05", 61, "2/3"],
  ["سارة الرواشدة", "term", "2026-12-20", 55, null],
  ["كرم الحياري", "monthly", "2026-11-18", 40, "1/3"],
  ["زيد العدوان", "monthly", "2026-10-28", 23, null],
  ["رهف المعايطة", "monthly", "2026-10-25", 12, null],
].map(([name, plan, endsOn, progress, lastQuiz], i) => ({
  id: `demo-${i}`,
  name: name as string,
  plan: plan as StudentRow["plan"],
  endsOn: endsOn as string,
  progress: progress as number,
  lastQuiz: lastQuiz as string | null,
}));

/** The teacher's active students with progress through this teacher's lessons. */
export async function listMyStudents(teacher: Teacher): Promise<StudentRow[]> {
  if (DEMO_MODE) return DEMO_ROWS;
  const supabase = await supabaseServer();
  const today = new Date().toISOString().slice(0, 10);
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("student_id, plan, ends_on, profiles(full_name)")
    .eq("teacher_id", teacher.id)
    .eq("status", "active")
    .gte("ends_on", today);
  const rows = (subs ?? []) as unknown as { student_id: string; plan: StudentRow["plan"]; ends_on: string; profiles: { full_name: string } | null }[];
  if (!rows.length) return [];
  const lessonIds = teacher.units.flatMap((u) => u.lessons.map((l) => l.id));
  const ids = rows.map((r) => r.student_id);
  const { data: done } = await supabase.from("lesson_progress").select("student_id, lesson_id").in("student_id", ids).in("lesson_id", lessonIds);
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("student_id, score, total, created_at")
    .in("student_id", ids)
    .in("lesson_id", lessonIds)
    .order("created_at", { ascending: false });
  const count: Record<string, number> = {};
  for (const d of done ?? []) count[d.student_id] = (count[d.student_id] ?? 0) + 1;
  const last: Record<string, string> = {};
  for (const a of attempts ?? []) last[a.student_id] ??= `${a.score}/${a.total}`;
  return rows
    .map((r) => ({
      id: r.student_id,
      name: r.profiles?.full_name || "طالب",
      plan: r.plan,
      endsOn: r.ends_on,
      progress: lessonIds.length ? Math.round(((count[r.student_id] ?? 0) / lessonIds.length) * 100) : 0,
      lastQuiz: last[r.student_id] ?? null,
    }))
    .sort((a, b) => b.progress - a.progress);
}
