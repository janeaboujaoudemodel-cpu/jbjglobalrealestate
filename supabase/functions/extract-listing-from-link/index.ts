import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Developer keywords for auto-detection
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

/**
 * Save documents (PDFs, brochures) to Supabase storage and return public URLs.
 */
async function saveDocumentsToStorage(
  supabase: any,
  projectSlug: string,
  documents: { url: string; type: string; name: string }[]
): Promise<{ url: string; storage_url: string; type: string; name: string }[]> {
  const saved: { url: string; storage_url: string; type: string; name: string }[] = [];

  for (const doc of documents) {
    try {
      const res = await fetch(doc.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) {
        console.log(`[extract] Failed to download doc: ${doc.url} (${res.status})`);
        saved.push({ ...doc, storage_url: doc.url }); // fallback to original URL
        continue;
      }

      const blob = await res.blob();
      const ext = doc.url.split("?")[0].split(".").pop() || "pdf";
      const fileName = `${doc.type}-${Date.now()}.${ext}`;
      const storagePath = `listings/${projectSlug}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(storagePath, blob, {
          contentType: blob.type || "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        console.error(`[extract] Upload error for ${storagePath}:`, uploadErr.message);
        saved.push({ ...doc, storage_url: doc.url });
        continue;
      }

      const { data: publicData } = supabase.storage
        .from("project-documents")
        .getPublicUrl(storagePath);

      saved.push({
        ...doc,
        storage_url: publicData?.publicUrl || doc.url,
      });
      console.log(`[extract] Saved document: ${storagePath}`);
    } catch (err) {
      console.error(`[extract] Error saving doc ${doc.url}:`, err);
      saved.push({ ...doc, storage_url: doc.url });
    }
  }

  return saved;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      url,
      urls, // support batch: array of URLs
      userId,
      albumName,
      auto_approve = false, // auto-approve mode
      queue = true, // always queue by default
    } = body;

    const urlList: string[] = urls || (url ? [url] : []);
    if (urlList.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured. Please connect Firecrawl in Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all developers for matching
    const { data: devRows } = await supabase.from("uae_developers").select("id, name, slug");
    const devMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const d of (devRows || [])) {
      if (!d.name || !d.slug) continue;
      const norm = d.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      devMap.set(norm, { id: d.id, name: d.name, slug: d.slug });
      for (const w of d.name.toLowerCase().split(/\s+/)) {
        if (w.length > 3) devMap.set(w, { id: d.id, name: d.name, slug: d.slug });
      }
    }

    const results: any[] = [];

    for (const rawUrl of urlList) {
      const startTime = Date.now();
      let formattedUrl = rawUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log(`[extract] Processing: ${formattedUrl}`);

      try {
        // Step 1: Scrape the URL
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown", "links", "html"],
            onlyMainContent: false,
            waitFor: 8000,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        if (!scrapeResponse.ok || !scrapeData.success) {
          console.error(`[extract] Firecrawl failed for ${formattedUrl}:`, scrapeData.error);
          results.push({ url: formattedUrl, success: false, error: scrapeData.error || "Scrape failed" });
          continue;
        }

        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];
        const html = scrapeData.data?.rawHtml || scrapeData.data?.html || "";
        const metadata = scrapeData.data?.metadata || {};

        // Step 2: Extract media from links and HTML
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

        // Step 3: AI structured extraction
        let extractedData: any = null;
        if (LOVABLE_API_KEY && markdown.length > 100) {
          try {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                max_tokens: 4000,
                temperature: 0.1,
                messages: [
                  {
                    role: "system",
                    content: `You are a UAE real estate data extraction expert. Extract EVERY detail you can find. Return ONLY valid JSON.`
                  },
                  {
                    role: "user",
                    content: `Extract ALL property/project details from this page:
URL: ${formattedUrl}
Title: ${metadata.title || ""}

CONTENT:
${markdown.substring(0, 25000)}

Return JSON:
{
  "name": "Project Name",
  "developer": "Developer Name",
  "location": "Area/Community",
  "emirate": "Dubai",
  "priceFrom": null,
  "priceTo": null,
  "bedroomsMin": null,
  "bedroomsMax": null,
  "handoverDate": "Q4 2026",
  "description": "Full 2-3 paragraph description",
  "amenities": ["Pool","Gym","Spa","Kids Play Area"],
  "paymentPlan": "60/40 or 20/80",
  "paymentBreakdown": [{"milestone":"Booking","percentage":10},{"milestone":"During Construction","percentage":50},{"milestone":"On Handover","percentage":40}],
  "unitTypes": ["Studio","1BR","2BR","3BR","4BR"],
  "projectStatus": "off-plan",
  "keyFeatures": ["Waterfront","Sea View"],
  "propertyType": "Apartment",
  "serviceCharge": "AED 18/sqft",
  "totalUnits": 500,
  "floors": 40,
  "sizeMin": 400,
  "sizeMax": 3500,
  "highlights": ["Near metro","10 min to airport"],
  "faqs": [{"q":"When is handover?","a":"Q4 2026"}]
}`
                  }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "extract_project",
                    description: "Extract structured project data",
                    parameters: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        developer: { type: "string" },
                        location: { type: "string" },
                        emirate: { type: "string" },
                        priceFrom: { type: "number" },
                        priceTo: { type: "number" },
                        bedroomsMin: { type: "number" },
                        bedroomsMax: { type: "number" },
                        handoverDate: { type: "string" },
                        description: { type: "string" },
                        amenities: { type: "array", items: { type: "string" } },
                        paymentPlan: { type: "string" },
                        paymentBreakdown: { type: "array", items: { type: "object", properties: { milestone: { type: "string" }, percentage: { type: "number" } } } },
                        unitTypes: { type: "array", items: { type: "string" } },
                        projectStatus: { type: "string" },
                        keyFeatures: { type: "array", items: { type: "string" } },
                        propertyType: { type: "string" },
                        serviceCharge: { type: "string" },
                        totalUnits: { type: "number" },
                        floors: { type: "number" },
                        sizeMin: { type: "number" },
                        sizeMax: { type: "number" },
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

        // Step 4: Build project data
        const projectName = extractedData?.name || albumName || metadata.title?.split("|")[0]?.trim() || "Draft Project";
        const slug = toSlug(projectName);
        const devName = extractedData?.developer || detectDeveloper(markdown) || detectDeveloper(formattedUrl);

        // Match developer in DB
        let devId: string | null = null;
        if (devName) {
          const norm = devName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const match = devMap.get(norm);
          if (match) devId = match.id;
          else {
            for (const w of devName.toLowerCase().split(/\s+/)) {
              if (w.length > 3 && devMap.has(w)) { devId = devMap.get(w)!.id; break; }
            }
          }
        }

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

        // Step 5: Save documents to storage
        const docsToSave: { url: string; type: string; name: string }[] = [];
        if (brochureUrl) docsToSave.push({ url: brochureUrl, type: "brochure", name: "Brochure" });
        if (paymentPlanUrl) docsToSave.push({ url: paymentPlanUrl, type: "payment_plan", name: "Payment Plan" });
        floorPlanUrls.forEach((fp, i) => docsToSave.push({ url: fp, type: "floor_plan", name: `Floor Plan ${i + 1}` }));

        const savedDocs = docsToSave.length > 0
          ? await saveDocumentsToStorage(supabase, slug, docsToSave)
          : [];

        // Build images payload for pending_project_imports
        const imagesPayload = imageUrls.slice(0, 30).map((imgUrl, i) => ({
          url: imgUrl,
          alt_text: `${projectName} - Image ${i + 1}`,
          display_order: i,
        }));

        // Build documents payload (with storage URLs)
        const documentsPayload = savedDocs.map(d => ({
          url: d.storage_url,
          original_url: d.url,
          type: d.type,
          name: d.name,
        }));

        // Step 6: Queue to pending_project_imports
        const importPayload: Record<string, any> = {
          name: projectName,
          slug,
          developer_name: devName || null,
          developer_id: devId || null,
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

        // Check for existing slug
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
            .update({ ...importPayload, status: auto_approve ? "approved" : "pending", updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) console.error("[extract] Update error:", error.message);
          importId = existing.id;
        } else {
          const { data: inserted, error } = await supabase
            .from("pending_project_imports")
            .insert(importPayload)
            .select("id")
            .single();
          if (error) console.error("[extract] Insert error:", error.message);
          importId = inserted?.id || null;
        }

        // If auto_approve, also call bulk-approve to push to projects table
        if (auto_approve && importId) {
          try {
            const approveRes = await fetch(`${supabaseUrl}/functions/v1/bulk-approve-imports`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({ import_ids: [importId] }),
            });
            const approveData = await approveRes.json();
            console.log("[extract] Auto-approved:", approveData);
          } catch (approveErr) {
            console.error("[extract] Auto-approve error:", approveErr);
          }
        }

        // Log extraction
        if (userId) {
          await supabase.from("listing_uploads").insert({
            user_id: userId,
            drive_url: formattedUrl,
            url_type: "firecrawl",
            status: "completed",
            extracted_data: { ...extractedData, imageCount: imageUrls.length, docCount: savedDocs.length },
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }).catch(() => {});
        }

        results.push({
          url: formattedUrl,
          success: true,
          importId,
          projectName,
          developer: devName,
          location: extractedData?.location,
          status: auto_approve ? "auto-approved" : "pending-approval",
          media: {
            images: imageUrls.length,
            documents: savedDocs.length,
            videos: videoUrls.length,
          },
          amenities: extractedData?.amenities || [],
          paymentPlan: extractedData?.paymentPlan,
          unitTypes: extractedData?.unitTypes || [],
          description: extractedData?.description?.substring(0, 300),
          duration_ms: Date.now() - startTime,
        });

        console.log(`[extract] Done: ${projectName} | ${imageUrls.length} imgs, ${savedDocs.length} docs | ${auto_approve ? "AUTO-APPROVED" : "QUEUED"}`);

      } catch (urlErr: any) {
        console.error(`[extract] Error for ${formattedUrl}:`, urlErr);
        results.push({ url: formattedUrl, success: false, error: urlErr.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        total: urlList.length,
        succeeded: successCount,
        failed: urlList.length - successCount,
        results,
        auto_approve,
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
