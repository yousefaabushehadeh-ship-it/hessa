import { DEMO_MODE } from "@/lib/env";
import { DEMO_STUDENT, TEACHERS } from "@/lib/demo-data";
import { demoPlatform } from "@/lib/demo-platform";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { PaymentRequest, School, SchoolInvite, Submission, Teacher } from "@/lib/types";

// Reads for worksheets, payments, schools and the admin dashboard. Like lib/data.ts, every
// function has a demo branch and a Supabase branch. Admin reads use the service key, and the
// pages that call them check the admin role first (requireRole("admin")).

const day = (v: string | null) => String(v ?? "").slice(0, 10);

// Worksheets --------------------------------------------------------------------------

type SubRow = {
  id: string; lesson_id: string; student_id: string; file_name: string; storage_path: string; note: string;
  status: Submission["status"]; mark: string | null; feedback: string | null; created_at: string;
  profiles?: { full_name: string } | null;
};
const SUB_COLS = "id, lesson_id, student_id, file_name, storage_path, note, status, mark, feedback, created_at, profiles(full_name)";

async function withLinks(rows: SubRow[]): Promise<Submission[]> {
  // Hand-ins sit in a private bucket; whoever may see the row gets a link for 10 minutes.
  const paths = rows.map((r) => r.storage_path);
  const links: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabaseAdmin().storage.from("submissions").createSignedUrls(paths, 600);
    for (const d of data ?? []) if (d.path && d.signedUrl) links[d.path] = d.signedUrl;
  }
  return rows.map((r) => ({
    id: r.id,
    lessonId: r.lesson_id,
    studentId: r.student_id,
    studentName: r.profiles?.full_name || "طالب",
    fileName: r.file_name,
    note: r.note,
    status: r.status,
    mark: r.mark,
    feedback: r.feedback,
    createdAt: day(r.created_at),
    url: links[r.storage_path] ?? null,
  }));
}

/** A student's own hand-ins for one worksheet, newest first. */
export async function listMySubmissions(studentId: string, lessonId: string): Promise<Submission[]> {
  if (DEMO_MODE) return demoPlatform.submissions.filter((x) => x.lessonId === lessonId && x.studentId === studentId);
  const supabase = await supabaseServer();
  const { data } = await supabase.from("worksheet_submissions").select(SUB_COLS).eq("lesson_id", lessonId).eq("student_id", studentId).order("created_at", { ascending: false });
  return withLinks((data ?? []) as unknown as SubRow[]);
}

/** Every hand-in for the teacher's worksheets (RLS: owns_lesson). */
export async function listTeacherSubmissions(teacher: Teacher): Promise<Submission[]> {
  const ids = teacher.units.flatMap((u) => u.lessons.filter((l) => l.type === "worksheet").map((l) => l.id));
  if (!ids.length) return [];
  if (DEMO_MODE) return demoPlatform.submissions.filter((x) => ids.includes(x.lessonId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const supabase = await supabaseServer();
  const { data } = await supabase.from("worksheet_submissions").select(SUB_COLS).in("lesson_id", ids).order("created_at", { ascending: false }).limit(200);
  return withLinks((data ?? []) as unknown as SubRow[]);
}

// Payments ---------------------------------------------------------------------------

type PayRow = {
  id: string; student_id: string; teacher_id: string; plan: PaymentRequest["plan"]; amount: number; method: PaymentRequest["method"];
  reference: string; status: PaymentRequest["status"]; note: string | null; created_at: string;
  profiles?: { full_name: string } | null; teachers?: { name: string } | null;
};
const PAY_COLS = "id, student_id, teacher_id, plan, amount, method, reference, status, note, created_at, profiles!payment_requests_student_id_fkey(full_name), teachers(name)";

const fromPay = (r: PayRow): PaymentRequest => ({
  id: r.id,
  studentId: r.student_id,
  studentName: r.profiles?.full_name || "طالب",
  teacherId: r.teacher_id,
  teacherName: r.teachers?.name ?? "",
  plan: r.plan,
  amount: Number(r.amount),
  method: r.method,
  reference: r.reference,
  status: r.status,
  note: r.note,
  createdAt: day(r.created_at),
});

const newestFirst = (list: PaymentRequest[]) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export async function listMyPayments(studentId: string): Promise<PaymentRequest[]> {
  if (DEMO_MODE) return newestFirst(demoPlatform.payments.filter((x) => x.studentId === studentId));
  const supabase = await supabaseServer();
  const { data } = await supabase.from("payment_requests").select(PAY_COLS).eq("student_id", studentId).order("created_at", { ascending: false }).limit(50);
  return ((data ?? []) as unknown as PayRow[]).map(fromPay);
}

export async function listTeacherPayments(teacherId: string): Promise<PaymentRequest[]> {
  if (DEMO_MODE) return newestFirst(demoPlatform.payments.filter((x) => x.teacherId === teacherId));
  const supabase = await supabaseServer();
  const { data } = await supabase.from("payment_requests").select(PAY_COLS).eq("teacher_id", teacherId).order("created_at", { ascending: false }).limit(100);
  return ((data ?? []) as unknown as PayRow[]).map(fromPay);
}

// Schools ----------------------------------------------------------------------------

export async function getSchool(id: string): Promise<School | null> {
  if (DEMO_MODE) return demoPlatform.schools.find((x) => x.id === id) ?? null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("schools").select("id, name, city, verified, created_at").eq("id", id).maybeSingle();
  return data ? { id: data.id, name: data.name, city: data.city, verified: data.verified, ownerName: "", createdAt: day(data.created_at) } : null;
}

export async function listSchoolInvites(schoolId: string): Promise<SchoolInvite[]> {
  if (DEMO_MODE) return demoPlatform.invites.filter((x) => x.schoolId === schoolId);
  const supabase = await supabaseServer();
  const { data } = await supabase.from("school_invites").select("id, phone, name, subject, grade, used_by, created_at").eq("school_id", schoolId).order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ id: r.id, phone: r.phone, name: r.name, subject: r.subject, grade: r.grade, used: Boolean(r.used_by), createdAt: day(r.created_at) }));
}

