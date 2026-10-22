import type { QuizQuestionFull, QuizResult, Review } from "@/lib/types";

// Demo-mode data that server actions change. Kept on globalThis because Next.js
// can load a module once per route bundle.
type Store = {
  quizzes: Record<string, QuizQuestionFull[]>;
  attempts: Record<string, QuizResult>;
  reviews: Record<string, (Review & { mine?: boolean })[]>;
};

const g = globalThis as unknown as { __hessaPhase2?: Store };

export const demo2: Store = (g.__hessaPhase2 ??= {
  quizzes: {
    // khaled · unit 1 · "اختبار قصير: قواعد الاشتقاق"
    "khaled-u0-l4": [
      { id: "q1", prompt: "مشتقة ق(س) = س³ − 4س + 7 هي:", options: ["3س² − 4", "3س² − 4س", "س² − 4", "3س³ − 4"], answer: 0 },
      { id: "q2", prompt: "إذا كان ص = جا س، فإن دص/دس تساوي:", options: ["−جتا س", "جتا س", "ظا س", "−جا س"], answer: 1 },
      { id: "q3", prompt: "باستخدام قاعدة السلسلة، مشتقة (2س + 1)⁵ هي:", options: ["5(2س + 1)⁴", "2(2س + 1)⁵", "10(2س + 1)⁴", "10(2س + 1)⁵"], answer: 2 },
    ],
  },
  attempts: {},
  reviews: {},
});
