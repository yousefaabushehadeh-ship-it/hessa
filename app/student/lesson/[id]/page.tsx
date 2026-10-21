import Link from "next/link";
import { notFound } from "next/navigation";
import { markDone } from "@/app/actions/student";
import { Icon, LessonIcon, TYPE_LABEL } from "@/components/ui";
import { DEMO_MODE } from "@/lib/env";
import { findLesson, getCompletedLessons, getMySubscriptions } from "@/lib/data";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function LessonView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireRole("student");
  const found = await findLesson(id);
  if (!found) notFound();
  const { teacher, unit, lesson, storagePath } = found;
  const subs = await getMySubscriptions(s.userId);
  const allowed = lesson.isFree || subs.some((x) => x.teacherId === teacher.id);
  const done = (await getCompletedLessons(s.userId)).has(lesson.id);

  if (!allowed) {
    return (
      <div className="card center-card">
        <h1 style={{ fontSize: 22 }}>هالدرس للمشتركين</h1>
        <p className="muted">
          اشترك مع أ. {teacher.name} عشان تنفتح كل موادّه. اطلب منه كود تفعيل.
        </p>
        <Link className="btn btn-pri" href="/student/redeem">
          عندي كود
        </Link>
        <Link className="btn btn-ghost" href={`/${teacher.slug}`}>
          صفحة الأستاذ
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
  const mark = `${s.fullName} · ${s.userId.slice(0, 8)}`;
  const doneAction = markDone.bind(null, lesson.id);

  return (
    <>
      <div className="top">
        <div className="hi">
          <Link className="link" href="/student/materials">
            رجوع للمواد
          </Link>
          <h1 style={{ marginTop: 8 }}>{lesson.title}</h1>
          <p>
            أ. {teacher.name} · {unit.title} · {TYPE_LABEL[lesson.type]} · {lesson.meta}
          </p>
        </div>
        <LessonIcon type={lesson.type} />
      </div>

      <div className="card panel">
        <div className="reader">
          {fileUrl ? (
            <iframe src={`${fileUrl}#toolbar=0`} title={lesson.title} />
          ) : (
            <div className="empty" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
              {lesson.type === "video"
                ? "مشغّل الفيديو المحمي جاي بالمرحلة الثانية."
                : lesson.type === "live"
                  ? `الحصة المباشرة: ${lesson.meta}. رابط الدخول بيظهر هون قبل الموعد.`
                  : lesson.type === "quiz"
                    ? "الاختبارات التفاعلية جاية بالمرحلة الثانية."
                    : DEMO_MODE
                      ? "بالنسخة التجريبية ما في ملفات مرفوعة. لما الأستاذ يرفع PDF بيظهر هون."
                      : "الأستاذ لسا ما رفع الملف."}
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
              <Icon name="check" sm /> خلّصت هالدرس
            </span>
          ) : (
            <form action={doneAction}>
              <button className="btn btn-pri btn-sm">
                <Icon name="check" sm /> خلّصت هالدرس
              </button>
            </form>
          )}
          <span className="muted" style={{ fontSize: 13 }}>
            المادة عليها علامة مائية باسمك. مشاركتها برا المنصة ممنوعة.
          </span>
        </div>
      </div>
    </>
  );
}
