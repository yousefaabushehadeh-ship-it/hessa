"use server";

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
  const phone = cleanPhone(fd.get("phone"));
  const as = fd.get("as") === "teacher" ? "teacher" : "student";
  const next = String(fd.get("next") ?? "") || undefined;
  if (!PHONE_RE.test(phone)) return { step: "phone", as, next, error: "اكتب رقم أردني صحيح بيبدأ بـ 77 أو 78 أو 79." };
  if (!fd.get("agree")) return { step: "phone", phone, as, next, error: "لازم توافق على الشروط وسياسة الخصوصية." };
  if (!DEMO_MODE) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({ phone: `+962${phone}` });
    if (error) return { step: "phone", phone, as, next, error: "ما قدرنا نبعث الكود. جرّب كمان شوي." };
  }
  return { step: "otp", phone, as, next };
}

export async function verifyOtp(prev: LoginState, fd: FormData): Promise<LoginState> {
  const token = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (token.length !== 6) return { ...prev, error: "الكود من 6 أرقام." };

  if (DEMO_MODE) {
    if (token !== DEMO_OTP) return { ...prev, error: "الكود غلط. بنسخة العرض الكود هو 482913." };
    if (prev.as === "teacher") {
      const t = TEACHERS.find((x) => x.id === DEMO_TEACHER_ID)!;
      await setDemoSession({ userId: "demo-teacher", role: "teacher", fullName: t.name, teacherId: t.id, consent: "not_needed" });
      redirect("/teacher");
    }
    return { ...prev, step: "profile", error: undefined };
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({ phone: `+962${prev.phone}`, token, type: "sms" });
  if (error || !data.user) return { ...prev, error: "الكود غلط أو انتهت صلاحيته." };
  const { data: profile } = await supabase.from("profiles").select("role, full_name, consent").eq("id", data.user.id).single();
  if (profile?.role === "teacher" || profile?.role === "admin") redirect("/teacher");
  if (!profile?.full_name) return { ...prev, step: "profile", error: undefined };
  redirect(safeNext(prev.next));
}

export async function completeProfile(prev: LoginState, fd: FormData): Promise<LoginState> {
  const fullName = String(fd.get("name") ?? "").trim();
  const grade = String(fd.get("grade") ?? "");
  const isMinor = fd.get("age") !== "adult";
  const parentPhone = cleanPhone(fd.get("parent"));
  if (fullName.length < 3) return { ...prev, error: "اكتب اسمك الكامل." };
  if (isMinor && !PHONE_RE.test(parentPhone)) return { ...prev, error: "اكتب رقم ولي الأمر صحيح." };
  if (isMinor && parentPhone === prev.phone) return { ...prev, error: "رقم ولي الأمر لازم يكون غير رقمك." };

  if (DEMO_MODE) {
    await setDemoSession({ userId: DEMO_STUDENT.id, role: "student", fullName, consent: isMinor ? "pending" : "not_needed" });
    redirect(isMinor ? "/student" : safeNext(prev.next));
  }

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { step: "phone", error: "انتهت الجلسة. ادخل من جديد." };
  const uid = auth.user.id;
  await supabase.from("profiles").update({ full_name: fullName, grade, is_minor: isMinor, parent_phone: isMinor ? `+962${parentPhone}` : null }).eq("id", uid);
  if (!isMinor) {
    // Users can't change their own consent field (protect_fields), so the server does it.
    await supabaseAdmin().from("profiles").update({ consent: "not_needed" }).eq("id", uid);
    redirect(safeNext(prev.next));
  }
  const { error } = await supabase.from("parent_consents").insert({ student_id: uid, parent_phone: `+962${parentPhone}` });
  if (error) return { ...prev, error: "صار خطأ وإحنا بنجهّز طلب الموافقة." };
  // The student area shows the consent link until the parent approves.
  redirect("/student");
}

/** The link a student sends to their parent, while consent is pending. */
export async function myConsentLink(): Promise<string | null> {
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
