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
    const { batch_size = 15 } = await req.json().catch(() => ({}));

    // Get developers missing logos
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null)
      .order("name")
      .limit(batch_size);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, done: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const devNames = devs.map(d => d.name).join("\n");

    // Use AI to find logo URLs for these developers
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
            content: `You are a real estate data expert. For each Dubai/UAE real estate developer, provide the direct URL to their official logo image. 
            
RULES:
- ONLY provide URLs you are confident about from real developer websites
- Logos are typically at paths like: /logo.png, /logo.svg, /images/logo.png, /wp-content/uploads/logo.png
- If you know the developer's website, construct the logo URL
- For developers you don't know, output "UNKNOWN"
- Return ONLY a JSON array, no other text`
          },
          {
            role: "user",
            content: `Find the official logo URL for each of these UAE/Dubai real estate developers:

${devNames}

Return a JSON array like:
[
  {"name": "Developer Name", "logo_url": "https://example.com/logo.png", "website": "https://example.com"},
  {"name": "Unknown Dev", "logo_url": "UNKNOWN", "website": "UNKNOWN"}
]`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON in AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    console.log(`Got ${suggestions.length} AI suggestions`);

    let updated = 0;
    let verified = 0;
    const results: { name: string; status: string; url?: string }[] = [];

    for (const suggestion of suggestions) {
      if (!suggestion.logo_url || suggestion.logo_url === "UNKNOWN") {
        results.push({ name: suggestion.name, status: "unknown" });
        continue;
      }

      verified++;

      // Find matching developer
      const dev = devs.find(d => d.name.toLowerCase() === suggestion.name.toLowerCase());
      if (!dev) {
        results.push({ name: suggestion.name, status: "no_match", url: suggestion.logo_url });
        continue;
      }

      const { error } = await supabase
        .from("developers")
        .update({ logo_url: suggestion.logo_url, updated_at: new Date().toISOString() })
        .eq("id", dev.id);

      if (!error) {
        updated++;
        results.push({ name: suggestion.name, status: "saved", url: suggestion.logo_url });
        console.log(`✅ ${dev.name}: ${suggestion.logo_url}`);
      } else {
        results.push({ name: suggestion.name, status: "db_error" });
      }
    }

    const { count } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .is("logo_url", null);

    return new Response(JSON.stringify({
      success: true,
      batch_size: devs.length,
      ai_suggestions: suggestions.length,
      verified,
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