export type SchoolTeacher = { id: string; slug: string; name: string; subject: string; grade: string; verified: boolean; students: number; lessons: number };

export async function listSchoolTeachers(schoolId: string): Promise<SchoolTeacher[]> {
  if (DEMO_MODE)
    return TEACHERS.filter((x) => x.schoolId === schoolId).map((x) => ({
      id: x.id, slug: x.slug, name: x.name, subject: x.subject, grade: x.grade, verified: x.verified,
      students: x.studentCount, lessons: x.units.reduce((a, u) => a + u.lessons.length, 0),
    }));
  const supabase = await supabaseServer();
  const { data } = await supabase.from("teachers").select("id, slug, name, subject, grade, verified, units(lessons(id))").eq("school_id", schoolId);
  const today = new Date().toISOString().slice(0, 10);
  const out: SchoolTeacher[] = [];
  for (const r of (data ?? []) as unknown as { id: string; slug: string; name: string; subject: string; grade: string; verified: boolean; units: { lessons: { id: string }[] }[] }[]) {
    const { count } = await supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("teacher_id", r.id).eq("status", "active").gte("ends_on", today);
    out.push({ id: r.id, slug: r.slug, name: r.name, subject: r.subject, grade: r.grade, verified: r.verified, students: count ?? 0, lessons: r.units.reduce((a, u) => a + u.lessons.length, 0) });
  }
  return out;
}

// Admin --------------------------------------------------------------------------------

export type AdminStats = {
  students: number; teachers: number; schools: number; activeSubs: number;
  pendingPayments: number; pendingTeachers: number; pendingSchools: number; revenue30: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  if (DEMO_MODE) {
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return {
      students: TEACHERS.reduce((a, x) => a + x.studentCount, 0),
      teachers: TEACHERS.filter((x) => x.verified).length,
      schools: demoPlatform.schools.filter((x) => x.verified).length,
      activeSubs: TEACHERS.reduce((a, x) => a + x.studentCount, 0),
      pendingPayments: demoPlatform.payments.filter((x) => x.status === "pending").length,
      pendingTeachers: demoPlatform.applicants.filter((x) => !x.teacherId && !x.rejected).length,
      pendingSchools: demoPlatform.schools.filter((x) => !x.verified).length,
      revenue30: demoPlatform.payments.filter((x) => x.status === "approved" && x.createdAt >= since).reduce((a, x) => a + x.amount, 0),
    };
  }
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const head = { count: "exact" as const, head: true };
  const [students, teachers, schools, subs, pay, apps, pendSchools, paid] = await Promise.all([
    db.from("profiles").select("id", head).eq("role", "student"),
    db.from("teachers").select("id", head).eq("verified", true),
    db.from("schools").select("id", head).eq("verified", true),
    db.from("subscriptions").select("id", head).eq("status", "active").gte("ends_on", today),
    db.from("payment_requests").select("id", head).eq("status", "pending"),
    listApplicants(),
    db.from("schools").select("id", head).eq("verified", false),
    db.from("payment_requests").select("amount").eq("status", "approved").gte("reviewed_at", since),
  ]);
  return {
    students: students.count ?? 0,
    teachers: teachers.count ?? 0,
    schools: schools.count ?? 0,
    activeSubs: subs.count ?? 0,
    pendingPayments: pay.count ?? 0,
    pendingTeachers: apps.length,
    pendingSchools: pendSchools.count ?? 0,
    revenue30: (paid.data ?? []).reduce((a, r) => a + Number(r.amount), 0),
  };
}

