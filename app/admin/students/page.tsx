import { AdminTop } from "@/components/admin-top";
import { fmtDate } from "@/components/ui";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listAllStudents } from "@/lib/platform";

export default async function AdminStudents({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const all = await listAllStudents();
  const list = q ? all.filter((x) => x.name.includes(q) || x.phone.includes(q.replace(/\D/g, "") || "~")) : all;
  const consent = { not_needed: ["p-ok", t("18+")], approved: ["p-ok", t("Parent approved")], pending: ["p-warn", t("Waiting for parent")], revoked: ["p-bad", t("Approval withdrawn")] } as Record<string, [string, string]>;
  return (
    <>
      <AdminTop title={t("Students")} sub={t("{n} students. Phone numbers are only for support; don't share them.", { n: all.length })} />
      <form className="card panel" method="get" style={{ display: "flex", gap: 10 }}>
        <input className="field" name="q" defaultValue={q} placeholder={t("Search by name or number")} aria-label={t("Search")} />
        <button className="btn btn-pri">{t("Search")}</button>
      </form>
      <div className="card panel">
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("Student")}</th>
                <th className="hide-s">{t("Grade")}</th>
                <th>{t("Subscriptions")}</th>
                <th>{t("Consent")}</th>
                <th className="hide-s">{t("Joined")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                    <div className="muted num" dir="ltr" style={{ fontSize: 12.5, textAlign: "start" }}>
                      {x.phone}
                    </div>
                  </td>
                  <td className="muted hide-s">{dataLabel(lang, x.grade)}</td>
                  <td className="num">{x.subs}</td>
                  <td>
                    <span className={`pill ${(consent[x.consent] ?? consent.pending)[0]}`}>{(consent[x.consent] ?? consent.pending)[1]}</span>
                  </td>
                  <td className="muted hide-s">{x.createdAt ? fmtDate(lang, x.createdAt) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
