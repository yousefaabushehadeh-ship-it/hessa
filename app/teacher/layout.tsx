import type { ReactNode } from "react";
import { DashShell, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { VerificationPanel } from "./verification/panel";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("teacher");
  // Until the team verifies them and links a page, new teachers only get the verification steps.
  const NAV: NavItem[] = s.teacherId
    ? [
        { href: "/teacher", label: t("Overview"), icon: "home" },
        { href: "/teacher/content", label: t("Content"), icon: "book" },
        { href: "/teacher/students", label: t("Students"), icon: "users" },
        { href: "/teacher/profile", label: t("My public page"), icon: "globe" },
        { href: "/teacher/verification", label: t("Verification"), icon: "shield" },
        { href: "/settings", label: t("Settings"), icon: "gear" },
      ]
    : [
        { href: "/teacher", label: t("Verification"), icon: "shield" },
        { href: "/settings", label: t("Settings"), icon: "gear" },
      ];
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.teacherId ? children : <VerificationPanel s={s} />}
    </DashShell>
  );
}
