import type { Metadata } from "next";
import { Portal } from "../../login/portal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Create a teacher account") };
}

export default async function Page() {
  return <Portal as="teacher" signup />;
}
