import { removeInvite } from "@/app/actions/school";
import { TopBar } from "@/components/dash-shell";
import { fmtDate } from "@/components/ui";
import { SUBJECT_LIST, TEACHER_GRADES } from "@/lib/catalog";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { listSchoolInvites } from "@/lib/platform";
import { mySchool } from "@/lib/school-context";
import { InviteForm } from "./invite-form";

export default async function SchoolTeachers() {
  const t = await getT();
  const lang = await getLang();
  const { s, school } = await mySchool();
  const invites = await listSchoolInvites(school.id);
  const opts = (list: string[]) => list.map((v) => [v, dataLabel(lang, v)] as [string, string]);
  return (
    <>
      <TopBar title={t("Teachers")} sub={t("Add a teacher by their mobile number. When they sign up with it, they join your school.")} who={s.fullName} initial={school.name[0]} color="var(--rail)" />
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Teachers you added")}</h2>
            </div>
            {invites.length === 0 ? (
              <div className="empty">{t("No teachers yet.")}</div>
            ) : (
              <ul className="doc-list">
                {invites.map((x) => (
                  <li key={x.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>{x.name}</b>
                      <div className="muted" style={{ fontSize: 13 }}>
                        <span dir="ltr" className="num">
                          {x.phone}
                        </span>{" "}
                        · {dataLabel(lang, x.subject)} · {dataLabel(lang, x.grade)} · {fmtDate(lang, x.createdAt)}
                      </div>
                    </div>
                    {x.used ? (
                      <span className="pill p-ok">{t("Joined")}</span>
                    ) : (
                      <>
                        <span className="pill p-warn">{t("Hasn't signed up yet")}</span>
                        <form action={removeInvite.bind(null, x.id)}>
                          <button className="link">{t("Remove")}</button>
                        </form>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Add a teacher")}</h2>
            </div>
            <InviteForm subjects={opts(SUBJECT_LIST)} grades={opts(TEACHER_GRADES)} />
          </div>
        </div>
      </div>
    </>
  );
}
