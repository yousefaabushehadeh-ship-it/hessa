"use client";

import { useActionState, useState } from "react";
import { saveReview, type ReviewState } from "@/app/actions/review";
import { Icon } from "@/components/ui";

export function ReviewForm({ teacherId, mine }: { teacherId: string; mine: { stars: number; body: string } | null }) {
  const [state, action, pending] = useActionState(saveReview.bind(null, teacherId), {} as ReviewState);
  const [stars, setStars] = useState(mine?.stars ?? 0);
  return (
    <form className="frm" action={action} style={{ marginBottom: 18 }}>
      <b style={{ fontFamily: "var(--f-display)" }}>{mine ? "عدّل تقييمك" : "قيّم الأستاذ"}</b>
      <div className="rate" role="radiogroup" aria-label="عدد النجوم">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= stars ? "on" : ""} title={`${n} من 5`}>
            <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} required />
            <Icon name="star" />
          </label>
        ))}
      </div>
      <textarea className="field" name="body" rows={3} maxLength={600} defaultValue={mine?.body} placeholder="شو عجبك؟ وشو بتتمنى يتحسّن؟" aria-label="تعليقك" />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri btn-sm" style={{ justifySelf: "start" }} disabled={pending}>
        {pending ? "لحظة..." : "انشر التقييم"}
      </button>
    </form>
  );
}
