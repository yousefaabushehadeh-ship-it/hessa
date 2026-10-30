// Browser side of a signed Storage upload: same request shape as supabase-js uploadToSignedUrl,
// so the file goes straight to Storage and not through our server.
export async function putToSignedUrl(signedUrl: string, file: File): Promise<boolean> {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const res = await fetch(signedUrl, { method: "PUT", body });
  return res.ok;
}
