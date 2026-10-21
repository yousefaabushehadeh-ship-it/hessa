import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site";
import { Icon, TeacherCard } from "@/components/ui";
import { SUBJECTS, TEACHERS } from "@/lib/demo-data";
import { listTeachers } from "@/lib/data";
import type { TeacherFilters } from "@/lib/types";

export const metadata: Metadata = { title: "لاقي أستاذك" };

const GRADES = ["", "توجيهي علمي", "جميع الفروع", "الصفوف 9 لـ 11"];
const SORTS: [NonNullable<TeacherFilters["sort"]>, string][] = [
  ["rating", "الأعلى تقييمًا"],
  ["students", "الأكثر طلابًا"],
  ["price", "السعر الأقل"],
];

type Search = Promise<Record<string, string | undefined>>;

export default async function Browse({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const f: TeacherFilters = {
    q: sp.q,
    subject: sp.subject,
    grade: sp.grade,
    city: sp.city,
    sort: (["rating", "students", "price"].includes(sp.sort ?? "") ? sp.sort : "rating") as TeacherFilters["sort"],
  };
  const list = await listTeachers(f);
  const cities = [...new Set(TEACHERS.map((t) => t.city))];
  return (
    <>
      <SiteNav active="browse" />
      <div className="gut">
        <form className="wrap browse" method="get">
          <aside className="card filters" aria-label="تصفية">
            <div>
              <label className="h" htmlFor="f-subject">
                المادة
              </label>
              <select className="field" id="f-subject" name="subject" defaultValue={f.subject ?? ""}>
                <option value="">كل المواد</option>
                {SUBJECTS.map(([s]) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="h" htmlFor="f-grade">
                الصف
              </label>
              <select className="field" id="f-grade" name="grade" defaultValue={f.grade ?? ""}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g || "الكل"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="h" htmlFor="f-city">
                المدينة
              </label>
              <select className="field" id="f-city" name="city" defaultValue={f.city ?? ""}>
                <option value="">كل المدن</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="h" htmlFor="f-sort">
                الترتيب
              </label>
              <select className="field" id="f-sort" name="sort" defaultValue={f.sort}>
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-pri" type="submit">
              اعرض النتائج
            </button>
          </aside>
          <section style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 28, marginBottom: 6 }}>لاقي أستاذك</h1>
            <p className="muted" style={{ marginBottom: 18 }}>
              كل أستاذ إله صفحة فيها موادّه وحصصه، وفيه دروس مجانية تجرّبها قبل الاشتراك.
            </p>
            <label className="search">
              <Icon name="search" />
              <input name="q" placeholder="ابحث باسم الأستاذ أو المادة..." defaultValue={f.q ?? ""} aria-label="بحث" />
            </label>
            <div className="rhead">
              <span className="muted">{list.length} أستاذ</span>
            </div>
            <div className="tgrid">
              {list.length ? (
                list.map((t) => <TeacherCard key={t.id} t={t} />)
              ) : (
                <div className="card empty" style={{ gridColumn: "1/-1" }}>
                  ما في أساتذة بهالتصفية حاليًا. جرّب مادة أو مدينة ثانية.
                </div>
              )}
            </div>
          </section>
        </form>
      </div>
      <SiteFooter />
    </>
  );
}
