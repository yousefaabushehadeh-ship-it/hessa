import type { Metadata } from "next";
import { Portal } from "../portal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("School sign in") };
}

export default async function Page() {
  return <Portal as="school" />;
}
