import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEVELOPER_KEYWORDS: Record<string, string[]> = {
  "Emaar": ["emaar", "downtown", "dubai hills", "creek harbour", "arabian ranches"],
  "DAMAC": ["damac", "cavalli", "paramount", "aykon"],
  "Sobha": ["sobha", "hartland", "creek vistas"],
  "Nakheel": ["nakheel", "palm", "jumeirah islands"],
  "Meraas": ["meraas", "city walk", "la mer", "bluewaters"],
  "Dubai Properties": ["dubai properties", "business bay", "culture village"],
  "Azizi": ["azizi", "riviera", "aura"],
  "Danube": ["danube", "elz", "bayz", "viewz"],
  "Binghatti": ["binghatti", "jacob"],
  "Select Group": ["select group", "jumeirah living", "peninsula"],
  "MAG": ["mag", "meydan"],
  "Ellington": ["ellington", "wilton"],
  "Omniyat": ["omniyat", "one palm", "alba"],
  "Deyaar": ["deyaar", "montrose"],
  "MTS Development": ["mts", "sunset bay"],
  "Imtiaz": ["imtiaz"],
  "Reportage": ["reportage"],
  "Tiger Group": ["tiger"],
  "Samana": ["samana"],
  "Object 1": ["object 1"],
  "Vincitore": ["vincitore"],
  "Citi Developer": ["citi developer", "citideveloper"],
};

function detectDeveloper(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [developer, keywords] of Object.entries(DEVELOPER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return developer;
    }
  }
  return null;
}

