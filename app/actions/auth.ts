"use server";

import { getT } from "@/lib/i18n-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE, DEMO_OTP, OTP_CHANNEL, SITE_URL } from "@/lib/env";
import { toE164 } from "@/lib/phone";
import { DEMO_SCHOOL_ID, DEMO_STUDENT, DEMO_TEACHER_ID, TEACHERS } from "@/lib/demo-data";
import { DEMO_SUBS_COOKIE } from "@/lib/data";
import { demoPlatform } from "@/lib/demo-platform";
import { GRADES, SUBJECT_LIST, TEACHER_GRADES } from "@/lib/catalog";
import { createTeacherPage, demoTeacherPage } from "@/lib/teacher-pages";
import { DEMO_COOKIE, getSession, homeFor } from "@/lib/session";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { Session } from "@/lib/types";

export type Portal = "student" | "teacher" | "school" | "admin";

export type LoginState = {
  step: "phone" | "otp" | "profile";
  phone?: string;
  as?: Portal;
  /** Where to go after sign-in (only same-site paths). */
  next?: string;
  /** Came from the sign-up page, so the demo asks for a name. */
  signup?: boolean;
  /** How the code was sent, so the code step can say "WhatsApp" or "SMS". */
  channel?: "whatsapp" | "sms";
  /** A short note on the code step, e.g. after sending the code again. */
  notice?: string;
  error?: string;
};

const safeNext = (v: string | undefined) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/student");
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

async function setDemoSession(s: Session) {
  (await cookies()).set(DEMO_COOKIE, JSON.stringify(s), COOKIE_OPTS);
}

export async function sendOtp(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const phone = toE164(fd.get("dial"), fd.get("phone"));
  const raw = String(fd.get("as"));
  const as: Portal = raw === "teacher" || raw === "school" || raw === "admin" ? raw : "student";
  const next = String(fd.get("next") ?? "") || undefined;
  const signup = fd.get("signup") === "1" || undefined;
  if (!phone) return { step: "phone", as, next, signup, error: t("Enter a valid mobile number with its country code.") };
  if (!fd.get("agree")) return { step: "phone", phone, as, next, signup, error: t("You must agree to the terms and privacy policy.") };
  const error = await deliverOtp(phone);
  if (error) return { step: "phone", phone, as, next, signup, error: t(error) };
  return { step: "otp", phone, as, next, signup, channel: OTP_CHANNEL };
}

/** Sends the login code (WhatsApp by default). Returns an English error to translate, or nothing. */
async function deliverOtp(phone: string): Promise<string | undefined> {
  if (DEMO_MODE) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: OTP_CHANNEL } });
  if (!error) return;
  console.error("sendOtp failed", error.status, error.code, error.message);
  // Supabase lets a number ask for a new code once a minute.
  if (error.status === 429 || /rate limit|seconds/i.test(error.message)) return "Please wait a minute before asking for a new code.";
  return "We couldn't send the code. Please try again shortly.";
}

/** "Send the code again" on the code step. */
export async function resendOtp(prev: LoginState): Promise<LoginState> {
  const t = await getT();
  if (!prev.phone?.startsWith("+")) return { step: "phone", as: prev.as, next: prev.next, signup: prev.signup };
  const error = await deliverOtp(prev.phone);
  if (error) return { ...prev, notice: undefined, error: t(error) };
  return { ...prev, channel: OTP_CHANNEL, error: undefined, notice: t("We sent you a new code.") };
}

