import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteQuestion } from "@/app/actions/quiz";
import { TopBar } from "@/components/dash-shell";
import { findLesson } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import { getQuizFull, getQuizStats } from "@/lib/quiz";
import { myTeacher } from "@/lib/teacher-context";
import { QuestionForm } from "./question-form";

export default async function QuizEditor({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const x = await myTeacher();
  const found = await findLesson(id);
  if (!found || found.teacher.id !== x.id || found.lesson.type !== "quiz") notFound();
  const questions = await getQuizFull(id);
  const stats = await getQuizStats(id);
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar
        title={found.lesson.title}
        sub={`${found.unit.title} · ${t("Quizzes are graded automatically. Students see the right answer after they submit.")}`}
        who={`${t("Teacher")} ${first}`}
        initial={x.initial}
        color={x.color} photoUrl={x.photoUrl}
      />
      <div className="kpis">
        <div className="card stat">
          <div className="lbl">{t("Questions")}</div>
          <div className="v">{questions.length}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Student attempts")}</div>
          <div className="v">{stats.attempts}</div>
        </div>
        <div className="card stat">
          <div className="lbl">{t("Average score")}</div>
          <div className="v">{stats.average === null ? "—" : `${stats.average}%`}</div>
        </div>
      </div>
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Questions")}</h2>
              <Link className="link" href="/teacher/content">
                {t("Back to content")}
              </Link>
            </div>
            {questions.length === 0 && <div className="empty">{t("No questions yet. Add the first one using the form.")}</div>}
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
                      {t("Delete question")}
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
              <h2>{t("New question")}</h2>
            </div>
            <QuestionForm lessonId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
