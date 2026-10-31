import { TopBar } from "@/components/dash-shell";
import { Icon } from "@/components/ui";
import { getT } from "@/lib/i18n-server";
import type { Session } from "@/lib/types";
import { getMyDocs, getMyPhoto } from "@/lib/verification";
import { DocList, DocUploadForm, PhotoForm } from "./forms";

/** Photo and documents. New teachers see this in place of the dashboard until their page is verified. */
export async function VerificationPanel({ s, color = "var(--rail)" }: { s: Session; color?: string }) {
  const t = await getT();
  const [photo, docs] = await Promise.all([getMyPhoto(s), getMyDocs(s)]);
  const kinds: [string, string][] = [
    ["id", t("ID card or passport")],
    ["degree", t("University degree")],
    ["certificate", t("Teaching license or certificate")],
    ["experience", t("Experience letter from a school or center")],
    ["other", t("Other")],
  ];
  const kindLabels = Object.fromEntries(kinds);
  const pendingPage = !s.teacherId;
  const has = (k: string) => docs.some((d) => d.kind === k && d.status !== "rejected");
  const first = s.fullName.split(" ")[0] || t("Teacher");

  return (
    <>
      <TopBar
        title={pendingPage ? t("Welcome, {name}", { name: first }) : t("Verification")}
        sub={pendingPage ? t("Three steps and your page is ready for students.") : t("Your photo and the documents we verified you with.")}
        who={s.fullName}
        initial={first[0] ?? "T"}
        color={color}
        photoUrl={photo}
      />
      {pendingPage && (
        <div className="card panel" style={{ marginBottom: 18 }}>
          <div className="ph2">
            <h2>{t("Your page is under review")}</h2>
            <span className="pill p-warn">{t("Under review")}</span>
          </div>
          <ol className="steps-list">
            <li className={photo ? "done" : ""}>
              <Icon name={photo ? "check" : "camera"} sm /> {t("Add a clear photo of yourself")}
            </li>
            <li className={has("id") ? "done" : ""}>
              <Icon name={has("id") ? "check" : "shield"} sm /> {t("Upload your ID card or passport")}
            </li>
            <li className={has("degree") || has("certificate") ? "done" : ""}>
              <Icon name={has("degree") || has("certificate") ? "check" : "award"} sm /> {t("Upload your degree or teaching license")}
            </li>
          </ol>
          <p className="muted" style={{ fontSize: 13.5 }}>
            {t("We review documents within 2 working days and call you on your number. Once approved, your public page opens and you can upload lessons and create access codes.")}
          </p>
        </div>
      )}
      <div className="g2">
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Profile photo")}</h2>
            </div>
            <PhotoForm photoUrl={photo} initial={first[0] ?? "T"} color={color} />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Add a document")}</h2>
            </div>
            <DocUploadForm kinds={kinds} />
          </div>
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Your documents")}</h2>
            </div>
            <DocList docs={docs} kindLabels={kindLabels} />
            <div className="hint" style={{ marginTop: 14 }}>
              <Icon name="lock" sm />
              <span>{t("Your documents are private. Only the Hessa review team can see them, and students never do.")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
