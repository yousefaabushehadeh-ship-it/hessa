import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { fmt } from "@/components/ui";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listSchoolInvites, listSchoolTeachers } from "@/lib/platform";
import { mySchool } from "@/lib/school-context";

export default async function SchoolHome() {
  const t = await getT();
  const lang = await getLang();
  const { s, school } = await mySchool();
  const [teachers, invites] = await Promise.all([listSchoolTeachers(school.id), listSchoolInvites(school.id)]);
  const students = teachers.reduce((a, x) => a + x.students, 0);
  const waiting = invites.filter((x) => !x.used).length;
  return (
    <>
      <TopBar title={school.name} sub={dataLabel(lang, school.city)} who={s.fullName} initial={school.name[0]} color="var(--rail)" />
      {!school.verified && (
        <div className="card panel" style={{ marginBottom: 18 }}>
          <div className="ph2">
            <h2>{t("Your school is under review")}</h2>
            <span className="pill p-warn">{t("Under review")}</span>
          </div>
          <p className="muted">{t("We'll call you within 2 working days to verify the school. You can add your teachers now; their pages go public once the school is verified.")}</p>
        </div>
      )}
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Teachers")}</div>
          <div className="v">{teachers.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Active students")}</div>
          <div className="v">{fmt(students)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Haven't joined yet")}</div>
          <div className="v">{waiting}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Status")}</div>
          <div className="v" style={{ fontSize: 18 }}>
            {school.verified ? <span className="pill p-ok">{t("Verified")}</span> : <span className="pill p-warn">{t("Under review")}</span>}
          </div>
        </div>
      </div>
      <div className="card panel">
        <div className="ph2">
          <h2>{t("Your teachers")}</h2>
          <Link className="link" href="/school/teachers">
            {t("Add a teacher")}
          </Link>
        </div>
        {teachers.length === 0 ? (
          <div className="empty">{t("Add your first teacher by their mobile number.")}</div>
        ) : (
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("Teacher")}</th>
                  <th className="hide-s">{t("Subject")}</th>
                  <th>{t("Students")}</th>
                  <th className="hide-s">{t("Items")}</th>
                  <th>{t("Page")}</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <b>{x.name}</b>
                    </td>
                    <td className="muted hide-s">
                      {dataLabel(lang, x.subject)} · {dataLabel(lang, x.grade)}
                    </td>
                    <td className="num">{fmt(x.students)}</td>
                    <td className="num hide-s">{x.lessons}</td>
                    <td>
                      {x.verified ? (
                        <Link className="link" href={`/${x.slug}`}>
                          {t("Public")}
                        </Link>
                      ) : (
                        <span className="pill p-warn">{t("Not public yet")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
