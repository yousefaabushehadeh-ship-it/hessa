"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeProfile, sendOtp, verifyOtp, type LoginState } from "@/app/actions/auth";

const STEPS: LoginState["step"][] = ["phone", "otp", "profile"];

// One action per step; each returns the state for the next step.
async function dispatch(prev: LoginState, fd: FormData): Promise<LoginState> {
  if (prev.step === "phone") return sendOtp(prev, fd);
  if (prev.step === "otp") return fd.get("back") ? { step: "phone", as: prev.as, next: prev.next, phone: prev.phone } : verifyOtp(prev, fd);
  return completeProfile(prev, fd);
}

export function LoginFlow({ as, next, demo, startAtProfile }: { as: "student" | "teacher"; next?: string; demo: boolean; startAtProfile?: boolean }) {
  const [state, action, pending] = useActionState(dispatch, { step: startAtProfile ? "profile" : "phone", as, next } as LoginState);
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
          <h1 style={{ fontSize: 24 }}>{teacher ? "دخول الأساتذة" : "دخول الطلاب"}</h1>
          <p className="muted">بدون إيميل ولا كلمة سر. بنبعتلك كود على رقمك.</p>
          <input type="hidden" name="as" value={state.as} />
          <input type="hidden" name="next" value={state.next ?? ""} />
          <div>
            <label className="h" htmlFor="ph">
              رقم الموبايل
            </label>
            <div className="inrow" dir="ltr">
              <span className="field num" style={{ flex: "0 0 auto", width: "auto" }}>
                +962
              </span>
              <input className="field num" id="ph" name="phone" inputMode="numeric" autoComplete="tel-national" required placeholder="7X XXX XXXX" defaultValue={state.phone} />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" name="agree" required /> بوافق على{" "}
            <Link className="link" href="/terms" target="_blank">
              شروط الاستخدام
            </Link>{" "}
            و
            <Link className="link" href="/privacy" target="_blank">
              سياسة الخصوصية
            </Link>
          </label>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? "لحظة..." : "ابعتلي الكود"}
          </button>
          <Link className="link" style={{ justifySelf: "center" }} href={teacher ? "/login" : "/login?as=teacher"}>
            {teacher ? "إنت طالب؟ ادخل من هون" : "إنت أستاذ؟ ادخل من هون"}
          </Link>
        </form>
      )}

      {state.step === "otp" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>أدخل الكود</h1>
          <p className="muted">
            بعتنا كود من 6 أرقام برسالة للرقم <span dir="ltr">+962 {state.phone}</span>.
          </p>
          <input className="field num" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required dir="ltr" style={{ textAlign: "center", fontSize: 22, letterSpacing: ".3em" }} aria-label="الكود" autoFocus />
          {demo && (
            <div className="hint">
              <span>
                نسخة تجريبية: الكود هو <b className="num">482913</b>
              </span>
            </div>
          )}
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? "لحظة..." : "تأكيد"}
          </button>
          <button className="link" style={{ justifySelf: "center" }} type="submit" name="back" value="1" formNoValidate>
            غيّر الرقم
          </button>
        </form>
      )}

      {state.step === "profile" && (
        <form className="frm" action={action}>
          <h1 style={{ fontSize: 24 }}>شوي عنك</h1>
          <div>
            <label className="h" htmlFor="nm">
              الاسم الكامل
            </label>
            <input className="field" id="nm" name="name" required autoComplete="name" />
          </div>
          <div>
            <label className="h" htmlFor="gr">
              الصف
            </label>
            <select className="field" id="gr" name="grade">
              <option>توجيهي علمي</option>
              <option>توجيهي أدبي</option>
              <option>توجيهي صناعي</option>
              <option>الصف الحادي عشر</option>
              <option>الصف العاشر</option>
              <option>الصف التاسع</option>
            </select>
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="h">عمرك</legend>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label className="opt">
                <input type="radio" name="age" value="minor" defaultChecked />
                <span className="t">
                  <b>أقل من 18</b>
                </span>
              </label>
              <label className="opt">
                <input type="radio" name="age" value="adult" />
                <span className="t">
                  <b>18 أو أكثر</b>
                </span>
              </label>
            </div>
          </fieldset>
          <div>
            <label className="h" htmlFor="pph">
              رقم ولي الأمر (إذا عمرك أقل من 18)
            </label>
            <input className="field num" dir="ltr" id="pph" name="parent" inputMode="numeric" placeholder="7X XXX XXXX" />
            <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              حسب قانون حماية البيانات الشخصية الأردني، الطالب تحت 18 بيحتاج موافقة ولي أمره.
            </p>
          </div>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn btn-pri" type="submit" disabled={pending}>
            {pending ? "لحظة..." : "كمّل"}
          </button>
        </form>
      )}

    </div>
  );
}
