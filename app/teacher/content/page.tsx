import { TopBar } from "@/components/dash-shell";
import { LessonIcon, TYPE_LABEL } from "@/components/ui";
import { myTeacher } from "@/lib/teacher-context";
import { AddLessonForm, AddUnitForm } from "./forms";

export default async function Content() {
  const t = await myTeacher();
  const first = t.name.split(" ")[0];
  return (
    <>
      <TopBar title="المحتوى" sub="رتّب موادّك بوحدات، وحدد الدروس المجانية للتجربة." who={`أ. ${first}`} initial={t.initial} color={t.color} />
      <div className="g2">
        <div className="col">
          {t.units.length === 0 && <div className="card empty">ابدأ بإضافة أول وحدة، وبعدها ارفع موادّها.</div>}
          {t.units.map((u) => (
            <div className="card panel" key={u.id}>
              <div className="ph2">
                <h2>{u.title}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {u.lessons.length} مواد
                </span>
              </div>
              <div className="scroll">
                <table className="tbl">
                  <tbody>
                    {u.lessons.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <span className="ttl">
                            <LessonIcon type={l.type} />
                            {l.title}
                          </span>
                        </td>
                        <td className="muted hide-s">
                          {TYPE_LABEL[l.type]} · {l.meta}
                        </td>
                        <td>{l.isFree ? <span className="pill p-ok">مجاني</span> : <span className="pill p-info">للمشتركين</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>رفع مادة جديدة</h2>
            </div>
            <AddLessonForm units={t.units.map((u) => ({ id: u.id, title: u.title }))} />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>وحدة جديدة</h2>
            </div>
            <AddUnitForm />
          </div>
        </div>
      </div>
    </>
  );
}
