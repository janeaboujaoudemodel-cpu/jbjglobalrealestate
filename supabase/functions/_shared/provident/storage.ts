type SupabaseLike = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Blob | ArrayBuffer | Uint8Array,
        options?: { contentType?: string; upsert?: boolean },
      ) => Promise<{ data: unknown; error: { message: string; statusCode?: string | number } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

function sanitizePathSegment(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isProbablyPdf(bytes: Uint8Array): boolean {
  // %PDF
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export async function mirrorRemotePdfToPublicStorage(args: {
  supabase: SupabaseLike;
  bucket: string;
  slug: string;
  type: "brochure" | "payment_plan" | "floor_plan";
  index?: number;
  sourceUrl: string;
  projectNameForFile?: string;
}): Promise<{ publicUrl: string; path: string; bytes: number } | null> {
  const { supabase, bucket, slug, type, index = 0, sourceUrl } = args;

  // Hard safety to avoid pulling nonsense URLs
  if (!/\.pdf(\?|$)/i.test(sourceUrl)) return null;

  const res = await fetch(sourceUrl, { redirect: "follow" });
  if (!res.ok) {
    console.warn(`[mirrorPdf] Download failed ${res.status}: ${sourceUrl}`);
    return null;
  }

  const contentType = res.headers.get("content-type") || "application/pdf";
  const buf = new Uint8Array(await res.arrayBuffer());
  if (!isProbablyPdf(buf)) {
    console.warn(`[mirrorPdf] Not a PDF (magic bytes mismatch): ${sourceUrl}`);
    return null;
  }

  // Limit: 50MB
  if (buf.byteLength > 50 * 1024 * 1024) {
    console.warn(`[mirrorPdf] PDF too large (${buf.byteLength} bytes): ${sourceUrl}`);
    return null;
  }

  const safeSlug = sanitizePathSegment(slug || "unknown");
  const suffix = type === "floor_plan" ? `-${index + 1}` : "";
  const fileName = `${type}${suffix}.pdf`;
  const path = `provident/${safeSlug}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buf, { contentType: contentType || "application/pdf", upsert: true });

  if (error) {
    console.warn(`[mirrorPdf] Upload failed: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path, bytes: buf.byteLength };
}
