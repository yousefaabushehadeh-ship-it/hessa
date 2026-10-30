import { notFound } from "next/navigation";
import { getSchool } from "@/lib/platform";
import { requireRole } from "@/lib/session";

/** The signed-in school account's own school, for the /school screens. */
export async function mySchool() {
  const s = await requireRole("school");
  const school = s.schoolId ? await getSchool(s.schoolId) : null;
  if (!school) notFound();
  return { s, school };
}
