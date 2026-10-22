"use client";

import { useActionState } from "react";
import { submitQuiz, type QuizState } from "@/app/actions/quiz";
import { useT } from "@/components/lang";
import type { QuizQuestion, QuizResult } from "@/lib/types";

export function QuizRunner({ lessonId, questions, last }: { lessonId: string; questions: QuizQuestion[]; last: QuizResult | null }) {
  const t = useT();
  const [state, action, pending] = useActionState(submitQuiz.bind(null, lessonId), {} as QuizState);
  const r = state.result;
  const pct = r ? Math.round((r.score / r.total) * 100) : 0;
  return (
    <form className="qz" action={action} key={r ? "done" : "open"}>
      {last && !r && (
        <div className="score">
          <span className="muted">{t("Your last attempt:")}</span>
          <b className="num">
            {t("{score} of {total}", { score: last.score, total: last.total })}
          </b>
          <span className="muted">{t("You can retake the quiz any time.")}</span>
        </div>
      )}
      <input type="hidden" name="count" value={questions.length} />
      {questions.map((q, i) => (
        <div className="qq" key={q.id}>
          <b>
            {i + 1}. {q.prompt}
          </b>
          <div className="ans">
            {q.options.map((o, j) => {
              const cls = r ? (r.correct[i] === j ? "right" : r.answers[i] === j ? "wrong" : "") : "";
              return (
                <label key={j} className={cls}>
                  <input type="radio" name={`q${i}`} value={j} required disabled={Boolean(r)} defaultChecked={r ? r.answers[i] === j : false} />
                  <span>{o}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {state.error && <p className="form-error">{state.error}</p>}
      {r ? (
        <>
          <div className="score">
            <span className="big num">
              {r.score}/{r.total}
            </span>
            <span>
              {pct >= 85
                ? t("Excellent! Keep it up.")
                : pct >= 60
                  ? t("Good. Review the questions marked in red.")
                  : t("Needs more work. Go back to the lesson and try again.")}
            </span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => location.reload()}>
            {t("Retake quiz")}
          </button>
        </>
      ) : (
        <button className="btn btn-pri" disabled={pending}>
          {pending ? t("Grading...") : t("Submit answers")}
        </button>
      )}
    </form>
  );
}
