import { DEMO_MODE } from "@/lib/env";
import { DEMO_STUDENT, TEACHERS } from "@/lib/demo-data";
import { supabaseServer } from "@/lib/supabase/server";
import type { Lesson, Teacher } from "@/lib/types";

// Student analysis, one source for three readers:
//   the teacher sees each of their students in detail, the parent sees their child
//   across all teachers, and the school sees totals per teacher only.
// With Supabase, the numbers come from the functions in 0006_student_analysis.sql.

export type QuizScore = { title: string; score: number; total: number; tries: number };
export type WorksheetMark = { title: string; status: "submitted" | "graded"; mark: string | null; feedback: string | null; at: string };
export type StudentStatus = "on_track" | "follow_up" | "inactive";

export type StudentReport = {
  lessonsDone: number;
  lessonsTotal: number;
  /** Finished lessons out of all of this teacher's lessons, 0 to 100. */
  progress: number;
  worksheetsTotal: number;
  quizzes: QuizScore[];
  worksheets: WorksheetMark[];
  /** Average of the last try on each quiz, 0 to 100, or null before any quiz. */
  quizAvg: number | null;
  /** Quizzes under 60% on the last try: where the student needs help. */
  weak: string[];
  lastActive: string | null;
  status: StudentStatus;
};

export type ReportTeacher = Pick<Teacher, "id" | "name" | "slug" | "subject" | "color" | "initial"> & { photoUrl?: string | null };
export type ParentReport = { name: string; grade: string | null; teachers: (StudentReport & { teacher: ReportTeacher; plan: "monthly" | "term"; endsOn: string })[] };
export type SchoolTeacherStats = { teacherId: string; students: number; avgProgress: number; avgQuiz: number | null; activeWeek: number; needFollowUp: number };

type RawReport = {
  lessons_done: number;
  lessons_total: number;
  worksheets_total: number;
  quizzes: QuizScore[];
  worksheets: WorksheetMark[];
  last_active: string | null;
};

const WEEK = 7 * 864e5;

/** Turns raw counts into the numbers people read, and decides who needs a follow-up. */
export function finishReport(r: RawReport): StudentReport {
  const progress = r.lessons_total ? Math.round((r.lessons_done / r.lessons_total) * 100) : 0;
  const pcts = r.quizzes.filter((q) => q.total > 0).map((q) => (q.score / q.total) * 100);
  const quizAvg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const weak = r.quizzes.filter((q) => q.total > 0 && q.score / q.total < 0.6).map((q) => q.title);
  const quiet = !r.last_active || Date.now() - Date.parse(r.last_active) > WEEK;
  const status: StudentStatus = quiet ? "inactive" : progress < 30 || (quizAvg !== null && quizAvg < 60) ? "follow_up" : "on_track";
  return {
    lessonsDone: r.lessons_done,
    lessonsTotal: r.lessons_total,
    progress,
    worksheetsTotal: r.worksheets_total,
    quizzes: r.quizzes,
    worksheets: r.worksheets,
    quizAvg,
    weak,
    lastActive: r.last_active,
    status,
  };
}

// Demo ---------------------------------------------------------------------------------

/** Sample students for the demo teacher; ids match lib/students.ts. */
const DEMO_PEOPLE: Record<string, { name: string; progress: number; skill: number; daysAgo: number }> = {
  "demo-0": { name: "ليان الخوالدة", progress: 92, skill: 0.95, daysAgo: 0 },
  "demo-1": { name: "عبدالرحمن بني هاني", progress: 78, skill: 0.8, daysAgo: 1 },
  "demo-2": { name: "محمد الشريف", progress: 68, skill: 0.67, daysAgo: 2 },
  "demo-3": { name: "تالا العبادي", progress: 61, skill: 0.55, daysAgo: 3 },
  "demo-4": { name: "سارة الرواشدة", progress: 55, skill: 0.7, daysAgo: 4 },
  "demo-5": { name: "كرم الحياري", progress: 40, skill: 0.34, daysAgo: 5 },
  "demo-6": { name: "زيد العدوان", progress: 23, skill: 0.5, daysAgo: 12 },
  "demo-7": { name: "رهف المعايطة", progress: 12, skill: 0.4, daysAgo: 20 },
};

const FEEDBACK = ["ممتاز، استمر هيك.", "شغل منيح، راجع السؤال الأخير.", "في أخطاء بالإشارات، ارجع لفيديو الدرس."];

