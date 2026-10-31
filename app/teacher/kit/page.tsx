import { TopBar } from "@/components/dash-shell";
import { KitIcon, kindLabel } from "@/components/kit";
import { getLang, getT } from "@/lib/i18n-server";
import { listResources } from "@/lib/resources";
import { requireRole } from "@/lib/session";
import { myTeacher } from "@/lib/teacher-context";
import { AddKitForm, DeleteKitItem } from "./kit-form";

export default async function TeacherKit() {
  const t = await getT();
  const lang = await getLang();
  const s = await requireRole("teacher");
  const x = await myTeacher();
  const items = await listResources(x.id, s);
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("Study kit")}
        sub={t("Books, explainer videos, summaries and links for your subject. Your students find them next to your lessons.")}
        who={`${t("Teacher")} ${first}`}
        initial={x.initial}
        color={x.color}
        photoUrl={x.photoUrl}
      />
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("In your kit")}</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                {t("{n} items", { n: items.length })}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="empty">{t("Your kit is empty. Start with the subject book or a one-page summary.")}</div>
            ) : (
              <div className="scroll">
                <table className="tbl">
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="ttl">
                            <KitIcon kind={r.kind} />
                            {r.title}
                          </span>
                        </td>
                        <td className="muted hide-s">{kindLabel(lang, r.kind)}</td>
                        <td>{r.isFree ? <span className="pill p-ok">{t("Free")}</span> : <span className="pill p-info">{t("Subscribers")}</span>}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <a className="link" href={r.hasFile ? `/api/resource/${r.id}` : r.url ?? "#"} target="_blank" rel="noopener noreferrer">
                            {t("Open")}
                          </a>{" "}
                          · <DeleteKitItem id={r.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Add to your kit")}</h2>
            </div>
            <AddKitForm />
          </div>
        </div>
      </div>
    </>
  );
}
