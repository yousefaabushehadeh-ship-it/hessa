"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/teacher";

type Fields = { headline: string; bio: string; education: string; liveSchedule: string; priceMonth: number; priceTerm: number };

export function ProfileForm({ t }: { t: Fields }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  return (
    <form className="frm" action={action}>
      <div>
        <label className="h" htmlFor="p-head">
          سطر تعريفي
        </label>
        <input className="field" id="p-head" name="headline" defaultValue={t.headline} maxLength={160} required />
      </div>
      <div>
        <label className="h" htmlFor="p-bio">
          عن الأستاذ
        </label>
        <textarea className="field" id="p-bio" name="bio" rows={5} defaultValue={t.bio} maxLength={1200} />
      </div>
      <div>
        <label className="h" htmlFor="p-edu">
          المؤهل
        </label>
        <input className="field" id="p-edu" name="education" defaultValue={t.education} />
      </div>
      <div>
        <label className="h" htmlFor="p-live">
          مواعيد الحصص المباشرة
        </label>
        <input className="field" id="p-live" name="live" defaultValue={t.liveSchedule} placeholder="السبت والثلاثاء · 7:00 مساءً" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="p-pm">
            السعر الشهري (د.أ)
          </label>
          <input className="field num" id="p-pm" name="priceMonth" type="number" min={1} max={500} defaultValue={t.priceMonth} required />
        </div>
        <div>
          <label className="h" htmlFor="p-pt">
            السعر الفصلي (د.أ)
          </label>
          <input className="field num" id="p-pt" name="priceTerm" type="number" min={1} max={1500} defaultValue={t.priceTerm} required />
        </div>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? "لحظة..." : "احفظ"}
      </button>
    </form>
  );
}
