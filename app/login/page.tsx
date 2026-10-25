import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n-server";
import { getSession } from "@/lib/session";
import { PortalChooser } from "./portal";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Sign in") };
}

export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; next?: string }> }) {
  const sp = await searchParams;
  const q = sp.next ? `?next=${encodeURIComponent(sp.next)}` : "";
  // Old links (/login?as=teacher) and links that need a lesson open go straight to a portal.
  if (sp.as === "teacher") redirect("/login/teacher");
  if (sp.as === "student" || sp.next) redirect(`/login/student${q}`);
  const s = await getSession();
  if (s) redirect(s.role === "student" ? (s.fullName ? "/student" : "/login/student") : "/teacher");
  return <PortalChooser />;
}