function toSlug(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function inferProjectNameFromFiles(files: { name: string; url: string; type: string }[]): string {
  if (!files.length) return "Uploaded Project";
  const first = files[0].name || "Uploaded Project";
  const cleaned = first
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(brochure|floor\s?plan|payment\s?plan|image|photo|doc|document|final|v\d+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 2 ? cleaned : "Uploaded Project";
}

/**
 * Humanize a document filename into a clean display title.
 * Strips extensions, underscores/dashes, trailing "(1)", title-cases.
 */
function humanizeDocTitle(rawName: string): string {
  let t = rawName
    .replace(/\.[a-z0-9]{2,5}$/i, "")       // strip extension
    .replace(/\(\d+\)\s*$/g, "")              // strip trailing (1)
    .replace(/[-_]+/g, " ")                   // dashes/underscores to spaces
    .replace(/\s+/g, " ")                     // collapse spaces
    .trim();
  if (!t) return rawName;
  // Title case
  return t.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Classify a document by its filename into a standard type.
 */
function classifyDocument(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("brochure")) return "brochure";
  if (lower.includes("fact") && lower.includes("sheet")) return "fact_sheet";
  if (lower.includes("payment") && lower.includes("plan")) return "payment_plan";
  if (lower.includes("floor") || lower.includes("layout")) return "floor_plan";
  if (lower.includes("inventory")) return "inventory";
  if (lower.includes("price") && lower.includes("list")) return "price_list";
  if (lower.includes("eoi")) return "eoi";
  return "document";
}

/**
 * Merge arrays by deduplicating on a key extractor.
 */
function mergeArrays<T>(existing: T[], incoming: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set(existing.map(keyFn));
  const merged = [...existing];
  for (const item of incoming) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

async function saveDocumentsToStorage(
  supabase: any,
  projectSlug: string,
  documents: { url: string; type: string; name: string }[]
): Promise<{ url: string; storage_url: string; type: string; name: string }[]> {
  const saved: { url: string; storage_url: string; type: string; name: string }[] = [];

  for (const doc of documents) {
    try {
      const res = await fetch(doc.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) {
        saved.push({ ...doc, storage_url: doc.url });
        continue;
      }
      const blob = await res.blob();
      const ext = doc.url.split("?")[0].split(".").pop() || "pdf";
      const fileName = `${doc.type}-${Date.now()}.${ext}`;
      const storagePath = `listings/${projectSlug}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(storagePath, blob, { contentType: blob.type || "application/pdf", upsert: true });

      if (uploadErr) {
        saved.push({ ...doc, storage_url: doc.url });
        continue;
      }
      const { data: publicData } = supabase.storage.from("project-documents").getPublicUrl(storagePath);
      saved.push({ ...doc, storage_url: publicData?.publicUrl || doc.url });
    } catch (err) {
      console.error(`[extract] Error saving doc ${doc.url}:`, err);
      saved.push({ ...doc, storage_url: doc.url });
    }
  }
  return saved;
}

async function matchDeveloperId(supabase: any, devName: string | null): Promise<string | null> {
  if (!devName) return null;
  try {
    const norm = devName.toLowerCase().trim();
    const { data } = await supabase
      .from("developers")
      .select("id, name")
      .ilike("name", `%${norm}%`)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id;

    const words = norm.split(/\s+/).filter((w: string) => w.length > 3);
    for (const word of words) {
      const { data: wordMatch } = await supabase
        .from("developers")
        .select("id")
        .ilike("name", `%${word}%`)
        .limit(1)
        .maybeSingle();
      if (wordMatch?.id) return wordMatch.id;
    }
  } catch (err) {
    console.error("[extract] Developer match error:", err);
  }
  return null;
}

/**
 * Find existing pending import by source_url first, then slug.
 * Returns { id, images, documents, ... } or null.
 */
async function findExistingPending(supabase: any, sourceUrl: string | null, slug: string): Promise<any | null> {
  // Try source_url first (unique index)
  if (sourceUrl) {
    const { data } = await supabase
      .from("pending_project_imports")
      .select("*")
      .eq("source_url", sourceUrl)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  // Fallback to slug
  const { data } = await supabase
    .from("pending_project_imports")
    .select("*")
    .eq("slug", slug)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

/**
 * Update job progress in listing_extraction_queue.
 */
async function updateJobProgress(supabase: any, jobId: string | null, message: string) {
  if (!jobId) return;
  try {
    await supabase
      .from("listing_extraction_queue")
      .update({ results: { progress: message } })
      .eq("id", jobId);
  } catch {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let parsedJobId: string | null = null;
  try {
    const body = await req.json();
    const {
      url,
      urls,
      files,
      userId,
      albumName,
      auto_approve: _auto_approve_raw = false,
      queue = true,
      retryImportId,
      async_mode = false,
      job_id,
    } = body;
    parsedJobId = job_id || null;

    const urlList: string[] = urls || (url ? [url] : []);
    const fileList: { name: string; url: string; type: string }[] = Array.isArray(files) ? files : [];
    const auto_approve = false; // ENFORCED: Manual publish only

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── ASYNC QUEUE MODE ──
    if (async_mode && !job_id && (urlList.length > 0 || fileList.length > 0)) {
      const { data: job, error: jobErr } = await supabase
        .from("listing_extraction_queue")
        .insert({
          user_id: userId,
          urls: urlList,
          files: fileList,
          auto_approve,
          status: "pending",
        })
        .select("id")
        .single();

      if (jobErr) {
        return new Response(
          JSON.stringify({ success: false, error: `Queue insert failed: ${jobErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const selfUrl = `${supabaseUrl}/functions/v1/extract-listing-from-link`;
      fetch(selfUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          job_id: job.id, urls: urlList, files: fileList, userId, auto_approve, albumName,
        }),
      }).catch(err => console.error("[extract] Fire-and-forget error:", err));

      return new Response(
        JSON.stringify({ success: true, async: true, jobId: job.id, status: "queued", message: "Extraction queued. Polling for results..." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PROCESSING A QUEUED JOB ──
    if (job_id) {
      await supabase.from("listing_extraction_queue").update({ status: "processing" }).eq("id", job_id);
    }

    // Handle retry
    if (retryImportId) {
      try {
        const { data: imp } = await supabase
          .from("pending_project_imports")
          .select("*")
          .eq("id", retryImportId)
          .maybeSingle();

        if (!imp) {
          return new Response(
            JSON.stringify({ success: false, error: "Import not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("pending_project_imports")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", retryImportId);

        return new Response(
          JSON.stringify({
            success: true,
            results: [{
              success: true, importId: imp.id, projectName: imp.name, developer: imp.developer_name,
              location: imp.location, status: "pending-approval",
              media: { images: (imp.images as any[])?.length || 0, documents: (imp.documents as any[])?.length || 0, videos: 0 },
              view_url: `/listing-admin/preview/${imp.id}`, duration_ms: 0, retried: true,
            }],
            succeeded: 1, failed: 0, total: 1, message: "Import reset to pending.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (retryErr: any) {
        return new Response(
          JSON.stringify({ success: false, error: retryErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (urlList.length === 0 && fileList.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "URL or files are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY && urlList.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    // ── FILE UPLOADS (PHASE A: merge instead of overwrite) ──
    if (fileList.length > 0) {
      const startTime = Date.now();
      const projectName = albumName || inferProjectNameFromFiles(fileList);
      const slug = toSlug(projectName);
      const joinedText = fileList.map((f) => `${f.name} ${f.url}`).join(" ");
      const devName = detectDeveloper(joinedText);
      const devId = await matchDeveloperId(supabase, devName);

      await updateJobProgress(supabase, job_id, `Processing ${fileList.length} files for "${projectName}"...`);

      const imagesPayload = fileList
        .filter((f) => f.type === "image")
        .map((f, i) => ({ url: f.url, alt_text: `${projectName} - Image ${i + 1}`, display_order: i }));

      const documentsPayload = fileList
        .filter((f) => f.type !== "image")
        .map((f, i) => {
          const docType = classifyDocument(f.name);
          return { url: f.url, original_url: f.url, type: docType, name: humanizeDocTitle(f.name || `Document ${i + 1}`) };
        });

      // Stable source_url for file uploads — never use the PDF URL
      const stableSourceUrl = `manual://${userId || "anon"}/${slug}`;

      try {
        // PHASE A: Find existing by stable source_url OR slug, then MERGE
        const existing = await findExistingPending(supabase, stableSourceUrl, slug);

        let importId: string | null = null;

        if (existing?.id) {
          // MERGE: append images/docs instead of replacing
          const existingImages = Array.isArray(existing.images) ? existing.images : [];
          const existingDocs = Array.isArray(existing.documents) ? existing.documents : [];
          
          const mergedImages = mergeArrays(existingImages, imagesPayload, (img: any) => img.url);
          const mergedDocs = mergeArrays(existingDocs, documentsPayload, (doc: any) => doc.url);

          const updatePayload: Record<string, any> = {
            images: mergedImages,
            documents: mergedDocs,
            updated_at: new Date().toISOString(),
            status: "pending",
          };
          // Only overwrite scalar fields if they were null/empty before
          if (!existing.developer_name && devName) updatePayload.developer_name = devName;
          if (!existing.developer_id && devId) updatePayload.developer_id = devId;
          if (albumName && existing.name === "Uploaded Project") updatePayload.name = projectName;

          const { error } = await supabase
            .from("pending_project_imports")
            .update(updatePayload)
            .eq("id", existing.id);
          if (error) throw new Error(`Update failed: ${error.message}`);
          importId = existing.id;
        } else {
          const importPayload: Record<string, any> = {
            name: projectName,
            slug,
            developer_name: devName || null,
            developer_id: devId,
            location: null,
            emirate: null, // STRICT: don't guess emirate from file uploads
            description: null, // PHASE B: No "Generated from X files" text
            images: imagesPayload,
            documents: documentsPayload,
            source_url: stableSourceUrl,
            is_new_project: true,
            status: "pending",
            enrichment_source: "file-upload",
            review_notes: JSON.stringify({ missing_fields: ["location", "emirate", "description"], source: "file-upload" }),
          };

          const { data: inserted, error } = await supabase
            .from("pending_project_imports")
            .insert(importPayload)
            .select("id")
            .single();
          if (error) throw new Error(`Insert failed: ${error.message}`);
          importId = inserted!.id;
        }

        // Log
        if (userId) {
          await supabase.from("listing_uploads").insert({
            user_id: userId, drive_url: stableSourceUrl, url_type: "upload",
            status: "completed", extracted_data: { projectName, files: fileList.length },
            created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
          }).then(() => {}).catch(() => {});
        }

        results.push({
          success: true, importId, projectName, developer: devName, location: null,
          status: "pending-approval",
          files_processed: fileList.length,
          media: { images: imagesPayload.length, documents: documentsPayload.length, videos: 0 },
          view_url: `/listing-admin/preview/${importId}`,
          duration_ms: Date.now() - startTime,
        });
      } catch (fileErr: any) {
        console.error("[extract] File processing error:", fileErr);
        results.push({
          success: false, name: projectName, error: fileErr.message,
          source_url: stableSourceUrl,
          duration_ms: Date.now() - startTime,
        });
      }
    }

    // ── URL EXTRACTION (PARALLEL) ──
    const urlPromises = urlList.map(async (rawUrl, urlIndex) => {
      const startTime = Date.now();
      let formattedUrl = rawUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log(`[extract] Processing: ${formattedUrl}`);
      await updateJobProgress(supabase, job_id, `Processing link ${urlIndex + 1}/${urlList.length}: ${formattedUrl}`);

      try {
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "links", "html"], onlyMainContent: false, waitFor: 8000 }),
        });

        const scrapeData = await scrapeResponse.json();
        if (!scrapeResponse.ok || !scrapeData.success) {
          return { url: formattedUrl, success: false, error: scrapeData.error || "Scrape failed" };
        }

        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];
        const html = scrapeData.data?.rawHtml || scrapeData.data?.html || "";
        const metadata = scrapeData.data?.metadata || {};
        const allContent = markdown + "\n" + html + "\n" + links.join("\n");

        // Images - filter out icons, flags, sprites, and decode Next.js proxy URLs
        const imageUrls: string[] = [];
        const seenImg = new Set<string>();
        const imgPatterns = [
          /https?:\/\/[^\s"'<>)+]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>)]*)?/gi,
          /https?:\/\/[a-z0-9-]+\.cloudfront\.net\/[^\s"'<>)+]+/gi,
        ];
        const EXCLUDED_IMG_PATTERNS = /logo|icon|avatar|placeholder|spinner|favicon|flags?\/|sprite|badge|arrow|chevron|_next\/static|fact[-_]?sheet|brand[-_]?guideline|broker[-_]?kit|material\.webp|film\.webp|about\.webp|book\.webp|company[-_]?profile|credential|certificate/i;
        for (const pat of imgPatterns) {
          for (const m of allContent.matchAll(pat)) {
            let rawImgUrl = m[0];
            // Decode Next.js proxy URLs to absolute originals
            const nextProxyMatch = rawImgUrl.match(/\/_next\/image\?url=([^&]+)/);
            if (nextProxyMatch) {
              try {
                const decoded = decodeURIComponent(nextProxyMatch[1]);
                // Make absolute if relative
                if (decoded.startsWith("/")) {
                  try {
                    const origin = new URL(formattedUrl).origin;
                    rawImgUrl = `${origin}${decoded}`;
                  } catch { rawImgUrl = decoded; }
                } else {
                  rawImgUrl = decoded;
                }
              } catch {}
            }
            const u = rawImgUrl.split("?")[0];
            if (!seenImg.has(u) && !EXCLUDED_IMG_PATTERNS.test(u) && u.length > 20) {
              seenImg.add(u);
              imageUrls.push(rawImgUrl);
            }
          }
        }

        // PDFs
        const pdfUrls: string[] = [];
        const seenPdf = new Set<string>();
        for (const m of allContent.matchAll(/https?:\/\/[^\s"'<>)+]+\.pdf(?:\?[^\s"'<>)]*)?/gi)) {
          const clean = m[0].split("?")[0];
          if (!seenPdf.has(clean)) { seenPdf.add(clean); pdfUrls.push(m[0]); }
        }

        // Videos
        const videoUrls: string[] = [];
        for (const m of allContent.matchAll(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/gi)) {
          videoUrls.push(`https://www.youtube.com/watch?v=${m[1]}`);
        }
        for (const m of allContent.matchAll(/https?:\/\/[^\s"'<>)+]+\.(?:mp4|webm)/gi)) {
          videoUrls.push(m[0]);
        }

        // AI extraction with STRICT no-hallucination rules
        let extractedData: any = null;
        const combinedContent = (markdown + "\n\n" + html).trim();
        if (LOVABLE_API_KEY && combinedContent.length > 100) {
          try {
            const contentForAI = combinedContent.substring(0, 80000);

            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-pro",
                max_tokens: 8000,
                temperature: 0.05,
                messages: [
                  { role: "system", content: `You are a senior UAE real estate data extraction specialist with 15 years experience. Your job is to extract EVERY SINGLE piece of information from property listings with 100% completeness and accuracy. You must be EXHAUSTIVE — missing even one amenity, one unit type, or one payment milestone is a failure.

EXTRACTION PRIORITY (extract ALL of these):
1. PROJECT IDENTITY: Official project name, developer/builder name, RERA number
2. LOCATION: Area/community, emirate, city, country — ONLY if explicitly stated
3. PRICING: Starting price, price range, price per sqft for EVERY unit type
4. UNIT TYPES: Extract EVERY bedroom configuration with size ranges (sqft), price ranges, bathroom count, available units count
5. PAYMENT PLAN: Full payment plan with EVERY milestone, percentage, timing, and amount
6. AMENITIES: List ALL amenities mentioned — pools, gyms, parks, retail, restaurants, spas, kids areas, etc. Be thorough.
7. KEY FEATURES & HIGHLIGHTS: Every selling point, unique feature, and highlight
8. PROJECT DETAILS: Total units, floors, completion/handover date, construction status, service charges
9. DESCRIPTION: The FULL project description text as written. Copy it verbatim. Do NOT summarize or shorten it.
10. NEARBY LANDMARKS: All mentioned distances to landmarks, schools, hospitals, malls, airports, metro stations
11. FAQs: Any Q&A sections

STRICT RULES — NO HALLUCINATION:
- ONLY extract information EXPLICITLY stated in the content. If not present → null.
- NEVER guess emirate, location, prices, developer, or amenities.
- If emirate not explicitly mentioned → null. NEVER default to "Dubai".
- Copy description VERBATIM from the page. NEVER generate or synthesize one.
- For amenities: extract EVERY SINGLE one mentioned, even if listed in image alt text or footer.
- For unit types: extract ALL configurations with their FULL details (size, price, bathrooms).
- For payment plans: extract EVERY step/milestone with percentage AND timing.` },
                  { role: "user", content: `Extract EVERY property/project detail from this content. Be EXHAUSTIVE — capture all amenities, all unit types, all payment milestones, full description. Return null for anything truly not found.

URL: ${formattedUrl}
Page Title: ${metadata.title || ""}

FULL CONTENT:
${contentForAI}` },
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_project",
                    description: "Extract comprehensive structured project data — null for missing fields",
                    parameters: {
                      type: "object",
                      properties: {
                        name: { type: ["string", "null"], description: "Official project name" },
                        developer: { type: ["string", "null"], description: "Developer/builder name" },
                        location: { type: ["string", "null"], description: "Area/community (e.g. Dubai Marina, JVC)" },
                        emirate: { type: ["string", "null"], description: "Emirate — ONLY if explicitly stated" },
                        priceFrom: { type: ["number", "null"] },
                        priceTo: { type: ["number", "null"] },
                        bedroomsMin: { type: ["number", "null"] },
                        bedroomsMax: { type: ["number", "null"] },
                        handoverDate: { type: ["string", "null"] },
                        completionPercentage: { type: ["number", "null"] },
                        description: { type: ["string", "null"], description: "Full project description from content. Do NOT generate." },
                        amenities: { type: "array", items: { type: "string" } },
                        paymentPlan: { type: ["string", "null"] },
                        paymentBreakdown: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              milestone: { type: "string" },
                              percentage: { type: "number" },
                              amount: { type: "string" },
                              timing: { type: "string" }
                            }
                          },
                        },
                        unitTypes: { type: "array", items: { type: "string" } },
                        unitDetails: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: { type: "string" },
                              sizeMin: { type: "number" },
                              sizeMax: { type: "number" },
                              priceFrom: { type: "number" },
                              priceTo: { type: "number" },
                              bathrooms: { type: "number" },
                              availableUnits: { type: "number" },
                              floorPlanTypes: { type: "array", items: { type: "string" } }
                            }
                          },
                        },
                        projectStatus: { type: ["string", "null"] },
                        keyFeatures: { type: "array", items: { type: "string" } },
                        propertyType: { type: ["string", "null"] },
                        serviceCharge: { type: ["string", "null"] },
                        totalUnits: { type: ["number", "null"] },
                        floors: { type: ["number", "null"] },
                        sizeMin: { type: ["number", "null"] },
                        sizeMax: { type: ["number", "null"] },
                        highlights: { type: "array", items: { type: "string" } },
                        nearbyLandmarks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, distance: { type: "string" }, time: { type: "string" } }
                          }
                        },
                        reraNumber: { type: ["string", "null"] },
                        faqs: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } },
                      },
                      required: ["name"],
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "extract_project" } },
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCall?.function?.arguments) {
                try { extractedData = JSON.parse(toolCall.function.arguments); } catch {}
              }
              if (!extractedData) {
                const content = aiData.choices?.[0]?.message?.content || "";
                try { extractedData = JSON.parse(content.replace(/```json\n?|\\n?```/g, "").trim()); } catch {}
              }
            } else {
              console.error("[extract] AI response not ok:", aiRes.status, await aiRes.text());
            }
          } catch (aiErr) {
            console.error("[extract] AI error:", aiErr);
          }
        }

        const projectName = extractedData?.name || albumName || metadata.title?.split("|")[0]?.trim() || "Draft Project";
        const slug = toSlug(projectName);
        const devName = extractedData?.developer || detectDeveloper(markdown) || detectDeveloper(formattedUrl);
        const devId = await matchDeveloperId(supabase, devName);

        // Categorize PDFs with brochure-first rule
        let brochureUrl: string | null = null;
        let factSheetUrl: string | null = null;
        let paymentPlanUrl: string | null = null;
        const floorPlanUrls: string[] = [];
        for (const pdf of pdfUrls) {
          const lower = pdf.toLowerCase();
          if (lower.includes("brochure")) brochureUrl = brochureUrl || pdf;
          else if (lower.includes("fact") && lower.includes("sheet")) factSheetUrl = factSheetUrl || pdf;
          else if (lower.includes("payment")) paymentPlanUrl = paymentPlanUrl || pdf;
          else if (lower.includes("floor") || lower.includes("plan")) floorPlanUrls.push(pdf);
        }
        // Brochure-first rule: if no brochure, use fact sheet in brochure slot
        if (!brochureUrl && factSheetUrl) {
          brochureUrl = factSheetUrl;
          factSheetUrl = null;
        }
        if (!brochureUrl && pdfUrls.length > 0) {
          brochureUrl = pdfUrls.find(p => p !== paymentPlanUrl && !floorPlanUrls.includes(p)) || null;
        }

        const docsToSave: { url: string; type: string; name: string }[] = [];
        if (brochureUrl) docsToSave.push({ url: brochureUrl, type: "brochure", name: "Brochure" });
        if (factSheetUrl) docsToSave.push({ url: factSheetUrl, type: "fact_sheet", name: "Fact Sheet" });
        if (paymentPlanUrl) docsToSave.push({ url: paymentPlanUrl, type: "payment_plan", name: "Payment Plan" });
        floorPlanUrls.forEach((fp, i) => docsToSave.push({ url: fp, type: "floor_plan", name: `Floor Plan ${i + 1}` }));

        const savedDocs = docsToSave.length > 0 ? await saveDocumentsToStorage(supabase, slug, docsToSave) : [];

        const imagesPayload = imageUrls.slice(0, 30).map((imgUrl, i) => ({
          url: imgUrl, alt_text: `${projectName} - Image ${i + 1}`, display_order: i,
        }));

        const documentsPayload = savedDocs.map(d => ({
          url: d.storage_url, original_url: d.url, type: d.type, name: humanizeDocTitle(d.name),
        }));

        // ── LOCATION VALIDATION — STRICT: null if not confirmed ──
        let validatedEmirate = extractedData?.emirate || null; // NOT defaulting to Dubai
        let validatedLocation = extractedData?.location || null;
        let locationConfidence = "ai-extracted";
        const missingFields: string[] = [];
        
        if (validatedLocation) {
          const locationLower = validatedLocation.toLowerCase().trim();
          const { data: areaMatch } = await supabase
            .from("areas")
            .select("name, emirate, latitude, longitude")
            .eq("is_active", true)
            .or(`name.ilike.%${locationLower}%,slug.eq.${locationLower.replace(/\s+/g, '-')}`)
            .limit(1)
            .maybeSingle();

          if (areaMatch) {
            validatedLocation = areaMatch.name;
            validatedEmirate = areaMatch.emirate;
            locationConfidence = "canonical-match";
          } else {
            try {
              const geoQuery = encodeURIComponent(`${projectName}, ${validatedLocation}, ${validatedEmirate || "UAE"}, UAE`);
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${geoQuery}&limit=1&countrycodes=ae`, {
                headers: { "User-Agent": "JBJGlobalBot/1.0" },
              });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.length > 0) {
                  const display = geoData[0].display_name || "";
                  const emiratesList = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
                  for (const em of emiratesList) {
                    if (display.toLowerCase().includes(em.toLowerCase())) {
                      validatedEmirate = em;
                      locationConfidence = "geocode-corrected";
                      break;
                    }
                  }
                }
              }
            } catch (geoErr) {
              console.error("[extract] Geocode fallback error:", geoErr);
            }
          }
        } else {
          missingFields.push("location");
        }

        if (!validatedEmirate) missingFields.push("emirate");
        if (!extractedData?.description) missingFields.push("description");
        if (!extractedData?.priceFrom) missingFields.push("price");

        const importPayload: Record<string, any> = {
          name: projectName,
          slug,
          developer_name: devName || null,
          developer_id: devId,
          location: validatedLocation,
          emirate: validatedEmirate || null,
          description: extractedData?.description || null,
          price_from: extractedData?.priceFrom || null,
          price_to: extractedData?.priceTo || null,
          bedrooms_min: extractedData?.bedroomsMin || null,
          bedrooms_max: extractedData?.bedroomsMax || null,
          handover_date: extractedData?.handoverDate || null,
          property_type_label: extractedData?.propertyType || null,
          status_label: extractedData?.projectStatus || null,
          payment_plan: extractedData?.paymentPlan || null,
          payment_breakdown: extractedData?.paymentBreakdown || null,
          service_charge: extractedData?.serviceCharge || null,
          total_units: extractedData?.totalUnits || null,
          floors: extractedData?.floors || null,
          size_min: extractedData?.sizeMin || null,
          size_max: extractedData?.sizeMax || null,
          amenities: extractedData?.amenities || null,
          unit_types: extractedData?.unitTypes ? extractedData.unitTypes.map((u: string, i: number) => ({ name: u, sort_order: i })) : null,
          unit_details: extractedData?.unitDetails || null,
          location_distances: extractedData?.nearbyLandmarks || null,
          construction_progress: extractedData?.completionPercentage || null,
          rera_number: extractedData?.reraNumber || null,
          highlights: extractedData?.highlights || extractedData?.keyFeatures || null,
          faqs: extractedData?.faqs || null,
          images: imagesPayload,
          documents: documentsPayload,
          video_url: videoUrls[0] || null,
          video_urls: videoUrls.length > 0 ? videoUrls : null,
          source_url: formattedUrl,
          is_new_project: true,
          status: "pending",
          enrichment_source: "url-extraction",
          review_notes: JSON.stringify({
            location_confidence: locationConfidence,
            missing_fields: missingFields.length > 0 ? missingFields : undefined,
            ...(missingFields.length > 0 ? { INCOMPLETE: true } : {}),
          }),
        };

        // ── AI POI ENRICHMENT ──
        const hasLandmarks = importPayload.location_distances && Array.isArray(importPayload.location_distances) && importPayload.location_distances.length > 0;
        if (!hasLandmarks && LOVABLE_API_KEY && (validatedLocation || validatedEmirate)) {
          try {
            const poiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                max_tokens: 2000,
                temperature: 0.1,
                messages: [
                  { role: "system", content: "You are a UAE geography expert. Return ONLY a JSON array of nearby landmarks. Only include landmarks you are confident about." },
                  { role: "user", content: `List the 8-10 nearest landmarks to "${projectName}" in ${validatedLocation || ""}, ${validatedEmirate || "UAE"}, UAE. Include hospitals, schools, airports, malls, beaches, metro stations, and tourist destinations. Return JSON array: [{"name":"...", "distance":"... km", "time":"... min drive"}]` },
                ],
              }),
            });
            if (poiRes.ok) {
              const poiData = await poiRes.json();
              const poiContent = poiData.choices?.[0]?.message?.content || "";
              const jsonMatch = poiContent.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const pois = JSON.parse(jsonMatch[0]);
                if (Array.isArray(pois) && pois.length > 0) {
                  importPayload.location_distances = pois.map((p: any) => ({
                    label: p.name,
                    time: p.time || p.distance || "N/A",
                  }));
                }
              }
            }
          } catch (poiErr) {
            console.error("[extract] POI enrichment error:", poiErr);
          }
        }

        // PHASE A: Find existing by source_url first, then slug — MERGE media
        const existing = await findExistingPending(supabase, formattedUrl, slug);
        let importId: string | null = null;

        if (existing?.id) {
          // Merge images and documents
          const existingImages = Array.isArray(existing.images) ? existing.images : [];
          const existingDocs = Array.isArray(existing.documents) ? existing.documents : [];
          importPayload.images = mergeArrays(existingImages, imagesPayload, (img: any) => img.url);
          importPayload.documents = mergeArrays(existingDocs, documentsPayload, (doc: any) => doc.url);

          const { error } = await supabase
            .from("pending_project_imports")
            .update({ ...importPayload, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) throw new Error(`Update failed: ${error.message}`);
          importId = existing.id;
        } else {
          const { data: inserted, error } = await supabase
            .from("pending_project_imports")
            .insert(importPayload)
            .select("id")
            .single();
          if (error) throw new Error(`Insert failed: ${error.message}`);
          importId = inserted!.id;
        }

        if (userId) {
          await supabase.from("listing_uploads").insert({
            user_id: userId, drive_url: formattedUrl, url_type: "firecrawl",
            status: "completed", extracted_data: { ...extractedData, imageCount: imageUrls.length, docCount: savedDocs.length },
            created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
          }).then(() => {}).catch(() => {});
        }

        return {
          url: formattedUrl, success: true, importId, projectName, developer: devName,
          location: validatedLocation,
          status: "pending-approval",
          media: { images: imageUrls.length, documents: savedDocs.length, videos: videoUrls.length },
          amenities: extractedData?.amenities || [],
          paymentPlan: extractedData?.paymentPlan,
          unitTypes: extractedData?.unitTypes || [],
          unitDetails: extractedData?.unitDetails || [],
          priceFrom: extractedData?.priceFrom,
          priceTo: extractedData?.priceTo,
          bedroomsMin: extractedData?.bedroomsMin,
          bedroomsMax: extractedData?.bedroomsMax,
          handoverDate: extractedData?.handoverDate,
          propertyType: extractedData?.propertyType,
          projectStatus: extractedData?.projectStatus,
          totalUnits: extractedData?.totalUnits,
          floors: extractedData?.floors,
          description: extractedData?.description?.substring(0, 500),
          heroImage: imageUrls[0] || null,
          view_url: `/listing-admin/preview/${importId}`,
          duration_ms: Date.now() - startTime,
        };

      } catch (urlErr: any) {
        console.error(`[extract] Error for ${formattedUrl}:`, urlErr);
        return { url: formattedUrl, success: false, error: urlErr.message };
      }
    });

    const urlResults = await Promise.allSettled(urlPromises);
    for (const settled of urlResults) {
      if (settled.status === "fulfilled") {
        results.push(settled.value);
      } else {
        results.push({ success: false, error: settled.reason?.message || "Unknown error" });
      }
    }

    const totalInputs = urlList.length + (fileList.length > 0 ? 1 : 0);
    const successCount = results.filter(r => r.success).length;

    const responsePayload = {
      success: successCount > 0, total: totalInputs, succeeded: successCount,
      failed: totalInputs - successCount, results, auto_approve,
      message: `${successCount} listing(s) extracted and queued for your approval`,
    };

    if (job_id) {
      await supabase
        .from("listing_extraction_queue")
        .update({
          status: successCount > 0 ? "completed" : "failed",
          results: responsePayload,
          error_message: successCount === 0 ? "All extractions failed" : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);
    }

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[extract] Fatal error:", error);

    if (parsedJobId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb.from("listing_extraction_queue").update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Extraction failed",
          completed_at: new Date().toISOString(),
        }).eq("id", parsedJobId);
      } catch {}
    }

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
