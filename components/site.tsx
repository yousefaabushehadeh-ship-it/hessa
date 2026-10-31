import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { getSession, homeFor } from "@/lib/session";
import { getT } from "@/lib/i18n-server";

export async function SiteNav({ active }: { active?: "browse" }) {
  const s = await getSession();
  const t = await getT();
  return (
    <>
      <header className="nav gut">
        <div className="wrap">
          <Link href="/" className="logo" aria-label={t("Hessa, home page")}>
            <span className="mk">ح</span>Hessa
          </Link>
          <nav className="nav-links">
            <Link href="/teachers" className={active === "browse" ? "on" : ""}>
              {t("Teachers")}
            </Link>
            <Link href="/services">{t("Services")}</Link>
            <Link href="/#how">{t("How it works")}</Link>
          </nav>
          <span className="sp" />
          <LangSwitch />
          {s ? (
            <Link href={homeFor(s.role)} className="btn btn-pri btn-sm">
              {t("My account")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                {t("Sign in")}
              </Link>
              <Link href="/signup" className="btn btn-pri btn-sm">
                {t("Create account")}
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="site gut">
      <div className="wrap">
        <div style={{ maxWidth: 300, display: "grid", gap: 10 }}>
          <span className="logo" style={{ fontSize: 22 }}>
            <span className="mk" style={{ width: 34, height: 34, fontSize: 18 }}>
              ح
            </span>
            Hessa
          </span>
          <p>
            {t("A platform that brings teachers and their students together in one place: lessons, live classes, quizzes and subscriptions.")}
          </p>
        </div>
        <div className="cols">
          <div>
            <h4>{t("For students")}</h4>
            <Link href="/signup/student">{t("Create a student account")}</Link>
            <Link href="/login/student">{t("Student sign in")}</Link>
            <Link href="/teachers">{t("Browse teachers")}</Link>
            <Link href="/#faq">{t("FAQ")}</Link>
          </div>
          <div>
            <h4>{t("For teachers")}</h4>
            <Link href="/signup/teacher">{t("Create a teacher account")}</Link>
            <Link href="/login/teacher">{t("Teacher sign in")}</Link>
            <Link href="/#teachers-band">{t("Prices and commission")}</Link>
          </div>
          <div>
            <h4>{t("Legal")}</h4>
            <Link href="/privacy">{t("Privacy policy")}</Link>
            <Link href="/terms">{t("Terms of use")}</Link>
          </div>
          <div>
            <h4>{t("Contact")}</h4>
            <span>{t("Amman, Jordan")}</span>
            <span>support@hessa.jo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
