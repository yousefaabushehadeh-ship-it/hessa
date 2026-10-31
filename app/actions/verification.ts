"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { DocKind } from "@/lib/types";
import { DOC_KINDS, DOC_MAX_MB, DOC_TYPES, demoVerification } from "@/lib/verification";

export type PhotoState = { ok?: string; error?: string };

/** The browser shrinks the photo to a small JPEG before sending it, so it fits in one request. */
export async function uploadPhoto(_prev: PhotoState, fd: FormData): Promise<PhotoState> {
  const t = await getT();
  const s = await requireRole("teacher");
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: t("Choose a photo.") };
  if (file.type !== "image/jpeg" || file.size > 600 * 1024) return { error: t("The photo must be a JPG or PNG image.") };

  if (DEMO_MODE) {
    const url = `data:image/jpeg;base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    demoVerification.photos[s.userId] = url;
    const page = s.teacherId ? TEACHERS.find((x) => x.id === s.teacherId) : null;
    if (page) page.photoUrl = url;
  } else {
    const supabase = await supabaseServer();
    // A new name each time, so browsers and the CDN don't keep showing the old photo.
    const path = `${s.userId}/${randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("teacher-photos").upload(path, file, { contentType: "image/jpeg" });
    if (error) return { error: t("We couldn't upload the photo.") };
    const url = supabase.storage.from("teacher-photos").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ photo_url: url }).eq("id", s.userId);
    if (s.teacherId) await supabase.from("teachers").update({ photo_url: url }).eq("id", s.teacherId);
  }
  revalidatePath("/", "layout");
  return { ok: t("Your photo is saved.") };
}

export type DocTicket = { signedUrl: string; path: string };

/** Step 1 of a document upload: check the file and hand the browser a one-time upload URL. */
export async function startDocUpload(kind: string, fileName: string, type: string, size: number): Promise<{ ticket?: DocTicket; demo?: boolean; error?: string }> {
  const t = await getT();
  const s = await requireRole("teacher");
  if (!DOC_KINDS.includes(kind as DocKind)) return { error: t("Choose the document type.") };
  if (!DOC_TYPES.includes(type) || size > DOC_MAX_MB * 1024 * 1024)
    return { error: t("The file must be a PDF or an image under {n} MB.", { n: DOC_MAX_MB }) };
  if (DEMO_MODE) return { demo: true };

  const ext = type === "application/pdf" ? "pdf" : type.split("/")[1];
  const path = `${s.userId}/${randomUUID()}.${ext}`;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage.from("teacher-docs").createSignedUploadUrl(path);
  if (error || !data) return { error: t("We couldn't prepare the upload. Please try again shortly.") };
  return { ticket: { signedUrl: data.signedUrl, path } };
}

/** Step 2: after the browser uploads the file (or right away in the demo), record it for review. */
export async function finishDocUpload(kind: string, fileName: string, path: string | null): Promise<{ error?: string }> {
  const t = await getT();
  const s = await requireRole("teacher");
  if (!DOC_KINDS.includes(kind as DocKind)) return { error: t("Choose the document type.") };
  const name = fileName.slice(0, 120);

  if (DEMO_MODE) {
    const list = (demoVerification.docs[s.userId] ??= []);
    list.unshift({ id: randomUUID(), kind: kind as DocKind, fileName: name, status: "pending", note: null, createdAt: new Date().toISOString().slice(0, 10) });
  } else {
    if (!path || !path.startsWith(`${s.userId}/`)) return { error: t("We couldn't upload the file.") };
    const supabase = await supabaseServer();
    const { error } = await supabase.from("teacher_documents").insert({ user_id: s.userId, kind, file_name: name, storage_path: path });
    if (error) return { error: t("We couldn't upload the file.") };
  }
  revalidatePath("/teacher", "layout");
  return {};
}

/** Teachers can remove a document until the team has reviewed it. */
export async function deleteDoc(id: string): Promise<void> {
  const s = await requireRole("teacher");
  if (DEMO_MODE) {
    const list = demoVerification.docs[s.userId] ?? [];
    demoVerification.docs[s.userId] = list.filter((d) => !(d.id === id && d.status === "pending"));
  } else {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("teacher_documents").delete().eq("id", id).eq("status", "pending").select("storage_path").maybeSingle();
    if (data) await supabase.storage.from("teacher-docs").remove([data.storage_path]);
  }
  revalidatePath("/teacher", "layout");
}
