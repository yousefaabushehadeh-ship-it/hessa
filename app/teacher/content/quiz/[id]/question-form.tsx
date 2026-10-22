"use client";

import { useActionState, useRef } from "react";
import { addQuestion, type EditState } from "@/app/actions/quiz";
import { useT } from "@/components/lang";

export function QuestionForm({ lessonId }: { lessonId: string }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: EditState, fd: FormData) => {
    const r = await addQuestion(lessonId, prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  return (
    <form className="frm" action={action} ref={ref}>
      <div>
        <label className="h" htmlFor="q-p">
          {t("Question")}
        </label>
        <textarea className="field" id="q-p" name="prompt" rows={2} required />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
        <legend className="h">{t("Options (mark the right answer)")}</legend>
        {[0, 1, 2, 3].map((i) => (
          <div className="inrow" key={i} style={{ alignItems: "center" }}>
            <input type="radio" name="answer" value={i} defaultChecked={i === 0} aria-label={t("Option {n} is correct", { n: i + 1 })} />
            <input
              className="field"
              name={`o${i}`}
              placeholder={i < 2 ? t("Option {n}", { n: i + 1 }) : t("Option {n} (optional)", { n: i + 1 })}
              required={i < 2}
            />
          </div>
        ))}
      </fieldset>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Add question")}
      </button>
    </form>
  );
}
