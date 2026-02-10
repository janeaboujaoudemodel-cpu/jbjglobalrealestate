import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 10, offset = 0, mode = "generate" } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get developers missing descriptions
    const { data: developers, error: fetchError } = await supabase
      .from("developers")
      .select("id, name, slug, headquarters, founded_year, completed_projects, offplan_projects")
      .or("description.is.null,description.eq.")
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (fetchError) throw fetchError;

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No developers need descriptions", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "check") {
      return new Response(
        JSON.stringify({ success: true, mode: "check", count: developers.length, developers: developers.map(d => d.name) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GenDevDesc] Processing ${developers.length} developers from offset ${offset}`);

    const results: { name: string; status: string; description?: string }[] = [];

    for (const dev of developers) {
      // Get project info for context
      const { data: projects } = await supabase
        .from("projects")
        .select("name, area_name, property_type")
        .eq("developer_name", dev.name)
        .limit(5);

      const projectInfo = projects && projects.length > 0
        ? `Their projects include: ${projects.map(p => `${p.name}${p.area_name ? ` in ${p.area_name}` : ''}`).join(', ')}.`
        : "";

      const contextParts = [
        `Developer name: ${dev.name}`,
        dev.headquarters ? `Headquarters: ${dev.headquarters}` : "",
        dev.founded_year ? `Founded: ${dev.founded_year}` : "",
        dev.completed_projects ? `Completed projects: ${dev.completed_projects}+` : "",
        dev.offplan_projects ? `Active off-plan projects: ${dev.offplan_projects}` : "",
        projectInfo,
      ].filter(Boolean).join("\n");

      const prompt = `Write a professional 2-3 sentence description for this real estate developer for a property listing website. Focus on their expertise, market position, and what makes them notable. Be factual and avoid superlatives. Do not start with the company name. Write in third person.

${contextParts}

Return ONLY the description text, no quotes or formatting.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You are a real estate copywriter. Write concise, professional developer descriptions." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`[GenDevDesc] AI error for ${dev.name}: ${aiResponse.status} ${errText}`);
          results.push({ name: dev.name, status: "ai_error" });
          continue;
        }

        const aiData = await aiResponse.json();
        const description = aiData.choices?.[0]?.message?.content?.trim();

        if (!description || description.length < 20) {
          results.push({ name: dev.name, status: "empty_response" });
          continue;
        }

        // Update the developer
        const { error: updateError } = await supabase
          .from("developers")
          .update({ description })
          .eq("id", dev.id);

        if (updateError) {
          results.push({ name: dev.name, status: "update_error" });
        } else {
          results.push({ name: dev.name, status: "updated", description: description.substring(0, 100) + "..." });
        }
      } catch (aiErr) {
        console.error(`[GenDevDesc] Error for ${dev.name}:`, aiErr);
        results.push({ name: dev.name, status: "error" });
      }
    }

    const updatedCount = results.filter(r => r.status === "updated").length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: developers.length,
        updated: updatedCount,
        next_offset: offset + batch_size,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[GenDevDesc] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
