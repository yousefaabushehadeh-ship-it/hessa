"use client";

import { useActionState } from "react";
import { approveConsent } from "@/app/actions/auth";

export function ConsentForm({ token }: { token: string }) {
  const [result, action, pending] = useActionState(async () => ((await approveConsent(token)) ? "ok" : "bad"), null as null | "ok" | "bad");
  if (result === "ok") return <p className="form-ok">شكرًا، تمت الموافقة وحساب الطالب صار فعّال.</p>;
  return (
    <form action={action} className="frm">
      {result === "bad" && <p className="form-error">الرابط مش صالح أو انستخدم قبل.</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? "لحظة..." : "بوافق"}
      </button>
    </form>
  );
}
