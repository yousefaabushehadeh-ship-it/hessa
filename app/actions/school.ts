"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { SUBJECT_LIST, TEACHER_GRADES } from "@/lib/catalog";
import { demoPlatform } from "@/lib/demo-platform";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export type InviteState = { ok?: string; error?: string };

const PHONE_RE = /^7[789]\d{7}$/;

/** The school adds a teacher by phone. When the teacher signs up with that number, their page opens under the school. */
export async function addTeacherInvite(_prev: InviteState, fd: FormData): Promise<InviteState> {
  const t = await getT();
  const s = await requireRole("school");
  if (!s.schoolId) return { error: t("Your school account isn't ready yet.") };
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const local = String(fd.get("phone") ?? "").replace(/\D/g, "").replace(/^(962|0)/, "");
  const subject = String(fd.get("subject") ?? "");
  const grade = String(fd.get("grade") ?? "");
  if (name.length < 3) return { error: t("Enter the teacher's full name.") };
  if (!PHONE_RE.test(local)) return { error: t("Enter a valid Jordanian number starting with 77, 78 or 79.") };
  if (!SUBJECT_LIST.includes(subject)) return { error: t("Choose the subject you teach.") };
  if (!TEACHER_GRADES.includes(grade)) return { error: t("Choose the grade you teach.") };
  const phone = `+962${local}`;

  if (DEMO_MODE) {
    if (demoPlatform.invites.some((x) => x.schoolId === s.schoolId && x.phone === phone)) return { error: t("This number is already on your list.") };
    demoPlatform.invites.unshift({ id: randomUUID(), schoolId: s.schoolId, phone, name, subject, grade, used: false, createdAt: new Date().toISOString().slice(0, 10) });
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.from("school_invites").insert({ school_id: s.schoolId, phone, name, subject, grade });
    if (error) return { error: error.code === "23505" ? t("This number is already on your list.") : t("We couldn't add the teacher.") };
  }
  revalidatePath("/school", "layout");
  return { ok: t("Added. Ask {name} to create a teacher account with {phone}; their page opens under your school.", { name, phone }) };
}

export async function removeInvite(id: string): Promise<void> {
  const s = await requireRole("school");
  if (DEMO_MODE) demoPlatform.invites = demoPlatform.invites.filter((x) => !(x.id === id && x.schoolId === s.schoolId && !x.used));
  else await (await supabaseServer()).from("school_invites").delete().eq("id", id).is("used_by", null);
  revalidatePath("/school", "layout");
}
