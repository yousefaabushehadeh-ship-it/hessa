export type LessonType = "video" | "pdf" | "quiz" | "live";

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
  units: Unit[];
};

export type Review = { author: string; when: string; stars: number; body: string };

export type Role = "student" | "teacher" | "admin";

export type Session = {
  userId: string;
  role: Role;
  fullName: string;
  /** For teachers: the teacher profile they own. */
  teacherId?: string;
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
export type QuizResult = { score: number; total: number; correct: number[]; answers: number[] };

export type StudentRow = { id: string; name: string; plan: "monthly" | "term"; endsOn: string; progress: number; lastQuiz: string | null };