function demoRaw(teacher: Teacher, progress: number, skill: number, daysAgo: number): RawReport {
  const lessons: Lesson[] = teacher.units.flatMap((u) => u.lessons);
  const n = Math.round((progress / 100) * lessons.length);
  const done = lessons.slice(0, n);
  // Show a quiz mark for anyone who got going, so the sample reads like a real record.
  const quiz = lessons.find((l) => l.type === "quiz");
  if (quiz && n >= 3 && !done.includes(quiz)) done[n - 1] = quiz;
  const at = (k: number) => new Date(Date.now() - (daysAgo + k) * 864e5).toISOString();
  const quizzes = done
    .filter((l) => l.type === "quiz")
    .map((l, i) => {
      const total = Number(l.meta.match(/\d+/)?.[0] ?? 10) || 10;
      const score = Math.max(0, Math.min(total, Math.round(total * (skill - i * 0.08))));
      return { title: l.title, score, total, tries: score === total ? 1 : 2 };
    });
  const worksheets = done
    .filter((l) => l.type === "worksheet")
    .map((l, i): WorksheetMark => {
      const graded = skill > 0.5;
      return { title: l.title, status: graded ? "graded" : "submitted", mark: graded ? `${Math.round(skill * 10)}/10` : null, feedback: graded ? FEEDBACK[skill > 0.8 ? 0 : 1] : null, at: at(i + 1) };
    });
  return {
    lessons_done: n,
    lessons_total: lessons.length,
    worksheets_total: lessons.filter((l) => l.type === "worksheet").length,
    quizzes,
    worksheets,
    last_active: n ? at(0) : null,
  };
}

function seedOf(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
}

// Reads ----------------------------------------------------------------------------------

/** One of the teacher's own students, or null if they aren't subscribed. */
export async function getTeacherStudentReport(teacher: Teacher, studentId: string): Promise<(StudentReport & { name: string }) | null> {
  if (DEMO_MODE) {
    const p = DEMO_PEOPLE[studentId];
    if (!p) return null;
    // Keep the same progress the students list shows.
    return { name: p.name, ...finishReport(demoRaw(teacher, p.progress, p.skill, p.daysAgo)), progress: p.progress };
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("teacher_student_report", { p_student: studentId });
  if (!data) return null;
  const raw = data as RawReport & { name: string };
  return { name: raw.name || "طالب", ...finishReport(raw) };
}

/** The child's report for the parent's link. The demo link is /parent/demo. */
export async function getParentReport(token: string): Promise<ParentReport | null> {
  if (DEMO_MODE) {
    if (token !== "demo") return null;
    const skills: Record<string, number> = { khaled: 0.72, sami: 0.45 };
    return {
      name: DEMO_STUDENT.fullName,
      grade: "الثاني عشر علمي",
      teachers: DEMO_STUDENT.subscriptions.flatMap((sub, i) => {
        const tc = TEACHERS.find((x) => x.id === sub.teacherId);
        if (!tc) return [];
        const report = finishReport(demoRaw(tc, sub.progress, skills[tc.id] ?? 0.6, i * 3));
        return [{ ...report, teacher: tc, plan: sub.plan, endsOn: sub.endsOn }];
      }),
    };
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("parent_report", { p_token: token });
  if (!data) return null;
  const raw = data as { name: string; grade: string | null; teachers: (RawReport & ReportTeacher & { plan: "monthly" | "term"; ends_on: string })[] };
  return {
    name: raw.name || "",
    grade: raw.grade,
    teachers: raw.teachers.map((x) => ({
      ...finishReport(x),
      teacher: { id: x.id, name: x.name, slug: x.slug, subject: x.subject, color: x.color, initial: x.initial },
      plan: x.plan,
      endsOn: x.ends_on,
    })),
  };
}

/** Totals per teacher for the signed-in school. No student names or single marks. */
export async function getSchoolStats(schoolId: string): Promise<SchoolTeacherStats[]> {
  if (DEMO_MODE) {
    return TEACHERS.filter((x) => x.schoolId === schoolId).map((x) => {
      const s = seedOf(x.id);
      const students = 40 + (s % 60);
      return { teacherId: x.id, students, avgProgress: 45 + (s % 30), avgQuiz: 60 + (s % 25), activeWeek: Math.round(students * 0.7), needFollowUp: Math.round(students * 0.18) };
    });
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("school_stats");
  return ((data ?? []) as { teacher_id: string; students: number; avg_progress: number; avg_quiz: number | null; active_week: number; need_follow_up: number }[]).map((r) => ({
    teacherId: r.teacher_id,
    students: r.students,
    avgProgress: r.avg_progress,
    avgQuiz: r.avg_quiz,
    activeWeek: r.active_week,
    needFollowUp: r.need_follow_up,
  }));
}
