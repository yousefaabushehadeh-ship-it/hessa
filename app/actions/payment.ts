"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { demoPlatform } from "@/lib/demo-platform";
import { getTeacherById } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { getSession, requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types";

export type PayState = { ok?: string; error?: string };

const METHODS: PaymentMethod[] = ["cliq", "wallet", "cash"];

/** The student paid by CliQ or wallet and sends the transfer reference; the teacher confirms it. */
export async function requestPayment(teacherId: string, _prev: PayState, fd: FormData): Promise<PayState> {
  const t = await getT();
  const s = await requireRole("student");
  const plan = fd.get("plan") === "term" ? "term" : "monthly";
  const method = METHODS.includes(fd.get("method") as PaymentMethod) ? (fd.get("method") as PaymentMethod) : "cliq";
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 60);
  if (reference.length < 3) return { error: t("Enter the transfer reference from your bank or wallet app.") };
  if (s.consent === "pending") return { error: t("Your parent needs to approve your account first.") };

  if (DEMO_MODE) {
    const teacher = TEACHERS.find((x) => x.id === teacherId && x.verified);
    if (!teacher) return { error: t("This teacher isn't taking students right now.") };
    if (demoPlatform.payments.some((p) => p.studentId === s.userId && p.teacherId === teacherId && p.status === "pending"))
      return { error: t("You already sent a payment to this teacher. Wait for them to confirm it.") };
    demoPlatform.payments.unshift({
      id: randomUUID(), studentId: s.userId, studentName: s.fullName, teacherId, teacherName: teacher.name, plan,
      amount: plan === "term" ? teacher.priceTerm : teacher.priceMonth, method, reference, status: "pending", note: null,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.rpc("request_payment", { p_teacher: teacherId, p_plan: plan, p_method: method, p_reference: reference });
    if (error)
      return { error: error.code === "23505" ? t("You already sent a payment to this teacher. Wait for them to confirm it.") : t("We couldn't send your request. Please try again.") };
  }
  revalidatePath("/student", "layout");
  return { ok: t("Sent! Your teacher will check the transfer and your materials open as soon as they confirm.") };
}

/** Teacher (for their own students) or admin: approve opens the subscription, reject sends a note back. */
export async function reviewPayment(id: string, approve: boolean, fd?: FormData): Promise<void> {
  const s = await getSession();
  if (!s || (s.role !== "teacher" && s.role !== "admin")) return;
  const note = String(fd?.get("note") ?? "").trim().slice(0, 300) || null;
  if (DEMO_MODE) {
    const p = demoPlatform.payments.find((x) => x.id === id && x.status === "pending");
    if (!p || (s.role === "teacher" && p.teacherId !== s.teacherId)) return;
    p.status = approve ? "approved" : "rejected";
    p.note = note;
    if (approve) {
      const tc = await getTeacherById(p.teacherId);
      if (tc) tc.studentCount += 1;
    }
  } else {
    const supabase = await supabaseServer();
    await supabase.rpc("review_payment", { p_id: id, p_approve: approve, p_note: note });
  }
  revalidatePath("/", "layout");
}
