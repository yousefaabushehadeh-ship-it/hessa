import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { TeacherCard } from "@/components/ui";
import { GRADES, SUBJECT_LIST } from "@/lib/catalog";
import { listTeachers } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";

/** Grade, then subject, then teacher: the way a new student finds who to study with. */
export default async function Find({ searchParams }: { searchParams: Promise<{ grade?: string; subject?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  const sp = await searchParams;
  const grade = GRADES.includes(sp.grade ?? "") ? sp.grade! : s.grade && GRADES.includes(s.grade) ? s.grade : "";
  const subject = SUBJECT_LIST.includes(sp.subject ?? "") ? sp.subject! : "";
  const forGrade = grade ? await listTeachers({ grade }) : [];
  const counts = Object.fromEntries(SUBJECT_LIST.map((x) => [x, forGrade.filter((y) => y.subject === x).length]));
  const teachers = subject ? forGrade.filter((x) => x.subject === subject) : [];
  const q = (g: string, sub?: string) => `/student/find?grade=${encodeURIComponent(g)}${sub ? `&subject=${encodeURIComponent(sub)}` : ""}`;
  const first = s.fullName.split(" ")[0] || "";
  const step = !grade ? 1 : !subject ? 2 : 3;

  return (
    <>
      <TopBar title={t("Find your teacher")} sub={t("Pick your grade, then the subject, then the teacher you want to study with.")} who={first} initial={first[0] ?? "S"} color="var(--orange)" />
      <ol className="find-steps" aria-label={t("Steps")}>
        {[t("Grade"), t("Subject"), t("Teacher")].map((label, i) => (
          <li key={label} className={i + 1 < step ? "done" : i + 1 === step ? "on" : ""}>
            <span className="num">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      <div className="card panel">
        <div className="ph2">
          <h2>{t("1. Your grade")}</h2>
        </div>
        <div className="chips">
          {GRADES.map((g) => (
            <Link key={g} className="chip" aria-pressed={g === grade} href={q(g)}>
              {dataLabel(lang, g)}
            </Link>
          ))}
        </div>
      </div>

      {grade && (
        <div className="card panel">
          <div className="ph2">
            <h2>{t("2. The subject")}</h2>
          </div>
          <div className="subj-grid">
            {SUBJECT_LIST.map((x) => (
              <Link key={x} className={`card subj${x === subject ? " on" : ""}${counts[x] ? "" : " empty-subj"}`} href={q(grade, x)} aria-pressed={x === subject}>
                <b>{dataLabel(lang, x)}</b>
                <span className="muted">{counts[x] === 1 ? t("1 teacher") : counts[x] ? t("{n} teachers", { n: counts[x] }) : t("No teachers yet")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {subject && (
        <div className="card panel">
          <div className="ph2">
            <h2>{t("3. Pick your teacher")}</h2>
            <span className="muted" style={{ fontSize: 13 }}>
              {dataLabel(lang, subject)} · {dataLabel(lang, grade)}
            </span>
          </div>
          {teachers.length ? (
            <div className="tgrid">
              {teachers.map((x) => (
                <TeacherCard key={x.id} t={x} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="empty">{t("No teachers for this subject and grade yet. We're adding new teachers every week.")}</div>
          )}
        </div>
      )}
    </>
  );
}
