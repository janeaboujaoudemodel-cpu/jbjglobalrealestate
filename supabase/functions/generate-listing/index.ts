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
  },
  required: ["name"],
};

// ========== BACKGROUND EXTRACTION LOGIC ==========
async function runExtraction(jobId: string, files: any[], url: string | null, description: string | null) {
  const supabase = getSupabase();
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const startMs = Date.now();

  try {
    // Update job to processing
    await supabase.from("ai_job_master").update({ status: "processing" }).eq("id", jobId);

    const hasFiles = files && files.length > 0 && files.some((f: any) => f.base64);

    // Build content parts
    const contentParts: any[] = [{
      type: "text",
      text: `You are a senior UAE real estate data extraction specialist. Extract COMPLETE listing data.

CRITICAL RULES:
- Extract ONLY facts explicitly present. NEVER invent or guess.
- If a field is not found, return null (or [] for arrays).
- NEVER default emirate to Dubai unless explicitly stated.
- Copy descriptions VERBATIM from source material.
- Extract ALL amenities, payment milestones, unit types with full details.
- Extract RERA number, service charge, total units, floors if present.

MULTI-PROJECT RULE:
- If content contains MULTIPLE DISTINCT projects (different names/buildings), return EACH as separate entry.
- Do NOT merge different projects into one.
- If all content is about ONE project, return array with one entry.`
    }];

    if (hasFiles) {
      for (const file of files) {
        if (file.base64 && file.mimeType) {
          contentParts.push({ type: "image_url", image_url: { url: `data:${file.mimeType};base64,${file.base64}` } });
          contentParts.push({ type: "text", text: `[Document: ${file.name}]` });
        }
      }
    }

    // Scrape URL
    let scrapedContent = "";
    if (url && firecrawlApiKey) {
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
        console.log("[generate-listing] Scraping:", formattedUrl);
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${firecrawlApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "links"], onlyMainContent: true, waitFor: 5000, timeout: 30000 }),
        });
        if (scrapeRes.ok) {
          const d = await scrapeRes.json();
          scrapedContent = d?.data?.markdown || "";
        } else {
          await scrapeRes.text(); // consume body
        }
      } catch (err) { console.warn("[generate-listing] Scrape failed:", err); }
    }

    if (scrapedContent) {
      contentParts.push({ type: "text", text: `\n\n--- WEBSITE CONTENT ---\n${scrapedContent.substring(0, 50000)}` });
    }
    if (description) {
      contentParts.push({ type: "text", text: `\n\n--- ADDITIONAL DESCRIPTION ---\n${description}` });
    }
    contentParts.push({ type: "text", text: "\n\nExtract ALL project data now. If MULTIPLE distinct projects, return each separately." });

    const model = hasFiles ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    console.log("[generate-listing] Model:", model, "Parts:", contentParts.length);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, max_tokens: 16000, temperature: 0.05,
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
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

    const parsed = JSON.parse(toolCall.function.arguments);
    const rawProjects: any[] = parsed.projects || (parsed.name ? [parsed] : []);
    console.log("[generate-listing] Extracted", rawProjects.length, "project(s)");

    const documentRecords = (files || []).map((f: any) => ({ name: humanizeDocTitle(f.name), type: classifyDocument(f.name), originalName: f.name }));

    const projects = [];
    const allDuplicates: any[] = [];

    for (const extracted of rawProjects) {
      const devId = await matchDeveloperId(supabase, extracted.developer);
      const slug = toSlug(extracted.name || "unnamed-project");

      const { data: pendingMatches } = await supabase.from("pending_project_imports").select("id, name, slug, source_url, status, created_at").or(`slug.eq.${slug},name.ilike.%${(extracted.name || "").substring(0, 30)}%`).limit(5);
      if (pendingMatches?.length) allDuplicates.push(...pendingMatches.map((m: any) => ({ ...m, source: "pending" })));

      const { data: liveMatches } = await supabase.from("projects").select("id, name, slug, created_at").or(`slug.eq.${slug},name.ilike.%${(extracted.name || "").substring(0, 30)}%`).limit(5);
      if (liveMatches?.length) allDuplicates.push(...liveMatches.map((m: any) => ({ ...m, source: "live" })));

      projects.push({ ...extracted, slug, developer_id: devId, documents: documentRecords });
    }

    const seenIds = new Set<string>();
    const uniqueDuplicates = allDuplicates.filter((d: any) => { if (seenIds.has(d.id)) return false; seenIds.add(d.id); return true; });

    const output = { success: true, projects, extracted: projects[0] || null, duplicates: uniqueDuplicates };

    await supabase.from("ai_job_master").update({
      status: "completed",
      output_payload: output,
      completed_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startMs,
    }).eq("id", jobId);

    console.log("[generate-listing] Job", jobId, "completed in", Date.now() - startMs, "ms");

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

// ========== MAIN HANDLER ==========
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, files, url, description, existingId, job_id } = body;

    const supabase = getSupabase();

    // ========== ACTION: POLL ==========
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

      if (job.status === "failed") {
        return new Response(JSON.stringify({ success: false, error: job.error_message || "Extraction failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Still processing
      return new Response(JSON.stringify({ success: true, status: "processing", processing_time_ms: job.processing_time_ms }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== ACTION: SAVE ==========
    if (action === "save") {
      const projectDataObj = files;
      const mode = url;

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
      if (saveErr) throw saveErr;
      return new Response(JSON.stringify({ success: true, mode: mode || "new", id: saved.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== ACTION: EXTRACT (default) — returns job_id immediately ==========
    if (!Deno.env.get("LOVABLE_API_KEY")) {
      return new Response(JSON.stringify({ success: false, error: "AI gateway not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create job record
    const { data: job, error: jobErr } = await supabase.from("ai_job_master").insert({
      tool_name: "generate-listing",
      user_id: "00000000-0000-0000-0000-000000000000", // system job
      input_payload: { fileCount: files?.length || 0, url, hasDescription: !!description },
      status: "queued",
    }).select("id").single();

    if (jobErr || !job) {
      console.error("[generate-listing] Failed to create job:", jobErr);
      return new Response(JSON.stringify({ success: false, error: "Failed to start extraction" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Start background processing — this runs AFTER the response is sent
    // @ts-ignore: EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runExtraction(job.id, files || [], url || null, description || null));
    } else {
      // Fallback: run inline (will be slower but won't crash)
      runExtraction(job.id, files || [], url || null, description || null).catch(console.error);
    }

    // Return immediately with job_id
    return new Response(JSON.stringify({ success: true, job_id: job.id, status: "queued" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("[generate-listing] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
