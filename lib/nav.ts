import type { NavItem } from "@/components/dash-shell";
import type { T } from "@/lib/i18n";
import type { Session } from "@/lib/types";

/** The side menu for each kind of account. Shared by the dashboards and the settings page. */
export function navFor(s: Session, t: T): NavItem[] {
  const settings = { href: "/settings", label: t("Settings"), icon: "gear" };
  if (s.role === "admin")
    return [
      { href: "/admin", label: t("Overview"), icon: "chart" },
      { href: "/admin/teachers", label: t("Teachers"), icon: "users" },
      { href: "/admin/schools", label: t("Schools"), icon: "bank" },
      { href: "/admin/students", label: t("Students"), icon: "book" },
      { href: "/admin/payments", label: t("Payments"), icon: "wallet" },
      { href: "/admin/reviews", label: t("Reviews"), icon: "star" },
      settings,
    ];
  if (s.role === "school")
    return [
      { href: "/school", label: t("Overview"), icon: "home" },
      { href: "/school/teachers", label: t("Teachers"), icon: "users" },
      settings,
    ];
  if (s.role === "teacher")
    // Until the team verifies them and links a page, new teachers only get the verification steps.
    return s.teacherId
      ? [
          { href: "/teacher", label: t("Overview"), icon: "home" },
          { href: "/teacher/content", label: t("Content"), icon: "book" },
          { href: "/teacher/worksheets", label: t("Worksheets"), icon: "worksheet" },
          { href: "/teacher/payments", label: t("Payments"), icon: "wallet" },
          { href: "/teacher/students", label: t("Students"), icon: "users" },
          { href: "/teacher/profile", label: t("My public page"), icon: "globe" },
          { href: "/teacher/verification", label: t("Verification"), icon: "shield" },
          settings,
        ]
      : [{ href: "/teacher", label: t("Verification"), icon: "shield" }, settings];
  return [
    { href: "/student", label: t("Home"), icon: "home" },
    { href: "/student/materials", label: t("Study materials"), icon: "book" },
    { href: "/student/find", label: t("Find a teacher"), icon: "search" },
    { href: "/student/redeem", label: t("Activate a code"), icon: "card" },
    settings,
  ];
}
