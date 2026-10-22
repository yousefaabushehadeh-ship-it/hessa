"use client";

import { useActionState } from "react";
import { createCodes } from "@/app/actions/teacher";
import { useT } from "@/components/lang";

export function CodesForm() {
  const t = useT();
  const [state, action, pending] = useActionState(createCodes, {});
  return (
    <form className="frm" action={action}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="cnt">
            {t("How many")}
          </label>
          <input className="field num" id="cnt" name="count" type="number" min={1} max={50} defaultValue={5} required />
        </div>
        <div>
          <label className="h" htmlFor="plan">
            {t("Plan")}
          </label>
          <select className="field" id="plan" name="plan">
            <option value="monthly">{t("Monthly (30 days)")}</option>
            <option value="term">{t("Term (90 days)")}</option>
          </select>
        </div>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      {state.codes && (
        <div className="codes">
          {state.codes.map((c) => (
            <code key={c}>{c}</code>
          ))}
        </div>
      )}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Create codes")}
      </button>
    </form>
  );
}