export async function verifyOtp(prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const token = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (token.length !== 6) return { ...prev, notice: undefined, error: t("The code has 6 digits.") };

  if (DEMO_MODE) {
    if (token !== DEMO_OTP) return { ...prev, notice: undefined, error: t("Wrong code. Check it and try again.") };
    // Signing in to the demo opens that portal's demo account; only sign-up asks for a name.
    if (!prev.signup) {
      if (prev.as === "admin") {
        await setDemoSession({ userId: "demo-admin", role: "admin", fullName: "فريق حِصّة", consent: "not_needed" });
        redirect("/admin");
      }
      if (prev.as === "school") {
        const school = demoPlatform.schools.find((x) => x.id === DEMO_SCHOOL_ID)!;
        await setDemoSession({ userId: school.ownerId, role: "school", fullName: school.ownerName, schoolId: school.id, consent: "not_needed" });
        redirect("/school");
      }
      if (prev.as === "teacher") {
        await setDemoSession({ userId: "3b8e1d47-2a9c-4f60-8d15-6e7a0c9b2f34", role: "teacher", fullName: TEACHERS.find((x) => x.id === DEMO_TEACHER_ID)!.name, teacherId: DEMO_TEACHER_ID, consent: "not_needed" });
        redirect("/teacher");
      }
      await setDemoSession({ userId: DEMO_STUDENT.id, role: "student", fullName: DEMO_STUDENT.fullName, grade: "الثاني عشر علمي", consent: "not_needed" });
      redirect(safeNext(prev.next));
    }
    if (prev.as === "admin") return { ...prev, step: "phone", error: t("Admin accounts are created by the Hessa team.") };
    return { ...prev, step: "profile", error: undefined };
  }

  const supabase = await supabaseServer();
  // WhatsApp codes are checked the same way as SMS codes.
  const { data, error } = await supabase.auth.verifyOtp({ phone: prev.phone!, token, type: "sms" });
  if (error || !data.user) return { ...prev, notice: undefined, error: t("The code is wrong or has expired.") };
  const { data: profile } = await supabase.from("profiles").select("role, full_name, consent").eq("id", data.user.id).single();
  const role = (profile?.role ?? "student") as Session["role"];
  const isNew = role === "student" && !profile?.full_name;
  // Admins can come in through any portal. Everyone else uses the portal of their own account.
  if (role === "admin") redirect("/admin");
  if (prev.as === "admin") {
    await supabase.auth.signOut();
    return { step: "phone", as: prev.as, phone: prev.phone, error: t("This number isn't an admin account.") };
  }
  if (!isNew && role !== prev.as) {
    await supabase.auth.signOut();
    const where = { student: t("the student portal"), teacher: t("the teacher portal"), school: t("the school portal") }[role as "student" | "teacher" | "school"];
    return { step: "phone", as: prev.as, next: prev.next, phone: prev.phone, signup: prev.signup, error: t("This number already has an account. Sign in from {portal}.", { portal: where }) };
  }
  if (isNew) return { ...prev, step: "profile", error: undefined };
  redirect(role === "student" ? safeNext(prev.next) : homeFor(role));
}

const pick = (v: FormDataEntryValue | null, list: string[]) => {
  const x = String(v ?? "");
  return list.includes(x) ? x : "";
};

/**
 * Last step of teacher sign-up. A teacher their school already added by phone gets a page under
 * the school right away; everyone else uploads documents and waits for the team to verify them.
 */
async function completeTeacherProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const fullName = String(fd.get("name") ?? "").trim().slice(0, 80);
  const subject = pick(fd.get("subject"), SUBJECT_LIST);
  const grade = pick(fd.get("grade"), TEACHER_GRADES);
  if (fullName.length < 3) return { ...prev, error: t("Enter your full name.") };
  if (!subject) return { ...prev, error: t("Choose the subject you teach.") };
  if (!grade) return { ...prev, error: t("Choose the grade you teach.") };
  const phone = prev.phone!;

  if (DEMO_MODE) {
    const userId = `teacher-${prev.phone}`;
    const invite = demoPlatform.invites.find((x) => x.phone === phone && !x.used);
    let teacherId: string | undefined;
    if (invite) {
      const school = demoPlatform.schools.find((x) => x.id === invite.schoolId);
      teacherId = demoTeacherPage({ name: fullName, subject: invite.subject, grade: invite.grade, city: "", verified: Boolean(school?.verified), schoolId: invite.schoolId });
      invite.used = true;
    } else if (!demoPlatform.applicants.some((a) => a.userId === userId)) {
      demoPlatform.applicants.unshift({ userId, name: fullName, phone, subject, grade, city: "", createdAt: new Date().toISOString().slice(0, 10) });
    }
    // Without a page, the dashboard shows the verification steps, like the real flow.
    await setDemoSession({ userId, role: "teacher", fullName, teacherId, consent: "not_needed" });
    redirect("/teacher");
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", as: "teacher", signup: prev.signup, error: t("Your session has ended. Please sign in again.") };
  const uid = auth.user.id;
  await supabase.from("profiles").update({ full_name: fullName, teach_subject: subject, teach_grade: grade, is_minor: false }).eq("id", uid);
  // Users can't change their own role or consent (protect_fields), so the server does it.
  const admin = supabaseAdmin();
  await admin.from("profiles").update({ role: "teacher", consent: "not_needed" }).eq("id", uid).eq("role", "student");
  const { data: invite } = await admin
    .from("school_invites")
    .select("id, school_id, subject, grade, schools(verified)")
    .eq("phone", phone)
    .is("used_by", null)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (invite) {
    const school = invite.schools as unknown as { verified: boolean } | null;
    const id = await createTeacherPage({ userId: uid, name: fullName, subject: invite.subject, grade: invite.grade, city: "", verified: Boolean(school?.verified), schoolId: invite.school_id });
    if (id) await admin.from("school_invites").update({ used_by: uid }).eq("id", invite.id);
  }
  redirect("/teacher");
}

