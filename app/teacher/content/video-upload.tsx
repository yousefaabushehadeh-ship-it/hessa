"use client";

import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { saveVideoLesson, startVideoUpload } from "@/app/actions/video";
import { useT } from "@/components/lang";

// Uploads straight from the browser to Bunny Stream with a ticket the server signed,
// so big videos never pass through our server.
export function VideoUploadForm({ units, enabled }: { units: { id: string; title: string }[]; enabled: boolean }) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});

  if (!enabled)
    return (
      <p className="muted" style={{ fontSize: 14 }}>
        {t("Video upload works once Bunny Stream is connected (steps are in the README). Videos are stored encrypted and shown to each student through a temporary link.")}
      </p>
    );
  if (!units.length) return <p className="muted">{t("Add a unit first.")}</p>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    const title = String(fd.get("title") ?? "");
    if (!(file instanceof File) || !file.size) return setMsg({ error: t("Choose a video file.") });
    if (!file.type.startsWith("video/")) return setMsg({ error: t("The file must be a video.") });
    setMsg({});
    const { ticket, error } = await startVideoUpload(title);
    if (!ticket) return setMsg({ error });
    setPct(0);
    const upload = new Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: ticket.signature,
        AuthorizationExpire: String(ticket.expires),
        VideoId: ticket.videoId,
        LibraryId: ticket.libraryId,
      },
      metadata: { filetype: file.type, title },
      onError: () => {
        setPct(null);
        setMsg({ error: t("The upload was interrupted. Check your connection and try again.") });
      },
      onProgress: (sent, total) => setPct(Math.round((sent / total) * 100)),
      onSuccess: async () => {
        const r = await saveVideoLesson({
          unitId: String(fd.get("unit")),
          title,
          meta: String(fd.get("meta") ?? ""),
          isFree: fd.get("free") === "on",
          videoId: ticket.videoId,
        });
        setPct(null);
        setMsg(r);
        if (r.ok) ref.current?.reset();
      },
    });
    upload.start();
  }

  return (
    <form className="frm" ref={ref} onSubmit={onSubmit}>
      <div>
        <label className="h" htmlFor="v-unit">
          {t("Unit")}
        </label>
        <select className="field" id="v-unit" name="unit">
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="h" htmlFor="v-title">
          {t("Lesson title")}
        </label>
        <input className="field" id="v-title" name="title" required placeholder={t("e.g. Chain rule")} />
      </div>
      <div>
        <label className="h" htmlFor="v-meta">
          {t("Length")}
        </label>
        <input className="field" id="v-meta" name="meta" placeholder={t("e.g. 42 min")} />
      </div>
      <div>
        <label className="h" htmlFor="v-file">
          {t("Video file")}
        </label>
        <input className="field" id="v-file" name="file" type="file" accept="video/*" required />
      </div>
      <label className="check">
        <input type="checkbox" name="free" /> {t("Free trial lesson")}
      </label>
      {pct !== null && (
        <div>
          <div className="upbar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="muted num" style={{ fontSize: 13 }}>
            {pct}% · {t("Keep this page open until it finishes")}
          </span>
        </div>
      )}
      {msg.error && <p className="form-error">{msg.error}</p>}
      {msg.ok && <p className="form-ok">{msg.ok}</p>}
      <button className="btn btn-pri" disabled={pct !== null}>
        {pct !== null ? t("Uploading...") : t("Upload video")}
      </button>
    </form>
  );
}
