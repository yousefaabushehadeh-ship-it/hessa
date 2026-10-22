"use server";

import { revalidatePath } from "next/cache";
import { BUNNY_ENABLED, createVideo, uploadTicket, videoBelongsTo, type UploadTicket } from "@/lib/bunny";
import { DEMO_MODE } from "@/lib/env";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

async function teacherId() {
  const s = await requireRole("teacher");
  if (!s.teacherId) throw new Error("No teacher page");
  return s.teacherId;
}

/** Step 1: create the video at Bunny and hand the browser a signed upload ticket. */
export async function startVideoUpload(title: string): Promise<{ ticket?: UploadTicket; error?: string }> {
  const id = await teacherId();
  if (DEMO_MODE || !BUNNY_ENABLED) return { error: "رفع الفيديو بيشتغل بعد ربط Bunny Stream." };
  if (title.trim().length < 3) return { error: "اكتب عنوان الفيديو." };
  try {
    const videoId = await createVideo(id, title.trim());
    return { ticket: uploadTicket(videoId) };
  } catch {
    return { error: "ما قدرنا نجهّز الرفع. جرّب كمان شوي." };
  }
}

/** Step 2: after the upload finishes, save the lesson. */
export async function saveVideoLesson(input: { unitId: string; title: string; meta: string; isFree: boolean; videoId: string }): Promise<{ ok?: string; error?: string }> {
  const id = await teacherId();
  if (DEMO_MODE || !BUNNY_ENABLED) return { error: "رفع الفيديو بيشتغل بعد ربط Bunny Stream." };
  if (!(await videoBelongsTo(input.videoId, id))) return { error: "هالفيديو مش إلك." };
  const supabase = await supabaseServer();
  const { data: unit } = await supabase.from("units").select("id").eq("id", input.unitId).eq("teacher_id", id).maybeSingle();
  if (!unit) return { error: "اختار الوحدة." };
  const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("unit_id", input.unitId);
  const { error } = await supabase.from("lessons").insert({
    unit_id: input.unitId,
    title: input.title.trim(),
    type: "video",
    meta: input.meta.trim(),
    is_free: input.isFree,
    position: count ?? 0,
    video_id: input.videoId,
  });
  if (error) return { error: "انرفع الفيديو بس ما قدرنا نحفظ الدرس." };
  revalidatePath("/", "layout");
  return { ok: `انرفع «${input.title.trim()}». بياخذ Bunny كم دقيقة يجهّزه للمشاهدة.` };
}
