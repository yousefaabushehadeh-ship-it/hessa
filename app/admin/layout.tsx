import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashShell } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { getT } from "@/lib/i18n-server";
import { navFor } from "@/lib/nav";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("admin");
  return (
    <DashShell nav={navFor(s, t)} footer={<SignOut />}>
      {children}
    </DashShell>
  );
}
