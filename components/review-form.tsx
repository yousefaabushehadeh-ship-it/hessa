"use client";

import { useActionState, useState } from "react";
import { saveReview, type ReviewState } from "@/app/actions/review";
import { useT } from "@/components/lang";
import { Icon } from "@/components/ui";

export function ReviewForm({ teacherId, mine }: { teacherId: string; mine: { stars: number; body: string } | null }) {
  const t = useT();
  const [state, action, pending] = useActionState(saveReview.bind(null, teacherId), {} as ReviewState);
  const [stars, setStars] = useState(mine?.stars ?? 0);
  return (
    <form className="frm" action={action} style={{ marginBottom: 18 }}>
      <b style={{ fontFamily: "var(--f-display)" }}>{mine ? t("Edit your review") : t("Rate this teacher")}</b>
      <div className="rate" role="radiogroup" aria-label={t("Stars")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= stars ? "on" : ""} title={t("{n} of 5", { n })}>
            <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} required />
            <Icon name="star" />
          </label>
        ))}
      </div>
      <textarea
        className="field"
        name="body"
        rows={3}
        maxLength={600}
        defaultValue={mine?.body}
        placeholder={t("What did you like? What could be better?")}
        aria-label={t("Your comment")}
      />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri btn-sm" style={{ justifySelf: "start" }} disabled={pending}>
        {pending ? t("One moment...") : t("Publish review")}
      </button>
    </form>
  );
}
