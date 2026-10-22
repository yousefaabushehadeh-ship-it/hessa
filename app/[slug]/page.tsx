import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteNav } from "@/components/site";
import { Avatar, Icon, LessonIcon, Stars, TYPE_LABEL, Verified, fmt, fmtDate } from "@/components/ui";
import { ReviewForm } from "@/components/review-form";
import { getMySubscriptions, getTeacherBySlug } from "@/lib/data";
import { getMyReview, getReviews } from "@/lib/reviews";
import { getSession } from "@/lib/session";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTeacherBySlug((await params).slug);
  if (!t) return {};
  return { title: `أ. ${t.name}، أستاذ ${t.subject} في ${t.city}`, description: t.headline };
}

export default async function TeacherPage({ params }: { params: Params }) {
  const t = await getTeacherBySlug((await params).slug);
  if (!t) notFound();
  const session = await getSession();
  const subs = session?.role === "student" ? await getMySubscriptions(session.userId) : [];
  const sub = subs.find((s) => s.teacherId === t.id);
  const reviews = await getReviews(t.id);
  const mine = sub && session ? await getMyReview(session.userId, t.id) : null;
  const count = t.units.reduce((a, u) => a + u.lessons.length, 0);
  const first = t.name.split(" ")[0];

  return (
    <>
      <SiteNav active="browse" />
      <div className="cover" />
      <div className="gut">
        <div className="wrap prof">
          <div className="prof-main">
            <div className="card ph">
              <Avatar t={t} size={96} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h1>
                  أ. {t.name}
                  {t.verified && <Verified />}
                </h1>
                <p className="muted" style={{ marginTop: 4 }}>
                  {t.headline}
                </p>
                <div className="tags">
                  <span className="pill p-info">{t.subject}</span>
                  <span className="pill p-info">{t.grade}</span>
                  <span className="pill p-info">
                    <Icon name="pin" sm /> {t.city}
                  </span>
                  {t.badge && <span className="pill p-ok">{t.badge}</span>}
                </div>
                <div className="kv">
                  <div>
                    <b className="num">{t.rating.toFixed(1)}</b>
                    <span>{t.reviewCount} تقييم</span>
                  </div>
                  <div>
                    <b className="num">{fmt(t.studentCount)}</b>
                    <span>طالب</span>
                  </div>
                  <div>
                    <b className="num">{t.years}</b>
                    <span>سنة خبرة</span>
                  </div>
                  <div>
                    <b className="num">{count}</b>
                    <span>مادة منشورة</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`https://wa.me/?text=${encodeURIComponent(`صفحة أ. ${t.name} على حِصّة: https://hessa.jo/${t.slug}`)}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <Icon name="share" sm /> hessa.jo/{t.slug}
                  </a>
                  <span className="muted" style={{ fontSize: 12.5, display: "inline-flex", gap: 4, alignItems: "center" }}>
                    <Icon name="shield" sm /> موثّق: الهوية والمؤهل
                  </span>
                </div>
              </div>
            </div>

            <div className="card box">
              <h2>عن الأستاذ</h2>
              <p>{t.bio}</p>
              <ul className="ul" style={{ marginTop: 16 }}>
                {t.education && (
                  <li>
                    <Icon name="book" sm />
                    <span>{t.education}</span>
                  </li>
                )}
                {t.liveSchedule && (
                  <li>
                    <Icon name="live" sm />
                    <span>حصص مباشرة: {t.liveSchedule}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card box">
              <div className="ph2" style={{ marginBottom: 14 }}>
                <h2 style={{ margin: 0 }}>المحتوى</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {sub ? "إنت مشترك، كل المواد مفتوحة" : "الدروس المجانية مفتوحة للتجربة"}
                </span>
              </div>
              {t.units.map((u, ui) => (
                <details className="unit" key={u.id} open={ui === 0}>
                  <summary>
                    <span>{u.title}</span>
                    <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                      {u.lessons.length} مواد
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
                            {TYPE_LABEL[l.type]} · {l.meta}
                          </span>
                        </span>
                        {l.isFree && !sub ? (
                          <span className="pill p-ok">مجاني</span>
                        ) : open ? null : (
                          <span className="muted">
                            <Icon name="lock" sm />
                          </span>
                        )}
                      </>
                    );
                    return open ? (
                      <Link key={l.id} className="lesson" href={session ? `/student/lesson/${l.id}` : `/login?next=/student/lesson/${l.id}`}>
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
                <h2 style={{ margin: 0 }}>التقييمات</h2>
                <Stars value={t.rating} />
              </div>
              {sub && <ReviewForm teacherId={t.id} mine={mine} />}
              {reviews.length === 0 && <p className="muted">ما في تقييمات لسا. أول المشتركين بيقدروا يقيّموا.</p>}
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
                    <Icon name="check" sm /> مشترك
                  </span>
                  <h3 style={{ fontSize: 19 }}>اشتراكك فعّال لحد {fmtDate(sub.endsOn)}</h3>
                  <Link className="btn btn-pri" href="/student/materials">
                    افتح موادّي
                  </Link>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 19 }}>اشترك مع أ. {first}</h3>
                  <div className="opt">
                    <span className="t">
                      <b>شهري</b>
                      <span>30 يوم من التفعيل</span>
                    </span>
                    <span className="pr num">{t.priceMonth} د.أ</span>
                  </div>
                  <div className="opt">
                    <span className="t">
                      <b>فصلي (3 شهور)</b>
                      <span>وفّر {t.priceMonth * 3 - t.priceTerm} د.أ</span>
                    </span>
                    <span className="pr num">{t.priceTerm} د.أ</span>
                  </div>
                  <Link className="btn btn-pri" href={session ? "/student/redeem" : "/login?next=/student/redeem"}>
                    عندي كود تفعيل
                  </Link>
                  <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                    ادفع للأستاذ واطلب منه كود تفعيل. الدفع الإلكتروني جاي قريبًا.
                  </p>
                </>
              )}
            </div>
            <div className="card buy">
              <b style={{ fontFamily: "var(--f-display)" }}>مع الاشتراك بتحصل على</b>
              <ul className="ul">
                <li>
                  <Icon name="check" sm />
                  <span>كل الفيديوهات والملخصات وأوراق العمل</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>حصص مباشرة وتسجيلاتها</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>اختبارات بعد كل وحدة</span>
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
