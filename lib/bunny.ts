import { createHash } from "node:crypto";

// Bunny Stream: teachers upload straight from the browser (TUS), students watch
// through an embed URL with a short-lived token. Docs:
// https://docs.bunny.net/stream/tus-resumable-uploads and https://docs.bunny.net/stream/token-authentication

const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID ?? "";
const API_KEY = process.env.BUNNY_STREAM_API_KEY ?? "";
const TOKEN_KEY = process.env.BUNNY_TOKEN_KEY ?? "";

export const BUNNY_ENABLED = Boolean(LIBRARY_ID && API_KEY && TOKEN_KEY);

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/** Bunny video titles start with the teacher id, so we can check who owns an upload. */
const titleFor = (teacherId: string, title: string) => `${teacherId}:${title}`;

export async function createVideo(teacherId: string, title: string): Promise<string> {
  const res = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
    method: "POST",
    headers: { AccessKey: API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title: titleFor(teacherId, title) }),
  });
  if (!res.ok) throw new Error(`Bunny create video failed: ${res.status}`);
  return ((await res.json()) as { guid: string }).guid;
}

export type UploadTicket = { libraryId: string; videoId: string; expires: number; signature: string };

export function uploadTicket(videoId: string): UploadTicket {
  const expires = Math.floor(Date.now() / 1000) + 6 * 3600;
  return { libraryId: LIBRARY_ID, videoId, expires, signature: sha256(LIBRARY_ID + API_KEY + expires + videoId) };
}

export async function videoBelongsTo(videoId: string, teacherId: string): Promise<boolean> {
  const res = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${encodeURIComponent(videoId)}`, {
    headers: { AccessKey: API_KEY, Accept: "application/json" },
  });
  if (!res.ok) return false;
  const v = (await res.json()) as { title?: string };
  return Boolean(v.title?.startsWith(`${teacherId}:`));
}

/** Embed link that stops working after `seconds`. */
export function embedUrl(videoId: string, seconds = 3 * 3600): string {
  const expires = Math.floor(Date.now() / 1000) + seconds;
  const token = sha256(TOKEN_KEY + videoId + expires);
  return `https://player.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}&autoplay=false&preload=true`;
}
