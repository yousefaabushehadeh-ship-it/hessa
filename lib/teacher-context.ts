import { notFound } from "next/navigation";
import { getTeacherById } from "@/lib/data";
import { requireRole } from "@/lib/session";

/** The signed-in teacher's own page, for the /teacher screens. */
export async function myTeacher() {
  const s = await requireRole("teacher");
  const t = s.teacherId ? await getTeacherById(s.teacherId) : null;
  if (!t) notFound();
  return t;
}
