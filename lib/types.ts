export type LessonType = "video" | "pdf" | "quiz" | "live" | "worksheet";

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  /** Duration, page count or schedule, shown under the title. */
  meta: string;
  isFree: boolean;
  position: number;
};

export type Unit = { id: string; title: string; position: number; lessons: Lesson[] };

export type Teacher = {
  id: string;
  slug: string;
  name: string;
  initial: string;
  subject: string;
  grade: string;
  city: string;
  years: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  priceMonth: number;
  priceTerm: number;
  color: string;
  badge: string | null;
  headline: string;
  education: string;
  liveSchedule: string;
  bio: string;
  verified: boolean;
  /** Uploaded by the teacher; without one, the initial on a colored square is shown. */
  photoUrl?: string | null;
  /** Set when the teacher joined through a school account. */
  schoolId?: string | null;
  /** Where students send the subscription money (CliQ alias or number). */
  cliqAlias?: string;
  units: Unit[];
};

export type DocKind = "id" | "degree" | "certificate" | "experience" | "other";

/** A file a teacher uploads so the Hessa team can verify them. */
export type TeacherDoc = { id: string; kind: DocKind; fileName: string; status: "pending" | "approved" | "rejected"; note: string | null; createdAt: string };

export type Review = { author: string; when: string; stars: number; body: string };

export type Role = "student" | "teacher" | "school" | "admin";

export type Session = {
  userId: string;
  role: Role;
  fullName: string;
  /** For teachers: the teacher profile they own. */
  teacherId?: string;
  /** For students: the grade they study in (a value from lib/catalog.ts). */
  grade?: string;
  /** For school accounts: the school they run. */
  schoolId?: string;
  /** Demo only: the new school's details, so a fresh server can rebuild it (sample data lives in memory). */
  demoSchool?: { name: string; city: string };
  consent?: "not_needed" | "pending" | "approved";
};

export type Subscription = {
  teacherId: string;
  plan: "monthly" | "term";
  endsOn: string;
  progress: number;
};

export type TeacherFilters = { q?: string; subject?: string; grade?: string; city?: string; sort?: "rating" | "students" | "price" };

export type QuizQuestion = { id: string; prompt: string; options: string[] };
/** Teachers see the right answer too. */
export type QuizQuestionFull = QuizQuestion & { answer: number };
/** `correct` is empty until the student's last try (or a full score); `left` is how many tries remain. */
export type QuizResult = { score: number; total: number; correct: number[]; answers: number[]; left?: number };

export type StudentRow = { id: string; name: string; plan: "monthly" | "term"; endsOn: string; progress: number; lastQuiz: string | null };

/** A student's hand-in for a worksheet. */
export type Submission = {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  fileName: string;
  note: string;
  status: "submitted" | "graded";
  mark: string | null;
  feedback: string | null;
  createdAt: string;
  /** Short-lived link to open the file (set only where the viewer may open it). */
  url?: string | null;
};

export type PaymentMethod = "cliq" | "wallet" | "cash";

export type PaymentRequest = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  plan: "monthly" | "term";
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  createdAt: string;
};

export type School = { id: string; name: string; city: string; verified: boolean; ownerName: string; createdAt: string };

/** A teacher a school added by phone number, before or after they signed in. */
export type SchoolInvite = { id: string; phone: string; name: string; subject: string; grade: string; used: boolean; createdAt: string };
