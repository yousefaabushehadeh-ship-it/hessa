import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/site";
import { getT } from "@/lib/i18n-server";

export async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const t = await getT();
  return (
    <>
      <SiteNav />
      <div className="gut">
        <article className="wrap card box" style={{ maxWidth: 820, marginBlock: 32, display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 28 }}>{title}</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            {t("Draft. It will be reviewed by a lawyer before launch.")}
          </p>
          {children}
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
