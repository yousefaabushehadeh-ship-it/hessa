import { randomBytes } from "node:crypto";
import { TEACHERS } from "@/lib/demo-data";
import { supabaseAdmin } from "@/lib/supabase/server";

// Creating a teacher's public page: by the team when they approve an applicant,
// or right away for a teacher their school added. Server only (service key).

export type NewPage = { userId?: string; name: string; subject: string; grade: string; city: string; verified: boolean; schoolId?: string | null; photoUrl?: string | null };

const COLORS = ["#0f4c45", "#d97706", "#7c3aed", "#0369a1", "#be185d", "#15803d", "#9a3412", "#0e7490"];
const pickColor = () => COLORS[randomBytes(1)[0] % COLORS.length];
const newSlug = () => `t-${randomBytes(4).toString("hex")}`;

/** Returns the new page's id, or null if it couldn't be created. */
export async function createTeacherPage(p: NewPage): Promise<string | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("teachers")
    .insert({
      user_id: p.userId ?? null,
      slug: newSlug(),
      name: p.name,
      initial: p.name.trim()[0] ?? "ح",
      subject: p.subject,
      grade: p.grade,
      city: p.city,
      color: pickColor(),
      verified: p.verified,
      school_id: p.schoolId ?? null,
      photo_url: p.photoUrl ?? null,
    })
    .select("id")
    .single();
  return error ? null : (data.id as string);
}

/** Same thing on the sample data. */
export function demoTeacherPage(p: NewPage): string {
  const id = `new-${randomBytes(3).toString("hex")}`;
  TEACHERS.push({
    id,
    slug: `t-${id}`,
    name: p.name,
    initial: p.name.trim()[0] ?? "ح",
    subject: p.subject,
    grade: p.grade,
    city: p.city,
    years: 0,
    rating: 0,
    reviewCount: 0,
    studentCount: 0,
    priceMonth: 20,
    priceTerm: 54,
    color: pickColor(),
    badge: null,
    headline: "",
    education: "",
    liveSchedule: "",
    bio: "",
    verified: p.verified,
    photoUrl: p.photoUrl ?? null,
    schoolId: p.schoolId ?? null,
    cliqAlias: "",
    units: [],
  });
  return id;
}
