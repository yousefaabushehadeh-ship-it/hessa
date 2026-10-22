"use client";

import { useActionState } from "react";
import { redeemCode } from "@/app/actions/student";
import { useT } from "@/components/lang";

export function RedeemForm() {
  const t = useT();
  const [state, action, pending] = useActionState(redeemCode, {});
  return (
    <form className="frm" action={action}>
      <label className="h" htmlFor="code">
        {t("Activation code")}
      </label>
      <input className="field num" id="code" name="code" dir="ltr" required placeholder="HS-XXXX-XX" style={{ textTransform: "uppercase", letterSpacing: ".06em" }} autoComplete="off" />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Activate")}
      </button>
    </form>
  );
}
