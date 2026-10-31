import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/env";
import { demoPlatform } from "@/lib/demo-platform";
import { getSchool } from "@/lib/platform";
import { requireRole } from "@/lib/session";

/** The signed-in school account's own school, for the /school screens. */
export async function mySchool() {
  const s = await requireRole("school");
  let school = s.schoolId ? await getSchool(s.schoolId) : null;
  // Demo data lives in server memory, and the host can answer from a fresh server that never saw the
  // sign-up. Rebuild the new school from the session instead of showing "page not found".
  if (!school && DEMO_MODE && s.schoolId && s.demoSchool) {
    school = { id: s.schoolId, name: s.demoSchool.name, city: s.demoSchool.city, verified: false, ownerName: s.fullName, createdAt: new Date().toISOString().slice(0, 10) };
    demoPlatform.schools.unshift({ ...school, ownerId: s.userId });
  }
  if (!school) notFound();
  return { s, school };
}
