"use client";

import { useTransition } from "react";
import { reviewPayment } from "@/app/actions/payment";
import { useT } from "@/components/lang";

/** Confirm or reject a pending transfer. Rejecting asks for a short reason the student sees. */
export function PaymentReview({ id }: { id: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <div className="row-actions">
      <button className="btn btn-pri btn-sm" disabled={pending} onClick={() => start(() => reviewPayment(id, true))}>
        {t("Confirm")}
      </button>
      <button
        className="btn btn-sm"
        disabled={pending}
        onClick={() => {
          const note = prompt(t("Why isn't it confirmed? The student sees this.")) ?? "";
          const fd = new FormData();
          fd.set("note", note);
          start(() => reviewPayment(id, false, fd));
        }}
      >
        {t("Reject")}
      </button>
    </div>
  );
}
