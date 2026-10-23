import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { Icon, fmt, fmtDate } from "@/components/ui";
import { getTeacherStats, listMyCodes } from "@/lib/data";
import { getLang, getT } from "@/lib/i18n-server";
import { myTeacher } from "@/lib/teacher-context";
import { CodesForm } from "./codes-form";

export default async function TeacherHome() {
  const t = await getT();
  const lang = await getLang();
  const x = await myTeacher();
  const codes = await listMyCodes(x.id);
  const st = await getTeacherStats(x, codes);
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("Welcome, Teacher {name}", { name: first })}
        sub={t("Create access codes for your students, and organize your content from the Content page.")}
        who={`${t("Teacher")} ${first}`}
        initial={x.initial}
        color={x.color}
      />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Active students")}</div>
          <div className="v">{fmt(st.activeStudents)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Unused codes")}</div>
          <div className="v">{st.codesLeft}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Published items")}</div>
          <div className="v">{st.lessons}</div>
          <div className="sub">{t("{n} free to try", { n: st.freeLessons })}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Monthly price")}</div>
          <div className="v">
            {x.priceMonth} <small>JOD</small>
          </div>
          <div className="sub">
            <Link className="link" href="/teacher/profile">
              {t("Edit")}
            </Link>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Access codes")}</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                {t("One code per student")}
              </span>
            </div>
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t("Code")}</th>
                    <th>{t("Plan")}</th>
                    <th className="hide-s">{t("Created")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code}>
                      <td className="num" dir="ltr" style={{ textAlign: "start" }}>
                        {c.code}
                      </td>
                      <td className="muted">{c.plan === "term" ? t("Term") : t("Monthly")}</td>
                      <td className="muted hide-s">{fmtDate(lang, c.createdAt)}</td>
                      <td>{c.usedBy ? <span className="pill p-info">{t("Used")}</span> : <span className="pill p-ok">{t("Ready")}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Create new codes")}</h2>
            </div>
            <CodesForm />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>{t("My public page")}</h2>
            </div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
              {t("Share this link with your students so they can see your study materials and try the free lessons.")}
            </p>
            <Link className="btn btn-ghost btn-sm" href={`/${x.slug}`}>
              <Icon name="globe" sm /> hessa.jo/{x.slug}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
