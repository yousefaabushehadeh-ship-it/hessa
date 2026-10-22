import { dataLabel, makeT, type Lang, type T } from "@/lib/i18n";
import { DEMO_MODE } from "@/lib/env";
import { REVIEWS } from "@/lib/demo-data";
import { demo2 } from "@/lib/demo-store";
import { supabaseServer } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

/** "3 days ago" style label. */
export function ago(iso: string, t: T, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 864e5);
  if (days < 1) return t("Today");
  if (days === 1) return t("Yesterday");
  if (days < 7) return t("{n} days ago", { n: days });
  if (days < 14) return t("1 week ago");
  if (days < 30) return t("{n} weeks ago", { n: Math.floor(days / 7) });
  if (days < 60) return t("1 month ago");
  if (days < 365) return t("{n} months ago", { n: Math.floor(days / 30) });
  return t("Over a year ago");
}

export async function getReviews(teacherId: string, lang: Lang = "en"): Promise<Review[]> {
  const t = makeT(lang);
  if (DEMO_MODE) {
    return [...(demo2.reviews[teacherId] ?? []), ...REVIEWS].map((r) => ({ ...r, when: dataLabel(lang, r.when) }));
  }
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("reviews")
    .select("author_name, stars, body, created_at")
    .eq("teacher_id", teacherId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((r) => ({ author: r.author_name, when: ago(r.created_at, t), stars: r.stars, body: r.body }));
}

export async function getMyReview(userId: string, teacherId: string): Promise<{ stars: number; body: string } | null> {
  if (DEMO_MODE) {
    const r = demo2.reviews[teacherId]?.find((x) => x.mine);
    return r ? { stars: r.stars, body: r.body } : null;
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.from("reviews").select("stars, body").eq("student_id", userId).eq("teacher_id", teacherId).maybeSingle();
  return data;
}
