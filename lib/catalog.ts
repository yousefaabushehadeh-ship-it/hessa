// Grades and subjects a student picks from. Values are stored in Arabic, like the rest
// of the sample data, and shown in English through dataLabel().

export const GRADE12 = ["الثاني عشر علمي", "الثاني عشر أدبي", "الثاني عشر صناعي"];

/** What a student studies in, from Grade 1 to the Grade 12 tracks. */
export const GRADES = [
  ...GRADE12,
  "الصف الحادي عشر",
  "الصف العاشر",
  "الصف التاسع",
  "الصف الثامن",
  "الصف السابع",
  "الصف السادس",
  "الصف الخامس",
  "الصف الرابع",
  "الصف الثالث",
  "الصف الثاني",
  "الصف الأول",
];

/** Groups a teacher can pick in addition to a single grade. */
const GROUPS: Record<string, string[]> = {
  "جميع الفروع": GRADE12,
  "الصفوف 9 لـ 11": ["الصف التاسع", "الصف العاشر", "الصف الحادي عشر"],
  "الصفوف 5 لـ 8": ["الصف الخامس", "الصف السادس", "الصف السابع", "الصف الثامن"],
  "الصفوف 1 لـ 4": ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع"],
};

/** What a teacher can say they teach. */
export const TEACHER_GRADES = [...GRADE12, ...Object.keys(GROUPS), ...GRADES.slice(GRADE12.length)];

export const SUBJECT_LIST = [
  "رياضيات",
  "فيزياء",
  "كيمياء",
  "علوم حياتية",
  "علوم الأرض والبيئة",
  "علوم",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "تاريخ الأردن",
  "التربية الإسلامية",
  "حاسوب",
];

export const CITIES = ["عمّان", "إربد", "الزرقاء", "السلط", "مادبا", "الكرك", "الطفيلة", "معان", "العقبة", "المفرق", "جرش", "عجلون"];

/** Does a teacher who teaches `teacherGrade` teach a student in `studentGrade`? */
export function teachesGrade(teacherGrade: string, studentGrade: string): boolean {
  return teacherGrade === studentGrade || (GROUPS[teacherGrade]?.includes(studentGrade) ?? false);
}
