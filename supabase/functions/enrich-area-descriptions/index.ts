import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND_PATTERNS = /provident|reelly|bayut|dubizzle|property finder/gi;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;

    // Get areas missing descriptions
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, emirate, property_count")
      .or("description.is.null,description.eq.")
      .eq("is_active", true)
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All areas have descriptions", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: remaining } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .or("description.is.null,description.eq.")
      .eq("is_active", true);

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch all areas into a single AI call for efficiency
    const areaList = areas.map((a, i) => `${i + 1}. ${a.name} (${a.emirate || "Dubai"}, ${a.property_count || 0} properties)`).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: `Write a 2-3 sentence factual description for each of these UAE areas/communities. Focus on what each area is known for, its character, key landmarks, and lifestyle. Do NOT mention any real estate agencies or brands. Write in professional third-person tone.

Areas:
${areaList}

Return a JSON array where each item has "index" (1-based) and "description". Example:
[{"index": 1, "description": "..."}, ...]

Return ONLY the JSON array, no other text.`
        }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    const results: { area: string; status: string }[] = [];

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const descriptions = JSON.parse(jsonMatch[0]);

        for (const desc of descriptions) {
          const idx = desc.index - 1;
          if (idx < 0 || idx >= areas.length) continue;
          const area = areas[idx];

          const cleaned = (desc.description || "").replace(BRAND_PATTERNS, "").replace(/\s{2,}/g, " ").trim();
          if (cleaned.length < 30) {
            results.push({ area: area.name, status: "description_too_short" });
            continue;
          }

          const { error: updateErr } = await supabase
            .from("areas")
            .update({ description: cleaned, updated_at: new Date().toISOString() })
            .eq("id", area.id);

          results.push({
            area: area.name,
            status: updateErr ? `error: ${updateErr.message}` : "updated",
          });
        }
      } else {
        results.push({ area: "batch", status: "failed_to_parse_ai_response" });
      }
    } else {
      results.push({ area: "batch", status: `ai_error: ${aiRes.status}` });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        remaining: (remaining || 0) - results.filter(r => r.status === "updated").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
