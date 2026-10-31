"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { addResource, deleteResource } from "@/app/actions/resource";
import { startMaterialUpload } from "@/app/actions/teacher";
import { useT } from "@/components/lang";
import { putToSignedUrl } from "@/lib/upload-client";

export function AddKitForm() {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState("book");
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof addResource>>, fd: FormData) => {
    // A book or summary goes to Storage first, then the item is saved with the file's path.
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
    const r = await addResource(prev, fd);
    if (r.ok) {
      ref.current?.reset();
      setKind("book");
    }
    return r;
  }, {});
  const isFile = kind === "book" || kind === "summary";
  return (
    <form className="frm" action={action} ref={ref}>
      <div>
        <label className="h" htmlFor="k-kind">
          {t("Type")}
        </label>
        <select className="field" id="k-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="book">{t("Book (PDF)")}</option>
          <option value="summary">{t("Summary (PDF)")}</option>
          <option value="video">{t("Explainer video (YouTube or Vimeo link)")}</option>
          <option value="link">{t("Useful link (a website, a simulation, a past paper)")}</option>
        </select>
      </div>
      <div>
        <label className="h" htmlFor="k-title">
          {t("Title")}
        </label>
        <input className="field" id="k-title" name="title" required placeholder={t("e.g. Chapter 1 summary")} />
      </div>
      {isFile ? (
        <div>
          <label className="h" htmlFor="k-file">
            {t("File (PDF files, up to 25 MB)")}
          </label>
          <input className="field" id="k-file" name="file" type="file" accept="application/pdf" required />
        </div>
      ) : (
        <div>
          <label className="h" htmlFor="k-url">
            {t("Link")}
          </label>
          <input className="field" id="k-url" name="url" type="url" dir="ltr" required placeholder="https://" />
          {kind === "video" && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              {t("YouTube and Vimeo videos play inside Hessa. For your own recorded lessons, use Upload a video in Content.")}
            </p>
          )}
        </div>
      )}
      <div>
        <label className="h" htmlFor="k-note">
          {t("A short note (optional)")}
        </label>
        <input className="field" id="k-note" name="note" maxLength={300} placeholder={t("e.g. Read it before the chapter quiz")} />
      </div>
      <label className="check">
        <input type="checkbox" name="free" /> {t("Free for everyone (shows on your public page)")}
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? t("Uploading...") : t("Add to the kit")}
      </button>
    </form>
  );
}

export function DeleteKitItem({ id }: { id: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="link"
      disabled={pending}
      onClick={() => {
        if (confirm(t("Remove this item from your study kit?"))) start(() => deleteResource(id));
      }}
    >
      {t("Remove")}
    </button>
  );
}
