import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalChooser } from "../login/portal";
import { getT } from "@/lib/i18n-server";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Create account") };
}

export default async function Signup() {
  const s = await getSession();
  if (s) redirect(s.role === "student" ? (s.fullName ? "/student" : "/login/student") : "/teacher");
  return <PortalChooser signup />;
}
