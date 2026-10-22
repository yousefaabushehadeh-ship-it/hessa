"use client";

import { useActionState, useRef } from "react";
import { addQuestion, type EditState } from "@/app/actions/quiz";

export function QuestionForm({ lessonId }: { lessonId: string }) {
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
          نص السؤال
        </label>
        <textarea className="field" id="q-p" name="prompt" rows={2} required />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
        <legend className="h">الخيارات (علّم الجواب الصح)</legend>
        {[0, 1, 2, 3].map((i) => (
          <div className="inrow" key={i} style={{ alignItems: "center" }}>
            <input type="radio" name="answer" value={i} defaultChecked={i === 0} aria-label={`الخيار ${i + 1} هو الصح`} />
            <input className="field" name={`o${i}`} placeholder={i < 2 ? `الخيار ${i + 1}` : `الخيار ${i + 1} (اختياري)`} required={i < 2} />
          </div>
        ))}
      </fieldset>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? "لحظة..." : "أضف السؤال"}
      </button>
    </form>
  );
}
