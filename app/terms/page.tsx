import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Terms of use") };
}

export default async function Terms() {
  const t = await getT();
  return (
    <LegalPage title={t("Terms of use")}>
      <h2>{t("Your account")}</h2>
      <p>{t("Your account is personal and for one person only. Sharing your account or code with someone else cancels your subscription.")}</p>
      <h2>{t("Content")}</h2>
      <p>{t("Study materials belong to the teacher. You may not download, record or share them outside the platform. Every file carries a watermark with your name.")}</p>
      <h2>{t("Subscriptions")}</h2>
      <p>{t("An access code opens one teacher's study materials for 30 days (monthly) or 90 days (term) from the day you activate it.")}</p>
      <h2>{t("Teachers")}</h2>
      <p>{t("Teachers are responsible for their content and its accuracy. A teacher's page goes public only after their identity and qualifications are verified.")}</p>
    </LegalPage>
  );
}
