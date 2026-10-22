import { AR } from "@/lib/i18n/ar";
import { EN_DATA } from "@/lib/i18n/data";

// English is the source language: every UI string is written in English in the code,
// and Arabic lives in ar.ts keyed by that English text. A missing Arabic entry falls
// back to English, so a new string never shows up blank.

export type Lang = "en" | "ar";
export const LANG_COOKIE = "hessa_lang";

export function parseLang(v: string | undefined | null): Lang {
  return v === "ar" ? "ar" : "en";
}

export type T = (text: string, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): T {
  return (text, vars) => {
    let out = lang === "ar" ? AR[text] ?? text : text;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    return out;
  };
}

/** Sample data (subjects, grades, cities) is stored in Arabic; this shows its English label. */
export function dataLabel(lang: Lang, value: string): string {
  return lang === "en" ? EN_DATA[value] ?? value : value;
}

const MONTHS_AR = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];

/** "2026-11-12" → "12 Nov 2026" (en) or "12 تشرين الثاني 2026" (ar). */
export function fmtDate(lang: Lang, iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "ar") return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