export type ApplicantDoc = { id: string; kind: string; fileName: string; status: "pending" | "approved" | "rejected"; note: string | null; url: string | null };
export type Applicant = { userId: string; name: string; phone: string; subject: string; grade: string; city: string; photoUrl: string | null; createdAt: string; docs: ApplicantDoc[] };

/** Teachers who signed up and have no page yet: the team reviews their documents. */
export async function listApplicants(): Promise<Applicant[]> {
  if (DEMO_MODE) {
    const { demoVerification } = await import("@/lib/verification");
    return demoPlatform.applicants
      .filter((a) => !a.teacherId && !a.rejected)
      .map((a) => ({
        ...a,
        photoUrl: demoVerification.photos[a.userId] ?? null,
        docs: (demoVerification.docs[a.userId] ?? []).map((d) => ({ id: d.id, kind: d.kind, fileName: d.fileName, status: d.status, note: d.note, url: null })),
      }));
  }
  const db = supabaseAdmin();
  const { data: rows } = await db.from("profiles").select("id, full_name, phone, teach_subject, teach_grade, city, photo_url, created_at").eq("role", "teacher").order("created_at", { ascending: false });
  const { data: linked } = await db.from("teachers").select("user_id").not("user_id", "is", null);
  const has = new Set((linked ?? []).map((r) => r.user_id as string));
  const waiting = (rows ?? []).filter((r) => !has.has(r.id));
  if (!waiting.length) return [];
  const { data: docs } = await db.from("teacher_documents").select("id, user_id, kind, file_name, storage_path, status, note").in("user_id", waiting.map((r) => r.id));
  const paths = (docs ?? []).map((d) => d.storage_path as string);
  const links: Record<string, string> = {};
  if (paths.length) {
    const { data } = await db.storage.from("teacher-docs").createSignedUrls(paths, 600);
    for (const d of data ?? []) if (d.path && d.signedUrl) links[d.path] = d.signedUrl;
  }
  return waiting.map((r) => ({
    userId: r.id,
    name: r.full_name || "—",
    phone: r.phone ? `+${String(r.phone).replace(/^\+/, "")}` : "",
    subject: r.teach_subject ?? "",
    grade: r.teach_grade ?? "",
    city: r.city ?? "",
    photoUrl: r.photo_url,
    createdAt: day(r.created_at),
    docs: (docs ?? [])
      .filter((d) => d.user_id === r.id)
      .map((d) => ({ id: d.id, kind: d.kind, fileName: d.file_name, status: d.status, note: d.note, url: links[d.storage_path] ?? null })),
  }));
}

export type AdminTeacher = { id: string; slug: string; name: string; subject: string; grade: string; city: string; verified: boolean; schoolName: string | null; rating: number; createdAt: string };

export async function listAllTeachers(): Promise<AdminTeacher[]> {
  if (DEMO_MODE)
    return TEACHERS.map((x) => ({
      id: x.id, slug: x.slug, name: x.name, subject: x.subject, grade: x.grade, city: x.city, verified: x.verified,
      schoolName: demoPlatform.schools.find((s) => s.id === x.schoolId)?.name ?? null, rating: x.rating, createdAt: "",
    }));
  const { data } = await supabaseAdmin().from("teachers").select("id, slug, name, subject, grade, city, verified, rating, created_at, schools(name)").order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { id: string; slug: string; name: string; subject: string; grade: string; city: string; verified: boolean; rating: number; created_at: string; schools: { name: string } | null }[]).map((r) => ({
    id: r.id, slug: r.slug, name: r.name, subject: r.subject, grade: r.grade, city: r.city, verified: r.verified,
    schoolName: r.schools?.name ?? null, rating: Number(r.rating), createdAt: day(r.created_at),
  }));
}

