"use server";

import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { FILE_KINDS, RESOURCE_KINDS, demoKit } from "@/lib/resources";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { ResourceKind } from "@/lib/types";

export type KitState = { ok?: string; error?: string };

async function myTeacherId() {
  const s = await requireRole("teacher");
  if (!s.teacherId) throw new Error("This account has no teacher page yet.");
  return s.teacherId;
}

/** A web address the student can safely open: https only, no spaces. */
function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v || v.length > 500 || /\s/.test(v)) return null;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (u.protocol === "http:") u.protocol = "https:";
    return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Saves a kit item. Books and summaries are uploaded first with startMaterialUpload
 * (straight from the browser to Storage), and `path` points at the file.
 */
export async function addResource(_prev: KitState, fd: FormData): Promise<KitState> {
  const t = await getT();
  const id = await myTeacherId();
  const kind = String(fd.get("kind")) as ResourceKind;
  const title = String(fd.get("title") ?? "").trim().slice(0, 160);
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  const isFree = fd.get("free") === "on";
  const path = String(fd.get("path") ?? "") || null;
  const hasFile = Boolean(path) || fd.get("demoFile") === "1";
  if (!RESOURCE_KINDS.includes(kind)) return { error: t("Choose the item type.") };
  if (title.length < 3) return { error: t("Enter the item title.") };
  const isFile = FILE_KINDS.includes(kind);
  const url = isFile ? null : cleanUrl(String(fd.get("url") ?? ""));
  if (isFile && !hasFile) return { error: t("Choose a PDF file.") };
  if (!isFile && !url) return { error: t("Paste a full link that starts with https://") };
  if (path && !path.startsWith(`${id}/`)) return { error: t("We couldn't upload the file.") };

  if (DEMO_MODE) {
    const position = demoKit.items.filter((r) => r.teacherId === id).length;
    demoKit.items.push({ id: `res-${Date.now().toString(36)}`, teacherId: id, kind, title, note, url, hasFile: isFile, isFree, position });
  } else {
    const supabase = await supabaseServer();
    const { count } = await supabase.from("resources").select("id", { count: "exact", head: true }).eq("teacher_id", id);
    const { error } = await supabase
      .from("resources")
      .insert({ teacher_id: id, kind, title, note, url, storage_path: isFile ? path : null, is_free: isFree, position: count ?? 0 });
    if (error) return { error: t("We couldn't save the item.") };
  }
  revalidatePath("/", "layout");
  return { ok: t("«{title}» is in your study kit now.", { title }) };
}

export async function deleteResource(resourceId: string): Promise<void> {
  const id = await myTeacherId();
  if (DEMO_MODE) {
    demoKit.items = demoKit.items.filter((r) => !(r.id === resourceId && r.teacherId === id));
  } else {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("resources").delete().eq("id", resourceId).eq("teacher_id", id).select("storage_path").maybeSingle();
    if (data?.storage_path) await supabase.storage.from("materials").remove([data.storage_path]);
  }
  revalidatePath("/", "layout");
}
