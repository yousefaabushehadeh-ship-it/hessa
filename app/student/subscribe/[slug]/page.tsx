import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/dash-shell";
import { Avatar, fmtDate } from "@/components/ui";
import { getMySubscriptions, getTeacherBySlug } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listMyPayments } from "@/lib/platform";
import { requireRole } from "@/lib/session";
import { PayForm } from "./pay-form";

export default async function Subscribe({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("student");
  const { slug } = await params;
  const teacher = await getTeacherBySlug(slug);
  if (!teacher || !teacher.verified) notFound();
  const [subs, payments] = await Promise.all([getMySubscriptions(s.userId), listMyPayments(s.userId)]);
  const sub = subs.find((x) => x.teacherId === teacher.id);
  const mine = payments.filter((p) => p.teacherId === teacher.id);
  const pending = mine.find((p) => p.status === "pending");
  const first = s.fullName.split(" ")[0] || "";
  const pill = { pending: ["p-warn", t("Waiting for the teacher")], approved: ["p-ok", t("Confirmed")], rejected: ["p-bad", t("Not confirmed")] } as const;

  return (
    <>
      <TopBar title={t("Subscribe with {name}", { name: teacher.name })} sub={`${dataLabel(lang, teacher.subject)} · ${dataLabel(lang, teacher.grade)}`} who={first} initial={first[0] ?? "S"} color="var(--orange)" />
      <div className="g2">
        <div className="col">
          <div className="card panel">
            {sub ? (
              <div className="frm">
                <span className="pill p-ok" style={{ justifySelf: "start" }}>
                  {t("Subscribed")}
                </span>
                <p>{t("Your subscription is active until {date}", { date: fmtDate(lang, sub.endsOn) })}</p>
                <Link className="btn btn-pri" href="/student/materials">
                  {t("Open my study materials")}
                </Link>
                <p className="muted" style={{ fontSize: 13 }}>
                  {t("Paying again adds the new period to the end of your current one.")}
                </p>
              </div>
            ) : null}
            {pending ? (
              <div className="frm">
                <span className={`pill ${pill.pending[0]}`} style={{ justifySelf: "start" }}>
                  {pill.pending[1]}
                </span>
                <p>{t("We sent your transfer reference {ref} to the teacher. Your materials open as soon as they confirm it.", { ref: pending.reference })}</p>
              </div>
            ) : (
              <PayForm teacherId={teacher.id} priceMonth={teacher.priceMonth} priceTerm={teacher.priceTerm} cliqAlias={teacher.cliqAlias ?? ""} />
            )}
          </div>
          {mine.length > 0 && (
            <div className="card panel">
              <div className="ph2">
                <h2>{t("My payments")}</h2>
              </div>
              <table className="tbl">
                <tbody>
                  {mine.map((p) => (
                    <tr key={p.id}>
                      <td className="num">{fmtDate(lang, p.createdAt)}</td>
                      <td className="num">{t("{n} JOD", { n: p.amount })}</td>
                      <td className="muted hide-s num" dir="ltr">
                        {p.reference}
                      </td>
                      <td>
                        <span className={`pill ${pill[p.status][0]}`}>{pill[p.status][1]}</span>
                        {p.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{p.note}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="col">
          <Link className="card trow" href={`/${teacher.slug}`} style={{ textDecoration: "none", padding: 18 }}>
            <Avatar t={teacher} size={56} />
            <div className="t">
              <b>
                {t("Teacher")} {teacher.name}
              </b>
              <span>{teacher.headline}</span>
            </div>
          </Link>
          <div className="card panel">
            <p className="muted" style={{ fontSize: 14 }}>
              {t("Already paid the teacher in person and got a code?")}{" "}
              <Link className="link" href="/student/redeem">
                {t("Activate a code")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
