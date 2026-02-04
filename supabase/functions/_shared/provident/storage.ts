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
  // %PDF magic bytes
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/**
 * Mirror a remote PDF to our public storage.
 * FIXED: 
 * 1. Relaxed URL check - now accepts any URL that might be a PDF (not just .pdf extension)
 * 2. Added proper headers to avoid 403s
 * 3. Accepts PDF if content-type says so OR magic bytes match
 * 4. Returns structured error reasons for debugging
 */
export async function mirrorRemotePdfToPublicStorage(args: {
  supabase: SupabaseLike;
  bucket: string;
  slug: string;
  type: "brochure" | "payment_plan" | "floor_plan";
  index?: number;
  sourceUrl: string;
  projectNameForFile?: string;
}): Promise<{ publicUrl: string; path: string; bytes: number; error?: string } | null> {
  const { supabase, bucket, slug, type, index = 0, sourceUrl } = args;

  // RELAXED: Accept URLs that look like they might be PDFs (even without .pdf extension)
  // Some CDNs serve PDFs with query strings or redirects
  const looksLikePdf = /\.pdf(\?|$)|\/pdf\//i.test(sourceUrl) || 
                       sourceUrl.includes("brochure") || 
                       sourceUrl.includes("floorplan") ||
                       sourceUrl.includes("payment");
  
  if (!looksLikePdf) {
    console.warn(`[mirrorPdf] Skipping non-PDF-like URL: ${sourceUrl.substring(0, 80)}...`);
    return null;
  }

  try {
    const res = await fetch(sourceUrl, { 
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    
    if (!res.ok) {
      console.warn(`[mirrorPdf] Download failed ${res.status}: ${sourceUrl}`);
      return { publicUrl: "", path: "", bytes: 0, error: `DOWNLOAD_FAILED_${res.status}` };
    }

    const contentType = res.headers.get("content-type") || "";
    const buf = new Uint8Array(await res.arrayBuffer());
    
    // FIXED: Accept if EITHER magic bytes match OR content-type says PDF
    const hasPdfMagic = isProbablyPdf(buf);
    const hasPdfContentType = contentType.includes("application/pdf");
    
    if (!hasPdfMagic && !hasPdfContentType) {
      console.warn(`[mirrorPdf] Not a PDF (magic: ${hasPdfMagic}, content-type: ${contentType}): ${sourceUrl}`);
      return { publicUrl: "", path: "", bytes: 0, error: "NOT_PDF_CONTENT" };
    }

    // Limit: 50MB
    if (buf.byteLength > 50 * 1024 * 1024) {
      console.warn(`[mirrorPdf] PDF too large (${buf.byteLength} bytes): ${sourceUrl}`);
      return { publicUrl: "", path: "", bytes: 0, error: "PDF_TOO_LARGE" };
    }

    const safeSlug = sanitizePathSegment(slug || "unknown");
    const suffix = type === "floor_plan" ? `-${index + 1}` : "";
    const fileName = `${type}${suffix}.pdf`;
    const path = `provident/${safeSlug}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buf, { contentType: "application/pdf", upsert: true });

    if (error) {
      console.warn(`[mirrorPdf] Upload failed: ${error.message}`);
      return { publicUrl: "", path: "", bytes: 0, error: `UPLOAD_FAILED: ${error.message}` };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log(`[mirrorPdf] Success: ${path} (${buf.byteLength} bytes)`);
    return { publicUrl: data.publicUrl, path, bytes: buf.byteLength };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[mirrorPdf] Exception: ${errMsg}`);
    return { publicUrl: "", path: "", bytes: 0, error: `EXCEPTION: ${errMsg}` };
  }
}
