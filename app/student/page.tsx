import Link from "next/link";
import { myParentReportLink } from "@/app/actions/auth";
import { TopBar } from "@/components/dash-shell";
import { Avatar, Icon, LessonIcon, fmtDate, typeLabel } from "@/components/ui";
import { getCompletedLessons, getMySubscriptions, getTeacherById } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

const EXAM_DATE = new Date("2027-06-20");

export default async function StudentHome() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  const subs = await getMySubscriptions(s.userId);
  const done = await getCompletedLessons(s.userId);
  const parentLink = await myParentReportLink();
  const teachers = (await Promise.all(subs.map((x) => getTeacherById(x.teacherId)))).filter((x) => x !== null);
  const days = Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 864e5));
  const first = s.fullName.split(" ")[0] || "";
  // Where the student reached with each teacher: lessons done, the unit they are in, and the next lesson.
  const reach = subs.flatMap((sub) => {
    const x = teachers.find((y) => y.id === sub.teacherId);
    if (!x) return [];
    const all = x.units.flatMap((u, ui) => u.lessons.map((l) => ({ l, u, ui })));
    const doneN = all.filter((a) => done.has(a.l.id)).length;
    const idx = all.findIndex((a) => !done.has(a.l.id));
    const next = idx >= 0 ? all[idx] : null;
    const pct = all.length ? Math.round((doneN / all.length) * 100) : 0;
    const units = x.units.map((u) => {
      const n = u.lessons.filter((l) => done.has(l.id)).length;
      return { id: u.id, title: u.title, state: n === u.lessons.length && n > 0 ? "done" : next && next.u.id === u.id ? "now" : "todo" };
    });
    return [{ sub, x, all, doneN, idx, next, pct, units }];
  });
  // The big "continue" card: the subject the student is furthest along in but not finished.
  const main = [...reach].filter((r) => r.next).sort((a, b) => b.pct - a.pct)[0];
  const totalDone = reach.reduce((a, r) => a + r.doneN, 0);
  const totalAll = reach.reduce((a, r) => a + r.all.length, 0);
  const overall = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("Good morning") : t("Good evening");

  return (
    <>
      <TopBar
        title={`${greet}, ${first}`}
        sub={t("About {n} days left until the final exams", { n: days })}
        who={first}
        initial={first[0] ?? "S"}
        color="var(--orange)"
      />
      {main?.next && (
        <div className="next go-on">
          <div style={{ minWidth: 0 }}>
            <div className="k">
              {t("Continue where you stopped")} · {dataLabel(lang, main.x.subject)} · <bdi>{t("Teacher {name}", { name: main.x.name })}</bdi>
            </div>
            <h3>{main.next.l.title}</h3>
            <div className="k">
              <bdi>{t("Lesson {n} of {total}", { n: main.idx + 1, total: main.all.length })}</bdi> · <bdi>{main.next.u.title}</bdi> · {typeLabel(lang, main.next.l.type)}
            </div>
            <div className="bar">
              <i style={{ width: `${main.pct}%` }} />
            </div>
          </div>
          <Link className="btn" href={`/student/lesson/${main.next.l.id}`}>
            {t("Continue lesson")} <Icon name="arrow" sm />
          </Link>
        </div>
      )}
      <div className="kpis k3">
        <div className="card stat">
          <div className="lbl">{t("Overall progress")}</div>
          <div className="v">{overall}%</div>
          <div className="bar">
            <i style={{ width: `${overall}%` }} />
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Lessons finished")}</div>
          <div className="v">
            {totalDone}
            <small>/{totalAll}</small>
          </div>
          <div className="sub">{t("{n} lessons left", { n: totalAll - totalDone })}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Active subscriptions")}</div>
          <div className="v">{subs.length}</div>
          <div className="sub">
            <Link className="link" href="/student/redeem">
              {t("Activate a new code")}
            </Link>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Where you reached in each subject")}</h2>
              <Link className="link" href="/student/materials">
                {t("All study materials")}
              </Link>
            </div>
            {reach.length ? (
              reach.map((r) => (
                <div key={r.x.id} className="reach">
                  <div className="reach-h">
                    <Avatar t={r.x} size={44} />
                    <div className="t">
                      <b>{dataLabel(lang, r.x.subject)}</b>
                      <span>
                        <bdi>{t("Teacher {name}", { name: r.x.name })}</bdi> · <bdi>{t("{done} of {total} lessons", { done: r.doneN, total: r.all.length })}</bdi>
                      </span>
                    </div>
                    <b className="num reach-pct">{r.pct}%</b>
                  </div>
                  <div className={r.pct < 30 ? "bar o" : "bar"}>
                    <i style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="units" aria-label={t("Units")}>
                    {r.units.map((u, i) => (
                      <span key={u.id} className={`unit ${u.state}`} title={u.title}>
                        {u.state === "done" ? <Icon name="check" sm /> : i + 1}
                      </span>
                    ))}
                    {r.next && <span className="muted unit-now">{r.next.u.title}</span>}
                  </div>
                  {r.next ? (
                    <Link className="lesson" href={`/student/lesson/${r.next.l.id}`}>
                      <LessonIcon type={r.next.l.type} />
                      <span className="t">
                        <b>
                          {t("Up next")}: {r.next.l.title}
                        </b>
                        <span>
                          {typeLabel(lang, r.next.l.type)} · {r.next.l.meta}
                        </span>
                      </span>
                      <Icon name="arrow" sm />
                    </Link>
                  ) : (
                    <div className="lesson" style={{ cursor: "default" }}>
                      <span className="t">
                        <b>{t("You finished every lesson with this teacher. Well done!")}</b>
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty">
                {t("You don't have any subscriptions yet.")} <Link className="link" href="/teachers">{t("Browse teachers")}</Link> {t("or")}{" "}
                <Link className="link" href="/student/redeem">
                  {t("activate a code")}
                </Link>
                .
              </div>
            )}
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("My teachers")}</h2>
              <Link className="link" href="/teachers">
                <Icon name="plus" sm /> {t("Subscribe to a new teacher")}
              </Link>
            </div>
            {subs.map((x) => {
              const tc = teachers.find((y) => y.id === x.teacherId);
              if (!tc) return null;
              const left = Math.ceil((new Date(x.endsOn).getTime() - Date.now()) / 864e5);
              return (
                <Link key={tc.id} className="trow" href={`/${tc.slug}`} style={{ textDecoration: "none" }}>
                  <Avatar t={tc} size={48} />
                  <div className="t">
                    <b>
                      {t("Teacher")} {tc.name}
                    </b>
                    <span>
                      {dataLabel(lang, tc.subject)} · {t("Until {date}", { date: fmtDate(lang, x.endsOn) })}
                    </span>
                  </div>
                  {left <= 5 ? <span className="pill p-warn">{left <= 0 ? t("Ends today") : t("{n} days left", { n: left })}</span> : <span className="pill p-ok">{t("Active")}</span>}
                </Link>
              );
            })}
          </div>
          {parentLink && (
            <div className="card panel">
              <div className="ph2">
                <h2>{t("Your parent's report")}</h2>
              </div>
              <p className="muted">{t("Your parent can follow your progress, quiz marks and teachers' comments through this link, with no account.")}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <a
                  className="btn btn-pri"
                  target="_blank"
                  rel="noopener"
                  href={`https://wa.me/?text=${encodeURIComponent(t("This is my progress report on Hessa: {url}", { url: parentLink }))}`}
                >
                  {t("Send on WhatsApp")}
                </a>
                <a className="btn btn-ghost" href={parentLink} target="_blank" rel="noopener">
                  {t("See what they see")}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
