import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Require authenticated owner/admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: isOwner } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "owner",
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 20, 50);
    const dryRun = body.dry_run || false;

    // Fetch drafts still missing data
    const { data: drafts, error: fetchErr } = await supabase
      .from("projects")
      .select("id, name, developer_name, emirate, price_from, area_name, handover_date, bedrooms_min, bedrooms_max, construction_status, size_min, size_max")
      .eq("is_published", false)
      .is("area_name", null)
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!drafts || drafts.length === 0) {
      return new Response(JSON.stringify({ message: "No drafts need AI enrichment", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const projectList = drafts.map((p, i) => 
      `${i + 1}. "${p.name}" by ${p.developer_name || "Unknown"} in ${p.emirate || "UAE"}, starting price: ${p.price_from ? `AED ${p.price_from}` : "unknown"}`
    ).join("\n");

    const aiPrompt = `You are a Dubai real estate expert. For each project below, provide the missing data in JSON format. 
Only use REAL, VERIFIED information. If you're not sure, use null.

Projects:
${projectList}

Return a JSON array with objects for each project (same order):
{
  "area_name": "district/community name e.g. Downtown Dubai, Business Bay, Dubai Marina, Arabian Ranches, etc.",
  "handover_date": "expected completion e.g. Q4 2025, Q1 2026, Ready, etc. or null",
  "bedrooms_min": number or null (0 for studio),
  "bedrooms_max": number or null,
  "construction_status": "Under Construction" | "Completed" | "Presale" | null,
  "size_min": number in sqft or null,
  "size_max": number in sqft or null
}

IMPORTANT: Only return the JSON array, nothing else. Be accurate - these are real Dubai/UAE off-plan projects.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    if (!lovableApiKey) throw new Error("Missing LOVABLE_API_KEY");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI proxy error: ${aiResp.status} - ${errText}`);
    }

    const aiData = await aiResp.json();
    const aiContent = aiData.choices?.[0]?.message?.content || aiData.content || "";
    
    // Parse JSON from AI response
    let enrichments: any[];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in AI response");
      enrichments = JSON.parse(jsonMatch[0]);
    } catch (parseErr: any) {
      return new Response(JSON.stringify({ error: `Failed to parse AI response: ${parseErr.message}`, raw: aiContent.substring(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = { updated: 0, skipped: 0, errors: 0, details: [] as string[] };

    for (let i = 0; i < drafts.length && i < enrichments.length; i++) {
      const project = drafts[i];
      const enrichment = enrichments[i];
      if (!enrichment) continue;

      const updates: Record<string, any> = {};

      if (!project.area_name && enrichment.area_name) updates.area_name = enrichment.area_name;
      if (!project.handover_date && enrichment.handover_date) {
        updates.handover_date = enrichment.handover_date;
        updates.expected_completion = enrichment.handover_date;
      } else if (!project.handover_date) {
        // Regex fallback: scrape Q# YYYY or earliest future year from text
        // already on the row (no external fetch) so cards stop showing "TBA".
        const haystack: string[] = [
          (project as any).description,
          (project as any).payment_breakdown,
          (project as any).payment_plan,
          (project as any).status_label,
          project.construction_status,
        ]
          .filter(Boolean)
          .map((v: any) => (typeof v === "string" ? v : JSON.stringify(v)));
        let scraped: string | null = null;
        for (const h of haystack) {
          const q = h.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
          if (q) { scraped = `Q${q[1]} ${q[2]}`; break; }
        }
        if (!scraped) {
          const thisYear = new Date().getFullYear();
          for (const h of haystack) {
            const yrs = h.match(/(20\d{2})/g);
            if (yrs) {
              const future = yrs.map(Number).filter((n: number) => n >= thisYear).sort((a: number, b: number) => a - b)[0];
              if (future) { scraped = String(future); break; }
            }
          }
        }
        if (scraped) {
          updates.handover_date = scraped;
          updates.expected_completion = scraped;
        }
      }
      if (project.bedrooms_min === null && enrichment.bedrooms_min !== null && enrichment.bedrooms_min !== undefined) {
        updates.bedrooms_min = enrichment.bedrooms_min;
      }
      if (project.bedrooms_max === null && enrichment.bedrooms_max !== null && enrichment.bedrooms_max !== undefined) {
        updates.bedrooms_max = enrichment.bedrooms_max;
      }
      if (!project.construction_status && enrichment.construction_status) {
        updates.construction_status = enrichment.construction_status;
      }
      if (!project.size_min && enrichment.size_min) updates.size_min = enrichment.size_min;
      if (!project.size_max && enrichment.size_max) updates.size_max = enrichment.size_max;

      if (Object.keys(updates).length > 0) {
        if (!dryRun) {
          const { error: upErr } = await supabase.from("projects").update(updates).eq("id", project.id);
          if (upErr) {
            stats.errors++;
            stats.details.push(`${project.name}: ${upErr.message}`);
            continue;
          }
        }
        stats.updated++;
        stats.details.push(`${project.name}: ${Object.keys(updates).join(", ")}`);
      } else {
        stats.skipped++;
      }
    }

    return new Response(JSON.stringify({ success: true, stats, projects_processed: drafts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
