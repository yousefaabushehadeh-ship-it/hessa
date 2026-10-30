import { setReviewHidden } from "@/app/actions/admin";
import { AdminTop } from "@/components/admin-top";
import { Icon } from "@/components/ui";
import { getT } from "@/lib/i18n-server";
import { listAllReviews } from "@/lib/platform";

export default async function AdminReviews() {
  const t = await getT();
  const list = await listAllReviews();
  return (
    <>
      <AdminTop title={t("Reviews")} sub={t("Hide a review that is abusive or not about the teaching. Hidden reviews don't count in the rating.")} />
      <div className="card panel">
        {list.length === 0 ? (
          <div className="empty">{t("No reviews yet.")}</div>
        ) : (
          <ul className="doc-list">
            {list.map((r) => (
              <li key={r.id} style={{ alignItems: "flex-start", opacity: r.hidden ? 0.6 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{r.author}</b>{" "}
                  <span className="muted" style={{ fontSize: 13 }}>
                    → {r.teacherName} · {r.createdAt}
                  </span>
                  <div className="stars" style={{ margin: "4px 0" }}>
                    {Array.from({ length: r.stars }, (_, i) => (
                      <Icon key={i} name="star" sm />
                    ))}
                  </div>
                  <p style={{ fontSize: 14 }}>{r.body}</p>
                </div>
                <form action={setReviewHidden.bind(null, r.id, !r.hidden)}>
                  <button className="btn btn-sm">{r.hidden ? t("Show again") : t("Hide")}</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
