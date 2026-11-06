import { DEMO_MODE } from "@/lib/env";
import { getMySubscriptions } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import type { Resource, ResourceKind, Session } from "@/lib/types";

// The study kit: books, explainer videos, summaries and links a teacher adds for their subject.
// Students read it through the teacher_resources / open_resource functions, so a paid link
// never reaches someone who hasn't subscribed.

export const RESOURCE_KINDS: ResourceKind[] = ["book", "video", "summary", "link"];
export const FILE_KINDS: ResourceKind[] = ["book", "summary"];

type DemoResource = Resource & { teacherId: string };

const SAMPLE: DemoResource[] = [
  { id: "res-k1", teacherId: "khaled", kind: "book", title: "كتاب الرياضيات: الفصل الأول كامل", note: "نسخة PDF مرتّبة مع حلول التمارين.", url: null, hasFile: true, isFree: false, position: 0 },
  { id: "res-k2", teacherId: "khaled", kind: "video", title: "شرح سريع: يعني شو المشتقة؟", note: "فيديو 10 دقايق قبل ما تبدأ الوحدة.", url: "https://www.youtube.com/watch?v=WUvTyaaNkzM", hasFile: false, isFree: true, position: 1 },
  { id: "res-k3", teacherId: "khaled", kind: "summary", title: "ملخص قوانين الاشتقاق بصفحتين", note: "", url: null, hasFile: true, isFree: true, position: 2 },
  { id: "res-k4", teacherId: "khaled", kind: "link", title: "آلة حاسبة للرسم البياني", note: "جرّب ترسم الاقترانات وتشوف المشتقة.", url: "https://www.desmos.com/calculator", hasFile: false, isFree: false, position: 3 },
  { id: "res-s1", teacherId: "sami", kind: "summary", title: "ملخص الزخم والتصادمات", note: "", url: null, hasFile: true, isFree: true, position: 0 },
  { id: "res-s2", teacherId: "sami", kind: "link", title: "محاكاة التصادمات (PhET)", note: "جرّب التصادم المرن وغير المرن بنفسك.", url: "https://phet.colorado.edu/en/simulations/collision-lab", hasFile: false, isFree: false, position: 1 },
];

// Kept on globalThis like the other demo stores, so teacher changes show on every page.
const g = globalThis as unknown as { __hessaKit?: { items: DemoResource[] } };
export const demoKit = (g.__hessaKit ??= { items: SAMPLE.map((x) => ({ ...x })) });

/** May this viewer open this teacher's paid items? (Demo mode only; the database decides otherwise.) */
async function demoCanOpenKit(s: Session | null, teacherId: string) {
  if (!s) return false;
  if (s.role === "admin" || (s.role === "teacher" && s.teacherId === teacherId)) return true;
  if (s.role !== "student" || s.consent === "pending") return false;
  return (await getMySubscriptions(s.userId)).some((x) => x.teacherId === teacherId);
}

const strip = ({ teacherId: _t, ...r }: DemoResource): Resource => r;

/** A teacher's kit as this viewer sees it: every title, and links only where they may open them. */
export async function listResources(teacherId: string, viewer: Session | null): Promise<Resource[]> {
  if (DEMO_MODE) {
    const open = await demoCanOpenKit(viewer, teacherId);
    return demoKit.items
      .filter((r) => r.teacherId === teacherId)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({ ...strip(r), url: (r.isFree && viewer) || open ? r.url : null }));
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("teacher_resources", { p_teacher: teacherId });
  return ((data ?? []) as { id: string; kind: ResourceKind; title: string; note: string; url: string | null; has_file: boolean; is_free: boolean; sort_order: number }[]).map((r) => ({
    id: r.id, kind: r.kind, title: r.title, note: r.note, url: r.url, hasFile: r.has_file, isFree: r.is_free, position: r.sort_order,
  }));
}

export type OpenedResource = { resource: Resource; teacherId: string; storagePath: string | null };

/** One item, or null when it doesn't exist or this viewer can't open it. */
export async function openResource(id: string, viewer: Session): Promise<OpenedResource | null> {
  if (DEMO_MODE) {
    const r = demoKit.items.find((x) => x.id === id);
    if (!r) return null;
    const free = r.isFree && !(viewer.role === "student" && viewer.consent === "pending");
    if (!free && !(await demoCanOpenKit(viewer, r.teacherId))) return null;
    return { resource: strip(r), teacherId: r.teacherId, storagePath: null };
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("open_resource", { p_id: id }).maybeSingle();
  if (!data) return null;
  const r = data as { id: string; teacher_id: string; kind: ResourceKind; title: string; note: string; url: string | null; storage_path: string | null; is_free: boolean };
  return {
    resource: { id: r.id, kind: r.kind, title: r.title, note: r.note, url: r.url, hasFile: Boolean(r.storage_path), isFree: r.is_free, position: 0 },
    teacherId: r.teacher_id,
    storagePath: r.storage_path,
  };
}

/** Which teacher owns an item (for the "subscribe" screen when a student can't open it). */
export async function resourceTeacher(id: string): Promise<string | null> {
  if (DEMO_MODE) return demoKit.items.find((x) => x.id === id)?.teacherId ?? null;
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("resource_teacher", { p_id: id });
  return (data as string | null) ?? null;
}

/**
 * A YouTube or Vimeo address as an embed URL, so the video plays inside Hessa.
 * Anything else returns null and opens in a new tab instead.
 */
export function videoEmbed(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  const ok = (id: string | null | undefined) => (id && /^[\w-]{6,20}$/.test(id) ? id : null);
  let yt: string | null = null;
  if (host === "youtu.be") yt = ok(u.pathname.slice(1));
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") yt = ok(u.searchParams.get("v"));
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
      yt = ok(m?.[1]);
    }
  }
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0`;
  if (host === "vimeo.com") {
    const m = u.pathname.match(/^\/(\d{5,12})/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  return null;
}
