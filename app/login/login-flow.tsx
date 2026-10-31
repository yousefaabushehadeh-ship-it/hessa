"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeProfile, sendOtp, verifyOtp, type LoginState, type Portal } from "@/app/actions/auth";
import { useT } from "@/components/lang";

const STEPS: LoginState["step"][] = ["phone", "otp", "profile"];

// One action per step; each returns the state for the next step.
async function dispatch(prev: LoginState, fd: FormData): Promise<LoginState> {
  if (prev.step === "phone") return sendOtp(prev, fd);
  if (prev.step === "otp") return fd.get("back") ? { step: "phone", as: prev.as, next: prev.next, phone: prev.phone, signup: prev.signup } : verifyOtp(prev, fd);
  return completeProfile(prev, fd);
}

type Option = [string, string];

type Props = {
  as: Portal;
  next?: string;
  demo: boolean;
  startAtProfile?: boolean;
  signup?: boolean;
  /** Choices for the profile step: [stored value, label]. */
  subjects?: Option[];
  grades?: Option[];
  teacherGrades?: Option[];
};

function Select({ id, name, label, options }: { id: string; name: string; label: string; options: Option[] }) {
  return (
    <div>
      <label className="h" htmlFor={id}>
        {label}
      </label>
      <select className="field" id={id} name={name} required>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LoginFlow({ as, next, demo, startAtProfile, signup, subjects = [], grades = [], teacherGrades = [] }: Props) {
  const t = useT();
  const [state, action, pending] = useActionState(dispatch, { step: startAtProfile ? "profile" : "phone", as, next, signup } as LoginState);
  const idx = STEPS.indexOf(state.step);
  const teacher = state.as === "teacher";
  const portal = state.as ?? "student";
  const names: Record<Portal, [string, string, string, string]> = {
    student: [t("Student portal"), t("Create a student account"), t("Student sign in"), "p-ok"],
    teacher: [t("Teacher portal"), t("Create a teacher account"), t("Teacher sign in"), "p-warn"],
    school: [t("School portal"), t("Create a school account"), t("School sign in"), "p-info"],
    admin: [t("Hessa team"), t("Team sign in"), t("Team sign in"), "p-bad"],
  };
  const [badge, upTitle, inTitle, pill] = names[portal];
  return (
    <div className="card center-card">
      <div className="dots">
        {(portal !== "student" && !signup && !startAtProfile ? STEPS.slice(0, 2) : STEPS).map((s, i) => (
          <i key={s} className={i <= idx ? "on" : ""} />
        ))}
      </div>

      {state.step === "phone" && (
        <form className="frm" action={action}>
          <span className={`pill ${pill}`} style={{ justifySelf: "start" }}>
            {badge}
          </span>
          <h1 style={{ fontSize: 24 }}>{signup ? upTitle : inTitle}</h1>
          <p className="muted">{t("No email and no password. We send a code to your phone.")}</p>
          <input type="hidden" name="as" value={state.as} />
          <input type="hidden" name="next" value={state.next ?? ""} />
          {signup && <input type="hidden" name="signup" value="1" />}
          <div>
            <label className="h" htmlFor="ph">
              {t("Mobile number")}
            </label>
            <div className="inrow" dir="ltr">
              <span className="field num" style={{ flex: "0 0 auto", width: "auto" }}>
                +962
              </span>
              <input className="field num" id="ph" name="phone" inputMode="numeric" autoComplete="tel-national" required placeholder="7X XXX XXXX" defaultValue={state.phone} />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" name="agree" required /> {t("I agree to the")}{" "}
            <Link className="link" href="/terms" target="_blank">
              {t("Terms of use")}
            </Link>{" "}
            {t("and the")}{" "}
            <Link className="link" href="/privacy" target="_blank">
              {t("Privacy policy")}
            </Link>
          </label>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? t("One moment...") : t("Send me a code")}
          </button>
          {portal !== "admin" && (
            <>
              <Link className="link" style={{ justifySelf: "center" }} href={signup ? `/login/${portal}` : `/signup/${portal}`}>
                {signup ? t("Already have an account? Sign in") : t("New here? Create an account")}
              </Link>
              <Link className="link" style={{ justifySelf: "center", fontSize: 13.5 }} href={`/${signup ? "signup" : "login"}/${portal === "student" ? "teacher" : "student"}`}>
                {portal === "student" ? t("Are you a teacher? Go to the teacher portal") : t("Are you a student? Go to the student portal")}
              </Link>
            </>
          )}
        </form>
      )}

      {state.step === "otp" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{t("Enter your code")}</h1>
          <p className="muted">
            {t("We sent a 6-digit code by SMS to")} <span dir="ltr">+962 {state.phone}</span>.
          </p>
          <input
            className="field num"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            dir="ltr"
            style={{ textAlign: "center", fontSize: 22, letterSpacing: ".3em" }}
            aria-label={t("Code")}
            autoFocus
          />
          {demo && (
            <div className="hint">
              <span>
                {t("Your code is")} <b className="num">482913</b>
              </span>
            </div>
          )}
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? t("One moment...") : t("Confirm")}
          </button>
          <button className="link" style={{ justifySelf: "center" }} type="submit" name="back" value="1" formNoValidate>
            {t("Change number")}
          </button>
        </form>
      )}

      {state.step === "profile" && teacher && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{t("About your teaching")}</h1>
          <div>
            <label className="h" htmlFor="tnm">
              {t("Full name")}
            </label>
            <input className="field" id="tnm" name="name" required autoComplete="name" />
          </div>
          <Select id="sub" name="subject" label={t("Subject you teach")} options={subjects} />
          <Select id="tgr" name="grade" label={t("Grade you teach")} options={teacherGrades} />
          <p className="muted" style={{ fontSize: 13 }}>
            {t("We check every teacher's identity and qualifications before their page goes public. If your school added you, your page opens right away.")}
          </p>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? t("One moment...") : t("Continue")}
          </button>
        </form>
      )}

      {state.step === "profile" && portal === "school" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{t("About your school")}</h1>
          <div>
            <label className="h" htmlFor="snm">
              {t("Your full name")}
            </label>
            <input className="field" id="snm" name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="h" htmlFor="sch">
              {t("School or center name")}
            </label>
            <input className="field" id="sch" name="school" required />
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            {t("We call the school to verify it. Once verified, the teachers you add go public right away.")}
          </p>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? t("One moment...") : t("Continue")}
          </button>
        </form>
      )}

      {state.step === "profile" && portal === "student" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{t("A bit about you")}</h1>
          <div>
            <label className="h" htmlFor="nm">
              {t("Full name")}
            </label>
            <input className="field" id="nm" name="name" required autoComplete="name" />
          </div>
          <Select id="gr" name="grade" label={t("Your grade")} options={grades} />
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="h">{t("Your age")}</legend>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label className="opt">
                <input type="radio" name="age" value="minor" defaultChecked />
                <span className="t">
                  <b>{t("Under 18")}</b>
                </span>
              </label>
              <label className="opt">
                <input type="radio" name="age" value="adult" />
                <span className="t">
                  <b>{t("18 or older")}</b>
                </span>
              </label>
            </div>
          </fieldset>
          <div>
            <label className="h" htmlFor="pph">
              {t("Parent's mobile number (if you are under 18)")}
            </label>
            <input className="field num" dir="ltr" id="pph" name="parent" inputMode="numeric" placeholder="7X XXX XXXX" />
            <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              {t("Under Jordan's personal data protection law, students under 18 need a parent's approval.")}
            </p>
          </div>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? t("One moment...") : t("Continue")}
          </button>
        </form>
      )}
    </div>
  );
}
