import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { Icon, fmt, fmtDate } from "@/components/ui";
import { getTeacherStats, listMyCodes } from "@/lib/data";
import { myTeacher } from "@/lib/teacher-context";
import { CodesForm } from "./codes-form";

export default async function TeacherHome() {
  const t = await myTeacher();
  const codes = await listMyCodes(t.id);
  const st = await getTeacherStats(t, codes);
  const first = t.name.split(" ")[0];
  return (
    <>
      <TopBar title={`أهلا أستاذ ${first}`} sub="أنشئ أكواد تفعيل لطلابك، ورتّب موادّك من صفحة المحتوى." who={`أ. ${first}`} initial={t.initial} color={t.color} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">الطلاب المشتركين</div>
          <div className="v">{fmt(st.activeStudents)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">أكواد جاهزة للاستخدام</div>
          <div className="v">{st.codesLeft}</div>
        </div>
        <div className="card stat">
          <div className="lbl">مواد منشورة</div>
          <div className="v">{st.lessons}</div>
          <div className="sub">منها {st.freeLessons} مجانية للتجربة</div>
        </div>
        <div className="card stat">
          <div className="lbl">السعر الشهري</div>
          <div className="v">
            {t.priceMonth} <small>د.أ</small>
          </div>
          <div className="sub">
            <Link className="link" href="/teacher/profile">
              عدّل
            </Link>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>أكواد التفعيل</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                كل كود لطالب واحد
              </span>
            </div>
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>الباقة</th>
                    <th className="hide-s">أُنشئ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code}>
                      <td className="num" dir="ltr" style={{ textAlign: "start" }}>
                        {c.code}
                      </td>
                      <td className="muted">{c.plan === "term" ? "فصلي" : "شهري"}</td>
                      <td className="muted hide-s">{fmtDate(c.createdAt)}</td>
                      <td>{c.usedBy ? <span className="pill p-info">مستخدم</span> : <span className="pill p-ok">جاهز</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>أنشئ أكواد جديدة</h2>
            </div>
            <CodesForm />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>صفحتك العامة</h2>
            </div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
              شارك هالرابط مع طلابك عشان يشوفوا موادّك ويجرّبوا الدروس المجانية.
            </p>
            <Link className="btn btn-ghost btn-sm" href={`/${t.slug}`}>
              <Icon name="globe" sm /> hessa.jo/{t.slug}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
