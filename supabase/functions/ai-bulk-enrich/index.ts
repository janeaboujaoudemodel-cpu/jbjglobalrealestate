import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(project: any): string {
  const name = project.name || "Unknown Project";
  const dev = project.developer_name || "Unknown Developer";
  const area = project.area_name || project.location || "Dubai";
  const emirate = project.emirate || "Dubai";
  const priceFrom = project.price_from ? `AED ${(project.price_from / 1000000).toFixed(1)}M` : null;
  const priceTo = project.price_to ? `AED ${(project.price_to / 1000000).toFixed(1)}M` : null;
  const priceRange = priceFrom && priceTo ? `${priceFrom} - ${priceTo}` : priceFrom || priceTo || "Not disclosed";
  const bedMin = project.bedrooms_min;
  const bedMax = project.bedrooms_max;
  const beds = bedMin != null && bedMax != null ? `${bedMin}-${bedMax} bedrooms` : bedMin != null ? `${bedMin}+ bedrooms` : "Various configurations";
  const status = project.construction_status || "Under Construction";
  const amenities = Array.isArray(project.amenities) ? project.amenities.slice(0, 15).join(", ") : "";
  const desc = project.description ? project.description.substring(0, 500) : "";
  const lat = project.latitude;
  const lng = project.longitude;
  const propertyType = project.property_type_label || "Residential";

  return `You are a Dubai real estate content expert. Generate professional content for this off-plan project.

PROJECT DETAILS:
- Name: ${name}
- Developer: ${dev}
- Location: ${area}, ${emirate}
- Property Type: ${propertyType}
- Price Range: ${priceRange}
- Bedrooms: ${beds}
- Construction Status: ${status}
- Amenities: ${amenities}
- Description: ${desc}
${lat && lng ? `- Coordinates: ${lat}, ${lng}` : ""}

Generate the following in a SINGLE JSON object. Be specific to THIS project, not generic. Use real Dubai landmarks for distances if coordinates are provided.

Required JSON structure:
{
  "faqs": [
    {"question": "string", "answer": "string"}
  ],
  "highlights": ["string"],
  "usp_bullets": ["string"],
  "payment_breakdown": [
    {"milestone": "string", "percentage": number, "description": "string"}
  ],
  "location_distances": [
    {"label": "string", "distance": "string", "time": "string"}
  ]
}

Rules:
- faqs: 5-8 Q&As specific to this project (pricing, payment, handover, location, amenities, ROI)
- highlights: 5-7 compelling selling points as short phrases
- usp_bullets: 5-7 unique selling propositions (different from highlights - focus on investment value, lifestyle, exclusivity)
- payment_breakdown: Typical Dubai payment plan (e.g., 20% down, 40% during construction, 40% on handover). Adapt based on construction status.
- location_distances: 5-8 nearby landmarks with realistic distances (Dubai Mall, DIFC, Airport, Metro, Beach, etc.). Use coordinates if available.

Return ONLY valid JSON, no markdown, no explanation.`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey) {
    return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }
  if (!lovableApiKey) {
    return json(500, { error: "Missing LOVABLE_API_KEY for AI generation" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 10, 50);
    const action = body.action || "enrich";

    // Stats mode
    if (action === "stats") {
      const { count: totalPublished } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);

      const { count: withFaqs } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("faqs", "is", null);

      const { count: withHighlights } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("highlights", "is", null);

      const { count: withUsp } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("usp_bullets", "is", null);

      const { count: withPayment } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("payment_breakdown", "is", null);

      const { count: withDistances } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("location_distances", "is", null);

      return json(200, {
        success: true,
        stats: {
          total_published: totalPublished || 0,
          with_faqs: withFaqs || 0,
          with_highlights: withHighlights || 0,
          with_usp: withUsp || 0,
          with_payment: withPayment || 0,
          with_distances: withDistances || 0,
          missing_faqs: (totalPublished || 0) - (withFaqs || 0),
          missing_highlights: (totalPublished || 0) - (withHighlights || 0),
        },
      });
    }

    // Enrich mode: find projects missing FAQs or highlights
    const { data: candidates, error: queryError } = await supabase
      .from("projects")
      .select("id, name, slug, developer_name, area_name, location, emirate, price_from, price_to, bedrooms_min, bedrooms_max, construction_status, amenities, description, latitude, longitude, property_type_label, faqs, highlights, usp_bullets, payment_breakdown, location_distances")
      .eq("is_published", true)
      .or("faqs.is.null,highlights.is.null")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (queryError) return json(500, { error: queryError.message });

    if (!candidates || candidates.length === 0) {
      return json(200, {
        success: true,
        message: "All published projects already have FAQs and highlights.",
        processed: 0, enriched: 0, errors: 0,
      });
    }

    console.log(`[ai-bulk-enrich] Processing ${candidates.length} projects`);

    let enriched = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const results: Array<{ name: string; status: string; fields: string[] }> = [];

    for (const project of candidates) {
      try {
        console.log(`[ai-bulk-enrich] Generating content for: ${project.name}`);

        const prompt = buildPrompt(project);

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text().catch(() => "");
          if (aiResponse.status === 429) {
            console.warn("[ai-bulk-enrich] Rate limited, stopping batch");
            errorDetails.push(`${project.name}: Rate limited (429)`);
            errors++;
            results.push({ name: project.name, status: "rate_limited", fields: [] });
            break; // Stop processing on rate limit
          }
          if (aiResponse.status === 402) {
            console.warn("[ai-bulk-enrich] Credits exhausted (402), stopping");
            errorDetails.push(`${project.name}: Credits exhausted (402)`);
            errors++;
            results.push({ name: project.name, status: "credits_exhausted", fields: [] });
            break;
          }
          throw new Error(`AI API ${aiResponse.status}: ${errText.substring(0, 200)}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("No content in AI response");
        }

        // Parse JSON from response (handle markdown code blocks)
        let parsed: any;
        try {
          const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          parsed = JSON.parse(jsonStr);
        } catch {
          throw new Error(`Failed to parse AI JSON: ${content.substring(0, 100)}`);
        }

        // Build update object (non-destructive)
        const updates: Record<string, any> = {};
        const fieldsUpdated: string[] = [];

        if (parsed.faqs && Array.isArray(parsed.faqs) && parsed.faqs.length > 0 && !project.faqs) {
          updates.faqs = parsed.faqs;
          fieldsUpdated.push("faqs");
        }

        if (parsed.highlights && Array.isArray(parsed.highlights) && parsed.highlights.length > 0 && !project.highlights) {
          updates.highlights = parsed.highlights;
          fieldsUpdated.push("highlights");
        }

        if (parsed.usp_bullets && Array.isArray(parsed.usp_bullets) && parsed.usp_bullets.length > 0 && !project.usp_bullets) {
          updates.usp_bullets = parsed.usp_bullets;
          fieldsUpdated.push("usp_bullets");
        }

        if (parsed.payment_breakdown && Array.isArray(parsed.payment_breakdown) && parsed.payment_breakdown.length > 0 && !project.payment_breakdown) {
          updates.payment_breakdown = parsed.payment_breakdown;
          fieldsUpdated.push("payment_breakdown");
        }

        if (parsed.location_distances && Array.isArray(parsed.location_distances) && parsed.location_distances.length > 0 && !project.location_distances) {
          updates.location_distances = parsed.location_distances;
          fieldsUpdated.push("location_distances");
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateErr } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", project.id);

          if (updateErr) {
            throw new Error(`DB update failed: ${updateErr.message}`);
          }

          enriched++;
          results.push({ name: project.name, status: "success", fields: fieldsUpdated });
          console.log(`[ai-bulk-enrich] ${project.name}: updated ${fieldsUpdated.join(", ")}`);
        } else {
          results.push({ name: project.name, status: "skipped", fields: [] });
          console.log(`[ai-bulk-enrich] ${project.name}: all fields already populated`);
        }

        // Throttle between AI calls (1 second — rate limiter handles backoff)
        await new Promise((r) => setTimeout(r, 1000));

      } catch (err) {
        errors++;
        const msg = err instanceof Error ? err.message : String(err);
        errorDetails.push(`${project.name}: ${msg}`);
        results.push({ name: project.name, status: "error", fields: [] });
        console.error(`[ai-bulk-enrich] Error for ${project.name}:`, msg);
      }
    }

    return json(200, {
      success: true,
      processed: candidates.length,
      enriched,
      errors,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      results,
    });

  } catch (err) {
    console.error("[ai-bulk-enrich] Fatal error:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
