import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, parseLang, type Lang, type T } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** Translator for server components and server actions. */
export async function getT(): Promise<T> {
  return makeT(await getLang());
}
