"use client";

import { useActionState } from "react";
import { redeemCode } from "@/app/actions/student";

export function RedeemForm() {
  const [state, action, pending] = useActionState(redeemCode, {});
  return (
    <form className="frm" action={action}>
      <label className="h" htmlFor="code">
        كود التفعيل
      </label>
      <input className="field num" id="code" name="code" dir="ltr" required placeholder="HS-XXXX-XX" style={{ textTransform: "uppercase", letterSpacing: ".06em" }} autoComplete="off" />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? "لحظة..." : "فعّل"}
      </button>
    </form>
  );
}
