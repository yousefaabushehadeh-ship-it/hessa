import Link from "next/link";
import { SiteNav } from "@/components/site";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const t = await getT();
  return (
    <>
      <SiteNav />
      <div className="gut">
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>{t("Page not found")}</h1>
          <p className="muted">{t("The link may be wrong or the page was removed.")}</p>
          <Link className="btn btn-pri" href="/teachers">
            {t("Browse teachers")}
          </Link>
        </div>
      </div>
    </>
  );
}
