"use client";

import { useActionState, useRef } from "react";
import { addLesson, addUnit } from "@/app/actions/teacher";
import { useT } from "@/components/lang";

export function AddLessonForm({ units }: { units: { id: string; title: string }[] }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof addLesson>>, fd: FormData) => {
    const r = await addLesson(prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  if (!units.length) return <p className="muted">{t("Add a chapter first.")}</p>;
  return (
    <form className="frm" action={action} ref={ref}>
      <div>
        <label className="h" htmlFor="l-unit">
          {t("Chapter")}
        </label>
        <select className="field" id="l-unit" name="unit">
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="h" htmlFor="l-title">
          {t("Title")}
        </label>
        <input className="field" id="l-title" name="title" required placeholder={t("e.g. Chain rule summary")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="l-type">
            {t("Type")}
          </label>
          <select className="field" id="l-type" name="type" defaultValue="pdf">
            <option value="pdf">{t("PDF file")}</option>
            <option value="quiz">{t("Quiz (add questions after)")}</option>
            <option value="live">{t("Live class")}</option>
          </select>
        </div>
        <div>
          <label className="h" htmlFor="l-meta">
            {t("Length or pages")}
          </label>
          <input className="field" id="l-meta" name="meta" placeholder={t("e.g. 12 pages")} />
        </div>
      </div>
      <div>
        <label className="h" htmlFor="l-file">
          {t("File (PDF files, up to 20 MB)")}
        </label>
        <input className="field" id="l-file" name="file" type="file" accept="application/pdf" />
      </div>
      <label className="check">
        <input type="checkbox" name="free" /> {t("Free trial lesson")}
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("Uploading...") : t("Publish")}
      </button>
    </form>
  );
}

export function AddUnitForm() {
  const t = useT();
  const [state, action, pending] = useActionState(addUnit, {});
  return (
    <form className="frm" action={action}>
      <input className="field" name="title" required placeholder={t("e.g. Chapter 4: Vectors")} aria-label={t("Chapter name")} />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-ghost" disabled={pending}>
        {t("Add chapter")}
      </button>
    </form>
  );
}
