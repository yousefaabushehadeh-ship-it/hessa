"use client";

import { useTransition } from "react";
import { useT } from "@/components/lang";

/** Asks for a short reason, then runs the bound server action with it as `note`. */
export function RejectButton({ action }: { action: (fd: FormData) => Promise<void> }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-sm"
      type="button"
      disabled={pending}
      onClick={() => {
        const note = prompt(t("Why? The teacher sees this and can upload again."));
        if (note === null) return;
        const fd = new FormData();
        fd.set("note", note);
        start(() => action(fd));
      }}
    >
      {t("Reject")}
    </button>
  );
}
