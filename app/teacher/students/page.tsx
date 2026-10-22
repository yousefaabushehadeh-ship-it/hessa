import { TopBar } from "@/components/dash-shell";
import { fmtDate } from "@/components/ui";
import { listMyStudents } from "@/lib/students";
import { myTeacher } from "@/lib/teacher-context";

export default async function Students() {
  const t = await myTeacher();
  const rows = await listMyStudents(t);
  const first = t.name.split(" ")[0];
  const behind = rows.filter((r) => r.progress < 30).length;
  const soon = rows.filter((r) => new Date(r.endsOn).getTime() - Date.now() < 7 * 864e5).length;
  return (
    <>
      <TopBar title="الطلاب" sub="مين مشترك، وين وصل، ومين محتاج متابعة." who={`أ. ${first}`} initial={t.initial} color={t.color} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">مشتركين حاليًا</div>
          <div className="v">{rows.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">محتاجين متابعة</div>
          <div className="v" style={{ color: behind ? "var(--warn-fg)" : undefined }}>
            {behind}
          </div>
          <div className="sub">تقدّمهم أقل من 30%</div>
        </div>
        <div className="card stat">
          <div className="lbl">اشتراكات بتخلص هالأسبوع</div>
          <div className="v">{soon}</div>
        </div>
      </div>
      <div className="card panel">
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>الطالب</th>
                <th className="hide-s">الاشتراك</th>
                <th>التقدّم</th>
                <th className="hide-s">آخر اختبار</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    ما في طلاب مشتركين لسا. أنشئ أكواد تفعيل وابعثها لطلابك.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b style={{ fontFamily: "var(--f-display)", fontWeight: 600 }}>{r.name}</b>
                  </td>
                  <td className="muted hide-s">
                    {r.plan === "term" ? "فصلي" : "شهري"} · لحد {fmtDate(r.endsOn)}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className={r.progress < 30 ? "bar o" : "bar"} style={{ flex: 1 }}>
                        <i style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="num" style={{ fontSize: 13 }}>
                        {r.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="muted hide-s num">{r.lastQuiz ?? "—"}</td>
                  <td>{r.progress < 30 ? <span className="pill p-warn">تابعه</span> : <span className="pill p-ok">منتظم</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
