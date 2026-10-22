import type { ReactNode } from "react";
import { DashShell, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { requireRole } from "@/lib/session";

const NAV: NavItem[] = [
  { href: "/teacher", label: "نظرة عامة", icon: "home" },
  { href: "/teacher/content", label: "المحتوى", icon: "book" },
  { href: "/teacher/students", label: "الطلاب", icon: "users" },
  { href: "/teacher/profile", label: "صفحتي العامة", icon: "globe" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const s = await requireRole("teacher");
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      {s.teacherId ? (
        children
      ) : (
        <div className="card center-card">
          <h1 style={{ fontSize: 22 }}>صفحتك قيد التجهيز</h1>
          <p className="muted">بعد ما نتحقق من هويتك ومؤهلك، بنربط صفحتك بحسابك وبتقدر ترفع موادّك. راسلنا على support@hessa.jo.</p>
        </div>
      )}
    </DashShell>
  );
}
