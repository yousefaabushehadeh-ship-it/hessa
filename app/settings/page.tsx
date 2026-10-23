import { setLang } from "@/app/actions/lang";
import { DashShell, TopBar, type NavItem } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { getLang, getT } from "@/lib/i18n-server";
import { requireSession } from "@/lib/session";

export default async function Settings() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireSession();
  const first = s.fullName.split(" ")[0] || "";
  const NAV: NavItem[] =
    s.role === "teacher"
      ? [
          { href: "/teacher", label: t("Overview"), icon: "home" },
          { href: "/teacher/content", label: t("Content"), icon: "book" },
          { href: "/teacher/students", label: t("Students"), icon: "users" },
          { href: "/teacher/profile", label: t("My public page"), icon: "globe" },
          { href: "/settings", label: t("Settings"), icon: "gear" },
        ]
      : [
          { href: "/student", label: t("Home"), icon: "home" },
          { href: "/student/materials", label: t("Study materials"), icon: "book" },
          { href: "/student/redeem", label: t("Activate a code"), icon: "card" },
          { href: "/teachers", label: t("Teachers"), icon: "users" },
          { href: "/settings", label: t("Settings"), icon: "gear" },
        ];
  return (
    <DashShell nav={NAV} footer={<SignOut />}>
      <TopBar title={t("Settings")} sub={t("Language and account.")} who={first} initial={first[0] ?? "S"} color="var(--orange)" />
      <div className="card panel" style={{ maxWidth: 620 }}>
        <div className="ph2">
          <h2>{t("Language")}</h2>
        </div>
        <form action={setLang} className="settings-list">
          <label className="radio-row">
            <input type="radio" name="lang" value="en" defaultChecked={lang === "en"} />
            <span>
              <b>English</b>
            </span>
          </label>
          <label className="radio-row">
            <input type="radio" name="lang" value="ar" defaultChecked={lang === "ar"} />
            <span>
              <b>العربية</b>
            </span>
          </label>
          <button className="btn btn-pri btn-sm" style={{ justifySelf: "start" }}>
            {t("Save language")}
          </button>
        </form>
      </div>
      <div className="card panel" style={{ maxWidth: 620 }}>
        <div className="ph2">
          <h2>{t("Account")}</h2>
        </div>
        <div className="settings-list">
          <div className="radio-row" style={{ cursor: "default" }}>
            <span>
              <span className="muted">{t("Name")}</span> <b>{s.fullName || "—"}</b>
            </span>
          </div>
          <div className="radio-row" style={{ cursor: "default" }}>
            <span>
              <span className="muted">{t("Role")}</span> <b>{s.role === "teacher" ? t("Teacher") : t("Student")}</b>
            </span>
          </div>
        </div>
      </div>
    </DashShell>
  );
}
