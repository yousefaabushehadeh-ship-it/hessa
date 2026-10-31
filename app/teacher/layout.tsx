import type { ReactNode } from "react";
import { DashShell } from "@/components/dash-shell";
import { navFor } from "@/lib/nav";
import { SignOut } from "@/components/sign-out";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { VerificationPanel } from "./verification/panel";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("teacher");
  const NAV = navFor(s, t);
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.teacherId ? children : <VerificationPanel s={s} />}
    </DashShell>
  );
}
