import { DEMO_SCHOOL_ID, DEMO_STUDENT } from "@/lib/demo-data";
import type { PaymentRequest, School, SchoolInvite, Submission } from "@/lib/types";

// Demo-mode records for schools, worksheets, payments and teacher applications.
// Kept on globalThis like demo-store.ts, because Next.js can load a module once per route bundle.

export type DemoApplicant = { userId: string; name: string; phone: string; subject: string; grade: string; city: string; createdAt: string; teacherId?: string; rejected?: boolean };

type Store = {
  schools: (School & { ownerId: string })[];
  invites: (SchoolInvite & { schoolId: string })[];
  submissions: Submission[];
  payments: PaymentRequest[];
  applicants: DemoApplicant[];
  hiddenReviews: string[];
};

const g = globalThis as unknown as { __hessaPlatform?: Store };

export const demoPlatform: Store = (g.__hessaPlatform ??= {
  schools: [
    { id: DEMO_SCHOOL_ID, ownerId: "demo-school", name: "مدارس النخبة", city: "العقبة", verified: true, ownerName: "إدارة مدارس النخبة", createdAt: "2026-09-01" },
    { id: "rowad", ownerId: "demo-school-2", name: "أكاديمية الروّاد", city: "إربد", verified: false, ownerName: "أحمد بني ياسين", createdAt: "2026-10-27" },
  ],
  invites: [
    { id: "inv-1", schoolId: DEMO_SCHOOL_ID, phone: "+962791112233", name: "يزن الطراونة", subject: "رياضيات", grade: "الصفوف 9 لـ 11", used: true, createdAt: "2026-09-02" },
    { id: "inv-2", schoolId: DEMO_SCHOOL_ID, phone: "+962785554433", name: "نور الشوابكة", subject: "اللغة الإنجليزية", grade: "الصف التاسع", used: false, createdAt: "2026-10-20" },
  ],
  submissions: [
    {
      id: "sub-1",
      lessonId: "khaled-u0-l3",
      studentId: "demo-0",
      studentName: "ليان الخوالدة",
      fileName: "حل-ورقة-الاشتقاق.jpg",
      note: "السؤال الرابع ما كنت متأكدة منه.",
      status: "graded",
      mark: "9/10",
      feedback: "ممتاز يا ليان. بالسؤال الرابع انتبهي لإشارة السالب.",
      createdAt: "2026-10-21",
    },
    {
      id: "sub-2",
      lessonId: "khaled-u0-l3",
      studentId: "demo-2",
      studentName: "تالا العبادي",
      fileName: "worksheet-1.pdf",
      note: "",
      status: "submitted",
      mark: null,
      feedback: null,
      createdAt: "2026-10-28",
    },
  ],
  payments: [
    {
      id: "pay-1",
      studentId: "demo-6",
      studentName: "زيد العدوان",
      teacherId: "khaled",
      teacherName: "خالد العمري",
      plan: "monthly",
      amount: 25,
      method: "cliq",
      reference: "CLQ-58201947",
      status: "pending",
      note: null,
      createdAt: "2026-10-29",
    },
    {
      id: "pay-2",
      studentId: DEMO_STUDENT.id,
      studentName: DEMO_STUDENT.fullName,
      teacherId: "khaled",
      teacherName: "خالد العمري",
      plan: "monthly",
      amount: 25,
      method: "cliq",
      reference: "CLQ-57110385",
      status: "approved",
      note: null,
      createdAt: "2026-10-13",
    },
  ],
  applicants: [
    { userId: "teacher-787654321", name: "مها العتوم", phone: "+962787654321", subject: "كيمياء", grade: "توجيهي علمي", city: "جرش", createdAt: "2026-10-26" },
  ],
  hiddenReviews: [],
});
