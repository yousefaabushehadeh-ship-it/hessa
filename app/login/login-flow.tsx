"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeProfile, sendOtp, verifyOtp, type LoginState } from "@/app/actions/auth";
import { useT } from "@/components/lang";

const STEPS: LoginState["step"][] = ["phone", "otp", "profile"];

// One action per step; each returns the state for the next step.
async function dispatch(prev: LoginState, fd: FormData): Promise<LoginState> {
  if (prev.step === "phone") return sendOtp(prev, fd);
  if (prev.step === "otp") return fd.get("back") ? { step: "phone", as: prev.as, next: prev.next, phone: prev.phone } : verifyOtp(prev, fd);
  return completeProfile(prev, fd);
}

export function LoginFlow({ as, next, demo, startAtProfile, signup }: { as: "student" | "teacher"; next?: string; demo: boolean; startAtProfile?: boolean; signup?: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState(dispatch, { step: startAtProfile ? "profile" : "phone", as, next, signup } as LoginState);
  const idx = STEPS.indexOf(state.step);
  const teacher = state.as === "teacher";
  return (
    <div className="card center-card">
      <div className="dots">
        {(teacher ? STEPS.slice(0, 2) : STEPS).map((s, i) => (
          <i key={s} className={i <= idx ? "on" : ""} />
        ))}
      </div>

      {state.step === "phone" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{signup ? t("Create your account") : teacher ? t("Teacher sign in") : t("Student sign in")}</h1>
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
          {signup ? (
            <Link className="link" style={{ justifySelf: "center" }} href="/login">
              {t("Already have an account? Sign in")}
            </Link>
          ) : (
            <Link className="link" style={{ justifySelf: "center" }} href="/signup">
              {t("New here? Create an account")}
            </Link>
          )}
          {!demo && !signup && (
            <Link className="link" style={{ justifySelf: "center" }} href={teacher ? "/login" : "/login?as=teacher"}>
              {teacher ? t("I'm a student. Sign in here") : t("I'm a teacher. Sign in here")}
            </Link>
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
                {t("Demo version: the code is")} <b className="num">482913</b>
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

      {state.step === "profile" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>{t("A bit about you")}</h1>
          <div>
            <label className="h" htmlFor="nm">
              {t("Full name")}
            </label>
            <input className="field" id="nm" name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="h" htmlFor="gr">
              {t("Grade")}
            </label>
            <select className="field" id="gr" name="grade">
              <option value="توجيهي علمي">{t("Tawjihi (Science)")}</option>
              <option value="توجيهي أدبي">{t("Tawjihi (Literary)")}</option>
              <option value="توجيهي صناعي">{t("Tawjihi (Industrial)")}</option>
              <option value="الصف الحادي عشر">{t("Grade 11")}</option>
              <option value="الصف العاشر">{t("Grade 10")}</option>
              <option value="الصف التاسع">{t("Grade 9")}</option>
            </select>
          </div>
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
