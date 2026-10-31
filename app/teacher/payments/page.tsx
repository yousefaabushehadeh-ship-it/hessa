import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { PaymentsTable } from "@/components/payments-table";
import { getLang, getT } from "@/lib/i18n-server";
import { listTeacherPayments } from "@/lib/platform";
import { myTeacher } from "@/lib/teacher-context";

export default async function Payments() {
  const t = await getT();
  const lang = await getLang();
  const x = await myTeacher();
  const list = await listTeacherPayments(x.id);
  const waiting = list.filter((p) => p.status === "pending");
  const month = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const earned = list.filter((p) => p.status === "approved" && p.createdAt >= month).reduce((a, p) => a + p.amount, 0);
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar title={t("Payments")} sub={t("Check each transfer in your bank or wallet app, then confirm it. The student's materials open right away.")} who={`${t("Teacher")} ${first}`} initial={x.initial} color={x.color} photoUrl={x.photoUrl} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Waiting for you")}</div>
          <div className="v" style={{ color: waiting.length ? "var(--warn-fg)" : undefined }}>
            {waiting.length}
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Confirmed in the last 30 days")}</div>
          <div className="v">
            {earned} <small>JOD</small>
          </div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Your CliQ alias")}</div>
          <div className="v num" dir="ltr" style={{ fontSize: 18 }}>
            {x.cliqAlias || "—"}
          </div>
          <div className="sub">
            <Link className="link" href="/teacher/profile">
              {t("Edit")}
            </Link>
          </div>
        </div>
      </div>
      <div className="card panel">
        <div className="ph2">
          <h2>{t("Payment requests")}</h2>
        </div>
        <PaymentsTable list={list} lang={lang} />
      </div>
    </>
  );
}
