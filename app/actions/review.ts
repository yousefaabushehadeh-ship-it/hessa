"use server";

import { getT } from "@/lib/i18n-server";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/env";
import { getMySubscriptions, getTeacherById } from "@/lib/data";
import { demo2 } from "@/lib/demo-store";
import { requireRole } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export type ReviewState = { ok?: string; error?: string };

export async function saveReview(teacherId: string, _prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const t = await getT();
  const s = await requireRole("student");
  const stars = Number(fd.get("stars"));
  const body = String(fd.get("body") ?? "").trim().slice(0, 600);
  if (!(stars >= 1 && stars <= 5)) return { error: t("Choose a star rating.") };
  const subs = await getMySubscriptions(s.userId);
  if (!subs.some((x) => x.teacherId === teacherId)) return { error: t("Only subscribed students can leave a review.") };

  if (DEMO_MODE) {
    const list = (demo2.reviews[teacherId] ??= []).filter((r) => !r.mine);
    list.unshift({ author: s.fullName, when: t("Today"), stars, body, mine: true });
    demo2.reviews[teacherId] = list;
  } else {
    const supabase = await supabaseServer();
    // author_name is filled in by the database from the profile.
    const { error } = await supabase
      .from("reviews")
      .upsert({ student_id: s.userId, teacher_id: teacherId, stars, body }, { onConflict: "student_id,teacher_id" });
    if (error) return { error: t("We couldn't save your review.") };
  }
  const teacher = await getTeacherById(teacherId);
  if (teacher) revalidatePath(`/${teacher.slug}`);
  return { ok: t("Thank you! Your review helps other students choose.") };
}
