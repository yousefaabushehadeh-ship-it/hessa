import Link from "next/link";
import { approveApplicant, reviewDoc, setTeacherVerified } from "@/app/actions/admin";
import { AdminTop } from "@/components/admin-top";
import { RejectButton } from "@/components/reject-button";
import { Stars } from "@/components/ui";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listAllTeachers, listApplicants } from "@/lib/platform";

export default async function AdminTeachers() {
  const t = await getT();
  const lang = await getLang();
  const [apps, teachers] = await Promise.all([listApplicants(), listAllTeachers()]);
  const kinds: Record<string, string> = {
    id: t("ID card or passport"),
    degree: t("University degree"),
    certificate: t("Teaching license or certificate"),
    experience: t("Experience letter from a school or center"),
    other: t("Other"),
  };
  const pill = { pending: ["p-warn", t("Under review")], approved: ["p-ok", t("Approved")], rejected: ["p-bad", t("Rejected")] } as const;
  return (
    <>
      <AdminTop title={t("Teachers")} sub={t("Check the documents of new teachers, then publish their page.")} />
      <div className="card panel">
        <div className="ph2">
          <h2>{t("Waiting for verification")}</h2>
          <span className="pill p-warn num">{apps.length}</span>
        </div>
        {apps.length === 0 ? (
          <div className="empty">{t("No teachers waiting.")}</div>
        ) : (
          <ul className="doc-list">
            {apps.map((a) => (
              <li key={a.userId} style={{ alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <b>{a.name}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {dataLabel(lang, a.subject)} · {dataLabel(lang, a.grade)}
                  </div>
                  <div className="muted num" dir="ltr" style={{ fontSize: 13, textAlign: "start" }}>
                    {a.phone} · {a.createdAt}
                  </div>
                  {!a.photoUrl && <div className="muted" style={{ fontSize: 12.5 }}>{t("No photo yet")}</div>}
                </div>
                <div style={{ flex: "2 1 320px", display: "grid", gap: 8 }}>
                  {a.docs.length === 0 && <span className="muted">{t("No documents yet.")}</span>}
                  {a.docs.map((d) => (
                    <div key={d.id} className="row-actions" style={{ justifyContent: "space-between" }}>
                      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        <b>{kinds[d.kind] ?? d.kind}</b>{" "}
                        {d.url ? (
                          <a className="link" href={d.url} target="_blank" rel="noopener" dir="auto">
                            {d.fileName}
                          </a>
                        ) : (
                          <span className="muted" dir="auto">
                            {d.fileName}
                          </span>
                        )}
                      </span>
                      {d.status === "pending" ? (
                        <span className="row-actions">
                          <form action={reviewDoc.bind(null, a.userId, d.id, true, undefined)}>
                            <button className="btn btn-sm">{t("Approve")}</button>
                          </form>
                          <RejectButton action={reviewDoc.bind(null, a.userId, d.id, false)} />
                        </span>
                      ) : (
                        <span className={`pill ${pill[d.status][0]}`}>{pill[d.status][1]}</span>
                      )}
                    </div>
                  ))}
                  <form action={approveApplicant.bind(null, a.userId)}>
                    <button className="btn btn-pri btn-sm" disabled={!a.docs.some((d) => d.kind === "id" && d.status !== "rejected")}>
                      {t("Verify and publish the page")}
                    </button>
                  </form>
                  {!a.docs.some((d) => d.kind === "id" && d.status !== "rejected") && (
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      {t("Needs an ID document first.")}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card panel">
        <div className="ph2">
          <h2>{t("All teacher pages")}</h2>
          <span className="muted num">{teachers.length}</span>
        </div>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("Teacher")}</th>
                <th className="hide-s">{t("Subject")}</th>
                <th className="hide-s">{t("School")}</th>
                <th className="hide-s">{t("Rating")}</th>
                <th>{t("Status")}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((x) => (
                <tr key={x.id}>
                  <td>
                    <Link className="link" href={`/${x.slug}`}>
                      {x.name}
                    </Link>
                  </td>
                  <td className="muted hide-s">
                    {dataLabel(lang, x.subject)} · {dataLabel(lang, x.grade)}
                  </td>
                  <td className="muted hide-s">{x.schoolName ?? "—"}</td>
                  <td className="hide-s">{x.rating ? <Stars value={x.rating} /> : "—"}</td>
                  <td>
                    <form action={setTeacherVerified.bind(null, x.id, !x.verified)} className="row-actions">
                      {x.verified ? <span className="pill p-ok">{t("Public")}</span> : <span className="pill p-warn">{t("Hidden")}</span>}
                      <button className="link">{x.verified ? t("Hide") : t("Publish")}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
