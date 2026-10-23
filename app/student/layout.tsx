import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { myConsentLink } from "@/app/actions/auth";
import { DashShell, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const s = await requireRole("student");
  if (!s.fullName) redirect("/login");
  const link = s.consent === "pending" ? await myConsentLink() : null;
  const NAV: NavItem[] = [
    { href: "/student", label: t("Home"), icon: "home" },
    { href: "/student/materials", label: t("Study materials"), icon: "book" },
    { href: "/student/redeem", label: t("Activate a code"), icon: "card" },
    { href: "/teachers", label: t("Teachers"), icon: "users" },
    { href: "/settings", label: t("Settings"), icon: "gear" },
  ];
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.consent === "pending" ? (
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>{t("Waiting for your parent's approval")}</h1>
          <p className="muted">{t("Send this link to your parent. Once they approve, your account is active and all your study materials open here.")}</p>
          {link && (
            <>
              <input className="field num" dir="ltr" readOnly value={link} aria-label={t("Approval link")} />
              <a
                className="btn btn-pri"
                target="_blank"
                rel="noopener"
                href={`https://wa.me/?text=${encodeURIComponent(t("Hello, I want to open an account on Hessa to study with my teachers. Approve here: {url}", { url: link }))}`}
              >
                {t("Send on WhatsApp")}
              </a>
            </>
          )}
          {DEMO_MODE && (
            <Link className="btn btn-ghost" href="/consent/demo">
              {t("(Demo) Open the approval page as a parent")}
            </Link>
          )}
        </div>
      ) : (
        children
      )}
    </DashShell>
  );
}
