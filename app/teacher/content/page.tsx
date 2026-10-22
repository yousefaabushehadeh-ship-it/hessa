import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { LessonIcon, typeLabel } from "@/components/ui";
import { BUNNY_ENABLED } from "@/lib/bunny";
import { DEMO_MODE } from "@/lib/env";
import { getLang, getT } from "@/lib/i18n-server";
import { myTeacher } from "@/lib/teacher-context";
import { AddLessonForm, AddUnitForm } from "./forms";
import { VideoUploadForm } from "./video-upload";

export default async function Content() {
  const t = await getT();
  const lang = await getLang();
  const x = await myTeacher();
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("Content")}
        sub={t("Organize your lessons into units, and pick which ones are free to try.")}
        who={`${t("Teacher")} ${first}`}
        initial={x.initial}
        color={x.color}
      />
      <div className="g2">
        <div className="col">
          {x.units.length === 0 && <div className="card empty">{t("Start by adding your first unit, then upload its materials.")}</div>}
          {x.units.map((u) => (
            <div className="card panel" key={u.id}>
              <div className="ph2">
                <h2>{u.title}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {t("{n} items", { n: u.lessons.length })}
                </span>
              </div>
              <div className="scroll">
                <table className="tbl">
                  <tbody>
                    {u.lessons.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <span className="ttl">
                            <LessonIcon type={l.type} />
                            {l.title}
                          </span>
                        </td>
                        <td className="muted hide-s">
                          {typeLabel(lang, l.type)} · {l.meta}
                        </td>
                        <td>{l.isFree ? <span className="pill p-ok">{t("Free")}</span> : <span className="pill p-info">{t("Subscribers")}</span>}</td>
                        <td>
                          {l.type === "quiz" && (
                            <Link className="link" href={`/teacher/content/quiz/${l.id}`}>
                              {t("Questions")}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="col">
          <div className="card panel">
            <div className="ph2">
              <h2>{t("Upload a video")}</h2>
            </div>
            <VideoUploadForm units={x.units.map((u) => ({ id: u.id, title: u.title }))} enabled={!DEMO_MODE && BUNNY_ENABLED} />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>{t("A file, quiz or live class")}</h2>
            </div>
            <AddLessonForm units={x.units.map((u) => ({ id: u.id, title: u.title }))} />
          </div>
          <div className="card panel">
            <div className="ph2">
              <h2>{t("New unit")}</h2>
            </div>
            <AddUnitForm />
          </div>
        </div>
      </div>
    </>
  );
}
