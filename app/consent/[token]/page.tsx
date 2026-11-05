import type { Metadata } from "next";
import { SiteNav } from "@/components/site";
import { getT } from "@/lib/i18n-server";
import { ConsentForm } from "./consent-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Parent approval"), robots: { index: false } };
}

export default async function Consent({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;
  return (
    <>
      <SiteNav />
      <div className="gut">
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>{t("Parent approval")}</h1>
          <p>
            {t("Your child wants to open an account on Hessa to study with their teachers. We store only their name, mobile number, grade and their progress in lessons. We don't share their data with any advertiser.")}
          </p>
          <ul className="ul">
            <li>{t("You can withdraw your approval and delete the account at any time, by emailing support@hessa.jo.")}</li>
            <li>{t("The teacher sees the student's name and progress in their subjects only.")}</li>
            <li>{t("After you approve, this same link shows you your child's report: progress, quiz marks and teachers' comments.")}</li>
            <li>{t("If your child's teacher works with a school, the school sees totals only, never your child's marks.")}</li>
          </ul>
          <ConsentForm token={token} />
        </div>
      </div>
    </>
  );
}
