import type { Metadata } from "next";
import { Portal } from "../portal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Student sign in") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return <Portal as="student" next={sp.next} />;
}
