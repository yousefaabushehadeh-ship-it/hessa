"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteState } from "@/app/actions/auth";
import { useT } from "@/components/lang";

export function DeleteForm() {
  const t = useT();
  const [state, action, pending] = useActionState(deleteAccount, {} as DeleteState);
  return (
    <form className="frm" action={action}>
      <p className="muted" style={{ fontSize: 14 }}>
        {t("This deletes your account, your progress, your hand-ins and your files. It can't be undone. Active subscriptions are not refunded.")}
      </p>
      <label className="h" htmlFor="del">
        {t("Type DELETE to confirm")}
      </label>
      <input className="field num" dir="ltr" id="del" name="confirm" autoComplete="off" required />
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="btn btn-sm" style={{ justifySelf: "start", color: "var(--bad-fg)" }} disabled={pending}>
        {pending ? t("One moment...") : t("Delete my account")}
      </button>
    </form>
  );
}
