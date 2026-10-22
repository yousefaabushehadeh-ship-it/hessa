"use server";

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
  const id = await myTeacherId();
  const patch = {
    headline: String(fd.get("headline") ?? "").trim().slice(0, 160),
    bio: String(fd.get("bio") ?? "").trim().slice(0, 1200),
    education: String(fd.get("education") ?? "").trim().slice(0, 160),
    live_schedule: String(fd.get("live") ?? "").trim().slice(0, 80),
    price_month: num(fd.get("priceMonth")),
    price_term: num(fd.get("priceTerm")),
  };
  if (!patch.headline) return { error: "اكتب سطر تعريفي قصير." };
  if (!(patch.price_month >= 1 && patch.price_month <= 500) || !(patch.price_term >= 1 && patch.price_term <= 1500))
    return { error: "السعر لازم يكون رقم بين 1 و 500 دينار للشهري." };

  if (DEMO_MODE) {
    const t = TEACHERS.find((x) => x.id === id)!;
    Object.assign(t, { headline: patch.headline, bio: patch.bio, education: patch.education, liveSchedule: patch.live_schedule, priceMonth: patch.price_month, priceTerm: patch.price_term });
  } else {
    const supabase = await supabaseServer();
    const { error } = await supabase.from("teachers").update(patch).eq("id", id);
    if (error) return { error: "ما قدرنا نحفظ التعديلات." };
  }
  revalidatePath("/", "layout");
  return { ok: "انحفظت التعديلات، وصفحتك العامة صارت محدّثة." };
}

export async function addUnit(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = await myTeacherId();
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 2) return { error: "اكتب اسم الوحدة." };
  if (DEMO_MODE) {
    const t = TEACHERS.find((x) => x.id === id)!;
    t.units.push({ id: `${id}-u${t.units.length}`, title, position: t.units.length, lessons: [] });
  } else {
    const supabase = await supabaseServer();
    const { count } = await supabase.from("units").select("id", { count: "exact", head: true }).eq("teacher_id", id);
    const { error } = await supabase.from("units").insert({ teacher_id: id, title, position: count ?? 0 });
    if (error) return { error: "ما قدرنا نضيف الوحدة." };
  }
  revalidatePath("/teacher/content");
  return { ok: `انضافت وحدة «${title}».` };
}

// Videos go through app/actions/video.ts (direct upload to Bunny Stream).
const TYPES: LessonType[] = ["pdf", "quiz", "live"];

export async function addLesson(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = await myTeacherId();
  const unitId = String(fd.get("unit") ?? "");
  const title = String(fd.get("title") ?? "").trim();
  const type = String(fd.get("type")) as LessonType;
  const meta = String(fd.get("meta") ?? "").trim();
  const isFree = fd.get("free") === "on";
  const file = fd.get("file");
  if (title.length < 3) return { error: "اكتب عنوان المادة." };
  if (!TYPES.includes(type)) return { error: "اختار نوع المادة." };
  const hasFile = file instanceof File && file.size > 0;
  if (type === "pdf" && !hasFile) return { error: "اختار ملف PDF." };
  if (hasFile && (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024)) return { error: "الملف لازم يكون PDF وحجمه أقل من 20 ميجا." };

  if (DEMO_MODE) {
    const unit = TEACHERS.find((x) => x.id === id)?.units.find((u) => u.id === unitId);
    if (!unit) return { error: "اختار الوحدة." };
    unit.lessons.push({ id: `${unitId}-l${unit.lessons.length}`, title, type, meta: meta || (hasFile ? "ملف جديد" : ""), isFree, position: unit.lessons.length });
  } else {
    const supabase = await supabaseServer();
    const { data: unit } = await supabase.from("units").select("id").eq("id", unitId).eq("teacher_id", id).maybeSingle();
    if (!unit) return { error: "اختار الوحدة." };
    let storagePath: string | null = null;
    if (hasFile) {
      // The first folder must be the teacher id: the storage policy checks it.
      storagePath = `${id}/${randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("materials").upload(storagePath, file, { contentType: "application/pdf" });
      if (error) return { error: "ما قدرنا نرفع الملف." };
    }
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("unit_id", unitId);
    const { error } = await supabase
      .from("lessons")
      .insert({ unit_id: unitId, title, type, meta, is_free: isFree, position: count ?? 0, storage_path: storagePath });
    if (error) return { error: "ما قدرنا نحفظ المادة." };
  }
  revalidatePath("/", "layout");
  return { ok: `انضافت «${title}» وصارت ظاهرة لطلابك.` };
}

function newCode() {
  // No 0/O/1/I so codes are easy to read out over the phone.
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  const s = Array.from(b, (x) => abc[x % abc.length]).join("");
  return `HS-${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function createCodes(_prev: FormState, fd: FormData): Promise<FormState> {
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
    if (error) return { error: "ما قدرنا ننشئ الأكواد." };
  }
  revalidatePath("/teacher");
  return { ok: `جهزت ${count} ${count === 1 ? "كود" : "أكواد"}. ابعث كل كود لطالب واحد بعد ما يدفعلك.`, codes };
}
