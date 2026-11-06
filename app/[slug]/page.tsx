import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/review-form";
import { SiteFooter, SiteNav } from "@/components/site";
import { Avatar, Icon, LessonIcon, Stars, Verified, fmt, fmtDate, typeLabel } from "@/components/ui";
import { getMySubscriptions, getTeacherBySlug } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { getMyReview, getReviews } from "@/lib/reviews";
import { getSession } from "@/lib/session";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getT();
  const lang = await getLang();
  const x = await getTeacherBySlug((await params).slug);
  if (!x) return {};
  return {
    title: t("Teacher {name}, {subject} teacher", { name: x.name, subject: dataLabel(lang, x.subject) }),
    description: x.headline,
  };
}

export default async function TeacherPage({ params }: { params: Params }) {
  const t = await getT();
  const lang = await getLang();
  const teacher = await getTeacherBySlug((await params).slug);
  if (!teacher) notFound();
  const session = await getSession();
  const subs = session?.role === "student" ? await getMySubscriptions(session.userId) : [];
  const sub = subs.find((s) => s.teacherId === teacher.id);
  const reviews = await getReviews(teacher.id, lang);
  const mine = sub && session ? await getMyReview(session.userId, teacher.id) : null;
  const count = teacher.units.reduce((a, u) => a + u.lessons.length, 0);
  const first = teacher.name.split(" ")[0];

  return (
    <>
      <SiteNav active="browse" />
      <div className="cover" />
      <div className="gut">
        <div className="wrap prof">
          <div className="prof-main">
            <div className="card ph">
              <Avatar t={teacher} size={96} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h1>
                  {t("Teacher")} {teacher.name}
                  {teacher.verified && <Verified title={t("Verified: identity and qualification checked")} />}
                </h1>
                <p className="muted" style={{ marginTop: 4 }}>
                  {teacher.headline}
                </p>
                <div className="tags">
                  <span className="pill p-info">{dataLabel(lang, teacher.subject)}</span>
                  <span className="pill p-info">{dataLabel(lang, teacher.grade)}</span>
                  {teacher.badge && <span className="pill p-ok">{teacher.badge}</span>}
                </div>
                <div className="kv">
                  <div>
                    <b className="num">{teacher.rating.toFixed(1)}</b>
                    <span>{t("{n} reviews", { n: teacher.reviewCount })}</span>
                  </div>
                  <div>
                    <b className="num">{fmt(teacher.studentCount)}</b>
                    <span>{t("students")}</span>
                  </div>
                  <div>
                    <b className="num">{teacher.years}</b>
                    <span>{t("years of experience")}</span>
                  </div>
                  <div>
                    <b className="num">{count}</b>
                    <span>{t("published lessons")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`https://wa.me/?text=${encodeURIComponent(t("Teacher page on Hessa: {url}", { url: `https://hessa.jo/${teacher.slug}` }))}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <Icon name="share" sm /> hessa.jo/{teacher.slug}
                  </a>
                  <span className="muted" style={{ fontSize: 12.5, display: "inline-flex", gap: 4, alignItems: "center" }}>
                    <Icon name="shield" sm /> {t("Verified: identity and qualifications")}
                  </span>
                </div>
              </div>
            </div>

            <div className="card box">
              <h2>{t("About the teacher")}</h2>
              <p>{teacher.bio}</p>
              <ul className="ul" style={{ marginTop: 16 }}>
                {teacher.education && (
                  <li>
                    <Icon name="book" sm />
                    <span>{teacher.education}</span>
                  </li>
                )}
                {teacher.liveSchedule && (
                  <li>
                    <Icon name="live" sm />
                    <span>
                      {t("Live classes:")} {teacher.liveSchedule}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card box">
              <div className="ph2" style={{ marginBottom: 14 }}>
                <h2 style={{ margin: 0 }}>{t("Content")}</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {sub ? t("You're subscribed. All lessons are open.") : t("Free lessons are open to try.")}
                </span>
              </div>
              {teacher.units.map((u, ui) => (
                <details className="unit" key={u.id} open={ui === 0}>
                  <summary>
                    <span>{u.title}</span>
                    <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                      {t("{n} items", { n: u.lessons.length })}
                    </span>
                  </summary>
                  {u.lessons.map((l) => {
                    const open = l.isFree || Boolean(sub);
                    const body = (
                      <>
                        <LessonIcon type={l.type} />
                        <span className="t">
                          <b>{l.title}</b>
                          <span>
                            {typeLabel(lang, l.type)} · {l.meta}
                          </span>
                        </span>
                        {l.isFree && !sub ? (
                          <span className="pill p-ok">{t("Free")}</span>
                        ) : open ? null : (
                          <span className="muted">
                            <Icon name="lock" sm />
                          </span>
                        )}
                      </>
                    );
                    return open ? (
                      <Link key={l.id} className="lesson" href={session ? `/student/lesson/${l.id}` : `/login/student?next=/student/lesson/${l.id}`}>
                        {body}
                      </Link>
                    ) : (
                      <div key={l.id} className="lesson" aria-disabled="true">
                        {body}
                      </div>
                    );
                  })}
                </details>
              ))}
            </div>

            <div className="card box">
              <div className="ph2">
                <h2 style={{ margin: 0 }}>{t("Reviews")}</h2>
                <Stars value={teacher.rating} />
              </div>
              {sub && <ReviewForm teacherId={teacher.id} mine={mine} />}
              {reviews.length === 0 && <p className="muted">{t("No reviews yet. Subscribed students can be the first.")}</p>}
              {reviews.map((r, i) => (
                <div className="rev" key={`${r.author}-${i}`}>
                  <div className="h">
                    <b style={{ fontFamily: "var(--f-display)" }}>{r.author}</b>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {r.when}
                    </span>
                  </div>
                  <span className="stars">
                    {Array.from({ length: r.stars }, (_, i) => (
                      <Icon key={i} name="star" sm />
                    ))}
                  </span>
                  <p style={{ marginTop: 6 }}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="side">
            <div className="card buy">
              {sub ? (
                <>
                  <span className="pill p-ok" style={{ justifySelf: "start" }}>
                    <Icon name="check" sm /> {t("Subscribed")}
                  </span>
                  <h3 style={{ fontSize: 19 }}>{t("Your subscription is active until {date}", { date: fmtDate(lang, sub.endsOn) })}</h3>
                  <Link className="btn btn-pri" href="/student/materials">
                    {t("Open my study materials")}
                  </Link>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 19 }}>{t("Subscribe with {name}", { name: first })}</h3>
                  <div className="opt">
                    <span className="t">
                      <b>{t("Monthly")}</b>
                      <span>{t("30 days from activation")}</span>
                    </span>
                    <span className="pr num">{t("{n} JOD", { n: teacher.priceMonth })}</span>
                  </div>
                  <div className="opt">
                    <span className="t">
                      <b>{t("Term (3 months)")}</b>
                      <span>{t("Save {n} JOD", { n: teacher.priceMonth * 3 - teacher.priceTerm })}</span>
                    </span>
                    <span className="pr num">{t("{n} JOD", { n: teacher.priceTerm })}</span>
                  </div>
                  <Link className="btn btn-pri" href={session ? `/student/subscribe/${teacher.slug}` : `/signup/student?next=/student/subscribe/${teacher.slug}`}>
                    {t("Subscribe now")}
                  </Link>
                  <Link className="btn btn-ghost" href={session ? "/student/redeem" : "/login/student?next=/student/redeem"}>
                    {t("I have an access code")}
                  </Link>
                  <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                    {t("Pay by CliQ or e-wallet. Your teacher confirms the transfer and your materials open.")}
                  </p>
                </>
              )}
            </div>
            <div className="card buy">
              <b style={{ fontFamily: "var(--f-display)" }}>{t("With your subscription you get")}</b>
              <ul className="ul">
                <li>
                  <Icon name="check" sm />
                  <span>{t("All videos, notes and worksheets")}</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>{t("Live classes and their recordings")}</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>{t("Quizzes after each chapter")}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
