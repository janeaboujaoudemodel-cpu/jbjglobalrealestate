import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toSlug(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function humanizeDocTitle(rawName: string): string {
  let t = rawName.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/\(\d+\)\s*$/g, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return rawName;
  return t.replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function classifyDocument(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("brochure")) return "brochure";
  if (lower.includes("fact") && lower.includes("sheet")) return "fact_sheet";
  if (lower.includes("payment") && lower.includes("plan")) return "payment_plan";
  if (lower.includes("floor") || lower.includes("layout")) return "floor_plan";
  if (lower.includes("inventory")) return "inventory";
  if (lower.includes("price") && lower.includes("list")) return "price_list";
  return "document";
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function triggerBackgroundProcessing(jobId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const endpoint = `${supabaseUrl}/functions/v1/generate-listing`;
  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRole}` },
      body: JSON.stringify({ action: "process", job_id: jobId }),
    }).catch((err) => console.error("[generate-listing] Background trigger failed:", err));
  } catch (err) {
    console.error("[generate-listing] triggerBackgroundProcessing error:", err);
  }
}

async function matchDeveloperId(supabase: any, devName: string | null): Promise<string | null> {
  if (!devName) return null;
  try {
    const norm = devName.toLowerCase().trim();
    const { data } = await supabase.from("developers").select("id, name").ilike("name", `%${norm}%`).limit(1).maybeSingle();
    if (data?.id) return data.id;
    const words = norm.split(/\s+/).filter((w: string) => w.length > 3);
    for (const word of words) {
      const { data: wm } = await supabase.from("developers").select("id").ilike("name", `%${word}%`).limit(1).maybeSingle();
      if (wm?.id) return wm.id;
    }
  } catch (err) { console.error("[generate-listing] Developer match error:", err); }
  return null;
}

const projectSchema = {
  type: "object",
  properties: {
    name: { type: ["string", "null"] },
    developer: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    emirate: { type: ["string", "null"] },
    priceFrom: { type: ["number", "null"] },
    priceTo: { type: ["number", "null"] },
    bedroomsMin: { type: ["number", "null"] },
    bedroomsMax: { type: ["number", "null"] },
    handoverDate: { type: ["string", "null"] },
    completionPercentage: { type: ["number", "null"] },
    description: { type: ["string", "null"] },
    amenities: { type: "array", items: { type: "string" } },
    paymentPlan: { type: ["string", "null"] },
    paymentBreakdown: {
      type: "array",
      items: { type: "object", properties: { milestone: { type: "string" }, percentage: { type: ["number", "null"] }, amount: { type: ["string", "null"] }, timing: { type: ["string", "null"] } } },
    },
    unitTypes: { type: "array", items: { type: "string" } },
    unitDetails: {
      type: "array",
      items: { type: "object", properties: { type: { type: "string" }, sizeMin: { type: ["number", "null"] }, sizeMax: { type: ["number", "null"] }, priceFrom: { type: ["number", "null"] }, priceTo: { type: ["number", "null"] }, bathrooms: { type: ["number", "null"] }, availableUnits: { type: ["number", "null"] }, floorPlanTypes: { type: "array", items: { type: "string" } } } },
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
    nearbyLandmarks: { type: "array", items: { type: "object", properties: { name: { type: "string" }, distance: { type: ["string", "null"] }, time: { type: ["string", "null"] } } } },
    reraNumber: { type: ["string", "null"] },
    faqs: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } },
    comparableProjects: { type: "array", items: { type: "object", properties: { name: { type: "string" }, developer: { type: ["string", "null"] }, reason: { type: ["string", "null"] }, _enriched: { type: "boolean" } } } },
    videoUrl: { type: ["string", "null"] },
    views: { type: "array", items: { type: "string" } },
    usps: { type: "array", items: { type: "string" } },
  },
  required: ["name"],
};

// ========== BATCH PROCESSING: Fetch files from storage & process in groups ==========

const BATCH_SIZE = 2;
const AI_FETCH_TIMEOUT_MS = 55000; // 55s to stay within edge function limits

async function updateJobProgress(supabase: any, jobId: string, progress: string) {
  await supabase.from("ai_job_master").update({
    output_payload: { progress, updated_at: new Date().toISOString() },
  }).eq("id", jobId);
}

async function fetchAIWithTimeout(url: string, options: RequestInit, timeoutMs = AI_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFileFromUrl(url: string): Promise<{ base64: string; ok: boolean }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { base64: "", ok: false };
    const buf = await res.arrayBuffer();
    // Convert to base64
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { base64: btoa(binary), ok: true };
  } catch {
    return { base64: "", ok: false };
  }
}

function mergeExtractedProjects(allBatchResults: any[][]): any[] {
  // Flatten all batch results
  const allProjects: any[] = [];
  const seenNames = new Map<string, number>();

  for (const batchProjects of allBatchResults) {
    for (const project of batchProjects) {
      const name = (project.name || "").toLowerCase().trim();
      if (name && seenNames.has(name)) {
        // Merge into existing project
        const idx = seenNames.get(name)!;
        const existing = allProjects[idx];
        // Merge arrays
        for (const key of ["amenities", "keyFeatures", "highlights", "unitTypes", "faqs", "nearbyLandmarks", "paymentBreakdown", "unitDetails", "comparableProjects", "views", "usps"]) {
          if (Array.isArray(project[key]) && project[key].length > 0) {
            existing[key] = [...new Set([...(existing[key] || []), ...project[key]])];
          }
        }
        // Fill in null fields
        for (const [k, v] of Object.entries(project)) {
          if (v !== null && v !== undefined && (existing[k] === null || existing[k] === undefined)) {
            existing[k] = v;
          }
        }
      } else {
        seenNames.set(name, allProjects.length);
        allProjects.push(project);
      }
    }
  }
  return allProjects;
}

async function runExtraction(jobId: string, fileRefs: any[], url: string | null, description: string | null) {
  const supabase = getSupabase();
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const startMs = Date.now();

  try {
    await supabase.from("ai_job_master").update({ status: "processing" }).eq("id", jobId);

    // Files now contain storageUrl instead of base64
    const storageFiles = (fileRefs || []).filter((f: any) => f.storageUrl);
    const inlineFiles = (fileRefs || []).filter((f: any) => f.base64 && !f.storageUrl);
    const totalFiles = storageFiles.length + inlineFiles.length;

    // Scrape URL if present
    let scrapedContent = "";
    if (url && firecrawlApiKey) {
      await updateJobProgress(supabase, jobId, "Scraping website...");
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
        console.log(`[generate-listing] Scraping URL: ${formattedUrl}`);
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "links"], onlyMainContent: true, waitFor: 5000, timeout: 30000 }),
        });
        if (scrapeRes.ok) {
          const d = await scrapeRes.json();
          scrapedContent = d?.data?.markdown || "";
          console.log(`[generate-listing] Scraped ${scrapedContent.length} chars`);
        } else {
          const errText = await scrapeRes.text();
          console.warn(`[generate-listing] Scrape HTTP ${scrapeRes.status}: ${errText.substring(0, 200)}`);
        }
      } catch (err) {
        console.warn("[generate-listing] Scrape failed:", err);
      }
    }
    // If we have a URL but scraping failed, use the URL itself as context
    const hasUrlContext = !!url;
    if (url && !scrapedContent) {
      scrapedContent = `Please extract project data from this real estate listing URL: ${url}\nNote: The page could not be scraped directly. Extract what you can from the URL structure and any provided description.`;
      console.log("[generate-listing] Using URL fallback text since scrape returned empty");
    }

    const systemPrompt = `You are a senior UAE real estate data extraction specialist. Extract COMPLETE listing data.

CRITICAL RULES:
- Extract ONLY facts explicitly present in the provided documents or website. NEVER invent, infer, or guess ANY data.
- If a field is not found, return null (or [] for arrays).
- NEVER default emirate to Dubai unless explicitly stated.
- Copy descriptions VERBATIM from source material.
- Extract ALL amenities, payment milestones, unit types with full details.
- Extract RERA number, service charge, total units, floors if present.
- Extract video URLs (YouTube, Vimeo, mp4 links) into videoUrl field.
- Extract property views (e.g. Sea View, Golf View, Marina View, City View, Boulevard View, Lagoon View, Ras Al Khor View, Wildlife Sanctuary View, Dubai Skyline) into views array.
- Extract unique selling propositions / lifestyle highlights into usps array.
- NEVER generate or infer a websiteUrl for the project. Only include if an official developer website link is explicitly present in the source.
- Payment plan milestones and percentages MUST be extracted VERBATIM from the source document. Do NOT infer, calculate, or generate payment breakdown percentages. If a payment plan is not explicitly provided, set paymentBreakdown to [] and paymentPlan to null.
- NEVER alter, recalculate, or adjust prices, locations, or amenities. Report EXACTLY as found in the documents.

MULTI-PROJECT RULE:
- If content contains MULTIPLE DISTINCT projects (different names/buildings), return EACH as separate entry.
- Do NOT merge different projects into one.
- If all content is about ONE project, return array with one entry.`;

    const allBatchResults: any[][] = [];
    let batchesProcessed = 0;

    // Process storage files in batches of BATCH_SIZE
    if (storageFiles.length > 0) {
      const totalBatches = Math.ceil(storageFiles.length / BATCH_SIZE);

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const batch = storageFiles.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
        const batchLabel = `Analyzing batch ${batchIdx + 1} of ${totalBatches} (${batch.length} files)...`;
        await updateJobProgress(supabase, jobId, batchLabel);
        console.log(`[generate-listing] ${batchLabel}`);

        const contentParts: any[] = [{ type: "text", text: systemPrompt }];

        // Fetch each file from storage and add as base64
        for (const file of batch) {
          try {
            const { base64, ok } = await fetchFileFromUrl(file.storageUrl);
            if (ok && base64) {
              contentParts.push({ type: "image_url", image_url: { url: `data:${file.mimeType};base64,${base64}` } });
              contentParts.push({ type: "text", text: `[Document: ${file.name}]` });
            } else {
              console.warn(`[generate-listing] Failed to fetch file: ${file.name}`);
            }
          } catch (err) {
            console.warn(`[generate-listing] Error fetching ${file.name}:`, err);
          }
        }

        // Add context from URL/description only in first batch
        if (batchIdx === 0) {
          if (scrapedContent) contentParts.push({ type: "text", text: `\n\n--- WEBSITE CONTENT ---\n${scrapedContent.substring(0, 50000)}` });
          if (description) contentParts.push({ type: "text", text: `\n\n--- ADDITIONAL DESCRIPTION ---\n${description}` });
        }

        contentParts.push({ type: "text", text: "\n\nExtract ALL project data now. If MULTIPLE distinct projects, return each separately." });

        try {
          const aiBody = JSON.stringify({
            model: "google/gemini-2.5-flash",
            max_tokens: 16000,
            temperature: 0.05,
            messages: [{ role: "user", content: contentParts }],
            tools: [{ type: "function", function: { name: "extract_projects", description: "Extract structured data for real estate projects.", parameters: { type: "object", properties: { projects: { type: "array", items: projectSchema } }, required: ["projects"] } } }],
            tool_choice: { type: "function", function: { name: "extract_projects" } },
          });
          const aiHeaders = { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" };

          let aiRes: Response;
          try {
            aiRes = await fetchAIWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST", headers: aiHeaders, body: aiBody,
            });
          } catch (abortErr) {
            // Timeout: retry each file individually
            console.warn(`[generate-listing] Batch ${batchIdx + 1} timed out, retrying files individually`);
            await updateJobProgress(supabase, jobId, `Batch ${batchIdx + 1} timed out — retrying files one by one...`);
            for (const file of batch) {
              try {
                const { base64, ok } = await fetchFileFromUrl(file.storageUrl);
                if (!ok || !base64) continue;
                const singleParts: any[] = [
                  { type: "text", text: systemPrompt },
                  { type: "image_url", image_url: { url: `data:${file.mimeType};base64,${base64}` } },
                  { type: "text", text: `[Document: ${file.name}]` },
                  { type: "text", text: "\n\nExtract ALL project data now. If MULTIPLE distinct projects, return each separately." },
                ];
                const singleRes = await fetchAIWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST", headers: aiHeaders,
                  body: JSON.stringify({ model: "google/gemini-2.5-flash", max_tokens: 8000, temperature: 0.05,
                    messages: [{ role: "user", content: singleParts }],
                    tools: [{ type: "function", function: { name: "extract_projects", description: "Extract structured data for real estate projects.", parameters: { type: "object", properties: { projects: { type: "array", items: projectSchema } }, required: ["projects"] } } }],
                    tool_choice: { type: "function", function: { name: "extract_projects" } },
                  }),
                });
                if (singleRes.ok) {
                  const d = await singleRes.json();
                  const tc = d?.choices?.[0]?.message?.tool_calls?.[0];
                  if (tc?.function?.arguments) {
                    const p = JSON.parse(tc.function.arguments);
                    allBatchResults.push(p.projects || (p.name ? [p] : []));
                    batchesProcessed++;
                  }
                } else {
                  const t = await singleRes.text();
                  console.warn(`[generate-listing] Single file ${file.name} failed: ${singleRes.status}`);
                }
              } catch (e) { console.warn(`[generate-listing] Single retry ${file.name} failed:`, e); }
            }
            continue; // Move to next batch
          }

          if (!aiRes.ok) {
            const errText = await aiRes.text();
            console.error(`[generate-listing] AI batch ${batchIdx + 1} error: ${aiRes.status}`, errText);
            if (aiRes.status !== 429 && aiRes.status !== 402) continue;
            throw new Error(aiRes.status === 429 ? "Rate limit exceeded" : "AI credits exhausted");
          }

          const aiData = await aiRes.json();
          const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            const batchProjects = parsed.projects || (parsed.name ? [parsed] : []);
            allBatchResults.push(batchProjects);
            batchesProcessed++;
          }
        } catch (err) {
          if ((err as Error).message?.includes("Rate limit") || (err as Error).message?.includes("credits")) throw err;
          console.error(`[generate-listing] Batch ${batchIdx + 1} failed, continuing:`, err);
        }
      }
    }

    // Process inline base64 files (legacy / small payloads) as a single batch
    if (inlineFiles.length > 0 || (storageFiles.length === 0 && (scrapedContent || description || hasUrlContext))) {
      const progressMsg = inlineFiles.length > 0 
        ? `Analyzing ${inlineFiles.length} inline document(s)...`
        : "Analyzing content...";
      await updateJobProgress(supabase, jobId, progressMsg);

      const contentParts: any[] = [{ type: "text", text: systemPrompt }];
      for (const file of inlineFiles) {
        if (file.base64 && file.mimeType) {
          contentParts.push({ type: "image_url", image_url: { url: `data:${file.mimeType};base64,${file.base64}` } });
          contentParts.push({ type: "text", text: `[Document: ${file.name}]` });
        }
      }
      if (scrapedContent) contentParts.push({ type: "text", text: `\n\n--- WEBSITE CONTENT ---\n${scrapedContent.substring(0, 50000)}` });
      if (description) contentParts.push({ type: "text", text: `\n\n--- ADDITIONAL DESCRIPTION ---\n${description}` });
      contentParts.push({ type: "text", text: "\n\nExtract ALL project data now. If MULTIPLE distinct projects, return each separately." });

      const model = "google/gemini-2.5-flash";
      const aiRes = await fetchAIWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: 16000,
          temperature: 0.05,
          messages: [{ role: "user", content: contentParts }],
          tools: [{ type: "function", function: { name: "extract_projects", description: "Extract structured data for real estate projects.", parameters: { type: "object", properties: { projects: { type: "array", items: projectSchema } }, required: ["projects"] } } }],
          tool_choice: { type: "function", function: { name: "extract_projects" } },
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("[generate-listing] AI error:", aiRes.status, errText);
        throw new Error(aiRes.status === 429 ? "Rate limit exceeded" : aiRes.status === 402 ? "AI credits exhausted" : "AI extraction failed");
      }

      const aiData = await aiRes.json();
      const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        allBatchResults.push(parsed.projects || (parsed.name ? [parsed] : []));
        batchesProcessed++;
      }
    }

    if (allBatchResults.length === 0 || allBatchResults.every(b => b.length === 0)) {
      throw new Error("AI returned no structured data from any batch");
    }

    await updateJobProgress(supabase, jobId, "Merging results and checking duplicates...");

    // Merge all batch results
    const rawProjects = mergeExtractedProjects(allBatchResults);

    const allFileRefs = [...storageFiles, ...inlineFiles];
    const documentRecords = allFileRefs.map((f: any) => ({ name: humanizeDocTitle(f.name), type: classifyDocument(f.name), originalName: f.name }));

    const projects = [];
    const allDuplicates: any[] = [];

    for (const extracted of rawProjects) {
      const devId = await matchDeveloperId(supabase, extracted.developer);
      const slug = toSlug(extracted.name || "unnamed-project");
      const nameFragment = (extracted.name || "").substring(0, 30).replace(/'/g, "");

      const { data: pendingMatches } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, source_url, status, created_at")
        .or(`slug.eq.${slug},name.ilike.%${nameFragment}%`)
        .limit(5);

      if (pendingMatches?.length) allDuplicates.push(...pendingMatches.map((m: any) => ({ ...m, source: "pending" })));

      const { data: liveMatches } = await supabase
        .from("projects")
        .select("id, name, slug, created_at")
        .or(`slug.eq.${slug},name.ilike.%${nameFragment}%`)
        .limit(5);

      if (liveMatches?.length) allDuplicates.push(...liveMatches.map((m: any) => ({ ...m, source: "live" })));

      projects.push({ ...extracted, slug, developer_id: devId, documents: documentRecords });
    }

    const seenIds = new Set<string>();
    const uniqueDuplicates = allDuplicates.filter((d: any) => {
      if (seenIds.has(d.id)) return false;
      seenIds.add(d.id);
      return true;
    });

    const totalBatchCount = Math.ceil(storageFiles.length / BATCH_SIZE) + (inlineFiles.length > 0 || (storageFiles.length === 0) ? 1 : 0);
    const output = {
      success: true,
      projects,
      extracted: projects[0] || null,
      duplicates: uniqueDuplicates,
      batchesProcessed,
      totalBatches: totalBatchCount,
      filesProcessed: totalFiles,
    };

    await supabase.from("ai_job_master").update({
      status: "completed",
      output_payload: output,
      completed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startMs,
    }).eq("id", jobId);

  } catch (error: unknown) {
    console.error("[generate-listing] Background error:", error);
    await supabase.from("ai_job_master").update({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      completed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startMs,
    }).eq("id", jobId);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, files, url, description, existingId, job_id } = body;

    const supabase = getSupabase();

    if (action === "poll" && job_id) {
      const { data: job, error } = await supabase
        .from("ai_job_master")
        .select("status, output_payload, error_message, processing_time_ms")
        .eq("id", job_id)
        .single();

      if (error || !job) {
        return new Response(JSON.stringify({ success: false, error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "completed") {
        return new Response(JSON.stringify(job.output_payload), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "failed" || job.status === "cancelled") {
        return new Response(JSON.stringify({ success: false, status: job.status, error: job.error_message || "Extraction failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "pending") {
        await triggerBackgroundProcessing(job_id);
      }

      // Stale job detection: if processing for >5min with no progress change, mark failed
      if (job.status === "processing") {
        const progressUpdatedAt = (job.output_payload as any)?.updated_at;
        if (progressUpdatedAt) {
          const staleMs = Date.now() - new Date(progressUpdatedAt).getTime();
          if (staleMs > 5 * 60 * 1000) {
            await supabase.from("ai_job_master").update({
              status: "failed",
              error_message: "Extraction timed out. Please retry with fewer files.",
              completed_at: new Date().toISOString(),
            }).eq("id", job_id);
            return new Response(JSON.stringify({ success: false, status: "failed", error: "Extraction timed out. Please retry with fewer files." }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Return progress info if available
      const progress = (job.output_payload as any)?.progress || null;
      return new Response(JSON.stringify({ success: true, status: job.status, processing_time_ms: job.processing_time_ms, progress }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cancel a running job
    if (action === "cancel" && job_id) {
      await supabase.from("ai_job_master").update({
        status: "cancelled",
        error_message: "Cancelled by user",
        completed_at: new Date().toISOString(),
      }).eq("id", job_id);
      return new Response(JSON.stringify({ success: true, status: "cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "process" && job_id) {
      const { data: job, error } = await supabase
        .from("ai_job_master")
        .select("status, input_payload")
        .eq("id", job_id)
        .single();

      if (error || !job) {
        return new Response(JSON.stringify({ success: false, error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "completed") {
        return new Response(JSON.stringify({ success: true, status: "completed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status === "processing") {
        return new Response(JSON.stringify({ success: true, status: "processing" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = job.input_payload || {};

      // @ts-ignore
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(runExtraction(job_id, payload.files || [], payload.url || null, payload.description || null));
      } else {
        await runExtraction(job_id, payload.files || [], payload.url || null, payload.description || null);
      }

      return new Response(JSON.stringify({ success: true, status: "processing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const projectDataObj = files;
      const mode = url;

      const invalidColumns = ['source', 'completion_percentage', 'key_features', 'project_status', 'nearby_landmarks', 'property_type'];
      for (const col of invalidColumns) {
        delete projectDataObj[col];
      }

      if (mode === "replace" && existingId) {
        await supabase.from("pending_project_imports").delete().eq("id", existingId);
      }

      if (mode === "merge" && existingId) {
        const { data: existing } = await supabase.from("pending_project_imports").select("*").eq("id", existingId).single();
        if (existing) {
          const updateData: Record<string, any> = {};
          for (const [key, val] of Object.entries(projectDataObj)) {
            if (val !== null && val !== undefined && val !== "" && !Array.isArray(val)) {
              if (!existing[key] || existing[key] === null || existing[key] === "") updateData[key] = val;
            }
          }
          updateData.images = [...(existing.images || []), ...(projectDataObj.images || [])];
          updateData.documents = [...(existing.documents || []), ...(projectDataObj.documents || [])];
          updateData.amenities = [...new Set([...(existing.amenities || []), ...(projectDataObj.amenities || [])])];
          updateData.updated_at = new Date().toISOString();

          const { error } = await supabase.from("pending_project_imports").update(updateData).eq("id", existingId);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true, mode: "merged", id: existingId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      const { data: saved, error: saveErr } = await supabase.from("pending_project_imports").insert(projectDataObj).select().single();
      if (saveErr) {
        console.error("[generate-listing] Save error:", saveErr);
        throw new Error(`Save failed: ${saveErr.message}`);
      }
      return new Response(JSON.stringify({ success: true, mode: mode || "new", id: saved.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!Deno.env.get("LOVABLE_API_KEY")) {
      return new Response(JSON.stringify({ success: false, error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Files now contain storageUrl references (not base64), so payload is tiny
    const payload = {
      files: (files || []).map((f: any) => ({
        name: f.name,
        mimeType: f.mimeType,
        storageUrl: f.storageUrl || null,
        base64: f.storageUrl ? undefined : (f.base64 || undefined), // Only keep base64 if no storage URL
      })),
      url: url || null,
      description: description || null,
      fileCount: Array.isArray(files) ? files.length : 0,
      hasDescription: !!description,
    };

    const { data: job, error: jobErr } = await supabase.from("ai_job_master").insert({
      tool_name: "generate-listing",
      user_id: userId,
      input_payload: payload,
      status: "pending",
    }).select("id").single();

    if (jobErr || !job) {
      console.error("[generate-listing] Failed to create job:", jobErr);
      return new Response(JSON.stringify({ success: false, error: "Failed to start extraction" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runExtraction(job.id, payload.files || [], payload.url || null, payload.description || null));
    } else {
      await triggerBackgroundProcessing(job.id);
    }

    return new Response(JSON.stringify({ success: true, job_id: job.id, status: "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[generate-listing] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
