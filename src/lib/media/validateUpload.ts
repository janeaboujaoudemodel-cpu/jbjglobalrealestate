/**
 * Validation for listing-media uploads.
 *
 * The owner media-ingest path uploads straight from the browser to Supabase
 * Storage, so there is no edge function in the middle to inspect the bytes.
 * `secure-file-upload/index.ts` does this properly for profile pictures — size
 * caps, MIME allowlist, extension-vs-MIME cross-check and magic-byte sniffing —
 * but none of it was applied to the listing-media path, which is the more
 * valuable target: those files are published to public listing pages.
 *
 * This module is the client half. The server half is bucket-level
 * `allowed_mime_types` / `file_size_limit` on `rel-media`, which Storage
 * enforces no matter what the client does. Neither half is sufficient alone:
 * the bucket cannot tell a renamed `.exe` from a real JPEG, and the client can
 * be bypassed entirely. Together they cover both.
 */

export type MediaKind = "image" | "video" | "document";

export interface MediaTypeSpec {
  kind: MediaKind;
  /** Extensions this MIME type may legitimately carry. */
  extensions: string[];
  /** Leading byte signatures. `offset` defaults to 0. */
  signatures: Array<{ bytes: number[]; offset?: number }>;
}

/** Per-kind size caps, in bytes. */
export const MAX_BYTES: Record<MediaKind, number> = {
  image: 20 * 1024 * 1024, // 20 MB
  document: 50 * 1024 * 1024, // 50 MB
  video: 500 * 1024 * 1024, // 500 MB
};

/** The single source of truth for what listing media may be. */
export const ALLOWED_TYPES: Record<string, MediaTypeSpec> = {
  "image/jpeg": { kind: "image", extensions: ["jpg", "jpeg"], signatures: [{ bytes: [0xff, 0xd8, 0xff] }] },
  "image/png": { kind: "image", extensions: ["png"], signatures: [{ bytes: [0x89, 0x50, 0x4e, 0x47] }] },
  "image/gif": { kind: "image", extensions: ["gif"], signatures: [{ bytes: [0x47, 0x49, 0x46, 0x38] }] },
  "image/webp": {
    kind: "image",
    extensions: ["webp"],
    // RIFF....WEBP — the format marker sits after the 4-byte length field.
    signatures: [{ bytes: [0x52, 0x49, 0x46, 0x46] }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  },
  "application/pdf": { kind: "document", extensions: ["pdf"], signatures: [{ bytes: [0x25, 0x50, 0x44, 0x46] }] },
  "video/mp4": { kind: "video", extensions: ["mp4", "m4v"], signatures: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }] },
  "video/quicktime": { kind: "video", extensions: ["mov"], signatures: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }] },
  "video/webm": { kind: "video", extensions: ["webm"], signatures: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }] },
  // OOXML documents are ZIP containers.
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    kind: "document",
    extensions: ["pptx"],
    signatures: [{ bytes: [0x50, 0x4b, 0x03, 0x04] }],
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    kind: "document",
    extensions: ["docx"],
    signatures: [{ bytes: [0x50, 0x4b, 0x03, 0x04] }],
  },
  // Legacy Office files are OLE compound documents.
  "application/vnd.ms-powerpoint": {
    kind: "document",
    extensions: ["ppt"],
    signatures: [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
  },
  "application/msword": {
    kind: "document",
    extensions: ["doc"],
    signatures: [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }],
  },
};

export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_TYPES);

/** Bytes needed to check the longest signature, including its offset. */
const SNIFF_BYTES = 16;

export type ValidationFailure =
  | { ok: false; reason: "type"; message: string }
  | { ok: false; reason: "extension"; message: string }
  | { ok: false; reason: "size"; message: string }
  | { ok: false; reason: "empty"; message: string }
  | { ok: false; reason: "signature"; message: string };

export type ValidationResult = { ok: true; kind: MediaKind; safeName: string } | ValidationFailure;

const formatMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

/**
 * Strip a filename down to something safe to place in a storage key.
 *
 * Storage paths are built by string concatenation, so a name containing `/` or
 * `..` decides where the object lands. Collapses to `[A-Za-z0-9._-]`, drops
 * leading dots, and caps the length.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").replace(/_{2,}/g, "_");
  const trimmed = cleaned.slice(0, 120);
  return trimmed.length > 0 ? trimmed : "file";
}

function extensionOf(name: string): string | null {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : null;
}

function matchesSignature(head: Uint8Array, spec: MediaTypeSpec): boolean {
  return spec.signatures.every(({ bytes, offset = 0 }) =>
    bytes.every((byte, i) => head[offset + i] === byte),
  );
}

/**
 * Validate one file. `readHead` is injectable so this runs under Node in tests
 * without a DOM `File`.
 */
export async function validateMediaFile(
  file: Pick<File, "name" | "size" | "type"> & { slice?: File["slice"] },
  readHead?: (f: typeof file) => Promise<Uint8Array>,
): Promise<ValidationResult> {
  const spec = ALLOWED_TYPES[file.type];
  if (!spec) {
    return {
      ok: false,
      reason: "type",
      message: `${file.name}: ${file.type || "unknown type"} is not an accepted media type.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, reason: "empty", message: `${file.name} is empty.` };
  }

  const limit = MAX_BYTES[spec.kind];
  if (file.size > limit) {
    return {
      ok: false,
      reason: "size",
      message: `${file.name} is ${formatMb(file.size)} — the limit for ${spec.kind} files is ${formatMb(limit)}.`,
    };
  }

  const ext = extensionOf(file.name);
  if (!ext || !spec.extensions.includes(ext)) {
    return {
      ok: false,
      reason: "extension",
      message: `${file.name}: extension does not match its declared type (${file.type}).`,
    };
  }

  const head = readHead ? await readHead(file) : await defaultReadHead(file as File);
  if (!matchesSignature(head, spec)) {
    return {
      ok: false,
      reason: "signature",
      message: `${file.name}: file contents do not match a ${file.type} file.`,
    };
  }

  return { ok: true, kind: spec.kind, safeName: sanitizeFileName(file.name) };
}

async function defaultReadHead(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, SNIFF_BYTES).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Split a batch into accepted files and human-readable rejection messages. */
export async function partitionValidMedia(
  files: File[],
  readHead?: (f: File) => Promise<Uint8Array>,
): Promise<{ accepted: Array<{ file: File; kind: MediaKind; safeName: string }>; rejected: string[] }> {
  const accepted: Array<{ file: File; kind: MediaKind; safeName: string }> = [];
  const rejected: string[] = [];
  for (const file of files) {
    const result = await validateMediaFile(file, readHead as never);
    if (result.ok) {
      accepted.push({ file, kind: result.kind, safeName: result.safeName });
    } else {
      // This project compiles with `strictNullChecks` off, where narrowing a
      // discriminated union on a literal boolean does not hold — hence the
      // explicit cast rather than relying on the `else` branch.
      rejected.push((result as ValidationFailure).message);
    }
  }
  return { accepted, rejected };
}
