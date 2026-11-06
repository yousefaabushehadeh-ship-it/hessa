import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site";
import { Icon, TeacherCard } from "@/components/ui";
import { GRADES as CATALOG_GRADES, SUBJECT_LIST } from "@/lib/catalog";
import { listTeachers } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import type { TeacherFilters } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Find your teacher") };
}

const GRADES = ["", ...CATALOG_GRADES];

type Search = Promise<Record<string, string | undefined>>;

export default async function Browse({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const sp = await searchParams;
  const SORTS: [NonNullable<TeacherFilters["sort"]>, string][] = [
    ["rating", t("Highest rated")],
    ["students", t("Most students")],
    ["price", t("Lowest price")],
  ];
  const f: TeacherFilters = {
    q: sp.q,
    subject: sp.subject,
    grade: sp.grade,
    sort: (["rating", "students", "price"].includes(sp.sort ?? "") ? sp.sort : "rating") as TeacherFilters["sort"],
  };
  const list = await listTeachers(f);
  return (
    <>
      <SiteNav active="browse" />
      <div className="gut">
        <form className="wrap browse" method="get">
          <aside className="card filters" aria-label={t("Filters")}>
            <div>
              <label className="h" htmlFor="f-subject">
                {t("Subject")}
              </label>
              <select className="field" id="f-subject" name="subject" defaultValue={f.subject ?? ""}>
                <option value="">{t("All subjects")}</option>
                {SUBJECT_LIST.map((s) => (
                  <option key={s} value={s}>
                    {dataLabel(lang, s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="h" htmlFor="f-grade">
                {t("Grade")}
              </label>
              <select className="field" id="f-grade" name="grade" defaultValue={f.grade ?? ""}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g ? dataLabel(lang, g) : t("All")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="h" htmlFor="f-sort">
                {t("Sort by")}
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
              {t("Show results")}
            </button>
          </aside>
          <section style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 28, marginBottom: 6 }}>{t("Find your teacher")}</h1>
            <p className="muted" style={{ marginBottom: 18 }}>
              {t("Every teacher has a page with their subjects and lessons, and free lessons you can try before subscribing.")}
            </p>
            <label className="search">
              <Icon name="search" />
              <input name="q" placeholder={t("Search by teacher name or subject...")} defaultValue={f.q ?? ""} aria-label={t("Search")} />
            </label>
            <div className="rhead">
              <span className="muted">{t("{n} teachers", { n: list.length })}</span>
            </div>
            <div className="tgrid">
              {list.length ? (
                list.map((x) => <TeacherCard key={x.id} t={x} lang={lang} />)
              ) : (
                <div className="card empty" style={{ gridColumn: "1/-1" }}>
                  {t("No teachers match these filters right now. Try another subject or grade.")}
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
