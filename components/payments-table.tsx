import { PaymentReview } from "@/components/payment-review";
import { fmtDate } from "@/components/ui";
import { makeT, type Lang } from "@/lib/i18n";
import type { PaymentRequest } from "@/lib/types";

/** Payment requests, for a teacher (their own) or the admin (all, with the teacher's name). */
export function PaymentsTable({ list, lang, showTeacher, canReview = true }: { list: PaymentRequest[]; lang: Lang; showTeacher?: boolean; canReview?: boolean }) {
  const t = makeT(lang);
  const pill = { pending: ["p-warn", t("Waiting")], approved: ["p-ok", t("Confirmed")], rejected: ["p-bad", t("Rejected")] } as const;
  const methods = { cliq: "CliQ", wallet: t("E-wallet"), cash: t("Cash") };
  if (!list.length) return <div className="empty">{t("No payments yet.")}</div>;
  return (
    <div className="scroll">
      <table className="tbl">
        <thead>
          <tr>
            <th>{t("Student")}</th>
            {showTeacher && <th className="hide-s">{t("Teacher")}</th>}
            <th>{t("Amount")}</th>
            <th className="hide-s">{t("Reference")}</th>
            <th className="hide-s">{t("Date")}</th>
            <th>{t("Status")}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>
                <b>{p.studentName}</b>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {p.plan === "term" ? t("Term") : t("Monthly")} · {methods[p.method]}
                </div>
              </td>
              {showTeacher && <td className="muted hide-s">{p.teacherName}</td>}
              <td className="num">{t("{n} JOD", { n: p.amount })}</td>
              <td className="num hide-s" dir="ltr" style={{ textAlign: "start" }}>
                {p.reference}
              </td>
              <td className="muted hide-s">{fmtDate(lang, p.createdAt)}</td>
              <td>
                {p.status === "pending" && canReview ? <PaymentReview id={p.id} /> : <span className={`pill ${pill[p.status][0]}`}>{pill[p.status][1]}</span>}
                {p.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{p.note}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
