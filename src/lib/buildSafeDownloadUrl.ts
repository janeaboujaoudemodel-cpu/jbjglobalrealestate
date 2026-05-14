/**
 * Build a branded download URL on jbj.ae that proxies to a signed
 * Supabase storage URL. Keeps the visible domain on the user's own brand
 * (avoids ad-blocker false positives on `*.supabase.co`) and triggers a
 * client-side blob download with the correct filename.
 */
function toBase64Url(input: string): string {
  // UTF-8 safe base64
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const BRAND_ORIGIN = "https://jbj.ae";

/**
 * @param signedUrl  The actual file URL (Supabase signed URL, etc.)
 * @param filename   Suggested download filename
 * @param origin     Base origin to use; defaults to the production brand
 *                   domain so the link is identical in emails and previews.
 */
export function buildSafeDownloadUrl(
  signedUrl: string | undefined,
  filename: string | undefined,
  origin: string = BRAND_ORIGIN,
): string | undefined {
  if (!signedUrl) return undefined;
  const u = toBase64Url(signedUrl);
  const n = filename ? encodeURIComponent(filename) : "";
  return `${origin}/d?u=${u}${n ? `&n=${n}` : ""}`;
}
