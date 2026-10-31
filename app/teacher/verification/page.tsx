import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { myTeacher } from "@/lib/teacher-context";
import { VerificationPanel } from "./panel";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Verification") };
}

export default async function TeacherVerification() {
  const s = await requireRole("teacher");
  const x = await myTeacher();
  return <VerificationPanel s={s} color={x.color} />;
}
