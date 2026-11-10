import Link from "next/link";
import { markNoticesRead } from "@/app/actions/notifications";
import { DashShell, TopBar } from "@/components/dash-shell";
import { SignOut } from "@/components/sign-out";
import { getLang, getT } from "@/lib/i18n-server";
import { fmtDate } from "@/lib/i18n";
import { navFor } from "@/lib/nav";
import { getNotices, noticeText, unreadCount } from "@/lib/notifications";
import { requireSession } from "@/lib/session";

export default async function Notifications() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireSession();
  const [list, unread] = await Promise.all([getNotices(s), unreadCount(s)]);
  const first = s.fullName.split(" ")[0] || "";
  return (
    <DashShell nav={navFor(s, t, unread)} footer={<SignOut />}>
      <TopBar title={t("Notifications")} sub={t("New payments, hand-ins and marks show up here.")} who={first} initial={first[0] ?? "H"} color="var(--orange)" />
      <div className="card panel" style={{ maxWidth: 720 }}>
        <div className="ph2">
          <h2>{t("Latest")}</h2>
          {unread > 0 && (
            <form action={markNoticesRead}>
              <button className="btn btn-ghost btn-sm">{t("Mark all as read")}</button>
            </form>
          )}
        </div>
        {list.length === 0 ? (
          <p className="muted">{t("Nothing new yet.")}</p>
        ) : (
          <div className="settings-list">
            {list.map((n) => (
              <Link key={n.id} href={n.link || "#"} className="radio-row" style={{ textDecoration: "none", color: "inherit" }}>
                <span>
                  {!n.read && <span className="pill p-warn" style={{ marginInlineEnd: 8 }}>{t("New")}</span>}
                  {noticeText(n, t)}
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>
                    {fmtDate(lang, n.createdAt.slice(0, 10))}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashShell>
  );
}
