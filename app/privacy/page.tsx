import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { getT } from "@/lib/i18n-server";
import { PRIVACY } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Privacy policy") };
}

export default async function Privacy() {
  const t = await getT();
  return <LegalPage title={t("Privacy policy")} sections={PRIVACY} />;
}
