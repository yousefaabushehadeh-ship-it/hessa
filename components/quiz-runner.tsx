"use client";

import { useActionState } from "react";
import { submitQuiz, type QuizState } from "@/app/actions/quiz";
import type { QuizQuestion, QuizResult } from "@/lib/types";

export function QuizRunner({ lessonId, questions, last }: { lessonId: string; questions: QuizQuestion[]; last: QuizResult | null }) {
  const [state, action, pending] = useActionState(submitQuiz.bind(null, lessonId), {} as QuizState);
  const r = state.result;
  const pct = r ? Math.round((r.score / r.total) * 100) : 0;
  return (
    <form className="qz" action={action} key={r ? "done" : "open"}>
      {last && !r && (
        <div className="score">
          <span className="muted">آخر محاولة إلك:</span>
          <b className="num">
            {last.score} من {last.total}
          </b>
          <span className="muted">بتقدر تعيد الاختبار وقت ما بدك.</span>
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
            <span>{pct >= 85 ? "ممتاز! كمّل على هالمستوى." : pct >= 60 ? "منيح. راجع الأسئلة اللي بالأحمر." : "بدها مراجعة. ارجع للدروس قبل الاختبار وجرّب كمان مرة."}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => location.reload()}>
            أعد الاختبار
          </button>
        </>
      ) : (
        <button className="btn btn-pri" disabled={pending}>
          {pending ? "عم نصحّح..." : "سلّم الإجابات"}
        </button>
      )}
    </form>
  );
}
