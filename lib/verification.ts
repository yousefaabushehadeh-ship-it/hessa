import { DEMO_MODE } from "@/lib/env";
import { TEACHERS } from "@/lib/demo-data";
import { supabaseServer } from "@/lib/supabase/server";
import type { DocKind, Session, TeacherDoc } from "@/lib/types";

// Teacher photo and verification documents. Demo mode keeps them in memory on globalThis, like demo-store.ts.

export const DOC_KINDS: DocKind[] = ["id", "degree", "certificate", "experience", "other"];
export const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const DOC_MAX_MB = 10;

type DemoVerification = { photos: Record<string, string>; docs: Record<string, TeacherDoc[]> };
const g = globalThis as unknown as { __hessaVerification?: DemoVerification };
export const demoVerification: DemoVerification = (g.__hessaVerification ??= { photos: {}, docs: {} });

/** The signed-in teacher's photo: on their page once it exists, on their profile before that. */
export async function getMyPhoto(s: Session): Promise<string | null> {
  if (DEMO_MODE) {
    const page = s.teacherId ? TEACHERS.find((x) => x.id === s.teacherId) : null;
    return page?.photoUrl ?? demoVerification.photos[s.userId] ?? null;
  }
  const supabase = await supabaseServer();
  if (s.teacherId) {
    const { data } = await supabase.from("teachers").select("photo_url").eq("id", s.teacherId).maybeSingle();
    if (data?.photo_url) return data.photo_url;
  }
  const { data } = await supabase.from("profiles").select("photo_url").eq("id", s.userId).maybeSingle();
  return data?.photo_url ?? null;
}

export async function getMyDocs(s: Session): Promise<TeacherDoc[]> {
  if (DEMO_MODE) return demoVerification.docs[s.userId] ?? [];
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("teacher_documents")
    .select("id, kind, file_name, status, note, created_at")
    .eq("user_id", s.userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((d) => ({
    id: d.id,
    kind: d.kind as DocKind,
    fileName: d.file_name,
    status: d.status as TeacherDoc["status"],
    note: d.note,
    createdAt: String(d.created_at).slice(0, 10),
  }));
}
