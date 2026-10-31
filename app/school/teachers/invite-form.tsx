"use client";

import { useActionState, useRef } from "react";
import { addTeacherInvite, type InviteState } from "@/app/actions/school";
import { useT } from "@/components/lang";

type Option = [string, string];

export function InviteForm({ subjects, grades }: { subjects: Option[]; grades: Option[] }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: InviteState, fd: FormData) => {
    const r = await addTeacherInvite(prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  return (
    <form className="frm" action={action} ref={ref}>
      <div>
        <label className="h" htmlFor="i-name">
          {t("Teacher's full name")}
        </label>
        <input className="field" id="i-name" name="name" required />
      </div>
      <div>
        <label className="h" htmlFor="i-phone">
          {t("Mobile number")}
        </label>
        <div className="inrow" dir="ltr">
          <span className="field num" style={{ flex: "0 0 auto", width: "auto" }}>
            +962
          </span>
          <input className="field num" id="i-phone" name="phone" inputMode="numeric" required placeholder="7X XXX XXXX" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="i-sub">
            {t("Subject")}
          </label>
          <select className="field" id="i-sub" name="subject">
            {subjects.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="h" htmlFor="i-gr">
            {t("Grade")}
          </label>
          <select className="field" id="i-gr" name="grade">
            {grades.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("Add teacher")}
      </button>
    </form>
  );
}
