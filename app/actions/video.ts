"use server";

import { getT } from "@/lib/i18n-server";
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
  const t = await getT();
  const id = await teacherId();
  if (DEMO_MODE || !BUNNY_ENABLED) return { error: t("Video upload works once Bunny Stream is connected.") };
  if (title.trim().length < 3) return { error: t("Enter the video title.") };
  try {
    const videoId = await createVideo(id, title.trim());
    return { ticket: uploadTicket(videoId) };
  } catch {
    return { error: t("We couldn't prepare the upload. Please try again shortly.") };
  }
}

/** Step 2: after the upload finishes, save the lesson. */
export async function saveVideoLesson(input: { unitId: string; title: string; meta: string; isFree: boolean; videoId: string }): Promise<{ ok?: string; error?: string }> {
  const t = await getT();
  const id = await teacherId();
  if (DEMO_MODE || !BUNNY_ENABLED) return { error: t("Video upload works once Bunny Stream is connected.") };
  if (!(await videoBelongsTo(input.videoId, id))) return { error: t("This video isn't yours.") };
  const supabase = await supabaseServer();
  const { data: unit } = await supabase.from("units").select("id").eq("id", input.unitId).eq("teacher_id", id).maybeSingle();
  if (!unit) return { error: t("Choose the chapter.") };
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
  if (error) return { error: t("The video uploaded, but we couldn't save the lesson.") };
  revalidatePath("/", "layout");
  return { ok: t("«{title}» uploaded. Bunny needs a few minutes to process it before it can play.", { title: input.title.trim() }) };
}
