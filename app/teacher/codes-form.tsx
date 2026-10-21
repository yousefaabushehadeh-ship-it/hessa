"use client";

import { useActionState } from "react";
import { createCodes } from "@/app/actions/teacher";

export function CodesForm() {
  const [state, action, pending] = useActionState(createCodes, {});
  return (
    <form className="frm" action={action}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="cnt">
            العدد
          </label>
          <input className="field num" id="cnt" name="count" type="number" min={1} max={50} defaultValue={5} required />
        </div>
        <div>
          <label className="h" htmlFor="plan">
            الباقة
          </label>
          <select className="field" id="plan" name="plan">
            <option value="monthly">شهري (30 يوم)</option>
            <option value="term">فصلي (90 يوم)</option>
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
        {pending ? "لحظة..." : "أنشئ الأكواد"}
      </button>
    </form>
  );
}
