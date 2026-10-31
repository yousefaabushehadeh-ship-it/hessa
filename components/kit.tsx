import Link from "next/link";
import { Icon } from "@/components/ui";
import { makeT, type Lang } from "@/lib/i18n";
import type { Resource, ResourceKind } from "@/lib/types";

const ICON: Record<ResourceKind, string> = { book: "book", video: "video", summary: "pdf", link: "link" };

export function kindLabel(lang: Lang, kind: ResourceKind): string {
  const t = makeT(lang);
  const labels: Record<ResourceKind, string> = { book: t("Book"), video: t("Explainer video"), summary: t("Summary"), link: t("Useful link") };
  return labels[kind];
}

export function KitIcon({ kind }: { kind: ResourceKind }) {
  return (
    <span className={`ltype lt-${kind}`}>
      <Icon name={ICON[kind]} sm />
    </span>
  );
}

/**
 * A teacher's study kit as a list. `open` means the viewer can open paid items
 * (subscribed, or the teacher themself); `signedIn` decides where free items lead.
 */
export function KitList({ items, lang, open, signedIn }: { items: Resource[]; lang: Lang; open: boolean; signedIn: boolean }) {
  const t = makeT(lang);
  return (
    <>
      {items.map((r) => {
        const canOpen = open || r.isFree;
        const body = (
          <>
            <KitIcon kind={r.kind} />
            <span className="t">
              <b>{r.title}</b>
              <span>
                {kindLabel(lang, r.kind)}
                {r.note && ` · ${r.note}`}
              </span>
            </span>
            {r.isFree && !open ? (
              <span className="pill p-ok">{t("Free")}</span>
            ) : canOpen ? (
              r.kind === "link" && <Icon name="share" sm />
            ) : (
              <span className="muted">
                <Icon name="lock" sm />
              </span>
            )}
          </>
        );
        if (!canOpen)
          return (
            <div key={r.id} className="lesson" aria-disabled="true">
              {body}
            </div>
          );
        if (!signedIn)
          return (
            <Link key={r.id} className="lesson" href={`/login/student?next=/student/kit/${r.id}`}>
              {body}
            </Link>
          );
        // Plain links open the site itself; everything else opens inside Hessa.
        if (r.kind === "link" && r.url)
          return (
            <a key={r.id} className="lesson" href={r.url} target="_blank" rel="noopener noreferrer">
              {body}
            </a>
          );
        return (
          <Link key={r.id} className="lesson" href={`/student/kit/${r.id}`}>
            {body}
          </Link>
        );
      })}
    </>
  );
}
