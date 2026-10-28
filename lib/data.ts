import { cookies } from "next/headers";
import { DEMO_MODE } from "@/lib/env";
import { DEMO_STUDENT, DEMO_TEACHER_ID, TEACHERS } from "@/lib/demo-data";
import { supabaseServer } from "@/lib/supabase/server";
import type { Lesson, Subscription, Teacher, TeacherFilters, Unit } from "@/lib/types";

// Every page reads through these functions, so the same UI runs on sample data
// (demo mode) or on Supabase once the keys are set.

export const DEMO_SUBS_COOKIE = "hessa_demo_subs";

type TeacherRow = {
  id: string; slug: string; name: string; initial: string; subject: string; grade: string; city: string;
  years: number; rating: number; review_count: number; student_count: number; price_month: number;
  price_term: number; color: string; badge: string | null; headline: string; education: string;
  live_schedule: string; bio: string; verified: boolean; photo_url: string | null;
  units?: { id: string; title: string; position: number; lessons: { id: string; title: string; type: Lesson["type"]; meta: string; is_free: boolean; position: number }[] }[];
};

const TEACHER_COLS =
  "id, slug, name, initial, subject, grade, city, years, rating, review_count, student_count, price_month, price_term, color, badge, headline, education, live_schedule, bio, verified, photo_url";

