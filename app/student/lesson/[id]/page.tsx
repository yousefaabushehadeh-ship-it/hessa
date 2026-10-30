import Link from "next/link";
import { notFound } from "next/navigation";
import { markDone } from "@/app/actions/student";
import { HandIn } from "@/components/hand-in";
import { QuizRunner } from "@/components/quiz-runner";
import { Icon, LessonIcon, typeLabel } from "@/components/ui";
import { BUNNY_ENABLED, embedUrl } from "@/lib/bunny";
import { DEMO_MODE } from "@/lib/env";
import { findLesson, getCompletedLessons, getMySubscriptions } from "@/lib/data";
import { getLang, getT } from "@/lib/i18n-server";
import { listMySubmissions } from "@/lib/platform";
import { getLastAttempt, getQuizForStudent } from "@/lib/quiz";
import { requireRole } from "@/lib/session";

export default async function LessonView({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const { id } = await params;
  const s = await requireRole("student");
  const found = await findLesson(id);
  if (!found) notFound();
  const { teacher, unit, lesson, storagePath, videoId } = found;
  const subs = await getMySubscriptions(s.userId);
  const allowed = lesson.isFree || subs.some((x) => x.teacherId === teacher.id);
  const done = (await getCompletedLessons(s.userId)).has(lesson.id);

  if (!allowed) {
    return (
      <div className="card center-card">
        <h1 style={{ fontSize: 22 }}>{t("This lesson is for subscribers")}</h1>
        <p className="muted">{t("Subscribe with {name} to open all their lessons.", { name: teacher.name })}</p>
        <Link className="btn btn-pri" href={`/student/subscribe/${teacher.slug}`}>
          {t("Subscribe now")}
        </Link>
        <Link className="btn btn-ghost" href="/student/redeem">
          {t("I have a code")}
        </Link>
        <Link className="btn btn-ghost" href={`/${teacher.slug}`}>
          {t("Teacher page")}
        </Link>
      </div>
    );
  }

  // PDFs come through /api/material, which checks access again and stamps every page
  // with the student's number and account id.
  const hasFile = (lesson.type === "pdf" || lesson.type === "worksheet") && (DEMO_MODE || Boolean(storagePath));
  const fileUrl = hasFile ? `/api/material/${lesson.id}` : null;
  const mine = lesson.type === "worksheet" ? await listMySubmissions(s.userId, lesson.id) : [];
  const videoUrl = BUNNY_ENABLED && videoId ? embedUrl(videoId) : null;
  const quiz = lesson.type === "quiz" ? await getQuizForStudent(lesson.id) : [];
  const last = lesson.type === "quiz" ? await getLastAttempt(s.userId, lesson.id) : null;
  const mark = `${s.fullName} · ${s.userId.slice(0, 8)}`;
  const doneAction = markDone.bind(null, lesson.id);

  return (
    <>
      <div className="top">
        <div className="hi">
          <Link className="link" href="/student/materials">
            <Icon name="arrow" sm /> {t("Back to study materials")}
          </Link>
          <h1 style={{ marginTop: 8 }}>{lesson.title}</h1>
          <p>
            {t("Teacher")} {teacher.name} · {unit.title} · {typeLabel(lang, lesson.type)} · {lesson.meta}
          </p>
        </div>
        <LessonIcon type={lesson.type} />
      </div>

      {lesson.type === "quiz" && quiz.length > 0 ? (
        <div className="card panel">
          <QuizRunner lessonId={lesson.id} questions={quiz} last={last} />
        </div>
      ) : (
        <div className="card panel">
          <div className={videoUrl ? "reader video" : "reader"}>
            {videoUrl ? (
              <iframe src={videoUrl} title={lesson.title} allow="accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen />
            ) : fileUrl ? (
              <iframe src={fileUrl} title={lesson.title} />
            ) : (
              <div className="empty" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
                {lesson.type === "video"
                  ? t("The teacher hasn't uploaded this video yet.")
                  : lesson.type === "live"
                    ? t("Live class: {meta}. The join link appears here before the start time.", { meta: lesson.meta })
                    : lesson.type === "quiz"
                      ? t("The teacher hasn't added questions to this quiz yet.")
                      : t("The teacher hasn't uploaded the file yet.")}
              </div>
            )}
            <div className="wm" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>{mark}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            {done ? (
              <span className="pill p-ok">
                <Icon name="check" sm /> {t("You finished this lesson")}
              </span>
            ) : (
              <form action={doneAction}>
                <button className="btn btn-pri btn-sm">
                  <Icon name="check" sm /> {t("Mark as finished")}
                </button>
              </form>
            )}
            {fileUrl && (
              <a className="btn btn-ghost btn-sm" href={`${fileUrl}?dl=1`}>
                <Icon name="download" sm /> {t("Download")}
              </a>
            )}
            <span className="muted" style={{ fontSize: 13 }}>
              {t("This material carries your number and account id. Sharing it outside the platform is not allowed.")}
            </span>
          </div>
          {lesson.type === "worksheet" && <HandIn lessonId={lesson.id} mine={mine} />}
        </div>
      )}
    </>
  );
}
