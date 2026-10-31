import { setLang } from "@/app/actions/lang";
import { DashShell, TopBar } from "@/components/dash-shell";
import { navFor } from "@/lib/nav";
import { DeleteForm } from "./delete-form";
import { SignOut } from "@/components/sign-out";
import { getLang, getT } from "@/lib/i18n-server";
import { requireSession } from "@/lib/session";

export default async function Settings() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireSession();
  const first = s.fullName.split(" ")[0] || "";
  const NAV = navFor(s, t);
  const roles = { student: t("Student"), teacher: t("Teacher"), school: t("School"), admin: t("Hessa team") };
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
              <span className="muted">{t("Role")}</span> <b>{roles[s.role]}</b>
            </span>
          </div>
        </div>
      </div>
      {s.role !== "admin" && (
        <div className="card panel" style={{ maxWidth: 620 }}>
          <div className="ph2">
            <h2>{t("Delete account")}</h2>
          </div>
          <DeleteForm />
        </div>
      )}
    </DashShell>
  );
}
