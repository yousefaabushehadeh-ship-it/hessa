import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { GradeForm } from "@/components/grade-form";
import { fmtDate } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n-server";
import { listTeacherSubmissions } from "@/lib/platform";
import { myTeacher } from "@/lib/teacher-context";

export default async function Worksheets({ searchParams }: { searchParams: Promise<{ lesson?: string; show?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const x = await myTeacher();
  const sp = await searchParams;
  const sheets = x.units.flatMap((u) => u.lessons.filter((l) => l.type === "worksheet"));
  const all = await listTeacherSubmissions(x);
  const waiting = all.filter((s) => s.status === "submitted").length;
  const list = all.filter((s) => (!sp.lesson || s.lessonId === sp.lesson) && (sp.show === "all" || s.status === "submitted" || sp.lesson));
  const title = (id: string) => sheets.find((l) => l.id === id)?.title ?? "";
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar title={t("Worksheets")} sub={t("Your students' hand-ins. Open the solution, give a mark and a comment.")} who={`${t("Teacher")} ${first}`} initial={x.initial} color={x.color} photoUrl={x.photoUrl} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Waiting for a mark")}</div>
          <div className="v" style={{ color: waiting ? "var(--warn-fg)" : undefined }}>
            {waiting}
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("All hand-ins")}</div>
          <div className="v">{all.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Worksheets")}</div>
          <div className="v">{sheets.length}</div>
          <div className="sub">
            <Link className="link" href="/teacher/content">
              {t("Add a worksheet")}
            </Link>
          </div>
        </div>
      </div>
      <div className="admin-tabs">
        <Link className="chip" aria-pressed={!sp.lesson && sp.show !== "all"} href="/teacher/worksheets">
          {t("Waiting")}
        </Link>
        <Link className="chip" aria-pressed={!sp.lesson && sp.show === "all"} href="/teacher/worksheets?show=all">
          {t("All")}
        </Link>
        {sheets.map((l) => (
          <Link key={l.id} className="chip" aria-pressed={sp.lesson === l.id} href={`/teacher/worksheets?lesson=${l.id}`}>
            {l.title}
          </Link>
        ))}
      </div>
      <div className="card panel">
        {list.length === 0 ? (
          <div className="empty">{sheets.length ? t("Nothing waiting. Well done!") : t("Add a worksheet from the Content page. Students hand in a photo or PDF of their solution.")}</div>
        ) : (
          <ul className="doc-list">
            {list.map((s) => (
              <li key={s.id} style={{ alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <b>{s.studentName}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {title(s.lessonId)} · <span className="num">{fmtDate(lang, s.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13.5, marginTop: 4, overflowWrap: "anywhere" }} dir="auto">
                    {s.url ? (
                      <a className="link" href={s.url} target="_blank" rel="noopener">
                        {s.fileName}
                      </a>
                    ) : (
                      s.fileName
                    )}
                  </div>
                  {s.note && <div className="feedback" style={{ marginTop: 6 }}>{s.note}</div>}
                </div>
                <div style={{ flex: "1 1 280px" }}>
                  {s.status === "graded" && <span className="pill p-ok num" style={{ marginBottom: 8 }}>{s.mark}</span>}
                  <GradeForm id={s.id} mark={s.mark} feedback={s.feedback} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
