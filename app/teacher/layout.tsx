import type { ReactNode } from "react";
import { DashShell, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("teacher");
  const NAV: NavItem[] = [
    { href: "/teacher", label: t("Overview"), icon: "home" },
    { href: "/teacher/content", label: t("Content"), icon: "book" },
    { href: "/teacher/students", label: t("Students"), icon: "users" },
    { href: "/teacher/profile", label: t("My public page"), icon: "globe" },
    { href: "/settings", label: t("Settings"), icon: "gear" },
  ];
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.teacherId ? (
        children
      ) : (
        <div className="card center-card">
          <h1 style={{ fontSize: 22 }}>{t("Your page is being set up")}</h1>
          <p className="muted">
            {t("Once we verify your identity and qualifications, we will link your page to your account and you can upload your materials. Contact support@hessa.jo.")}
          </p>
        </div>
      )}
    </DashShell>
  );
}
