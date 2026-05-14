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
