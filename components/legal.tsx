import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/site";
import { fmtDate } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { LEGAL_UPDATED, type LegalSection } from "@/lib/legal";

export async function LegalPage({ title, sections, children }: { title: string; sections: LegalSection[]; children?: ReactNode }) {
  const t = await getT();
  const lang = await getLang();
  return (
    <>
      <SiteNav />
      <div className="gut">
        <article className="wrap card box legal" style={{ maxWidth: 820, marginBlock: 32, display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 28 }}>{title}</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            {t("Last updated: {date}", { date: fmtDate(lang, LEGAL_UPDATED) })}
          </p>
          <nav className="legal-toc" aria-label={t("Contents")}>
            {sections.map((s, i) => (
              <a key={s.h} href={`#s${i + 1}`}>
                {i + 1}. {t(s.h)}
              </a>
            ))}
          </nav>
          {sections.map((s, i) => (
            <section key={s.h} id={`s${i + 1}`} style={{ display: "grid", gap: 8 }}>
              <h2>
                {i + 1}. {t(s.h)}
              </h2>
              {s.p.map((p) => (
                <p key={p}>{t(p)}</p>
              ))}
            </section>
          ))}
          {children}
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
