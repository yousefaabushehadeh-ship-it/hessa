import { TopBar } from "@/components/dash-shell";
import { fmtDate } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n-server";
import { listMyStudents } from "@/lib/students";
import { myTeacher } from "@/lib/teacher-context";

export default async function Students() {
  const t = await getT();
  const lang = await getLang();
  const x = await myTeacher();
  const rows = await listMyStudents(x);
  const first = x.name.split(" ")[0];
  const behind = rows.filter((r) => r.progress < 30).length;
  const soon = rows.filter((r) => new Date(r.endsOn).getTime() - Date.now() < 7 * 864e5).length;
  return (
    <>
      <TopBar title={t("Students")} sub={t("Who is subscribed, how far they've got, and who needs a follow-up.")} who={`${t("Teacher")} ${first}`} initial={x.initial} color={x.color} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Current subscribers")}</div>
          <div className="v">{rows.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Need a follow-up")}</div>
          <div className="v" style={{ color: behind ? "var(--warn-fg)" : undefined }}>
            {behind}
          </div>
          <div className="sub">{t("Progress under 30%")}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Subscriptions ending this week")}</div>
          <div className="v">{soon}</div>
        </div>
      </div>
      <div className="card panel">
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("Student")}</th>
                <th className="hide-s">{t("Subscription")}</th>
                <th>{t("Progress")}</th>
                <th className="hide-s">{t("Last quiz")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    {t("No subscribed students yet. Create activation codes and send them to your students.")}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b style={{ fontFamily: "var(--f-display)", fontWeight: 600 }}>{r.name}</b>
                  </td>
                  <td className="muted hide-s">
                    {r.plan === "term" ? t("Term") : t("Monthly")} · {t("until {date}", { date: fmtDate(lang, r.endsOn) })}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className={r.progress < 30 ? "bar o" : "bar"} style={{ flex: 1 }}>
                        <i style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="num" style={{ fontSize: 13 }}>
                        {r.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="muted hide-s num">{r.lastQuiz ?? "—"}</td>
                  <td>{r.progress < 30 ? <span className="pill p-warn">{t("Follow up")}</span> : <span className="pill p-ok">{t("On track")}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
