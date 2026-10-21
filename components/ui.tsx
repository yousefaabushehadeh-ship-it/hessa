import Link from "next/link";
import { ICONS } from "@/components/icons";
import type { LessonType, Teacher } from "@/lib/types";

export function Icon({ name, sm }: { name: string; sm?: boolean }) {
  return <svg className={sm ? "i sm" : "i"} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }} />;
}

export function Avatar({ t, size = 48 }: { t: Pick<Teacher, "color" | "initial">; size?: number }) {
  return (
    <div className="av" style={{ width: size, height: size, background: t.color, fontSize: Math.round(size * 0.42) }}>
      {t.initial}
    </div>
  );
}

export function Verified() {
  return (
    <span className="vbadge" title="أستاذ موثّق: تم التحقق من الهوية والمؤهل">
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

export const TYPE_LABEL: Record<LessonType, string> = { video: "فيديو", pdf: "ملف PDF", quiz: "اختبار", live: "حصة مباشرة" };

export function LessonIcon({ type }: { type: LessonType }) {
  return (
    <span className={`ltype lt-${type}`}>
      <Icon name={type} sm />
    </span>
  );
}

export function TeacherCard({ t }: { t: Teacher }) {
  return (
    <Link href={`/${t.slug}`} className="card tc" aria-label={`صفحة أ. ${t.name}`}>
      <div className="top">
        <Avatar t={t} size={54} />
        <div style={{ minWidth: 0 }}>
          <h3>
            أ. {t.name}
            {t.verified && <Verified />}
          </h3>
          <div className="meta">
            {t.subject} · {t.grade}
          </div>
        </div>
      </div>
      <p className="hl">{t.headline}</p>
      <div className="meta" style={{ gap: 14 }}>
        <Stars value={t.rating} />
        <span>({t.reviewCount} تقييم)</span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          <Icon name="pin" sm />
          {t.city}
        </span>
      </div>
      <div className="foot">
        <span className="price num">
          {t.priceMonth} د.أ <small>/ شهر</small>
        </span>
        {t.badge ? <span className="pill p-ok">{t.badge}</span> : <span className="pill p-info">{fmt(t.studentCount)} طالب</span>}
      </div>
    </Link>
  );
}

export { fmtDate } from "@/lib/format";