export async function listAllSchools(): Promise<(School & { teachers: number })[]> {
  if (DEMO_MODE) return demoPlatform.schools.map((x) => ({ ...x, teachers: TEACHERS.filter((y) => y.schoolId === x.id).length }));
  const { data } = await supabaseAdmin().from("schools").select("id, name, city, verified, created_at, profiles(full_name), teachers(id)").order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { id: string; name: string; city: string; verified: boolean; created_at: string; profiles: { full_name: string } | null; teachers: { id: string }[] }[]).map((r) => ({
    id: r.id, name: r.name, city: r.city, verified: r.verified, ownerName: r.profiles?.full_name ?? "", createdAt: day(r.created_at), teachers: r.teachers.length,
  }));
}

export type AdminStudent = { id: string; name: string; phone: string; grade: string; consent: string; subs: number; createdAt: string };

export async function listAllStudents(): Promise<AdminStudent[]> {
  if (DEMO_MODE) {
    const names = ["ليان الخوالدة", "عبدالرحمن بني هاني", "تالا العبادي", "سارة الرواشدة", "كرم الحياري", "زيد العدوان", "رهف المعايطة"];
    return [
      { id: DEMO_STUDENT.id, name: DEMO_STUDENT.fullName, phone: "+962791234567", grade: "توجيهي علمي", consent: "not_needed", subs: 2, createdAt: "2026-09-14" },
      ...names.map((name, i) => ({ id: `demo-${i}`, name, phone: `+96278${String(1000000 + i * 137531).slice(0, 7)}`, grade: "توجيهي علمي", consent: i === 6 ? "pending" : "approved", subs: i === 6 ? 0 : 1, createdAt: "2026-10-0" + (i + 1) })),
    ];
  }
  const db = supabaseAdmin();
  const { data } = await db.from("profiles").select("id, full_name, phone, grade, consent, created_at, subscriptions!subscriptions_student_id_fkey(id)").eq("role", "student").order("created_at", { ascending: false }).limit(500);
  return ((data ?? []) as unknown as { id: string; full_name: string; phone: string | null; grade: string | null; consent: string; created_at: string; subscriptions: { id: string }[] }[]).map((r) => ({
    id: r.id, name: r.full_name || "—", phone: r.phone ? `+${String(r.phone).replace(/^\+/, "")}` : "", grade: r.grade ?? "", consent: r.consent, subs: r.subscriptions.length, createdAt: day(r.created_at),
  }));
}

export async function listAllPayments(): Promise<PaymentRequest[]> {
  if (DEMO_MODE) return newestFirst(demoPlatform.payments);
  const { data } = await supabaseAdmin().from("payment_requests").select(PAY_COLS).order("created_at", { ascending: false }).limit(300);
  return ((data ?? []) as unknown as PayRow[]).map(fromPay);
}

export type AdminReview = { id: string; teacherName: string; author: string; stars: number; body: string; hidden: boolean; createdAt: string };

export async function listAllReviews(): Promise<AdminReview[]> {
  if (DEMO_MODE) {
    const { REVIEWS } = await import("@/lib/demo-data");
    return REVIEWS.map((r, i) => ({ id: `rev-${i}`, teacherName: "خالد العمري", author: r.author, stars: r.stars, body: r.body, hidden: demoPlatform.hiddenReviews.includes(`rev-${i}`), createdAt: r.when }));
  }
  const { data } = await supabaseAdmin().from("reviews").select("id, author_name, stars, body, hidden, created_at, teachers(name)").order("created_at", { ascending: false }).limit(200);
  return ((data ?? []) as unknown as { id: string; author_name: string; stars: number; body: string; hidden: boolean; created_at: string; teachers: { name: string } | null }[]).map((r) => ({
    id: r.id, teacherName: r.teachers?.name ?? "", author: r.author_name, stars: r.stars, body: r.body, hidden: r.hidden, createdAt: day(r.created_at),
  }));
}
