import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site";
import { DEMO_MODE } from "@/lib/env";
import { getSession } from "@/lib/session";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = { title: "الدخول" };

export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; next?: string }> }) {
  const sp = await searchParams;
  const s = await getSession();
  // Signed in but never finished the profile step: pick up from there.
  const unfinished = s?.role === "student" && !s.fullName;
  if (s && !unfinished) redirect(s.role === "teacher" ? "/teacher" : "/student");
  const as = sp.as === "teacher" ? "teacher" : "student";
  return (
    <>
      <SiteNav />
      <div className="gut">
        <LoginFlow key={as} as={as} next={sp.next} demo={DEMO_MODE} startAtProfile={unfinished} />
      </div>
    </>
  );
}
