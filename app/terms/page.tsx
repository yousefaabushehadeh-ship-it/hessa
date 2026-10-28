import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { getT } from "@/lib/i18n-server";
import { TERMS } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Terms of use") };
}

export default async function Terms() {
  const t = await getT();
  return <LegalPage title={t("Terms of use")} sections={TERMS} />;
}
