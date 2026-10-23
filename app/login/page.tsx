import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { getSession } from "@/lib/session";
import { LoginFlow } from "./login-flow";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Sign in") };
}

export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; next?: string }> }) {
  const sp = await searchParams;
  const s = await getSession();
  // Signed in but never finished the profile step: pick up from there.
  const unfinished = s?.role === "student" && !s.fullName;
  if (s && !unfinished) redirect(s.role === "teacher" ? "/teacher" : "/student");
  // The demo has one student account, so teacher sign-in is only offered with real accounts.
  const as = sp.as === "teacher" && !DEMO_MODE ? "teacher" : "student";
  return (
    <>
      <SiteNav />
      <div className="gut">
        <LoginFlow key={as} as={as} next={sp.next} demo={DEMO_MODE} startAtProfile={unfinished} />
      </div>
    </>
  );
}
