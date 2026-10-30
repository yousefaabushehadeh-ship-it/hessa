"use client";

import { useActionState, useRef, useState } from "react";
import { addLesson, addUnit, startMaterialUpload } from "@/app/actions/teacher";
import { useT } from "@/components/lang";
import { putToSignedUrl } from "@/lib/upload-client";

export function AddLessonForm({ units }: { units: { id: string; title: string }[] }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("pdf");
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof addLesson>>, fd: FormData) => {
    // A PDF goes to Storage first, then the item is saved with the file's path.
    const file = fd.get("file");
    fd.delete("file");
    if (file instanceof File && file.size > 0) {
      const start = await startMaterialUpload(file.type, file.size);
      if (start.error) return { error: start.error };
      if (start.ticket) {
        if (!(await putToSignedUrl(start.ticket.signedUrl, file))) return { error: t("The upload was interrupted. Check your connection and try again.") };
        fd.set("path", start.ticket.path);
      } else fd.set("demoFile", "1");
    }
    const r = await addLesson(prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  const needsFile = type === "pdf" || type === "worksheet";
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
          <select className="field" id="l-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="pdf">{t("PDF file")}</option>
            <option value="worksheet">{t("Worksheet (students hand in a solution)")}</option>
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
      {needsFile && (
        <div>
          <label className="h" htmlFor="l-file">
            {t("File (PDF files, up to 25 MB)")}
          </label>
          <input className="field" id="l-file" name="file" type="file" accept="application/pdf" required />
        </div>
      )}
      {type === "quiz" && (
        <div>
          <label className="h" htmlFor="l-tries">
            {t("Tries per student")}
          </label>
          <input className="field num" id="l-tries" name="tries" type="number" min={1} max={20} defaultValue={3} />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
            {t("Students see the right answers after their last try, or when they get everything right.")}
          </p>
        </div>
      )}
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
