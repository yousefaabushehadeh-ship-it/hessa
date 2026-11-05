import { fmtDate } from "@/components/ui";
import type { StudentReport, StudentStatus } from "@/lib/analysis";
import { makeT, type Lang } from "@/lib/i18n";

export function StatusPill({ status, lang }: { status: StudentStatus; lang: Lang }) {
  const t = makeT(lang);
  if (status === "on_track") return <span className="pill p-ok">{t("On track")}</span>;
  if (status === "follow_up") return <span className="pill p-warn">{t("Follow up")}</span>;
  return <span className="pill p-bad">{t("Inactive this week")}</span>;
}

/** "Today", "Yesterday", "3 days ago", or the date. */
export function lastSeen(lang: Lang, iso: string | null): string {
  const t = makeT(lang);
  if (!iso) return t("No activity yet");
  const days = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  if (days <= 0) return t("Today");
  if (days === 1) return t("Yesterday");
  if (days < 14) return t("{n} days ago", { n: days });
  return fmtDate(lang, iso.slice(0, 10));
}

/** The numbers and lists of one student's record with one teacher. */
export function ReportBody({ r, lang }: { r: StudentReport; lang: Lang }) {
  const t = makeT(lang);
  const handedIn = r.worksheets.length;
  return (
    <div className="report">
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Progress")}</div>
          <div className="v">{r.progress}%</div>
          <div className={r.progress < 30 ? "bar o" : "bar"}>
            <i style={{ width: `${r.progress}%` }} />
          </div>
          <div className="sub">{t("{done} of {total} lessons", { done: r.lessonsDone, total: r.lessonsTotal })}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Quiz average")}</div>
          <div className="v" style={{ color: r.quizAvg !== null && r.quizAvg < 60 ? "var(--warn-fg)" : undefined }}>
            {r.quizAvg === null ? "—" : `${r.quizAvg}%`}
          </div>
          <div className="sub">{t("{n} quizzes taken", { n: r.quizzes.length })}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Worksheets handed in")}</div>
          <div className="v">
            {handedIn}/{r.worksheetsTotal}
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Last active")}</div>
          <div className="v" style={{ fontSize: 18 }}>
            {lastSeen(lang, r.lastActive)}
          </div>
          <div className="sub">
            <StatusPill status={r.status} lang={lang} />
          </div>
        </div>
      </div>
      {r.weak.length > 0 && (
        <div className="card panel">
          <div className="ph2">
            <h2>{t("Needs more practice")}</h2>
          </div>
          <p className="muted">{t("Last quiz score under 60% in:")}</p>
          <ul className="ul">
            {r.weak.map((w) => (
              <li key={w}>
                <span className="pill p-warn">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Quizzes")}</h2>
            </div>
            {r.quizzes.length === 0 ? (
              <div className="empty">{t("No quizzes taken yet.")}</div>
            ) : (
              <div className="scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t("Quiz")}</th>
                      <th>{t("Last score")}</th>
                      <th className="hide-s">{t("Tries")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.quizzes.map((q) => (
                      <tr key={q.title}>
                        <td>{q.title}</td>
                        <td className="num">
                          <span className={q.score / q.total < 0.6 ? "pill p-warn" : "pill p-ok"}>
                            {q.score}/{q.total}
                          </span>
                        </td>
                        <td className="num hide-s">{q.tries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Worksheets")}</h2>
            </div>
            {r.worksheets.length === 0 ? (
              <div className="empty">{t("No worksheets handed in yet.")}</div>
            ) : (
              r.worksheets.map((w, i) => (
                <div key={i} className="lesson" style={{ cursor: "default" }}>
                  <span className="t">
                    <b>{w.title}</b>
                    <span>{w.feedback ? `“${w.feedback}”` : t("Waiting for the teacher's mark")}</span>
                  </span>
                  {w.mark ? <span className="pill p-ok">{w.mark}</span> : <span className="pill p-info">{t("Handed in")}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
