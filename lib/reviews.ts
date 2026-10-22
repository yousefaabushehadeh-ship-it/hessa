import { DEMO_MODE } from "@/lib/env";
import { REVIEWS } from "@/lib/demo-data";
import { demo2 } from "@/lib/demo-store";
import { supabaseServer } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

/** "قبل 3 أيام" style label. */
export function ago(iso: string, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 864e5);
  if (days < 1) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return Math.floor(days / 7) === 1 ? "قبل أسبوع" : `قبل ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) return Math.floor(days / 30) === 1 ? "قبل شهر" : `قبل ${Math.floor(days / 30)} شهور`;
  return "قبل أكثر من سنة";
}

export async function getReviews(teacherId: string): Promise<Review[]> {
  if (DEMO_MODE) return [...(demo2.reviews[teacherId] ?? []), ...REVIEWS];
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("reviews")
    .select("author_name, stars, body, created_at")
    .eq("teacher_id", teacherId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((r) => ({ author: r.author_name, when: ago(r.created_at), stars: r.stars, body: r.body }));
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
