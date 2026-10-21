import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { myConsentLink } from "@/app/actions/auth";
import { DashShell, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { DEMO_MODE } from "@/lib/env";
import { requireRole } from "@/lib/session";

const NAV: NavItem[] = [
  { href: "/student", label: "الرئيسية", icon: "home" },
  { href: "/student/materials", label: "المواد", icon: "book" },
  { href: "/student/redeem", label: "تفعيل كود", icon: "card" },
  { href: "/teachers", label: "الأساتذة", icon: "users" },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const s = await requireRole("student");
  if (!s.fullName) redirect("/login");
  const link = s.consent === "pending" ? await myConsentLink() : null;
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.consent === "pending" ? (
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>بانتظار موافقة ولي الأمر</h1>
          <p className="muted">ابعث هالرابط لولي أمرك. أول ما يوافق، حسابك بيتفعّل وكل موادّك بتنفتح هون.</p>
          {link && (
            <>
              <input className="field num" dir="ltr" readOnly value={link} aria-label="رابط الموافقة" />
              <a
                className="btn btn-pri"
                target="_blank"
                rel="noopener"
                href={`https://wa.me/?text=${encodeURIComponent(`مرحبا، بدي أفتح حساب على منصة حِصّة للدراسة مع أساتذتي. وافق من هون: ${link}`)}`}
              >
                ابعثه على الواتساب
              </a>
            </>
          )}
          {DEMO_MODE && (
            <Link className="btn btn-ghost" href="/consent/demo">
              (تجربة) افتح صفحة الموافقة كأنك ولي الأمر
            </Link>
          )}
        </div>
      ) : (
        children
      )}
    </DashShell>
  );
}
