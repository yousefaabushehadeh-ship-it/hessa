import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { Avatar, Icon, LessonIcon, typeLabel } from "@/components/ui";
import { getCompletedLessons, getMySubscriptions, getTeacherById } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

export default async function Materials() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  const subs = await getMySubscriptions(s.userId);
  const done = await getCompletedLessons(s.userId);
  const teachers = (await Promise.all(subs.map((x) => getTeacherById(x.teacherId)))).filter((x) => x !== null);
  const first = s.fullName.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("Materials")}
        sub={t("All lessons, notes and quizzes from your teachers, organized by unit.")}
        who={first}
        initial={first[0] ?? "S"}
        color="var(--orange)"
      />
      {teachers.length === 0 && (
        <div className="card empty">
          {t("No materials yet.")} <Link className="link" href="/student/redeem">{t("Activate a code from your teacher")}</Link> {t("to open their materials.")}
        </div>
      )}
      {teachers.map((x) => {
        const all = x.units.flatMap((u) => u.lessons);
        const dn = all.filter((l) => done.has(l.id)).length;
        return (
          <div className="card panel" key={x.id}>
            <div className="ph2">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar t={x} size={40} />
                <div>
                  <h2>
                    {dataLabel(lang, x.subject)} · {t("Teacher")} {x.name}
                  </h2>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {t("Completed {done} of {total} items", { done: dn, total: all.length })}
                  </span>
                </div>
              </div>
              <Link className="link" href={`/${x.slug}`}>
                {t("Teacher page")} <Icon name="arrow" sm />
              </Link>
            </div>
            {x.units.map((u, ui) => (
              <details className="unit" key={u.id} open={ui === 0}>
                <summary>
                  <span>{u.title}</span>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                    {t("{n} items", { n: u.lessons.length })}
                  </span>
                </summary>
                {u.lessons.map((l) => (
                  <Link key={l.id} className="lesson" href={`/student/lesson/${l.id}`}>
                    <LessonIcon type={l.type} />
                    <span className="t">
                      <b>{l.title}</b>
                      <span>
                        {typeLabel(lang, l.type)} · {l.meta}
                      </span>
                    </span>
                    {done.has(l.id) && (
                      <span className="pill p-ok">
                        <Icon name="check" sm /> {t("Completed")}
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
