import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteQuestion } from "@/app/actions/quiz";
import { TopBar } from "@/components/dash-shell";
import { findLesson } from "@/lib/data";
import { getQuizFull, getQuizStats } from "@/lib/quiz";
import { myTeacher } from "@/lib/teacher-context";
import { QuestionForm } from "./question-form";

export default async function QuizEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await myTeacher();
  const found = await findLesson(id);
  if (!found || found.teacher.id !== t.id || found.lesson.type !== "quiz") notFound();
  const questions = await getQuizFull(id);
  const stats = await getQuizStats(id);
  const first = t.name.split(" ")[0];
  return (
    <>
      <TopBar title={found.lesson.title} sub={`${found.unit.title} · الاختبار بيتصحّح تلقائيًا، والطالب بيشوف الجواب الصح بعد ما يسلّم.`} who={`أ. ${first}`} initial={t.initial} color={t.color} />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">عدد الأسئلة</div>
          <div className="v">{questions.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">محاولات الطلاب</div>
          <div className="v">{stats.attempts}</div>
        </div>
        <div className="card stat">
          <div className="lbl">متوسط العلامة</div>
          <div className="v">{stats.average === null ? "—" : `${stats.average}%`}</div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>الأسئلة</h2>
              <Link className="link" href="/teacher/content">
                رجوع للمحتوى
              </Link>
            </div>
            {questions.length === 0 && <div className="empty">ما في أسئلة لسا. ضيف أول سؤال من النموذج.</div>}
            <div className="qz">
              {questions.map((q, i) => (
                <div className="qq" key={q.id}>
                  <b>
                    {i + 1}. {q.prompt}
                  </b>
                  <div className="ans">
                    {q.options.map((o, j) => (
                      <label key={j} className={j === q.answer ? "right" : ""}>
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                  <form action={deleteQuestion.bind(null, id, q.id)} style={{ marginTop: 8 }}>
                    <button className="link" style={{ color: "var(--bad-fg)" }}>
                      احذف السؤال
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>سؤال جديد</h2>
            </div>
            <QuestionForm lessonId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
