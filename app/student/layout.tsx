import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashShell } from "@/components/dash-shell";
import { navFor } from "@/lib/nav";
import { unreadCount } from "@/lib/notifications";
import { SignOut } from "@/components/sign-out";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("student");
  if (!s.fullName) redirect("/login/student");
  const NAV = navFor(s, t, await unreadCount(s));
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {children}
    </DashShell>
  );
}
