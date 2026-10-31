import { setSchoolVerified } from "@/app/actions/admin";
import { AdminTop } from "@/components/admin-top";
import { fmtDate } from "@/components/ui";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listAllSchools } from "@/lib/platform";

export default async function AdminSchools() {
  const t = await getT();
  const lang = await getLang();
  const schools = await listAllSchools();
  return (
    <>
      <AdminTop title={t("Schools")} sub={t("Call the school to check it, then verify it. Its teachers go public with it.")} />
      <div className="card panel">
        {schools.length === 0 ? (
          <div className="empty">{t("No schools yet.")}</div>
        ) : (
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("School")}</th>
                  <th className="hide-s">{t("Contact")}</th>
                  <th>{t("Teachers")}</th>
                  <th className="hide-s">{t("Joined")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <b>{x.name}</b>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {dataLabel(lang, x.city)}
                      </div>
                    </td>
                    <td className="muted hide-s">{x.ownerName}</td>
                    <td className="num">{x.teachers}</td>
                    <td className="muted hide-s">{x.createdAt ? fmtDate(lang, x.createdAt) : ""}</td>
                    <td>
                      <form action={setSchoolVerified.bind(null, x.id, !x.verified)} className="row-actions">
                        {x.verified ? <span className="pill p-ok">{t("Verified")}</span> : <span className="pill p-warn">{t("Under review")}</span>}
                        <button className={x.verified ? "link" : "btn btn-pri btn-sm"}>{x.verified ? t("Remove verification") : t("Verify")}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
