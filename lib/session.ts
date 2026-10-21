import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import type { Role, Session } from "@/lib/types";

export const DEMO_COOKIE = "hessa_demo";

export async function getSession(): Promise<Session | null> {
  if (DEMO_MODE) {
    const raw = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, full_name, consent").eq("id", data.user.id).single();
  const { data: teacher } = await supabase.from("teachers").select("id").eq("user_id", data.user.id).maybeSingle();
  return {
    userId: data.user.id,
    role: (profile?.role ?? "student") as Role,
    fullName: profile?.full_name ?? "",
    teacherId: teacher?.id,
    consent: profile?.consent === "revoked" ? "pending" : profile?.consent ?? "pending",
  };
}

/** Sends people who aren't signed in (or have the wrong role) to the login page. */
export async function requireRole(role: Role): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== role && s.role !== "admin") redirect(s.role === "teacher" ? "/teacher" : "/student");
  return s;
}
