import type { Metadata } from "next";
import { Portal } from "../portal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Team sign in"), robots: { index: false } };
}

export default async function Page() {
  return <Portal as="admin" />;
}
