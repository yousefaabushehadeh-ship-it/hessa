"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/teacher";
import { useT } from "@/components/lang";

type Fields = { headline: string; bio: string; education: string; liveSchedule: string; priceMonth: number; priceTerm: number; cliqAlias?: string };

export function ProfileForm({ t: fields }: { t: Fields }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    <form className="frm" action={action}>
      <div>
        <label className="h" htmlFor="p-head">
          {t("Short headline")}
        </label>
        <input className="field" id="p-head" name="headline" defaultValue={fields.headline} maxLength={160} required />
      </div>
      <div>
        <label className="h" htmlFor="p-bio">
          {t("About you")}
        </label>
        <textarea className="field" id="p-bio" name="bio" rows={5} defaultValue={fields.bio} maxLength={1200} />
      </div>
      <div>
        <label className="h" htmlFor="p-edu">
          {t("Qualifications")}
        </label>
        <input className="field" id="p-edu" name="education" defaultValue={fields.education} />
      </div>
      <div>
        <label className="h" htmlFor="p-live">
          {t("Live class times")}
        </label>
        <input className="field" id="p-live" name="live" defaultValue={fields.liveSchedule} placeholder={t("e.g. Sat & Tue · 7:00 PM")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="p-pm">
            {t("Monthly price (JOD)")}
          </label>
          <input className="field num" id="p-pm" name="priceMonth" type="number" min={1} max={500} defaultValue={fields.priceMonth} required />
        </div>
        <div>
          <label className="h" htmlFor="p-pt">
            {t("Term price (JOD)")}
          </label>
          <input className="field num" id="p-pt" name="priceTerm" type="number" min={1} max={1500} defaultValue={fields.priceTerm} required />
        </div>
      </div>
      <div>
        <label className="h" htmlFor="p-cliq">
          {t("Your CliQ alias or number")}
        </label>
        <input className="field num" dir="ltr" id="p-cliq" name="cliq" defaultValue={fields.cliqAlias ?? ""} maxLength={40} placeholder="KHALED.OMARI" />
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          {t("Students send their subscription here, then you confirm the transfer from the Payments page.")}
        </p>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Save")}
      </button>
    </form>
  );
}
