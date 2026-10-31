"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { findLesson, getMySubscriptions } from "@/lib/data";
import { demoPlatform } from "@/lib/demo-platform";
import { getT } from "@/lib/i18n-server";
import { getSession, requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

const TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
const MAX_MB = 10;

async function canHandIn(userId: string, lessonId: string) {
  const found = await findLesson(lessonId);
  if (!found || found.lesson.type !== "worksheet") return false;
  if (found.lesson.isFree) return true;
  return (await getMySubscriptions(userId)).some((x) => x.teacherId === found.teacher.id);
}

export type HandInTicket = { signedUrl: string; path: string };

/** Step 1: check the file and hand the browser a one-time upload URL in the student's own folder. */
export async function startHandIn(lessonId: string, type: string, size: number): Promise<{ ticket?: HandInTicket; demo?: boolean; error?: string }> {
  const t = await getT();
  const s = await requireRole("student");
  if (!TYPES[type] || size > MAX_MB * 1024 * 1024) return { error: t("Upload a photo or a PDF under {n} MB.", { n: MAX_MB }) };
  if (!(await canHandIn(s.userId, lessonId))) return { error: t("You don't have access to this worksheet.") };
  if (DEMO_MODE) return { demo: true };
  const path = `${s.userId}/${lessonId}/${randomUUID()}.${TYPES[type]}`;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage.from("submissions").createSignedUploadUrl(path);
  if (error || !data) return { error: t("We couldn't prepare the upload. Please try again shortly.") };
  return { ticket: { signedUrl: data.signedUrl, path } };
}

/** Step 2: record the hand-in so the teacher sees it. */
export async function finishHandIn(lessonId: string, fileName: string, path: string | null, note: string): Promise<{ ok?: string; error?: string }> {
  const t = await getT();
  const s = await requireRole("student");
  const name = fileName.slice(0, 120) || "solution";
  const text = note.trim().slice(0, 500);
  if (DEMO_MODE) {
    if (!(await canHandIn(s.userId, lessonId))) return { error: t("You don't have access to this worksheet.") };
    demoPlatform.submissions.unshift({
      id: randomUUID(), lessonId, studentId: s.userId, studentName: s.fullName, fileName: name, note: text,
      status: "submitted", mark: null, feedback: null, createdAt: new Date().toISOString().slice(0, 10),
    });
  } else {
    if (!path || !path.startsWith(`${s.userId}/${lessonId}/`)) return { error: t("We couldn't upload the file.") };
    const supabase = await supabaseServer();
    // RLS checks the folder and that the student can open the lesson.
    const { error } = await supabase.from("worksheet_submissions").insert({ lesson_id: lessonId, student_id: s.userId, file_name: name, storage_path: path, note: text });
    if (error) return { error: t("We couldn't save your hand-in. Please try again.") };
    await supabase.from("lesson_progress").upsert({ student_id: s.userId, lesson_id: lessonId });
  }
  revalidatePath(`/student/lesson/${lessonId}`);
  revalidatePath("/teacher/worksheets");
  return { ok: t("Handed in! Your teacher will mark it and you'll see the comment here.") };
}

/** Students can take a hand-in back until it is marked. */
export async function withdrawHandIn(id: string, lessonId: string): Promise<void> {
  const s = await requireRole("student");
  if (DEMO_MODE) {
    demoPlatform.submissions = demoPlatform.submissions.filter((x) => !(x.id === id && x.studentId === s.userId && x.status === "submitted"));
  } else {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("worksheet_submissions").delete().eq("id", id).eq("status", "submitted").select("storage_path").maybeSingle();
    if (data) await supabase.storage.from("submissions").remove([data.storage_path]);
  }
  revalidatePath(`/student/lesson/${lessonId}`);
}

export type GradeState = { ok?: string; error?: string };

/** The teacher's mark and comment. */
export async function gradeHandIn(id: string, _prev: GradeState, fd: FormData): Promise<GradeState> {
  const t = await getT();
  const s = await getSession();
  if (!s || (s.role !== "teacher" && s.role !== "admin")) return { error: t("Only the teacher can mark this.") };
  const mark = String(fd.get("mark") ?? "").trim().slice(0, 20);
  const feedback = String(fd.get("feedback") ?? "").trim().slice(0, 1000);
  if (!mark) return { error: t("Write a mark, for example 8/10.") };
  if (DEMO_MODE) {
    const sub = demoPlatform.submissions.find((x) => x.id === id);
    const found = sub ? await findLesson(sub.lessonId) : null;
    if (!sub || (s.role === "teacher" && found?.teacher.id !== s.teacherId)) return { error: t("Only the teacher can mark this.") };
    Object.assign(sub, { status: "graded", mark, feedback });
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.rpc("grade_submission", { p_id: id, p_mark: mark, p_feedback: feedback });
    if (error) return { error: t("We couldn't save the mark.") };
  }
  revalidatePath("/teacher/worksheets");
  return { ok: t("Saved. The student can see your mark now.") };
}
