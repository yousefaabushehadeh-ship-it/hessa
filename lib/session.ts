import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/env";
import { demoPlatform } from "@/lib/demo-platform";
import { supabaseServer } from "@/lib/supabase/server";
import type { Role, Session } from "@/lib/types";

export const DEMO_COOKIE = "hessa_demo";

export async function getSession(): Promise<Session | null> {
  if (DEMO_MODE) {
    const raw = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as Session;
      // A demo applicant the admin approved gets their new page without signing in again.
      if (s.role === "teacher" && !s.teacherId) s.teacherId = demoPlatform.applicants.find((a) => a.userId === s.userId)?.teacherId;
      return s;
    } catch {
      return null;
    }
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, full_name, consent, grade").eq("id", data.user.id).single();
  const role = (profile?.role ?? "student") as Role;
  const { data: teacher } = role === "teacher" ? await supabase.from("teachers").select("id").eq("user_id", data.user.id).maybeSingle() : { data: null };
  const { data: school } = role === "school" ? await supabase.from("schools").select("id").eq("owner_id", data.user.id).maybeSingle() : { data: null };
  return {
    userId: data.user.id,
    role,
    fullName: profile?.full_name ?? "",
    grade: role === "student" ? profile?.grade ?? undefined : undefined,
    teacherId: teacher?.id,
    schoolId: school?.id,
    consent: profile?.consent === "revoked" ? "pending" : profile?.consent ?? "pending",
  };
}

/** Any signed-in person, of any role. Sends everyone else to the login page. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/** Each role's own dashboard. */
export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "school" ? "/school" : role === "teacher" ? "/teacher" : "/student";
}

/** Sends people who aren't signed in to their portal, and people with the wrong role to their own dashboard. */
export async function requireRole(role: Role): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(role === "student" ? "/login/student" : `/login/${role}`);
  if (s.role !== role) redirect(homeFor(s.role));
  return s;
}
