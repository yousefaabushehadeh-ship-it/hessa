import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { getSession } from "@/lib/session";
import { LoginFlow } from "../login/login-flow";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Create account") };
}

export default async function Signup() {
  const s = await getSession();
  if (s) redirect(s.role === "teacher" ? "/teacher" : "/student");
  return (
    <>
      <SiteNav />
      <div className="gut">
        <LoginFlow key="signup" as="student" demo={DEMO_MODE} signup />
      </div>
    </>
  );
}
