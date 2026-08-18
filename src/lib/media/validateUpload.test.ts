import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  MAX_BYTES,
  partitionValidMedia,
  sanitizeFileName,
  validateMediaFile,
  type MediaKind,
  type ValidationFailure,
  type ValidationResult,
} from "./validateUpload";

/**
 * Assert the call was rejected and hand back the typed failure.
 *
 * The explicit return annotation is load-bearing: this project compiles with
 * `strictNullChecks` off, where narrowing a discriminated union on a literal
 * boolean does not hold, so `if (r.ok) throw` alone leaves `r` widened.
 */
function success(r: ValidationResult): { ok: true; kind: MediaKind; safeName: string } {
  if (!r.ok) throw new Error(`expected the file to be accepted, but: ${(r as ValidationFailure).message}`);
  return r as { ok: true; kind: MediaKind; safeName: string };
}

function failure(r: ValidationResult): ValidationFailure {
  if (r.ok) throw new Error("expected the file to be rejected, but it was accepted");
  return r as ValidationFailure;
}

/**
 * Audit finding 3.3 — the listing-media upload path had no size or type
 * validation of any kind before the file reached Storage. These lock the
 * checks that replaced it, with particular attention to the case a plain
 * extension check misses: a file renamed to look like an image.
 */

const head = (bytes: number[], length = 16) => {
  const out = new Uint8Array(length);
  bytes.forEach((b, i) => (out[i] = b));
  return out;
};

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const PDF = [0x25, 0x50, 0x44, 0x46];
const WEBP = (() => {
  const b = new Array(12).fill(0);
  [0x52, 0x49, 0x46, 0x46].forEach((v, i) => (b[i] = v));
  [0x57, 0x45, 0x42, 0x50].forEach((v, i) => (b[8 + i] = v));
  return b;
})();
/** Windows PE executable — the thing an attacker would try to smuggle. */
const EXE = [0x4d, 0x5a, 0x90, 0x00];

const file = (name: string, type: string, size: number) => ({ name, type, size });

describe("validateMediaFile", () => {
  it("accepts a real JPEG", async () => {
    const r = await validateMediaFile(file("villa.jpg", "image/jpeg", 2048), async () => head(JPEG));
    expect(r.ok).toBe(true);
    expect(success(r).kind).toBe("image");
  });

  it("accepts a real webp, whose marker sits at offset 8", async () => {
    const r = await validateMediaFile(file("hero.webp", "image/webp", 4096), async () => head(WEBP));
    expect(r.ok).toBe(true);
  });

  it("rejects an executable renamed and relabelled as a JPEG", async () => {
    const r = await validateMediaFile(file("payload.jpg", "image/jpeg", 4096), async () => head(EXE));
    const f = failure(r);
    expect(f.reason).toBe("signature");
    expect(f.message).toMatch(/do not match/i);
  });

  it("rejects a type that is not on the allowlist", async () => {
    const r = await validateMediaFile(file("script.svg", "image/svg+xml", 512), async () => head(JPEG));
    expect(failure(r).reason).toBe("type");
  });

  it("rejects an extension that contradicts the declared MIME type", async () => {
    const r = await validateMediaFile(file("brochure.png", "application/pdf", 1024), async () => head(PDF));
    expect(failure(r).reason).toBe("extension");
  });

  it("enforces the per-kind size cap", async () => {
    const tooBig = MAX_BYTES.image + 1;
    const r = await validateMediaFile(file("huge.png", "image/png", tooBig), async () => head(PNG));
    const f = failure(r);
    expect(f.reason).toBe("size");
    expect(f.message).toMatch(/20 MB/);
  });

  it("allows a video far larger than the image cap", async () => {
    const r = await validateMediaFile(
      file("tour.mp4", "video/mp4", MAX_BYTES.image * 5),
      async () => head([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]),
    );
    expect(r.ok).toBe(true);
    expect(success(r).kind).toBe("video");
  });

  it("rejects an empty file", async () => {
    const r = await validateMediaFile(file("empty.png", "image/png", 0), async () => head(PNG));
    expect(failure(r).reason).toBe("empty");
  });
});

describe("sanitizeFileName", () => {
  it("strips path separators so a filename cannot choose its storage location", () => {
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("..");
  });

  it("collapses characters that are unsafe in a storage key", () => {
    expect(sanitizeFileName("my photo (1)#.jpg")).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it("never returns an empty name", () => {
    expect(sanitizeFileName("...")).toBe("file");
    expect(sanitizeFileName("")).toBe("file");
  });

  it("caps runaway lengths", () => {
    expect(sanitizeFileName("a".repeat(500) + ".jpg").length).toBeLessThanOrEqual(120);
  });
});

describe("partitionValidMedia", () => {
  it("keeps good files and explains each rejection", async () => {
    const files = [
      file("ok.jpg", "image/jpeg", 1024),
      file("bad.exe", "application/x-msdownload", 1024),
      file("fake.png", "image/png", 1024),
    ] as unknown as File[];

    const readHead = async (f: File) => head(f.name === "fake.png" ? EXE : JPEG);
    const { accepted, rejected } = await partitionValidMedia(files, readHead);

    expect(accepted.map((a) => a.file.name)).toEqual(["ok.jpg"]);
    expect(rejected).toHaveLength(2);
    expect(rejected.join(" ")).toMatch(/bad\.exe/);
    expect(rejected.join(" ")).toMatch(/fake\.png/);
  });
});

describe("allowlist", () => {
  it("does not permit SVG, which can carry script", () => {
    expect(ALLOWED_MIME_TYPES).not.toContain("image/svg+xml");
  });

  it("covers the types the ingest UI advertises", () => {
    for (const t of ["image/jpeg", "image/png", "video/mp4", "application/pdf"]) {
      expect(ALLOWED_MIME_TYPES).toContain(t);
    }
  });
});
