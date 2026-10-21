import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <SiteNav />
      <div className="gut">
        <article className="wrap card box" style={{ maxWidth: 820, marginBlock: 32, display: "grid", gap: 14 }}>
          <h1 style={{ fontSize: 28 }}>{title}</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            مسودة أولية، بتنراجع قانونيًا قبل الإطلاق.
          </p>
          {children}
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
