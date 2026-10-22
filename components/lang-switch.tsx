import { setLang } from "@/app/actions/lang";
import { getT, getLang } from "@/lib/i18n-server";

/** Works without JavaScript: a plain form that posts to a server action. */
export async function LangSwitch() {
  const lang = await getLang();
  const t = await getT();
  const next = lang === "en" ? "ar" : "en";
  return (
    <form action={setLang} className="lang-switch">
      <input type="hidden" name="lang" value={next} />
      <button type="submit" aria-label={t("Switch language")}>
        {next === "ar" ? "عربي" : "English"}
      </button>
    </form>
  );
}
