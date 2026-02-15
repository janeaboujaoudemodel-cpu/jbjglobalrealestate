import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { batch_size = 20, offset = 0 } = await req.json().catch(() => ({}));

    // Get developers missing logos
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null)
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, done: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const devNames = devs.map(d => d.name).join("\n");

    // Step 1: Ask AI for website domains
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a UAE/Dubai real estate expert. For each developer name, provide their official website domain if you know it. Many are small Dubai developers. Return ONLY a JSON array.`
          },
          {
            role: "user",
            content: `For each developer, provide their website domain. If unknown, put "UNKNOWN".

${devNames}

Return JSON array:
[{"name": "Developer Name", "domain": "developer.com"}]`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const suggestions = JSON.parse(jsonMatch[0]);
    let updated = 0;
    let checked = 0;
    const results: any[] = [];

    for (const suggestion of suggestions) {
      if (!suggestion.domain || suggestion.domain === "UNKNOWN") {
        results.push({ name: suggestion.name, status: "unknown" });
        continue;
      }

      const dev = devs.find(d => d.name.toLowerCase() === suggestion.name.toLowerCase());
      if (!dev) {
        results.push({ name: suggestion.name, status: "no_match" });
        continue;
      }

      checked++;
      const domain = suggestion.domain.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");

      // Try Clearbit Logo API first (high quality logos)
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      
      try {
        const logoCheck = await fetch(clearbitUrl, { method: "HEAD", redirect: "follow" });
        if (logoCheck.ok && logoCheck.headers.get("content-type")?.includes("image")) {
          const { error } = await supabase
            .from("developers")
            .update({ logo_url: clearbitUrl, updated_at: new Date().toISOString() })
            .eq("id", dev.id);
          
          if (!error) {
            updated++;
            results.push({ name: dev.name, status: "clearbit", url: clearbitUrl });
            console.log(`✅ ${dev.name}: ${clearbitUrl}`);
            continue;
          }
        }
      } catch {}

      // Fallback: Google Favicon (lower quality but more coverage)
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      try {
        const favCheck = await fetch(faviconUrl, { method: "HEAD" });
        if (favCheck.ok) {
          const { error } = await supabase
            .from("developers")
            .update({ logo_url: faviconUrl, updated_at: new Date().toISOString() })
            .eq("id", dev.id);
          
          if (!error) {
            updated++;
            results.push({ name: dev.name, status: "favicon", url: faviconUrl });
            console.log(`✅ ${dev.name}: ${faviconUrl} (favicon)`);
            continue;
          }
        }
      } catch {}

      results.push({ name: dev.name, status: "no_logo_found", domain });
    }

    const { count } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .is("logo_url", null);

    return new Response(JSON.stringify({
      success: true,
      batch_size: devs.length,
      checked,
      updated,
      still_missing: count || 0,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
