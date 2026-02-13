import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;
    const offset = body.offset || 0;
    const mode = body.mode || "enrich"; // "check" or "enrich"

    // Find developers needing enrichment (missing key fields)
    const { data: developers, error: fetchErr } = await supabase
      .from("developers")
      .select("id, name, slug, description, founded_year, headquarters, completed_projects, website_url, ceo_name, total_units_delivered, specialization, notable_projects, parent_company")
      .or("website_url.is.null,ceo_name.is.null,total_units_delivered.is.null,specialization.is.null")
      .order("completed_projects", { ascending: false, nullsFirst: true })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) throw fetchErr;

    if (mode === "check") {
      // Count total needing enrichment
      const { count } = await supabase
        .from("developers")
        .select("id", { count: "exact", head: true })
        .or("website_url.is.null,ceo_name.is.null,total_units_delivered.is.null,specialization.is.null");

      return new Response(JSON.stringify({
        total_needing_enrichment: count,
        sample: developers?.map(d => d.name),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!developers || developers.length === 0) {
      return new Response(JSON.stringify({
        status: "complete",
        message: "All developers have been enriched!",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get their known projects for context
    const devIds = developers.map(d => d.id);
    const { data: projects } = await supabase
      .from("projects")
      .select("developer_id, name")
      .in("developer_id", devIds)
      .limit(100);

    const projectsByDev: Record<string, string[]> = {};
    projects?.forEach(p => {
      if (!projectsByDev[p.developer_id]) projectsByDev[p.developer_id] = [];
      projectsByDev[p.developer_id].push(p.name);
    });

    const results: any[] = [];

    for (const dev of developers) {
      try {
        const knownProjects = projectsByDev[dev.id]?.join(", ") || "none known";

        const prompt = `You are a real estate research assistant. Research the UAE real estate developer "${dev.name}" and return ONLY factual, verifiable information.

Known info:
- Description: ${dev.description || "none"}
- Founded: ${dev.founded_year || "unknown"}
- HQ: ${dev.headquarters || "unknown"}
- Known projects: ${knownProjects}

Return a JSON object with these fields. If you are NOT confident a fact is accurate, set it to null. Never fabricate data.

{
  "website_url": "official website URL or null",
  "ceo_name": "CEO or Chairman full name or null",
  "total_units_delivered": number or null (lifetime residential units handed over),
  "upcoming_units": number or null (units currently under construction),
  "expected_completion_year": number or null (next major project handover year),
  "notable_projects": "comma-separated list of 3-5 most famous projects or null",
  "parent_company": "parent group name or null (e.g. Dubai Holding for Meraas)",
  "license_number": "RERA or DED license number or null",
  "specialization": "one of: Luxury, Affordable, Mid-range, Mixed-use, Waterfront, Ultra-luxury, Commercial, or null",
  "founded_year": number or null (only if not already known)
}

IMPORTANT: Only return the JSON object, no other text.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${dev.name}: ${aiResponse.status} ${errText}`);
          if (aiResponse.status === 429) {
            await new Promise(r => setTimeout(r, 5000));
          }
          results.push({ developer: dev.name, status: `ai_error_${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        // Extract JSON from response
        let parsed: any;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error(`Failed to parse AI response for ${dev.name}:`, content.substring(0, 200));
          results.push({ developer: dev.name, status: "parse_error" });
          continue;
        }

        // Build update object - only set fields that are currently null
        const updateData: Record<string, any> = {};

        if (!dev.website_url && parsed.website_url) updateData.website_url = parsed.website_url;
        if (!dev.ceo_name && parsed.ceo_name) updateData.ceo_name = parsed.ceo_name;
        if (!dev.total_units_delivered && parsed.total_units_delivered) updateData.total_units_delivered = parsed.total_units_delivered;
        if (parsed.upcoming_units) updateData.upcoming_units = parsed.upcoming_units;
        if (parsed.expected_completion_year) updateData.expected_completion_year = parsed.expected_completion_year;
        if (!dev.notable_projects && parsed.notable_projects) updateData.notable_projects = parsed.notable_projects;
        if (!dev.parent_company && parsed.parent_company) updateData.parent_company = parsed.parent_company;
        if (parsed.license_number) updateData.license_number = parsed.license_number;
        if (!dev.specialization && parsed.specialization) updateData.specialization = parsed.specialization;
        if (!dev.founded_year && parsed.founded_year) updateData.founded_year = parsed.founded_year;

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          const { error: updateErr } = await supabase
            .from("developers")
            .update(updateData)
            .eq("id", dev.id);

          if (updateErr) {
            console.error(`Update error for ${dev.name}:`, updateErr);
            results.push({ developer: dev.name, status: "update_error" });
          } else {
            results.push({ developer: dev.name, status: "enriched", fields_updated: Object.keys(updateData).filter(k => k !== "updated_at") });
          }
        } else {
          results.push({ developer: dev.name, status: "no_new_data" });
        }

        // Small delay between AI calls
        await new Promise(r => setTimeout(r, 1000));

      } catch (devErr) {
        console.error(`Error processing ${dev.name}:`, devErr);
        results.push({ developer: dev.name, status: "error", message: String(devErr) });
      }
    }

    return new Response(JSON.stringify({
      status: "batch_complete",
      processed: results.length,
      results,
      next_offset: offset + batchSize,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("enrich-developer-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
