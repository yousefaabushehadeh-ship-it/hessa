"use server";

import { getT } from "@/lib/i18n-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE, DEMO_OTP, SITE_URL } from "@/lib/env";
import { DEMO_STUDENT, DEMO_TEACHER_ID, TEACHERS } from "@/lib/demo-data";
import { DEMO_SUBS_COOKIE } from "@/lib/data";
import { DEMO_COOKIE, getSession } from "@/lib/session";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { Session } from "@/lib/types";

export type LoginState = {
  step: "phone" | "otp" | "profile";
  phone?: string;
  as?: "student" | "teacher";
  /** Where to go after sign-in (only same-site paths). */
  next?: string;
  /** Came from the sign-up page, so the demo asks for a name. */
  signup?: boolean;
  error?: string;
};

const PHONE_RE = /^7[789]\d{7}$/;
const cleanPhone = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\D/g, "").replace(/^(962|0)/, "");
const safeNext = (v: string | undefined) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/student");
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

async function setDemoSession(s: Session) {
  (await cookies()).set(DEMO_COOKIE, JSON.stringify(s), COOKIE_OPTS);
}

export async function sendOtp(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const phone = cleanPhone(fd.get("phone"));
  const as = fd.get("as") === "teacher" ? "teacher" : "student";
  const next = String(fd.get("next") ?? "") || undefined;
  const signup = fd.get("signup") === "1" || undefined;
  if (!PHONE_RE.test(phone)) return { step: "phone", as, next, signup, error: t("Enter a valid Jordanian number starting with 77, 78 or 79.") };
  if (!fd.get("agree")) return { step: "phone", phone, as, next, signup, error: t("You must agree to the terms and privacy policy.") };
  if (!DEMO_MODE) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({ phone: `+962${phone}` });
    if (error) return { step: "phone", phone, as, next, signup, error: t("We couldn't send the code. Please try again shortly.") };
  }
  return { step: "otp", phone, as, next, signup };
}

export async function verifyOtp(prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const token = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (token.length !== 6) return { ...prev, error: t("The code has 6 digits.") };

  if (DEMO_MODE) {
    if (token !== DEMO_OTP) return { ...prev, error: t("Wrong code. Check it and try again.") };
    // Signing in to the demo opens that portal's demo account; only sign-up asks for a name.
    if (!prev.signup) {
      if (prev.as === "teacher") {
        await setDemoSession({ userId: "3b8e1d47-2a9c-4f60-8d15-6e7a0c9b2f34", role: "teacher", fullName: TEACHERS.find((x) => x.id === DEMO_TEACHER_ID)!.name, teacherId: DEMO_TEACHER_ID, consent: "not_needed" });
        redirect("/teacher");
      }
      await setDemoSession({ userId: DEMO_STUDENT.id, role: "student", fullName: DEMO_STUDENT.fullName, consent: "not_needed" });
      redirect(safeNext(prev.next));
    }
    return { ...prev, step: "profile", error: undefined };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({ phone: `+962${prev.phone}`, token, type: "sms" });
  if (error || !data.user) return { ...prev, error: t("The code is wrong or has expired.") };
  const { data: profile } = await supabase.from("profiles").select("role, full_name, consent").eq("id", data.user.id).single();
  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
  // Each portal only opens its own kind of account.
  if (isTeacher && prev.as !== "teacher") {
    await supabase.auth.signOut();
    return { step: "phone", as: prev.as, next: prev.next, phone: prev.phone, signup: prev.signup, error: t("This number belongs to a teacher account. Use the teacher portal.") };
  }
  if (!isTeacher && prev.as === "teacher" && profile?.full_name) {
    await supabase.auth.signOut();
    return { step: "phone", as: prev.as, phone: prev.phone, signup: prev.signup, error: t("This number belongs to a student account. Use the student portal.") };
  }
  if (isTeacher) redirect("/teacher");
  if (!profile?.full_name) return { ...prev, step: "profile", error: undefined };
  redirect(safeNext(prev.next));
}

/** Last step of teacher sign-up: name and subject, then the page waits for verification. */
async function completeTeacherProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  const t = await getT();
  const fullName = String(fd.get("name") ?? "").trim();
  const subject = String(fd.get("subject") ?? "").trim();
  if (fullName.length < 3) return { ...prev, error: t("Enter your full name.") };
  if (!subject) return { ...prev, error: t("Choose the subject you teach.") };

  if (DEMO_MODE) {
    // A new teacher has no page yet: the dashboard shows the verification steps, like the real flow.
    await setDemoSession({ userId: `teacher-${prev.phone}`, role: "teacher", fullName, consent: "not_needed" });
    redirect("/teacher");
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", as: "teacher", signup: prev.signup, error: t("Your session has ended. Please sign in again.") };
  const uid = auth.user.id;
  // For teachers, `grade` holds the subject they teach until their page is set up.
  await supabase.from("profiles").update({ full_name: fullName, grade: subject, is_minor: false }).eq("id", uid);
  // Users can't change their own role or consent (protect_fields), so the server does it.
  // A teacher role alone opens nothing: the dashboard waits until an admin links a verified page.
  await supabaseAdmin().from("profiles").update({ role: "teacher", consent: "not_needed" }).eq("id", uid).eq("role", "student");
  redirect("/teacher");
}

export async function completeProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  if (prev.as === "teacher") return completeTeacherProfile(prev, fd);
  const t = await getT();
  const fullName = String(fd.get("name") ?? "").trim();
  const grade = String(fd.get("grade") ?? "");
  const isMinor = fd.get("age") !== "adult";
  const parentPhone = cleanPhone(fd.get("parent"));
  if (fullName.length < 3) return { ...prev, error: t("Enter your full name.") };
  if (isMinor && !PHONE_RE.test(parentPhone)) return { ...prev, error: t("Enter a valid parent's number.") };
  if (isMinor && parentPhone === prev.phone) return { ...prev, error: t("The parent's number must be different from yours.") };

  if (DEMO_MODE) {
    await setDemoSession({ userId: DEMO_STUDENT.id, role: "student", fullName, consent: isMinor ? "pending" : "not_needed" });
    redirect(isMinor ? "/student" : safeNext(prev.next));
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", as: "student", signup: prev.signup, error: t("Your session has ended. Please sign in again.") };
  const uid = auth.user.id;
  await supabase.from("profiles").update({ full_name: fullName, grade, is_minor: isMinor, parent_phone: isMinor ? `+962${parentPhone}` : null }).eq("id", uid);
  if (!isMinor) {
    // Users can't change their own consent field (protect_fields), so the server does it.
    await supabaseAdmin().from("profiles").update({ consent: "not_needed" }).eq("id", uid);
    redirect(safeNext(prev.next));
  }
  const { error } = await supabase.from("parent_consents").insert({ student_id: uid, parent_phone: `+962${parentPhone}` });
  if (error) return { ...prev, error: t("Something went wrong while preparing the approval request.") };
  // The student area shows the consent link until the parent approves.
  redirect("/student");
}

/** The link a student sends to their parent, while consent is pending. */
export async function myConsentLink(): Promise<string | null> {
  const t = await getT();
  if (DEMO_MODE) return `${SITE_URL}/consent/demo`;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("parent_consents")
    .select("token")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? `${SITE_URL}/consent/${data.token}` : null;
}

export async function approveConsent(token: string): Promise<boolean> {
  const t = await getT();
  if (DEMO_MODE) {
    const s = await getSession();
    if (s) await setDemoSession({ ...s, consent: "approved" });
    return token === "demo";
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("approve_consent", { p_token: token });
  return Boolean(data);
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
