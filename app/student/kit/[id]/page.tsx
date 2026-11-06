import Link from "next/link";
import { notFound } from "next/navigation";
import { KitIcon, kindLabel } from "@/components/kit";
import { Icon } from "@/components/ui";
import { getTeacherById } from "@/lib/data";
import { getLang, getT } from "@/lib/i18n-server";
import { openResource, resourceTeacher, videoEmbed } from "@/lib/resources";
import { requireRole } from "@/lib/session";

export default async function KitItem({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const { id } = await params;
  const s = await requireRole("student");
  const opened = await openResource(id, s);

  if (!opened) {
    const tid = await resourceTeacher(id);
    const teacher = tid ? await getTeacherById(tid) : null;
    if (!teacher) notFound();
    return (
      <div className="card center-card">
        <h1 style={{ fontSize: 22 }}>{t("This is for subscribers")}</h1>
        <p className="muted">{t("Subscribe with {name} to open their whole study kit.", { name: teacher.name })}</p>
        <Link className="btn btn-pri" href={`/student/subscribe/${teacher.slug}`}>
          {t("Subscribe now")}
        </Link>
        <Link className="btn btn-ghost" href={`/${teacher.slug}`}>
          {t("Teacher page")}
        </Link>
      </div>
    );
  }

  const { resource: r, teacherId } = opened;
  const teacher = await getTeacherById(teacherId);
  const fileUrl = r.hasFile ? `/api/resource/${r.id}` : null;
  const embed = r.kind === "video" && r.url ? videoEmbed(r.url) : null;
  const mark = `${s.fullName} · ${s.userId.slice(0, 8)}`;

  return (
    <>
      <div className="top">
        <div className="hi">
          <Link className="link" href="/student/materials">
            <Icon name="arrow" sm /> {t("Back to study materials")}
          </Link>
          <h1 style={{ marginTop: 8 }}>{r.title}</h1>
          <p>
            {teacher && `${t("Teacher")} ${teacher.name} · `}
            {t("Study kit")} · {kindLabel(lang, r.kind)}
          </p>
        </div>
        <KitIcon kind={r.kind} />
      </div>
      <div className="card panel">
        {r.note && <p style={{ marginBottom: 14 }}>{r.note}</p>}
        {embed ? (
          <div className="reader video">
            <iframe src={embed} title={r.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : fileUrl ? (
          <div className="reader">
            <iframe src={fileUrl} title={r.title} />
            <div className="wm" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>{mark}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty" style={{ minHeight: 200, display: "grid", placeItems: "center" }}>
            {t("This opens on another site.")}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          {fileUrl && (
            <a className="btn btn-pri btn-sm" href={`${fileUrl}?dl=1`}>
              <Icon name="download" sm /> {t("Download")}
            </a>
          )}
          {r.url && (
            <a className="btn btn-ghost btn-sm" href={r.url} target="_blank" rel="noopener noreferrer">
              <Icon name="share" sm /> {embed ? t("Open on YouTube or Vimeo") : t("Open the link")}
            </a>
          )}
          {fileUrl && (
            <span className="muted" style={{ fontSize: 13 }}>
              {t("This material carries your number and account id. Sharing it outside the platform is not allowed.")}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
