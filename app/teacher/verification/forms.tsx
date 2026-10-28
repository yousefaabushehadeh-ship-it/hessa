"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { deleteDoc, finishDocUpload, startDocUpload, uploadPhoto } from "@/app/actions/verification";
import { useT } from "@/components/lang";
import { Icon } from "@/components/ui";
import type { TeacherDoc } from "@/lib/types";

const PHOTO_PX = 512;

/** Center-crops to a square and shrinks to a small JPEG in the browser, so any phone photo fits in one request. */
async function squareJpeg(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = PHOTO_PX;
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, PHOTO_PX, PHOTO_PX);
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("encode"))), "image/jpeg", 0.85));
}

export function PhotoForm({ photoUrl, initial, color }: { photoUrl: string | null; initial: string; color: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(uploadPhoto, {});
  const [preview, setPreview] = useState<string | null>(photoUrl);
  const [error, setError] = useState<string>();
  const [, start] = useTransition();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("The photo must be a JPG or PNG image."));
    setError(undefined);
    try {
      const blob = await squareJpeg(file);
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      start(() => action(fd));
    } catch {
      setError(t("We couldn't read this image. Try another photo."));
    }
  }

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local preview or a Storage URL
        <img src={preview} alt={t("Your photo")} width={96} height={96} style={{ borderRadius: 18, objectFit: "cover", width: 96, height: 96 }} />
      ) : (
        <div className="av" style={{ width: 96, height: 96, background: color, fontSize: 40 }}>
          {initial}
        </div>
      )}
      <div style={{ display: "grid", gap: 8, flex: "1 1 220px" }}>
        <label className="btn" style={{ justifySelf: "start", cursor: "pointer" }}>
          <Icon name="upload" sm /> {pending ? t("Uploading...") : preview ? t("Change photo") : t("Upload a photo")}
          <input type="file" accept="image/*" onChange={onPick} hidden disabled={pending} />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {t("A clear photo of your face, without sunglasses. Students trust a page with a real photo more.")}
        </p>
        {(error || state.error) && <p className="form-error">{error || state.error}</p>}
        {state.ok && !error && <p className="form-ok">{state.ok}</p>}
      </div>
    </div>
  );
}

export function DocUploadForm({ kinds }: { kinds: [string, string][] }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    const kind = String(fd.get("kind") ?? "");
    if (!(file instanceof File) || !file.size) return setMsg({ error: t("Choose a file.") });
    setBusy(true);
    setMsg({});
    try {
      const start = await startDocUpload(kind, file.name, file.type, file.size);
      if (start.error) return setMsg({ error: start.error });
      if (start.ticket) {
        // Same request shape as supabase-js uploadToSignedUrl: the file goes straight to Storage, not through our server.
        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        const res = await fetch(start.ticket.signedUrl, { method: "PUT", body });
        if (!res.ok) return setMsg({ error: t("The upload was interrupted. Check your connection and try again.") });
      }
      const done = await finishDocUpload(kind, file.name, start.ticket?.path ?? null);
      if (done.error) return setMsg({ error: done.error });
      setMsg({ ok: t("Uploaded. We'll review it within 2 working days.") });
      ref.current?.reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="frm" ref={ref} onSubmit={onSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div>
          <label className="h" htmlFor="d-kind">
            {t("Document type")}
          </label>
          <select className="field" id="d-kind" name="kind">
            {kinds.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="h" htmlFor="d-file">
            {t("File (PDF or image)")}
          </label>
          <input className="field" id="d-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
        </div>
      </div>
      {msg.error && <p className="form-error">{msg.error}</p>}
      {msg.ok && <p className="form-ok">{msg.ok}</p>}
      <button className="btn btn-pri" disabled={busy}>
        {busy ? t("Uploading...") : t("Upload document")}
      </button>
    </form>
  );
}

export function DocList({ docs, kindLabels }: { docs: TeacherDoc[]; kindLabels: Record<string, string> }) {
  const t = useT();
  const [pending, start] = useTransition();
  if (!docs.length) return <p className="muted">{t("No documents yet.")}</p>;
  const pill = { pending: ["p-warn", t("Under review")], approved: ["p-ok", t("Approved")], rejected: ["p-bad", t("Rejected")] } as const;
  return (
    <ul className="doc-list">
      {docs.map((d) => (
        <li key={d.id}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>{kindLabels[d.kind]}</b>
            <div className="muted" style={{ fontSize: 12.5, overflowWrap: "anywhere" }} dir="auto">
              {d.fileName} · <span className="num">{d.createdAt}</span>
            </div>
            {d.note && <div className="form-error" style={{ fontSize: 12.5 }}>{d.note}</div>}
          </div>
          <span className={`pill ${pill[d.status][0]}`}>{pill[d.status][1]}</span>
          {d.status === "pending" && (
            <button className="link" type="button" disabled={pending} onClick={() => start(() => deleteDoc(d.id))}>
              {t("Remove")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
