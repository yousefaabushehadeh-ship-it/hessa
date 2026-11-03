import { TopBar } from "@/components/dash-shell";
import { fmt } from "@/components/ui";
import { getSchoolStats } from "@/lib/analysis";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listSchoolTeachers } from "@/lib/platform";
import { mySchool } from "@/lib/school-context";

/** Totals per teacher. The school never sees a single student's name or marks here. */
export default async function SchoolAnalysis() {
  const t = await getT();
  const lang = await getLang();
  const { s, school } = await mySchool();
  const [teachers, stats] = await Promise.all([listSchoolTeachers(school.id), getSchoolStats(school.id)]);
  const rows = teachers.map((x) => ({ x, st: stats.find((y) => y.teacherId === x.id) }));
  const students = stats.reduce((a, x) => a + x.students, 0);
  const active = stats.reduce((a, x) => a + x.activeWeek, 0);
  const follow = stats.reduce((a, x) => a + x.needFollowUp, 0);
  const avg = (k: "avgProgress" | "avgQuiz") => {
    const list = stats.filter((x) => x.students > 0 && x[k] !== null);
    const n = list.reduce((a, x) => a + x.students, 0);
    return n ? Math.round(list.reduce((a, x) => a + (x[k] ?? 0) * x.students, 0) / n) : null;
  };
  const avgProgress = avg("avgProgress");
  const avgQuiz = avg("avgQuiz");
  return (
    <>
      <TopBar title={t("Student analysis")} sub={t("How your teachers' students are doing, in totals per teacher.")} who={s.fullName} initial={school.name[0]} color="var(--rail)" />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Active students")}</div>
          <div className="v">{fmt(students)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Studied this week")}</div>
          <div className="v">{students ? `${Math.round((active / students) * 100)}%` : "—"}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Average progress")}</div>
          <div className="v">{avgProgress === null ? "—" : `${avgProgress}%`}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Quiz average")}</div>
          <div className="v">{avgQuiz === null ? "—" : `${avgQuiz}%`}</div>
        </div>
      </div>
      <div className="card panel">
        <div className="ph2">
          <h2>{t("By teacher")}</h2>
          {follow > 0 && <span className="pill p-warn">{t("{n} students need a follow-up", { n: follow })}</span>}
        </div>
        {rows.length === 0 ? (
          <div className="empty">{t("Add your first teacher by their mobile number.")}</div>
        ) : (
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("Teacher")}</th>
                  <th>{t("Students")}</th>
                  <th>{t("Progress")}</th>
                  <th className="hide-s">{t("Quiz average")}</th>
                  <th className="hide-s">{t("Studied this week")}</th>
                  <th>{t("Need a follow-up")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ x, st }) => (
                  <tr key={x.id}>
                    <td>
                      <b>{x.name}</b>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {dataLabel(lang, x.subject)}
                      </div>
                    </td>
                    <td className="num">{fmt(st?.students ?? 0)}</td>
                    <td style={{ minWidth: 110 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div className={(st?.avgProgress ?? 0) < 30 ? "bar o" : "bar"} style={{ flex: 1 }}>
                          <i style={{ width: `${st?.avgProgress ?? 0}%` }} />
                        </div>
                        <span className="num" style={{ fontSize: 13 }}>
                          {st?.avgProgress ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="num hide-s">{st?.avgQuiz == null ? "—" : `${st.avgQuiz}%`}</td>
                    <td className="num hide-s">{st?.students ? `${Math.round((st.activeWeek / st.students) * 100)}%` : "—"}</td>
                    <td className="num">{st?.needFollowUp ? <span className="pill p-warn">{st.needFollowUp}</span> : <span className="pill p-ok">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        {t("To protect students' privacy, the school sees totals only. Each teacher follows their own students one by one, and parents see their own child's report.")}
      </p>
    </>
  );
}
