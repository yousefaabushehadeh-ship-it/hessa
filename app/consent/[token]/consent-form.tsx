"use client";

import Link from "next/link";
import { useActionState } from "react";
import { parentConsent, type ConsentState } from "@/app/actions/auth";
import { useT } from "@/components/lang";

export function ConsentForm({ token, phone, demo }: { token: string; phone: string; demo?: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState(parentConsent.bind(null, token), { step: "send" } as ConsentState);
  if (state.step === "done")
    return (
      <>
        <p className="form-ok">{t("Thank you. Approval recorded and your child's account is now active.")}</p>
        <p>
          {t("Keep this link: from now on it shows your child's report.")}{" "}
          <Link className="link" href={`/parent/${token}`}>
            {t("Open the report")}
          </Link>
        </p>
      </>
    );
  return (
    <form action={action} className="frm">
      {state.error && <p className="form-error">{state.error}</p>}
      {state.notice && <p className="form-ok">{state.notice}</p>}
      {state.step === "send" ? (
        <>
          <p>
            {t("To make sure it's you, we'll send a code to the parent's number:")}{" "}
            <b className="num" dir="ltr">
              {phone}
            </b>
          </p>
          <input type="hidden" name="send" value="1" />
          <button className="btn btn-pri" disabled={pending}>
            {pending ? t("One moment...") : t("Send me the code")}
          </button>
        </>
      ) : (
        <>
          <label className="h" htmlFor="pcode">
            {t("The code you received")}
          </label>
          <input id="pcode" className="field num" dir="ltr" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" required />
          {demo && (
            <p className="muted">
              {t("Your code is")} <b className="num">482913</b>
            </p>
          )}
          <button className="btn btn-pri" disabled={pending}>
            {pending ? t("One moment...") : t("I approve")}
          </button>
        </>
      )}
    </form>
  );
}
