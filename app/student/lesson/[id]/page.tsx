import Link from "next/link";
import { notFound } from "next/navigation";
import { markDone } from "@/app/actions/student";
import { QuizRunner } from "@/components/quiz-runner";
import { Icon, LessonIcon, typeLabel } from "@/components/ui";
import { BUNNY_ENABLED, embedUrl } from "@/lib/bunny";
import { DEMO_MODE } from "@/lib/env";
import { findLesson, getCompletedLessons, getMySubscriptions } from "@/lib/data";
import { getLang, getT } from "@/lib/i18n-server";
import { getLastAttempt, getQuizForStudent } from "@/lib/quiz";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

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
        <p className="muted">{t("Subscribe with {name} to open all their lessons. Ask them for an activation code.", { name: teacher.name })}</p>
        <Link className="btn btn-pri" href="/student/redeem">
          {t("I have a code")}
        </Link>
        <Link className="btn btn-ghost" href={`/${teacher.slug}`}>
          {t("Teacher page")}
        </Link>
      </div>
    );
  }

  // Files sit in a private bucket. The server checks access above, then hands out a
  // link that stops working after 10 minutes.
  let fileUrl: string | null = null;
  if (!DEMO_MODE && storagePath) {
    const { data } = await supabaseAdmin().storage.from("materials").createSignedUrl(storagePath, 600);
    fileUrl = data?.signedUrl ?? null;
  }
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
            <Icon name="arrow" sm /> {t("Back to materials")}
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
              <iframe src={`${fileUrl}#toolbar=0`} title={lesson.title} />
            ) : (
              <div className="empty" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
                {lesson.type === "video"
                  ? DEMO_MODE || !BUNNY_ENABLED
                    ? t("Video plays here once Bunny Stream is connected. The demo has no videos.")
                    : t("The teacher hasn't uploaded this video yet.")
                  : lesson.type === "live"
                    ? t("Live class: {meta}. The join link appears here before the start time.", { meta: lesson.meta })
                    : lesson.type === "quiz"
                      ? t("The teacher hasn't added questions to this quiz yet.")
                      : DEMO_MODE
                        ? t("The demo has no uploaded files. When a teacher uploads a PDF, it appears here.")
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
            <span className="muted" style={{ fontSize: 13 }}>
              {t("This material has a watermark with your name. Sharing it outside the platform is not allowed.")}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
