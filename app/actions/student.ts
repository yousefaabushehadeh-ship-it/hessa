"use server";

import { getLang, getT } from "@/lib/i18n-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { DEMO_SUBS_COOKIE, demoStore, getMySubscriptions } from "@/lib/data";
import { requireRole } from "@/lib/session";
import { fmtDate } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";

export type RedeemState = { ok?: string; error?: string };

export async function redeemCode(_prev: RedeemState, fd: FormData): Promise<RedeemState> {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (code.length < 6) return { error: t("Enter the code exactly as your teacher gave it to you.") };

  if (DEMO_MODE) {
    const c = demoStore.codes.find((x) => x.code === code && !x.usedBy);
    if (!c) return { error: t("The code is wrong or has already been used.") };
    c.usedBy = s.fullName;
    const subs = (await getMySubscriptions(s.userId)).filter((x) => x.teacherId !== "khaled");
    const ends = new Date(Date.now() + (c.plan === "term" ? 90 : 30) * 864e5).toISOString().slice(0, 10);
    subs.push({ teacherId: "khaled", plan: c.plan, endsOn: ends, progress: 68 });
    (await cookies()).set(DEMO_SUBS_COOKIE, JSON.stringify(subs), { httpOnly: true, sameSite: "lax", path: "/" });
    revalidatePath("/student", "layout");
    return { ok: t("Done! Your subscription with Teacher Khaled Al-Omari is active until {date}.", { date: fmtDate(lang, ends) }) };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("redeem_code", { p_code: code });
  if (error) return { error: t("The code is wrong or has already been used.") };
  revalidatePath("/student", "layout");
  return { ok: t("Your subscription is active. Your materials are now open.") };
}

export async function markDone(lessonId: string) {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  if (DEMO_MODE) return;
  const supabase = await supabaseServer();
  await supabase.from("lesson_progress").upsert({ student_id: s.userId, lesson_id: lessonId });
  revalidatePath("/student", "layout");
}
