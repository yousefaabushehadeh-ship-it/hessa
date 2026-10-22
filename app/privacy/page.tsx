import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Privacy policy") };
}

export default async function Privacy() {
  const t = await getT();
  return (
    <LegalPage title={t("Privacy policy")}>
      <h2>{t("What data we collect")}</h2>
      <p>{t("Your mobile number, name, grade, your parent's number for students under 18, and the lessons you have completed. We do not collect payment data at this stage.")}</p>
      <h2>{t("Why we collect it")}</h2>
      <p>{t("To sign you in, open the materials of your teachers, and let your teacher see your progress in their subjects. We don't sell your data and we don't share it with advertisers.")}</p>
      <h2>{t("Students under 18")}</h2>
      <p>{t("Under Jordan's personal data protection law No. 24 of 2023, an account is only activated after a parent approves it. A parent can withdraw their approval at any time.")}</p>
      <h2>{t("Your rights")}</h2>
      <p>{t("You can ask for a copy of your data, a correction, or the deletion of your account, by emailing support@hessa.jo.")}</p>
    </LegalPage>
  );
}
