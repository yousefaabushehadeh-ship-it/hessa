"use server";

import { getT } from "@/lib/i18n-server";
import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { demoStore } from "@/lib/data";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { LessonType } from "@/lib/types";

export type FormState = { ok?: string; error?: string; codes?: string[] };

async function myTeacherId() {
  const s = await requireRole("teacher");
  if (!s.teacherId) throw new Error("This account has no teacher page yet.");
  return s.teacherId;
}

const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/[^\d.]/g, ""));

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const t = await getT();
  const id = await myTeacherId();
  const patch = {
    headline: String(fd.get("headline") ?? "").trim().slice(0, 160),
    bio: String(fd.get("bio") ?? "").trim().slice(0, 1200),
    education: String(fd.get("education") ?? "").trim().slice(0, 160),
    live_schedule: String(fd.get("live") ?? "").trim().slice(0, 80),
    price_month: num(fd.get("priceMonth")),
    price_term: num(fd.get("priceTerm")),
    cliq_alias: String(fd.get("cliq") ?? "").trim().slice(0, 40),
  };
  if (!patch.headline) return { error: t("Write a short headline.") };
  if (!(patch.price_month >= 1 && patch.price_month <= 500) || !(patch.price_term >= 1 && patch.price_term <= 1500))
    return { error: t("The monthly price must be between 1 and 500 JOD.") };

  if (DEMO_MODE) {
    const t = TEACHERS.find((x) => x.id === id)!;
    Object.assign(t, { headline: patch.headline, bio: patch.bio, education: patch.education, liveSchedule: patch.live_schedule, priceMonth: patch.price_month, priceTerm: patch.price_term, cliqAlias: patch.cliq_alias });
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.from("teachers").update(patch).eq("id", id);
    if (error) return { error: t("We couldn't save your changes.") };
  }
  revalidatePath("/", "layout");
  return { ok: t("Your changes are saved and your public page is updated.") };
}

export async function addUnit(_prev: FormState, fd: FormData): Promise<FormState> {
  const t = await getT();
  const id = await myTeacherId();
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 2) return { error: t("Enter the chapter name.") };
  if (DEMO_MODE) {
    const t = TEACHERS.find((x) => x.id === id)!;
    t.units.push({ id: `${id}-u${t.units.length}`, title, position: t.units.length, lessons: [] });
  } else {
    const supabase = await supabaseServer();
    const { count } = await supabase.from("units").select("id", { count: "exact", head: true }).eq("teacher_id", id);
    const { error } = await supabase.from("units").insert({ teacher_id: id, title, position: count ?? 0 });
    if (error) return { error: t("We couldn't add the chapter.") };
  }
  revalidatePath("/teacher/content");
  return { ok: t("Chapter «{title}» was added.", { title }) };
}

// Videos go through app/actions/video.ts (direct upload to Bunny Stream).
const TYPES: LessonType[] = ["pdf", "worksheet", "quiz", "live"];
const FILE_MAX_MB = 25;

export type UploadTicket = { signedUrl: string; path: string };

/**
 * Step 1 of a PDF upload: the browser gets a one-time URL and sends the file straight to Storage,
 * so big files never pass through our server (hosting limits a request to a few MB).
 */
export async function startMaterialUpload(type: string, size: number): Promise<{ ticket?: UploadTicket; demo?: boolean; error?: string }> {
  const t = await getT();
  const id = await myTeacherId();
  if (type !== "application/pdf" || size > FILE_MAX_MB * 1024 * 1024) return { error: t("The file must be a PDF under {n} MB.", { n: FILE_MAX_MB }) };
  if (DEMO_MODE) return { demo: true };
  // The first folder must be the teacher id: the storage policy checks it.
  const path = `${id}/${randomUUID()}.pdf`;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage.from("materials").createSignedUploadUrl(path);
  if (error || !data) return { error: t("We couldn't prepare the upload. Please try again shortly.") };
  return { ticket: { signedUrl: data.signedUrl, path } };
}

/** Step 2 (or the only step, for quizzes and live classes): save the item. `path` is set when a PDF was uploaded. */
export async function addLesson(_prev: FormState, fd: FormData): Promise<FormState> {
  const t = await getT();
  const id = await myTeacherId();
  const unitId = String(fd.get("unit") ?? "");
  const title = String(fd.get("title") ?? "").trim().slice(0, 160);
  const type = String(fd.get("type")) as LessonType;
  const meta = String(fd.get("meta") ?? "").trim().slice(0, 60);
  const isFree = fd.get("free") === "on";
  const path = String(fd.get("path") ?? "") || null;
  const hasFile = Boolean(path) || fd.get("demoFile") === "1";
  const tries = Math.min(20, Math.max(1, Math.floor(num(fd.get("tries")) || 3)));
  if (title.length < 3) return { error: t("Enter the item title.") };
  if (!TYPES.includes(type)) return { error: t("Choose the item type.") };
  if ((type === "pdf" || type === "worksheet") && !hasFile) return { error: t("Choose a PDF file.") };
  if (path && !path.startsWith(`${id}/`)) return { error: t("We couldn't upload the file.") };

  if (DEMO_MODE) {
    const unit = TEACHERS.find((x) => x.id === id)?.units.find((u) => u.id === unitId);
    if (!unit) return { error: t("Choose the chapter.") };
    unit.lessons.push({ id: `${unitId}-l${unit.lessons.length}`, title, type, meta: meta || (hasFile ? t("New file") : ""), isFree, position: unit.lessons.length });
  } else {
    const supabase = await supabaseServer();
    const { data: unit } = await supabase.from("units").select("id").eq("id", unitId).eq("teacher_id", id).maybeSingle();
    if (!unit) return { error: t("Choose the chapter.") };
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("unit_id", unitId);
    const { error } = await supabase
      .from("lessons")
      .insert({ unit_id: unitId, title, type, meta, is_free: isFree, position: count ?? 0, storage_path: path, max_attempts: tries });
    if (error) return { error: t("We couldn't save the item.") };
  }
  revalidatePath("/", "layout");
  return { ok: t("«{title}» was added and is now visible to your students.", { title }) };
}

function newCode() {
  // No 0/O/1/I so codes are easy to read out over the phone.
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  const s = Array.from(b, (x) => abc[x % abc.length]).join("");
  return `HS-${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function createCodes(_prev: FormState, fd: FormData): Promise<FormState> {
  const t = await getT();
  const id = await myTeacherId();
  const count = Math.min(50, Math.max(1, Math.floor(num(fd.get("count")))));
  const plan: "monthly" | "term" = fd.get("plan") === "term" ? "term" : "monthly";
  const codes = Array.from({ length: count }, newCode);
  if (DEMO_MODE) {
    const today = new Date().toISOString().slice(0, 10);
    demoStore.codes.unshift(...codes.map((code) => ({ code, plan, usedBy: null, createdAt: today })));
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.from("activation_codes").insert(codes.map((code) => ({ code, teacher_id: id, plan })));
    if (error) return { error: t("We couldn't create the codes.") };
  }
  revalidatePath("/teacher");
  return { ok: t("{count} code(s) ready. Send each code to one student after they pay you.", { count }), codes };
}
