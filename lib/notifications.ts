import { randomUUID } from "node:crypto";
import { DEMO_MODE } from "@/lib/env";
import type { T } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import type { Session } from "@/lib/types";

export type NoticeKind = "payment_new" | "payment_approved" | "payment_rejected" | "handin_new" | "handin_graded" | "consent_approved";
export type Notice = { id: string; kind: NoticeKind; params: Record<string, string>; link: string; read: boolean; createdAt: string };

// Demo notices, kept on globalThis like demo-store.ts. Keyed by recipient: a student's id, or "teacher:<teacherId>".
const g = globalThis as unknown as { __hessaNotices?: (Notice & { to: string })[] };
const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
// A few starting notices so the demo dashboards aren't empty; they match the sample payments and hand-ins.
const demoNotices = (g.__hessaNotices ??= [
  { id: "n-1", to: "teacher:khaled", kind: "payment_new", params: { student: "زيد العدوان", amount: "25" }, link: "/teacher/payments", read: false, createdAt: day(0) },
  { id: "n-2", to: "teacher:khaled", kind: "handin_new", params: { student: "تالا العبادي", lesson: "ورقة عمل: الاشتقاق" }, link: "/teacher/worksheets", read: false, createdAt: day(1) },
]);

const keyFor = (s: Session) => (s.role === "teacher" ? `teacher:${s.teacherId}` : s.userId);

/** Demo only: in Supabase the database triggers write notices (migration 0010). */
export function demoNotify(to: string, kind: NoticeKind, params: Record<string, string>, link: string) {
  if (!DEMO_MODE) return;
  demoNotices.unshift({ id: randomUUID(), to, kind, params, link, read: false, createdAt: new Date().toISOString() });
  demoNotices.splice(100);
}

export async function getNotices(s: Session): Promise<Notice[]> {
  if (DEMO_MODE) return demoNotices.filter((n) => n.to === keyFor(s)).slice(0, 30);
  const supabase = await supabaseServer();
  const { data } = await supabase.from("notifications").select("id, kind, params, link, read_at, created_at").order("created_at", { ascending: false }).limit(30);
  return (data ?? []).map((n) => ({ id: n.id, kind: n.kind, params: n.params ?? {}, link: n.link, read: Boolean(n.read_at), createdAt: n.created_at }));
}

export async function unreadCount(s: Session): Promise<number> {
  if (s.role !== "student" && s.role !== "teacher") return 0;
  if (DEMO_MODE) return demoNotices.filter((n) => n.to === keyFor(s) && !n.read).length;
  const supabase = await supabaseServer();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}

export async function markAllRead(s: Session) {
  if (DEMO_MODE) {
    for (const n of demoNotices) if (n.to === keyFor(s)) n.read = true;
    return;
  }
  const supabase = await supabaseServer();
  await supabase.rpc("mark_notifications_read");
}

export function noticeText(n: Notice, t: T): string {
  const p = n.params;
  switch (n.kind) {
    case "payment_new":
      return t("{student} sent a payment of {amount} JOD. Check it and confirm.", { student: p.student ?? "", amount: p.amount ?? "" });
    case "payment_approved":
      return t("{teacher} confirmed your payment. Your materials are open.", { teacher: p.teacher ?? "" });
    case "payment_rejected":
      return p.note
        ? t("{teacher} couldn't confirm your payment: {note}", { teacher: p.teacher ?? "", note: p.note })
        : t("{teacher} couldn't confirm your payment. Check the reference and send it again.", { teacher: p.teacher ?? "" });
    case "handin_new":
      return t("{student} handed in \"{lesson}\".", { student: p.student ?? "", lesson: p.lesson ?? "" });
    case "handin_graded":
      return t("Your teacher marked \"{lesson}\": {mark}", { lesson: p.lesson ?? "", mark: p.mark ?? "" });
    case "consent_approved":
      return t("Your parent approved your account. Pick your teachers and start.");
  }
}
