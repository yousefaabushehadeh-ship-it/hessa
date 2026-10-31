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
  const reveal = Boolean(r?.correct.length);
  const outOfTries = !r && last?.left === 0;
  return (
    <form className="qz" action={action} key={r ? "done" : "open"}>
      {last && !r && (
        <div className="score">
          <span className="muted">{t("Your last attempt:")}</span>
          <b className="num">
            {t("{score} of {total}", { score: last.score, total: last.total })}
          </b>
          <span className="muted">
            {outOfTries ? t("You've used all your tries for this quiz.") : t("Tries left: {n}", { n: last.left ?? 0 })}
          </span>
        </div>
      )}
      <input type="hidden" name="count" value={questions.length} />
      {questions.map((q, i) => (
        <div className="qq" key={q.id}>
          <b>
            {i + 1}. <bdi>{q.prompt}</bdi>
          </b>
          <div className="ans">
            {q.options.map((o, j) => {
              // Right and wrong are only marked once the answers are revealed (last try or full score).
              const cls = r && reveal ? (r.correct[i] === j ? "right" : r.answers[i] === j ? "wrong" : "") : "";
              return (
                <label key={j} className={cls}>
                  <input type="radio" name={`q${i}`} value={j} required disabled={Boolean(r) || outOfTries} defaultChecked={r ? r.answers[i] === j : false} />
                  <span dir="auto">{o}</span>
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
                  ? reveal
                    ? t("Good. Review the questions marked in red.")
                    : t("Good. Review the lesson and try again.")
                  : t("Needs more work. Go back to the lesson and try again.")}
            </span>
          </div>
          {!reveal && (
            <p className="muted" style={{ fontSize: 13.5 }}>
              {t("Tries left: {n}. The right answers show after your last try.", { n: r.left ?? 0 })}
            </p>
          )}
          {(r.left ?? 0) > 0 && r.score < r.total && (
            <button type="button" className="btn btn-ghost" onClick={() => location.reload()}>
              {t("Retake quiz")}
            </button>
          )}
        </>
      ) : (
        <button className="btn btn-pri" disabled={pending || outOfTries}>
          {pending ? t("Grading...") : t("Submit answers")}
        </button>
      )}
    </form>
  );
}
