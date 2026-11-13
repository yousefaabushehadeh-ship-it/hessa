"use client";

import { useT } from "@/components/lang";
import { COUNTRIES, splitPhone } from "@/lib/phone";

/** Country code picker plus the number. Posts "dial" and "phone". */
export function PhoneField({ id, value, autoComplete }: { id: string; value?: string; autoComplete?: string }) {
  const t = useT();
  const v = splitPhone(value);
  return (
    <div className="inrow" dir="ltr">
      <select className="field num" name="dial" defaultValue={v.dial} aria-label={t("Country code")} style={{ flex: "0 0 auto", width: "auto" }}>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.flag} +{c.dial}
          </option>
        ))}
      </select>
      <input className="field num" id={id} name="phone" inputMode="tel" autoComplete={autoComplete ?? "tel-national"} required placeholder={v.dial === "962" ? "7X XXX XXXX" : ""} defaultValue={v.local} />
    </div>
  );
}
