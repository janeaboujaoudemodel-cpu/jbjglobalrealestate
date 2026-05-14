// Fetches a remote PDF (or any binary) and returns it as a Resend-compatible
// attachment object. Returns null on any failure or oversize file so the caller
// can safely fall back to link-only delivery without blocking the send.
//
// Resend hard limit is ~40 MB total. We cap at 15 MB per attachment to keep
// well clear of provider/inbox limits.

const MAX_BYTES = 15 * 1024 * 1024;

export interface ResendAttachment {
  filename: string;
  content: string; // base64
  content_type?: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
  }
  // btoa is available in Deno edge runtime
  return btoa(binary);
}

export async function fetchEmailAttachment(
  url: string | undefined | null,
  filename: string | undefined | null,
  contentType = "application/pdf",
): Promise<ResendAttachment | null> {
  const u = String(url || "").trim();
  const name = String(filename || "").trim();
  if (!u || !name) return null;

  try {
    const res = await fetch(u, { redirect: "follow" });
    if (!res.ok) {
      console.warn(`[fetchEmailAttachment] HTTP ${res.status} fetching ${u}`);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0) return null;
    if (buf.byteLength > MAX_BYTES) {
      console.warn(`[fetchEmailAttachment] Skipping oversize attachment ${name} (${buf.byteLength} bytes)`);
      return null;
    }
    // If a PDF was requested, verify the bytes actually start with %PDF-.
    // Otherwise we'd be base64-encoding an HTML error/landing page and
    // delivering it as a .pdf — which is exactly why Gmail showed a blank
    // document. Reject so the caller surfaces a clear error.
    if (contentType === "application/pdf") {
      const head = buf.subarray(0, 5);
      const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46 && head[4] === 0x2d;
      if (!isPdf) {
        console.warn(`[fetchEmailAttachment] ${name} fetched but is not a PDF (first bytes: ${Array.from(head).join(",")}). Refusing to attach.`);
        return null;
      }
    }
    return {
      filename: name,
      content: bytesToBase64(buf),
      content_type: contentType,
    };
  } catch (err) {
    console.warn(`[fetchEmailAttachment] Failed to fetch ${u}:`, err);
    return null;
  }
}
