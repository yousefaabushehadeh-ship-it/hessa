import Link from "next/link";
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
  const teachers = (await Promise.all(subs.map((x) => getTeacherById(x.teacherId)))).filter((x) => x !== null);
  const days = Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 864e5));
  const first = s.fullName.split(" ")[0] || "";
  // "Pick up where you left off": the first lesson not yet finished, per teacher.
  const nextUp = teachers.flatMap((x) => {
    const l = x.units.flatMap((u) => u.lessons).find((y) => !done.has(y.id));
    return l ? [{ x, l }] : [];
  });
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("Good morning") : t("Good evening");

  return (
    <>
      <TopBar
        title={`${greet}, ${first}`}
        sub={t("About {n} days left until the Tawjihi exams", { n: days })}
        who={first}
        initial={first[0] ?? "S"}
        color="var(--orange)"
      />
      <div className="kpis">
        {subs.map((x) => {
          const tc = teachers.find((y) => y.id === x.teacherId);
          return (
            <div className="card stat" key={x.teacherId}>
              <div className="lbl">{t("Your progress in {subject}", { subject: dataLabel(lang, tc?.subject ?? "") })}</div>
              <div className="v">{x.progress}%</div>
              <div className="bar">
                <i style={{ width: `${x.progress}%` }} />
              </div>
            </div>
          );
        })}
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
              <h2>{t("Pick up where you left off")}</h2>
              <Link className="link" href="/student/materials">
                {t("All materials")}
              </Link>
            </div>
            {nextUp.length ? (
              nextUp.map(({ x, l }) => (
                <Link key={l.id} className="lesson" href={`/student/lesson/${l.id}`}>
                  <LessonIcon type={l.type} />
                  <span className="t">
                    <b>{l.title}</b>
                    <span>
                      {t("Teacher {name}", { name: x.name })} · {typeLabel(lang, l.type)} · {l.meta}
                    </span>
                  </span>
                  <Icon name="arrow" sm />
                </Link>
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
              const soon = new Date(x.endsOn).getTime() - Date.now() < 5 * 864e5;
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
                  {soon ? <span className="pill p-warn">{t("Ending soon")}</span> : <span className="pill p-ok">{t("Active")}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
