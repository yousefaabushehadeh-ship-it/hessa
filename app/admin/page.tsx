import Link from "next/link";
import { AdminTop } from "@/components/admin-top";
import { PaymentsTable } from "@/components/payments-table";
import { fmt } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n-server";
import { getAdminStats, listAllPayments } from "@/lib/platform";

export default async function AdminHome() {
  const t = await getT();
  const lang = await getLang();
  const [st, payments] = await Promise.all([getAdminStats(), listAllPayments()]);
  const todo: [number, string, string][] = [
    [st.pendingTeachers, t("Teachers waiting for verification"), "/admin/teachers"],
    [st.pendingSchools, t("Schools waiting for verification"), "/admin/schools"],
    [st.pendingPayments, t("Payments waiting for the teacher"), "/admin/payments"],
  ];
  return (
    <>
      <AdminTop title={t("Platform overview")} sub={t("Everything happening on Hessa, in one place.")} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Students")}</div>
          <div className="v">{fmt(st.students)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Verified teachers")}</div>
          <div className="v">{st.teachers}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Active subscriptions")}</div>
          <div className="v">{fmt(st.activeSubs)}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Confirmed payments, 30 days")}</div>
          <div className="v">
            {fmt(st.revenue30)} <small>JOD</small>
          </div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Latest payments")}</h2>
              <Link className="link" href="/admin/payments">
                {t("All payments")}
              </Link>
            </div>
            <PaymentsTable list={payments.slice(0, 8)} lang={lang} showTeacher canReview={false} />
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Needs your attention")}</h2>
            </div>
            <ul className="doc-list">
              {todo.map(([n, label, href]) => (
                <li key={href}>
                  <Link className="link" href={href} style={{ flex: 1 }}>
                    {label}
                  </Link>
                  <span className={`pill ${n ? "p-warn" : "p-ok"} num`}>{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Schools")}</h2>
            </div>
            <p className="muted">{t("{n} verified schools on the platform.", { n: st.schools })}</p>
          </div>
        </div>
      </div>
    </>
  );
}
