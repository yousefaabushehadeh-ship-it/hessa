"use client";

import { useRef, useState, useTransition } from "react";
import { finishHandIn, startHandIn, withdrawHandIn } from "@/app/actions/worksheet";
import { useT } from "@/components/lang";
import { Icon } from "@/components/ui";
import { putToSignedUrl } from "@/lib/upload-client";
import type { Submission } from "@/lib/types";

/** The student's side of a worksheet: upload a photo or PDF of the solution, then see the mark. */
export function HandIn({ lessonId, mine }: { lessonId: string; mine: Submission[] }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return setMsg({ error: t("Choose a file.") });
    setBusy(true);
    setMsg({});
    try {
      const s = await startHandIn(lessonId, file.type, file.size);
      if (s.error) return setMsg({ error: s.error });
      if (s.ticket && !(await putToSignedUrl(s.ticket.signedUrl, file)))
        return setMsg({ error: t("The upload was interrupted. Check your connection and try again.") });
      const done = await finishHandIn(lessonId, file.name, s.ticket?.path ?? null, String(fd.get("note") ?? ""));
      setMsg(done);
      if (done.ok) ref.current?.reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hand-in">
      <b style={{ fontFamily: "var(--f-display)" }}>{t("Hand in your solution")}</b>
      <form className="frm" ref={ref} onSubmit={onSubmit}>
        <input className="field" name="file" type="file" accept="image/*,application/pdf" capture="environment" required aria-label={t("Your solution")} />
        <textarea className="field" name="note" rows={2} maxLength={500} placeholder={t("A note for your teacher (optional)")} />
        {msg.error && <p className="form-error">{msg.error}</p>}
        {msg.ok && <p className="form-ok">{msg.ok}</p>}
        <button className="btn btn-pri btn-sm" style={{ justifySelf: "start" }} disabled={busy}>
          <Icon name="upload" sm /> {busy ? t("Uploading...") : t("Hand in")}
        </button>
      </form>
      {mine.length > 0 && (
        <ul className="doc-list">
          {mine.map((x) => (
            <li key={x.id} style={{ flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <b dir="auto" style={{ overflowWrap: "anywhere" }}>
                  {x.url ? (
                    <a className="link" href={x.url} target="_blank" rel="noopener">
                      {x.fileName}
                    </a>
                  ) : (
                    x.fileName
                  )}
                </b>
                <div className="muted num" style={{ fontSize: 12.5 }}>
                  {x.createdAt}
                </div>
                {x.feedback && <div className="feedback" style={{ marginTop: 8 }}>{x.feedback}</div>}
              </div>
              {x.status === "graded" ? (
                <span className="pill p-ok num">{x.mark}</span>
              ) : (
                <>
                  <span className="pill p-warn">{t("Waiting for a mark")}</span>
                  <button className="link" type="button" disabled={pending} onClick={() => start(() => withdrawHandIn(x.id, lessonId))}>
                    {t("Take back")}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
