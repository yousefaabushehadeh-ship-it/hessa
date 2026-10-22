"use client";

import { createContext, useContext, type ReactNode } from "react";
import { makeT, type Lang, type T } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Translator for client components. */
export function useT(): T {
  return makeT(useContext(LangContext));
}

export function useLang(): Lang {
  return useContext(LangContext);
}
