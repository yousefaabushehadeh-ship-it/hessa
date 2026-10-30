"use client";

import { useActionState } from "react";
import { gradeHandIn, type GradeState } from "@/app/actions/worksheet";
import { useT } from "@/components/lang";

export function GradeForm({ id, mark, feedback }: { id: string; mark: string | null; feedback: string | null }) {
  const t = useT();
  const [state, action, pending] = useActionState(gradeHandIn.bind(null, id), {} as GradeState);
  return (
    <form className="frm" action={action} style={{ gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8 }}>
        <input className="field num" name="mark" defaultValue={mark ?? ""} placeholder="8/10" maxLength={20} required aria-label={t("Mark")} />
        <input className="field" name="feedback" defaultValue={feedback ?? ""} placeholder={t("A comment for the student")} maxLength={1000} aria-label={t("Comment")} />
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri btn-sm" style={{ justifySelf: "start" }} disabled={pending}>
        {mark ? t("Update mark") : t("Save mark")}
      </button>
    </form>
  );
}
