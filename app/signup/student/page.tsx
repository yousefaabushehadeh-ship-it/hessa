import type { Metadata } from "next";
import { Portal } from "../../login/portal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Create a student account") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return <Portal as="student" signup next={sp.next} />;
}
