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

/**
 * Match developer_id from the `developers` table (not uae_developers).
 */
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

    // Try word-level match
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      url,
      urls,
      files,
      userId,
      albumName,
      auto_approve = false,
      queue = true,
      retryImportId, // NEW: retry a failed/pending import
    } = body;

    const urlList: string[] = urls || (url ? [url] : []);
    const fileList: { name: string; url: string; type: string }[] = Array.isArray(files) ? files : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle retry of existing import
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

        // Re-process the source URL if available
        if (imp.source_url && imp.source_url.startsWith("http")) {
          // Reset status and re-invoke with the URL
          await supabase
            .from("pending_project_imports")
            .update({ status: "pending", updated_at: new Date().toISOString() })
            .eq("id", retryImportId);

          return new Response(
            JSON.stringify({
              success: true,
              results: [{
                success: true,
                importId: imp.id,
                projectName: imp.name,
                developer: imp.developer_name,
                location: imp.location,
                status: "pending-approval",
                media: { images: (imp.images as any[])?.length || 0, documents: (imp.documents as any[])?.length || 0, videos: 0 },
                view_url: `/listing-admin/preview/${imp.id}`,
                duration_ms: 0,
                retried: true,
              }],
              succeeded: 1,
              failed: 0,
              total: 1,
              message: "Import reset to pending. Ready for review.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // For file-based imports, just reset status
        await supabase
          .from("pending_project_imports")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", retryImportId);

        return new Response(
          JSON.stringify({
            success: true,
            results: [{
              success: true,
              importId: imp.id,
              projectName: imp.name,
              status: "pending-approval",
              view_url: `/listing-admin/preview/${imp.id}`,
              duration_ms: 0,
              retried: true,
            }],
            succeeded: 1,
            failed: 0,
            total: 1,
            message: "Import reset to pending.",
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

    // ── FILE UPLOADS ──
    if (fileList.length > 0) {
      const startTime = Date.now();
      const projectName = albumName || inferProjectNameFromFiles(fileList);
      const slug = toSlug(projectName);
      const joinedText = fileList.map((f) => `${f.name} ${f.url}`).join(" ");
      const devName = detectDeveloper(joinedText);
      const devId = await matchDeveloperId(supabase, devName);

      const imagesPayload = fileList
        .filter((f) => f.type === "image")
        .map((f, i) => ({ url: f.url, alt_text: `${projectName} - Image ${i + 1}`, display_order: i }));

      const documentsPayload = fileList
        .filter((f) => f.type !== "image")
        .map((f, i) => {
          const lower = (f.name || "").toLowerCase();
          const docType = lower.includes("floor") ? "floor_plan" : lower.includes("payment") ? "payment_plan" : lower.includes("brochure") ? "brochure" : "document";
          return { url: f.url, original_url: f.url, type: docType, name: f.name || `Document ${i + 1}` };
        });

      const importPayload: Record<string, any> = {
        name: projectName,
        slug,
        developer_name: devName || null,
        developer_id: devId, // properly matched from developers table
        location: null,
        emirate: "Dubai",
        description: `Generated from ${fileList.length} uploaded file(s).`,
        images: imagesPayload,
        documents: documentsPayload,
        source_url: fileList[0]?.url || "file-upload",
        is_new_project: true,
        status: auto_approve ? "approved" : "pending",
        enrichment_source: "file-upload",
      };

      try {
        const { data: existing } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .eq("slug", slug)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let importId: string | null = null;

        if (existing?.id) {
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

        if (auto_approve && importId) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/bulk-approve-imports`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
              body: JSON.stringify({ import_ids: [importId] }),
            });
          } catch (e) { console.error("[extract] Auto-approve error:", e); }
        }

        // Log
        if (userId) {
          await supabase.from("listing_uploads").insert({
            user_id: userId, drive_url: fileList[0]?.url || "uploaded-files", url_type: "upload",
            status: "completed", extracted_data: { projectName, files: fileList.length },
            created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
          }).then(() => {}).catch(() => {});
        }

        results.push({
          success: true, importId, projectName, developer: devName, location: null,
          status: auto_approve ? "auto-approved" : "pending-approval",
          files_processed: fileList.length,
          media: { images: imagesPayload.length, documents: documentsPayload.length, videos: 0 },
          view_url: auto_approve ? `/project/${slug}` : `/listing-admin/preview/${importId}`,
          duration_ms: Date.now() - startTime,
        });
      } catch (fileErr: any) {
        console.error("[extract] File processing error:", fileErr);
        results.push({
          success: false, name: projectName, error: fileErr.message,
          source_url: fileList[0]?.url,
          duration_ms: Date.now() - startTime,
        });
      }
    }

    // ── URL EXTRACTION ──
    for (const rawUrl of urlList) {
      const startTime = Date.now();
      let formattedUrl = rawUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log(`[extract] Processing: ${formattedUrl}`);

      try {
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "links", "html"], onlyMainContent: false, waitFor: 8000 }),
        });

        const scrapeData = await scrapeResponse.json();
        if (!scrapeResponse.ok || !scrapeData.success) {
          results.push({ url: formattedUrl, success: false, error: scrapeData.error || "Scrape failed" });
          continue;
        }

        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];
        const html = scrapeData.data?.rawHtml || scrapeData.data?.html || "";
        const metadata = scrapeData.data?.metadata || {};
        const allContent = markdown + "\n" + html + "\n" + links.join("\n");

        // Images
        const imageUrls: string[] = [];
        const seenImg = new Set<string>();
        const imgPatterns = [
          /https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>)]*)?/gi,
          /https?:\/\/[a-z0-9-]+\.cloudfront\.net\/[^\s"'<>)]+/gi,
        ];
        for (const pat of imgPatterns) {
          for (const m of allContent.matchAll(pat)) {
            const u = m[0].split("?")[0];
            if (!seenImg.has(u) && !/logo|icon|avatar|placeholder|spinner|favicon/i.test(u)) {
              seenImg.add(u);
              imageUrls.push(m[0]);
            }
          }
        }

        // PDFs
        const pdfUrls: string[] = [];
        const seenPdf = new Set<string>();
        for (const m of allContent.matchAll(/https?:\/\/[^\s"'<>)]+\.pdf(?:\?[^\s"'<>)]*)?/gi)) {
          const clean = m[0].split("?")[0];
          if (!seenPdf.has(clean)) { seenPdf.add(clean); pdfUrls.push(m[0]); }
        }

        // Videos
        const videoUrls: string[] = [];
        for (const m of allContent.matchAll(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/gi)) {
          videoUrls.push(`https://www.youtube.com/watch?v=${m[1]}`);
        }
        for (const m of allContent.matchAll(/https?:\/\/[^\s"'<>)]+\.(?:mp4|webm)/gi)) {
          videoUrls.push(m[0]);
        }

        // AI extraction
        let extractedData: any = null;
        if (LOVABLE_API_KEY && markdown.length > 100) {
          try {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                max_tokens: 4000,
                temperature: 0.1,
                messages: [
                  { role: "system", content: `You are a UAE real estate data extraction expert. Extract EVERY detail. Return ONLY valid JSON.` },
                  { role: "user", content: `Extract ALL property/project details:\nURL: ${formattedUrl}\nTitle: ${metadata.title || ""}\n\nCONTENT:\n${markdown.substring(0, 25000)}\n\nReturn JSON:\n{"name":"Project Name","developer":"Developer Name","location":"Area","emirate":"Dubai","priceFrom":null,"priceTo":null,"bedroomsMin":null,"bedroomsMax":null,"handoverDate":"Q4 2026","description":"Full description","amenities":["Pool","Gym"],"paymentPlan":"60/40","paymentBreakdown":[{"milestone":"Booking","percentage":10}],"unitTypes":["Studio","1BR"],"projectStatus":"off-plan","keyFeatures":["Waterfront"],"propertyType":"Apartment","serviceCharge":"AED 18/sqft","totalUnits":500,"floors":40,"sizeMin":400,"sizeMax":3500,"highlights":["Near metro"],"faqs":[{"q":"When?","a":"Q4 2026"}]}` },
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_project",
                    description: "Extract structured project data",
                    parameters: {
                      type: "object",
                      properties: {
                        name: { type: "string" }, developer: { type: "string" }, location: { type: "string" },
                        emirate: { type: "string" }, priceFrom: { type: "number" }, priceTo: { type: "number" },
                        bedroomsMin: { type: "number" }, bedroomsMax: { type: "number" }, handoverDate: { type: "string" },
                        description: { type: "string" }, amenities: { type: "array", items: { type: "string" } },
                        paymentPlan: { type: "string" },
                        paymentBreakdown: { type: "array", items: { type: "object", properties: { milestone: { type: "string" }, percentage: { type: "number" } } } },
                        unitTypes: { type: "array", items: { type: "string" } }, projectStatus: { type: "string" },
                        keyFeatures: { type: "array", items: { type: "string" } }, propertyType: { type: "string" },
                        serviceCharge: { type: "string" }, totalUnits: { type: "number" }, floors: { type: "number" },
                        sizeMin: { type: "number" }, sizeMax: { type: "number" },
                        highlights: { type: "array", items: { type: "string" } },
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
                try { extractedData = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim()); } catch {}
              }
            }
          } catch (aiErr) {
            console.error("[extract] AI error:", aiErr);
          }
        }

        const projectName = extractedData?.name || albumName || metadata.title?.split("|")[0]?.trim() || "Draft Project";
        const slug = toSlug(projectName);
        const devName = extractedData?.developer || detectDeveloper(markdown) || detectDeveloper(formattedUrl);

        // Match developer from the correct `developers` table
        const devId = await matchDeveloperId(supabase, devName);

        // Categorize PDFs
        let brochureUrl: string | null = null;
        let paymentPlanUrl: string | null = null;
        const floorPlanUrls: string[] = [];
        for (const pdf of pdfUrls) {
          const lower = pdf.toLowerCase();
          if (lower.includes("brochure")) brochureUrl = brochureUrl || pdf;
          else if (lower.includes("payment")) paymentPlanUrl = paymentPlanUrl || pdf;
          else if (lower.includes("floor") || lower.includes("plan")) floorPlanUrls.push(pdf);
        }
        if (!brochureUrl && pdfUrls.length > 0) {
          brochureUrl = pdfUrls.find(p => p !== paymentPlanUrl && !floorPlanUrls.includes(p)) || null;
        }

        // Save docs
        const docsToSave: { url: string; type: string; name: string }[] = [];
        if (brochureUrl) docsToSave.push({ url: brochureUrl, type: "brochure", name: "Brochure" });
        if (paymentPlanUrl) docsToSave.push({ url: paymentPlanUrl, type: "payment_plan", name: "Payment Plan" });
        floorPlanUrls.forEach((fp, i) => docsToSave.push({ url: fp, type: "floor_plan", name: `Floor Plan ${i + 1}` }));

        const savedDocs = docsToSave.length > 0 ? await saveDocumentsToStorage(supabase, slug, docsToSave) : [];

        const imagesPayload = imageUrls.slice(0, 30).map((imgUrl, i) => ({
          url: imgUrl, alt_text: `${projectName} - Image ${i + 1}`, display_order: i,
        }));

        const documentsPayload = savedDocs.map(d => ({
          url: d.storage_url, original_url: d.url, type: d.type, name: d.name,
        }));

        const importPayload: Record<string, any> = {
          name: projectName,
          slug,
          developer_name: devName || null,
          developer_id: devId, // correctly matched from developers table, null if not found
          location: extractedData?.location || null,
          emirate: extractedData?.emirate || "Dubai",
          description: extractedData?.description?.substring(0, 3000) || null,
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
          highlights: extractedData?.highlights || extractedData?.keyFeatures || null,
          faqs: extractedData?.faqs || null,
          images: imagesPayload,
          documents: documentsPayload,
          video_url: videoUrls[0] || null,
          video_urls: videoUrls.length > 0 ? videoUrls : null,
          source_url: formattedUrl,
          is_new_project: true,
          status: auto_approve ? "approved" : "pending",
          enrichment_source: "url-extraction",
        };

        const { data: existing } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .eq("slug", slug)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let importId: string | null = null;

        if (existing?.id) {
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

        if (auto_approve && importId) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/bulk-approve-imports`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
              body: JSON.stringify({ import_ids: [importId] }),
            });
          } catch (e) { console.error("[extract] Auto-approve error:", e); }
        }

        if (userId) {
          await supabase.from("listing_uploads").insert({
            user_id: userId, drive_url: formattedUrl, url_type: "firecrawl",
            status: "completed", extracted_data: { ...extractedData, imageCount: imageUrls.length, docCount: savedDocs.length },
            created_at: new Date().toISOString(), completed_at: new Date().toISOString(),
          }).then(() => {}).catch(() => {});
        }

        results.push({
          url: formattedUrl, success: true, importId, projectName, developer: devName,
          location: extractedData?.location,
          status: auto_approve ? "auto-approved" : "pending-approval",
          media: { images: imageUrls.length, documents: savedDocs.length, videos: videoUrls.length },
          amenities: extractedData?.amenities || [],
          paymentPlan: extractedData?.paymentPlan,
          unitTypes: extractedData?.unitTypes || [],
          description: extractedData?.description?.substring(0, 300),
          view_url: auto_approve ? `/project/${slug}` : `/listing-admin/preview/${importId}`,
          duration_ms: Date.now() - startTime,
        });

      } catch (urlErr: any) {
        console.error(`[extract] Error for ${formattedUrl}:`, urlErr);
        results.push({ url: formattedUrl, success: false, error: urlErr.message });
      }
    }

    const totalInputs = urlList.length + (fileList.length > 0 ? 1 : 0);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0, total: totalInputs, succeeded: successCount,
        failed: totalInputs - successCount, results, auto_approve,
        message: auto_approve
          ? `${successCount} listing(s) extracted and auto-approved`
          : `${successCount} listing(s) extracted and queued for your approval`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[extract] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