/** Last step of school sign-up: the school's name. The team verifies the school before its teachers go public. */
async function completeSchoolProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const fullName = String(fd.get("name") ?? "").trim().slice(0, 80);
  const schoolName = String(fd.get("school") ?? "").trim().slice(0, 120);
  if (fullName.length < 3) return { ...prev, error: t("Enter your full name.") };
  if (schoolName.length < 3) return { ...prev, error: t("Enter the school's name.") };

  if (DEMO_MODE) {
    const id = `school-${prev.phone}`;
    if (!demoPlatform.schools.some((x) => x.id === id))
      demoPlatform.schools.unshift({ id, ownerId: `school-owner-${prev.phone}`, name: schoolName, city: "", verified: false, ownerName: fullName, createdAt: new Date().toISOString().slice(0, 10) });
    await setDemoSession({ userId: `school-owner-${prev.phone}`, role: "school", fullName, schoolId: id, demoSchool: { name: schoolName, city: "" }, consent: "not_needed" });
    redirect("/school");
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", as: "school", signup: prev.signup, error: t("Your session has ended. Please sign in again.") };
  const uid = auth.user.id;
  await supabase.from("profiles").update({ full_name: fullName, is_minor: false }).eq("id", uid);
  const admin = supabaseAdmin();
  await admin.from("profiles").update({ role: "school", consent: "not_needed" }).eq("id", uid).eq("role", "student");
  const { error } = await admin.from("schools").insert({ owner_id: uid, name: schoolName });
  if (error) return { ...prev, error: t("We couldn't create the school account.") };
  redirect("/school");
}

export async function completeProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  if (prev.as === "teacher") return completeTeacherProfile(prev, fd);
  if (prev.as === "school") return completeSchoolProfile(prev, fd);
  const t = await getT();
  const fullName = String(fd.get("name") ?? "").trim().slice(0, 80);
  const grade = pick(fd.get("grade"), GRADES);
  if (fullName.length < 3) return { ...prev, error: t("Enter your full name.") };
  if (!grade) return { ...prev, error: t("Choose your grade.") };

  if (DEMO_MODE) {
    await setDemoSession({ userId: DEMO_STUDENT.id, role: "student", fullName, grade, consent: "not_needed" });
    redirect(prev.next ? safeNext(prev.next) : "/student/find");
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", as: "student", signup: prev.signup, error: t("Your session has ended. Please sign in again.") };
  const uid = auth.user.id;
  await supabase.from("profiles").update({ full_name: fullName, grade }).eq("id", uid);
  // No parent approval step: the account is active right away. Users can't change consent themselves (protect_fields).
  await supabaseAdmin().from("profiles").update({ consent: "not_needed" }).eq("id", uid);
  // New students pick their subject and teacher next.
  redirect(prev.next ? safeNext(prev.next) : "/student/find");
}

/**
 * The private link a student can send a parent to follow their progress (/parent/[token]), no account needed.
 * Made the first time the student opens their home page.
 */
export async function myParentReportLink(): Promise<string | null> {
  if (DEMO_MODE) return `${SITE_URL}/parent/demo`;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("parent_consents")
    .select("token")
    .eq("student_id", auth.user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return `${SITE_URL}/parent/${data.token}`;
  const { data: made } = await admin.from("parent_consents").insert({ student_id: auth.user.id, parent_phone: "", status: "approved", approved_at: new Date().toISOString() }).select("token").single();
  return made ? `${SITE_URL}/parent/${made.token}` : null;
}

export async function signOut() {
  const t = await getT();
  if (DEMO_MODE) {
    const jar = await cookies();
    jar.delete(DEMO_COOKIE);
    jar.delete(DEMO_SUBS_COOKIE);
  } else {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export type DeleteState = { error?: string };

/** Deletes the account and everything tied to it (Jordan PDPL: the right to erasure). */
export async function deleteAccount(_prev: DeleteState, fd: FormData): Promise<DeleteState> {
  const t = await getT();
  const s = await getSession();
  if (!s) redirect("/");
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") return { error: t("Type DELETE to confirm.") };
  if (s.role === "admin") return { error: t("Admin accounts are removed by the Hessa team.") };
  if (DEMO_MODE) {
    const jar = await cookies();
    jar.delete(DEMO_COOKIE);
    jar.delete(DEMO_SUBS_COOKIE);
    redirect("/");
  }
  const admin = supabaseAdmin();
  // Files first: the rows that point to them go with the account.
  for (const bucket of ["submissions", "teacher-docs", "teacher-photos"]) {
    const { data } = await admin.storage.from(bucket).list(s.userId, { limit: 1000 });
    if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${s.userId}/${f.name}`));
  }
  // A teacher's public page comes down with the account.
  if (s.teacherId) await admin.from("teachers").update({ verified: false }).eq("id", s.teacherId);
  const { error } = await admin.auth.admin.deleteUser(s.userId);
  if (error) return { error: t("We couldn't delete the account. Please contact us.") };
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
