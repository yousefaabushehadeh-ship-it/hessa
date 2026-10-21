import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { Avatar, Icon, LessonIcon, TYPE_LABEL } from "@/components/ui";
import { getCompletedLessons, getMySubscriptions, getTeacherById } from "@/lib/data";
import { requireRole } from "@/lib/session";

export default async function Materials() {
  const s = await requireRole("student");
  const subs = await getMySubscriptions(s.userId);
  const done = await getCompletedLessons(s.userId);
  const teachers = (await Promise.all(subs.map((x) => getTeacherById(x.teacherId)))).filter((t) => t !== null);
  const first = s.fullName.split(" ")[0];
  return (
    <>
      <TopBar title="المواد" sub="كل الدروس والملخصات والاختبارات من أساتذتك، مرتبة حسب الوحدة." who={first} initial={first[0] ?? "ط"} color="var(--orange)" />
      {teachers.length === 0 && (
        <div className="card empty">
          ما في مواد لسا. <Link className="link" href="/student/redeem">فعّل كود من أستاذك</Link> عشان تنفتح موادّه.
        </div>
      )}
      {teachers.map((t) => {
        const all = t.units.flatMap((u) => u.lessons);
        const dn = all.filter((l) => done.has(l.id)).length;
        return (
          <div className="card panel" key={t.id}>
            <div className="ph2">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar t={t} size={40} />
                <div>
                  <h2>
                    {t.subject} · أ. {t.name}
                  </h2>
                  <span className="muted" style={{ fontSize: 13 }}>
                    خلّصت {dn} من {all.length} مواد
                  </span>
                </div>
              </div>
              <Link className="link" href={`/${t.slug}`}>
                صفحة الأستاذ <Icon name="arrow" sm />
              </Link>
            </div>
            {t.units.map((u, ui) => (
              <details className="unit" key={u.id} open={ui === 0}>
                <summary>
                  <span>{u.title}</span>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                    {u.lessons.length} مواد
                  </span>
                </summary>
                {u.lessons.map((l) => (
                  <Link key={l.id} className="lesson" href={`/student/lesson/${l.id}`}>
                    <LessonIcon type={l.type} />
                    <span className="t">
                      <b>{l.title}</b>
                      <span>
                        {TYPE_LABEL[l.type]} · {l.meta}
                      </span>
                    </span>
                    {done.has(l.id) && (
                      <span className="pill p-ok">
                        <Icon name="check" sm /> مكتمل
                      </span>
                    )}
                  </Link>
                ))}
              </details>
            ))}
          </div>
        );
      })}
    </>
  );
}