function fromRow(r: TeacherRow): Teacher {
  const units: Unit[] = (r.units ?? [])
    .map((u) => ({
      id: u.id,
      title: u.title,
      position: u.position,
      lessons: u.lessons
        .map((l) => ({ id: l.id, title: l.title, type: l.type, meta: l.meta, isFree: l.is_free, position: l.position }))
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);
  return {
    id: r.id, slug: r.slug, name: r.name, initial: r.initial, subject: r.subject, grade: r.grade, city: r.city,
    years: r.years, rating: Number(r.rating), reviewCount: r.review_count, studentCount: r.student_count,
    priceMonth: Number(r.price_month), priceTerm: Number(r.price_term), color: r.color, badge: r.badge,
    headline: r.headline, education: r.education, liveSchedule: r.live_schedule, bio: r.bio, verified: r.verified, photoUrl: r.photo_url, units,
  };
}

export function applyFilters(list: Teacher[], f: TeacherFilters): Teacher[] {
  const q = f.q?.trim() ?? "";
  const out = list.filter(
    (t) =>
      (!f.subject || t.subject === f.subject) &&
      (!f.grade || t.grade === f.grade) &&
      (!f.city || t.city === f.city) &&
      (!q || (t.name + t.subject + t.headline).includes(q)),
  );
  return out.sort((a, b) =>
    f.sort === "price" ? a.priceMonth - b.priceMonth : f.sort === "students" ? b.studentCount - a.studentCount : b.rating - a.rating,
  );
}

export async function listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  if (DEMO_MODE) return applyFilters(TEACHERS, filters);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("teachers").select(TEACHER_COLS).eq("verified", true);
  if (error) throw error;
  return applyFilters((data as TeacherRow[]).map(fromRow), filters);
}

export async function getTeacherBySlug(slug: string): Promise<Teacher | null> {
  if (DEMO_MODE) return TEACHERS.find((t) => t.slug === slug) ?? null;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("teachers")
    .select(`${TEACHER_COLS}, units(id, title, position, lessons(id, title, type, meta, is_free, position))`)
    .eq("slug", slug)
    .maybeSingle();
  return data ? fromRow(data as TeacherRow) : null;
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  if (DEMO_MODE) return TEACHERS.find((t) => t.id === id) ?? null;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("teachers")
    .select(`${TEACHER_COLS}, units(id, title, position, lessons(id, title, type, meta, is_free, position))`)
    .eq("id", id)
    .maybeSingle();
  return data ? fromRow(data as TeacherRow) : null;
}

export async function getMySubscriptions(userId: string): Promise<Subscription[]> {
  if (DEMO_MODE) {
    const raw = (await cookies()).get(DEMO_SUBS_COOKIE)?.value;
    if (raw) {
      try {
        return JSON.parse(raw) as Subscription[];
      } catch {
        /* fall through to the default demo list */
      }
    }
    return DEMO_STUDENT.subscriptions;
  }
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("subscriptions")
    .select("teacher_id, plan, ends_on")
    .eq("student_id", userId)
    .eq("status", "active")
    .gte("ends_on", new Date().toISOString().slice(0, 10));
  const subs = data ?? [];
  // Progress = finished lessons / all lessons of that teacher.
  const { data: done } = await supabase.from("lesson_progress").select("lesson_id, lessons(units(teacher_id))").eq("student_id", userId);
  const doneBy: Record<string, number> = {};
  for (const d of (done ?? []) as unknown as { lessons: { units: { teacher_id: string } } }[]) {
    const tid = d.lessons?.units?.teacher_id;
    if (tid) doneBy[tid] = (doneBy[tid] ?? 0) + 1;
  }
  const out: Subscription[] = [];
  for (const s of subs) {
    const t = await getTeacherById(s.teacher_id);
    const total = t?.units.reduce((a, u) => a + u.lessons.length, 0) ?? 0;
    out.push({ teacherId: s.teacher_id, plan: s.plan, endsOn: s.ends_on, progress: total ? Math.round(((doneBy[s.teacher_id] ?? 0) / total) * 100) : 0 });
  }
  return out;
}

export async function getCompletedLessons(userId: string): Promise<Set<string>> {
  if (DEMO_MODE) return new Set(["khaled-u0-l0", "khaled-u0-l1", "khaled-u2-l2"]);
  const supabase = await supabaseServer();
  const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("student_id", userId);
  return new Set((data ?? []).map((r) => r.lesson_id as string));
}

export type FoundLesson = { teacher: Teacher; unit: Unit; lesson: Lesson; storagePath: string | null; videoId: string | null };

export async function findLesson(lessonId: string): Promise<FoundLesson | null> {
  if (DEMO_MODE) {
    for (const teacher of TEACHERS)
      for (const unit of teacher.units)
        for (const lesson of unit.lessons) if (lesson.id === lessonId) return { teacher, unit, lesson, storagePath: null, videoId: null };
    return null;
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.from("lessons").select("id, storage_path, video_id, units(teacher_id)").eq("id", lessonId).maybeSingle();
  if (!data) return null;
  const tid = (data.units as unknown as { teacher_id: string }).teacher_id;
  const teacher = await getTeacherById(tid);
  if (!teacher) return null;
  for (const unit of teacher.units)
    for (const lesson of unit.lessons) if (lesson.id === lessonId) return { teacher, unit, lesson, storagePath: data.storage_path, videoId: data.video_id };
  return null;
}

export type CodeRow = { code: string; plan: "monthly" | "term"; usedBy: string | null; createdAt: string };

// Demo codes live in memory for the lifetime of the server process (see demo-data.ts on globalThis).
const demoCodes: CodeRow[] = [
  { code: "HS-KHALED-01", plan: "monthly", usedBy: null, createdAt: "2026-10-18" },
  { code: "HS-KHALED-02", plan: "term", usedBy: null, createdAt: "2026-10-18" },
  { code: "HS-7KQ2-M9", plan: "monthly", usedBy: "ليان الخوالدة", createdAt: "2026-10-12" },
];
const g = globalThis as unknown as { __hessaStore?: { codes: CodeRow[] } };
export const demoStore = (g.__hessaStore ??= { codes: demoCodes });

export async function listMyCodes(teacherId: string): Promise<CodeRow[]> {
  if (DEMO_MODE) return demoStore.codes;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("activation_codes")
    .select("code, plan, used_by, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => ({ code: r.code, plan: r.plan, usedBy: r.used_by, createdAt: String(r.created_at).slice(0, 10) }));
}

export type TeacherStats = { activeStudents: number; codesLeft: number; lessons: number; freeLessons: number };

export async function getTeacherStats(teacher: Teacher, codes: CodeRow[]): Promise<TeacherStats> {
  const lessons = teacher.units.flatMap((u) => u.lessons);
  let activeStudents = teacher.studentCount;
  if (!DEMO_MODE) {
    const supabase = await supabaseServer();
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacher.id)
      .eq("status", "active");
    activeStudents = count ?? 0;
  }
  return { activeStudents, codesLeft: codes.filter((c) => !c.usedBy).length, lessons: lessons.length, freeLessons: lessons.filter((l) => l.isFree).length };
}

export function demoTeacherId() {
  return DEMO_TEACHER_ID;
}
