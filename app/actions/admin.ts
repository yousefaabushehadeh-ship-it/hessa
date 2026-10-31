"use server";

import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { demoPlatform } from "@/lib/demo-platform";
import { requireRole } from "@/lib/session";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { createTeacherPage, demoTeacherPage } from "@/lib/teacher-pages";

// The Hessa team's actions. Each one checks the admin role, then writes with the service key
// (protect_fields stops even an admin's own session from changing verification fields).

const done = () => revalidatePath("/", "layout");

/** Approve a teacher who signed up: their documents are marked approved and their public page is created. */
export async function approveApplicant(userId: string): Promise<void> {
  await requireRole("admin");
  if (DEMO_MODE) {
    const a = demoPlatform.applicants.find((x) => x.userId === userId);
    if (!a || a.teacherId) return;
    const { demoVerification } = await import("@/lib/verification");
    a.teacherId = demoTeacherPage({ name: a.name, subject: a.subject, grade: a.grade, city: a.city, verified: true, photoUrl: demoVerification.photos[userId] ?? null });
    for (const d of demoVerification.docs[userId] ?? []) if (d.status === "pending") d.status = "approved";
    return done();
  }
  const db = supabaseAdmin();
  const { data: p } = await db.from("profiles").select("full_name, teach_subject, teach_grade, city, photo_url, role").eq("id", userId).maybeSingle();
  if (!p || p.role !== "teacher") return;
  const { data: has } = await db.from("teachers").select("id").eq("user_id", userId).maybeSingle();
  if (!has) await createTeacherPage({ userId, name: p.full_name, subject: p.teach_subject ?? "", grade: p.teach_grade ?? "", city: p.city ?? "", verified: true, photoUrl: p.photo_url });
  await db.from("teacher_documents").update({ status: "approved" }).eq("user_id", userId).eq("status", "pending");
  done();
}

/** Approve or reject one document. A rejected one shows the reason to the teacher so they can upload again. */
export async function reviewDoc(userId: string, docId: string, approve: boolean, fd?: FormData): Promise<void> {
  await requireRole("admin");
  const note = approve ? null : String(fd?.get("note") ?? "").trim().slice(0, 300) || null;
  if (DEMO_MODE) {
    const { demoVerification } = await import("@/lib/verification");
    const d = (demoVerification.docs[userId] ?? []).find((x) => x.id === docId);
    if (d) Object.assign(d, { status: approve ? "approved" : "rejected", note });
    return done();
  }
  await supabaseAdmin().from("teacher_documents").update({ status: approve ? "approved" : "rejected", note }).eq("id", docId).eq("user_id", userId);
  done();
}

/** Take a teacher's page down (or put it back up). */
export async function setTeacherVerified(teacherId: string, verified: boolean): Promise<void> {
  await requireRole("admin");
  if (DEMO_MODE) {
    const x = TEACHERS.find((y) => y.id === teacherId);
    if (x) x.verified = verified;
    return done();
  }
  await supabaseAdmin().from("teachers").update({ verified }).eq("id", teacherId);
  done();
}

/** Verifying a school also publishes the teachers it added; un-verifying takes them down. */
export async function setSchoolVerified(schoolId: string, verified: boolean): Promise<void> {
  await requireRole("admin");
  if (DEMO_MODE) {
    const sc = demoPlatform.schools.find((x) => x.id === schoolId);
    if (sc) sc.verified = verified;
    for (const x of TEACHERS) if (x.schoolId === schoolId) x.verified = verified;
    return done();
  }
  const db = supabaseAdmin();
  await db.from("schools").update({ verified }).eq("id", schoolId);
  await db.from("teachers").update({ verified }).eq("school_id", schoolId);
  done();
}

export async function setReviewHidden(id: string, hidden: boolean): Promise<void> {
  await requireRole("admin");
  if (DEMO_MODE) {
    demoPlatform.hiddenReviews = hidden ? [...demoPlatform.hiddenReviews, id] : demoPlatform.hiddenReviews.filter((x) => x !== id);
    return done();
  }
  // Through the admin's own session: the review_fill trigger only lets is_admin() change the flag.
  await (await supabaseServer()).from("reviews").update({ hidden }).eq("id", id);
  done();
}
