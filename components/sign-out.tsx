"use client";

import { signOut } from "@/app/actions/auth";
import { useT } from "@/components/lang";

export function SignOut() {
  const t = useT();
  return (
    <form action={signOut} className="out">
      <button type="submit">{t("Sign out")}</button>
    </form>
  );
}
