import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportBody } from "@/components/report";
import { SiteNav } from "@/components/site";
import { Avatar, fmtDate } from "@/components/ui";
import { getParentReport } from "@/lib/analysis";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Your child's report"), robots: { index: false } };
}

/** The parent opens the approval link we sent them, with no account and no password. */
export default async function ParentReportPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const { token } = await params;
  const report = await getParentReport(token);
  if (!report) notFound();
  return (
    <>
      <SiteNav />
      <div className="gut" style={{ paddingBlock: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>{t("{name}'s report", { name: report.name })}</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          {report.grade ? `${dataLabel(lang, report.grade)} · ` : ""}
          {t("How your child is doing with each teacher, updated every time they study.")}
        </p>
        {report.teachers.length === 0 && <div className="card panel empty">{t("Your child has no active subscriptions right now.")}</div>}
        {report.teachers.map((x) => (
          <section key={x.teacher.id} style={{ marginBottom: 34 }}>
            <div className="card panel" style={{ marginBottom: 14 }}>
              <div className="trow" style={{ borderBottom: 0, paddingBlock: 0 }}>
                <Avatar t={x.teacher} size={48} />
                <div className="t">
                  <b>
                    {t("Teacher")} {x.teacher.name}
                  </b>
                  <span>
                    {dataLabel(lang, x.teacher.subject)} · {x.plan === "term" ? t("Term") : t("Monthly")} · {t("Until {date}", { date: fmtDate(lang, x.endsOn) })}
                  </span>
                </div>
                <Link className="link" href={`/${x.teacher.slug}`}>
                  {t("Teacher page")}
                </Link>
              </div>
            </div>
            <ReportBody r={x} lang={lang} />
          </section>
        ))}
        <div className="card panel">
          <ul className="ul">
            <li>{t("Keep this link to yourself: anyone who has it can see this report.")}</li>
            <li>{t("Each teacher sees your child's progress in their own subject only. The school sees totals, never your child's marks.")}</li>
            <li>{t("To stop sharing, withdraw your approval by emailing support@hessa.jo.")}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
