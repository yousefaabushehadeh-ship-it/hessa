import Link from "next/link";
import { ICONS } from "@/components/icons";
import { dataLabel, fmtDate as fmtDateFor, makeT, type Lang } from "@/lib/i18n";
import type { LessonType, Teacher } from "@/lib/types";

export function Icon({ name, sm }: { name: string; sm?: boolean }) {
  return <svg className={sm ? "i sm" : "i"} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }} />;
}

export function Avatar({ t, size = 48 }: { t: Pick<Teacher, "color" | "initial" | "photoUrl">; size?: number }) {
  if (t.photoUrl)
    // eslint-disable-next-line @next/next/no-img-element -- photos come from Supabase Storage or a demo data URL
    return <img className="av" src={t.photoUrl} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: "cover" }} />;
  return (
    <div className="av" style={{ width: size, height: size, background: t.color, fontSize: Math.round(size * 0.42) }}>
      {t.initial}
    </div>
  );
}

export function Verified({ title }: { title: string }) {
  return (
    <span className="vbadge" title={title}>
      <Icon name="check" />
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars">
      <Icon name="star" sm />
      {value.toFixed(1)}
    </span>
  );
}

export const fmt = (n: number) => n.toLocaleString("en-US");

export const fmtDate = fmtDateFor;

export function typeLabel(lang: Lang, type: LessonType): string {
  const t = makeT(lang);
  const labels: Record<LessonType, string> = { video: t("Video"), pdf: t("PDF"), quiz: t("Quiz"), live: t("Live class"), worksheet: t("Worksheet") };
  return labels[type];
}

export function LessonIcon({ type }: { type: LessonType }) {
  return (
    <span className={`ltype lt-${type}`}>
      <Icon name={type} sm />
    </span>
  );
}

export function TeacherCard({ t: teacher, lang }: { t: Teacher; lang: Lang }) {
  const t = makeT(lang);
  return (
    <Link href={`/${teacher.slug}`} className="card tc" aria-label={t("Teacher page: {name}", { name: teacher.name })}>
      <div className="top">
        <Avatar t={teacher} size={54} />
        <div style={{ minWidth: 0 }}>
          <h3>
            {t("Teacher")} {teacher.name}
            {teacher.verified && <Verified title={t("Verified: identity and qualification checked")} />}
          </h3>
          <div className="meta">
            {dataLabel(lang, teacher.subject)} · {dataLabel(lang, teacher.grade)}
          </div>
        </div>
      </div>
      <p className="hl">{teacher.headline}</p>
      <div className="meta" style={{ gap: 14 }}>
        <Stars value={teacher.rating} />
        <span>({t("{n} reviews", { n: teacher.reviewCount })})</span>
      </div>
      <div className="foot">
        <span className="price num">
          {teacher.priceMonth} JOD <small>/ {t("month")}</small>
        </span>
        {teacher.badge ? (
          <span className="pill p-ok">{teacher.badge}</span>
        ) : (
          <span className="pill p-info">{t("{n} students", { n: fmt(teacher.studentCount) })}</span>
        )}
      </div>
    </Link>
  );
}
