// Phone numbers from any country, stored as E.164 ("+962791234567").
// Jordan is the default and keeps its strict check; other countries get a length check.

export type Country = { code: string; dial: string; flag: string; name: string };

export const COUNTRIES: Country[] = [
  { code: "JO", dial: "962", flag: "🇯🇴", name: "Jordan" },
  { code: "PS", dial: "970", flag: "🇵🇸", name: "Palestine" },
  { code: "SA", dial: "966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "AE", dial: "971", flag: "🇦🇪", name: "UAE" },
  { code: "KW", dial: "965", flag: "🇰🇼", name: "Kuwait" },
  { code: "QA", dial: "974", flag: "🇶🇦", name: "Qatar" },
  { code: "BH", dial: "973", flag: "🇧🇭", name: "Bahrain" },
  { code: "OM", dial: "968", flag: "🇴🇲", name: "Oman" },
  { code: "IQ", dial: "964", flag: "🇮🇶", name: "Iraq" },
  { code: "SY", dial: "963", flag: "🇸🇾", name: "Syria" },
  { code: "LB", dial: "961", flag: "🇱🇧", name: "Lebanon" },
  { code: "EG", dial: "20", flag: "🇪🇬", name: "Egypt" },
  { code: "TR", dial: "90", flag: "🇹🇷", name: "Turkey" },
  { code: "GB", dial: "44", flag: "🇬🇧", name: "UK" },
  { code: "DE", dial: "49", flag: "🇩🇪", name: "Germany" },
  { code: "US", dial: "1", flag: "🇺🇸", name: "USA / Canada" },
];

const DIALS = new Set(COUNTRIES.map((c) => c.dial));

/**
 * Builds "+<dial><number>" from the country picker and the typed number, or null when it isn't valid.
 * The typed number may already carry a code ("+9665...", "009665..."), which wins over the picker.
 */
export function toE164(dialField: unknown, numberField: unknown): string | null {
  const raw = String(numberField ?? "").trim();
  let digits = raw.replace(/\D/g, "");
  let dial = DIALS.has(String(dialField)) ? String(dialField) : "962";
  if (raw.startsWith("+") || digits.startsWith("00")) {
    digits = digits.replace(/^00/, "");
    const found = [...DIALS].sort((a, b) => b.length - a.length).find((d) => digits.startsWith(d));
    if (!found) return null;
    dial = found;
    digits = digits.slice(found.length);
  } else if (digits.startsWith(dial) && digits.length > dial.length + 6) {
    digits = digits.slice(dial.length);
  }
  digits = digits.replace(/^0+/, "");
  if (dial === "962") return /^7[789]\d{7}$/.test(digits) ? `+962${digits}` : null;
  return digits.length >= 6 && digits.length + dial.length <= 15 ? `+${dial}${digits}` : null;
}

/** "+962791234567" → "+962 79 123 4567" style spacing, only for showing it. */
export function prettyPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const dial = [...DIALS].sort((a, b) => b.length - a.length).find((x) => d.startsWith(x)) ?? "";
  return `+${dial} ${d.slice(dial.length)}`;
}

/** Splits a stored number back for the form: { dial: "962", local: "791234567" }. */
export function splitPhone(e164?: string): { dial: string; local: string } {
  if (!e164) return { dial: "962", local: "" };
  const p = prettyPhone(e164).split(" ");
  return { dial: p[0].slice(1) || "962", local: p[1] ?? "" };
}
