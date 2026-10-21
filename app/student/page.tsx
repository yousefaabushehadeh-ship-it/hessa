import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { Avatar, Icon, LessonIcon, TYPE_LABEL, fmtDate } from "@/components/ui";
import { getCompletedLessons, getMySubscriptions, getTeacherById } from "@/lib/data";
import { requireRole } from "@/lib/session";

const EXAM_DATE = new Date("2027-06-20");

export default async function StudentHome() {
  const s = await requireRole("student");
  const subs = await getMySubscriptions(s.userId);
  const done = await getCompletedLessons(s.userId);
  const teachers = (await Promise.all(subs.map((x) => getTeacherById(x.teacherId)))).filter((t) => t !== null);
  const days = Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 864e5));
  const first = s.fullName.split(" ")[0] || "يا بطل";
  // "Up next": the first lesson not yet finished, per teacher.
  const nextUp = teachers.flatMap((t) => {
    const l = t.units.flatMap((u) => u.lessons).find((x) => !done.has(x.id));
    return l ? [{ t, l }] : [];
  });

  return (
    <>
      <TopBar title={`أهلا يا ${first}`} sub={`ضايلك تقريبًا ${days} يوم على امتحانات التوجيهي`} who={first} initial={first[0]} color="var(--orange)" />
      <div className="kpis">
        {subs.map((x) => {
          const t = teachers.find((y) => y.id === x.teacherId);
          return (
            <div className="card stat" key={x.teacherId}>
              <div className="lbl">تقدّمك بمادة {t?.subject}</div>
              <div className="v">{x.progress}%</div>
              <div className="bar">
                <i style={{ width: `${x.progress}%` }} />
              </div>
            </div>
          );
        })}
        <div className="card stat">
          <div className="lbl">اشتراكات فعّالة</div>
          <div className="v">{subs.length}</div>
          <div className="sub">
            <Link className="link" href="/student/redeem">
              فعّل كود جديد
            </Link>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>كمّل من وين وقفت</h2>
              <Link className="link" href="/student/materials">
                كل المواد
              </Link>
            </div>
            {nextUp.length ? (
              nextUp.map(({ t, l }) => (
                <Link key={l.id} className="lesson" href={`/student/lesson/${l.id}`}>
                  <LessonIcon type={l.type} />
                  <span className="t">
                    <b>{l.title}</b>
                    <span>
                      أ. {t.name} · {TYPE_LABEL[l.type]} · {l.meta}
                    </span>
                  </span>
                  <Icon name="arrow" sm />
                </Link>
              ))
            ) : (
              <div className="empty">
                ما عندك اشتراكات لسا. <Link className="link" href="/teachers">تصفّح الأساتذة</Link> أو{" "}
                <Link className="link" href="/student/redeem">
                  فعّل كود
                </Link>
                .
              </div>
            )}
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>أساتذتي</h2>
              <Link className="link" href="/teachers">
                <Icon name="plus" sm /> اشترك بجديد
              </Link>
            </div>
            {subs.map((x) => {
              const t = teachers.find((y) => y.id === x.teacherId);
              if (!t) return null;
              const soon = new Date(x.endsOn).getTime() - Date.now() < 5 * 864e5;
              return (
                <Link key={t.id} className="trow" href={`/${t.slug}`} style={{ textDecoration: "none" }}>
                  <Avatar t={t} size={48} />
                  <div className="t">
                    <b>أ. {t.name}</b>
                    <span>
                      {t.subject} · لحد {fmtDate(x.endsOn)}
                    </span>
                  </div>
                  {soon ? <span className="pill p-warn">قرّب يخلص</span> : <span className="pill p-ok">فعّال</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
