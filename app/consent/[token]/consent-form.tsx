"use client";

import { useActionState } from "react";
import { approveConsent } from "@/app/actions/auth";
import { useT } from "@/components/lang";

export function ConsentForm({ token }: { token: string }) {
  const t = useT();
  const [result, action, pending] = useActionState(async () => ((await approveConsent(token)) ? "ok" : "bad"), null as null | "ok" | "bad");
  if (result === "ok") return <p className="form-ok">{t("Thank you. Approval recorded and your child's account is now active.")}</p>;
  return (
    <form action={action} className="frm">
      {result === "bad" && <p className="form-error">{t("This link is not valid or has already been used.")}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("One moment...") : t("I approve")}
      </button>
    </form>
  );
}
