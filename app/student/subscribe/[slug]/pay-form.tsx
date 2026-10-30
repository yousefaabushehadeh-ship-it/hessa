"use client";

import { useActionState, useState } from "react";
import { requestPayment, type PayState } from "@/app/actions/payment";
import { useT } from "@/components/lang";

type Props = { teacherId: string; priceMonth: number; priceTerm: number; cliqAlias: string };

export function PayForm({ teacherId, priceMonth, priceTerm, cliqAlias }: Props) {
  const t = useT();
  const [state, action, pending] = useActionState(requestPayment.bind(null, teacherId), {} as PayState);
  const [plan, setPlan] = useState<"monthly" | "term">("monthly");
  const amount = plan === "term" ? priceTerm : priceMonth;
  if (state.ok) return <p className="form-ok">{state.ok}</p>;
  return (
    <form className="frm" action={action}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 10 }}>
        <legend className="h">{t("1. Choose a plan")}</legend>
        <label className="opt">
          <input type="radio" name="plan" value="monthly" checked={plan === "monthly"} onChange={() => setPlan("monthly")} />
          <span className="t">
            <b>{t("Monthly")}</b>
            <span>{t("30 days from activation")}</span>
          </span>
          <span className="pr num">{t("{n} JOD", { n: priceMonth })}</span>
        </label>
        <label className="opt">
          <input type="radio" name="plan" value="term" checked={plan === "term"} onChange={() => setPlan("term")} />
          <span className="t">
            <b>{t("Term (3 months)")}</b>
            <span>{t("Save {n} JOD", { n: priceMonth * 3 - priceTerm })}</span>
          </span>
          <span className="pr num">{t("{n} JOD", { n: priceTerm })}</span>
        </label>
      </fieldset>
      <div className="pay-box">
        <span className="h">{t("2. Send the amount by CliQ")}</span>
        <span className="big num">{t("{n} JOD", { n: amount })}</span>
        {cliqAlias ? (
          <span>
            {t("CliQ alias:")} <b dir="ltr" className="num">{cliqAlias}</b>
          </span>
        ) : (
          <span className="muted">{t("The teacher hasn't added a CliQ alias yet. Ask them where to send the payment.")}</span>
        )}
        <span className="muted" style={{ fontSize: 13 }}>
          {t("Use your bank or wallet app (Zain Cash, Orange Money, or any bank). Keep the reference number it shows you.")}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div>
          <label className="h" htmlFor="p-method">
            {t("Paid with")}
          </label>
          <select className="field" id="p-method" name="method" defaultValue="cliq">
            <option value="cliq">CliQ</option>
            <option value="wallet">{t("E-wallet")}</option>
            <option value="cash">{t("Cash to the teacher")}</option>
          </select>
        </div>
        <div>
          <label className="h" htmlFor="p-ref">
            {t("3. Transfer reference")}
          </label>
          <input className="field num" dir="ltr" id="p-ref" name="reference" required maxLength={60} placeholder="CLQ-12345678" />
        </div>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Send for confirmation")}
      </button>
    </form>
  );
}
