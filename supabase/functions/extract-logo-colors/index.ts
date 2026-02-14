import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function extractColorViaAI(logoUrl: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this logo image carefully. I need the EXACT background/border color that surrounds the logo graphic itself — the color of the rectangular area behind and around the logo symbol/text. This is NOT the color of the logo text or icon, but the BACKGROUND COLOR the logo sits on. Match the EXACT shade precisely — do not approximate. If the background is transparent, white, or near-white, return rgb(255,255,255). For dark backgrounds, distinguish carefully between pure black rgb(0,0,0), dark navy rgb(0,40,85), dark brown rgb(90,60,30), etc. Return ONLY the rgb() value with no spaces, nothing else. Example: rgb(0,40,85)"
              },
              {
                type: "image_url",
                image_url: { url: logoUrl }
              }
            ]
          }
        ],
        max_tokens: 50,
      }),
    });

    if (!resp.ok) {
      console.error(`AI error for ${logoUrl}: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Extract rgb() value from response
    const match = text.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/);
    if (match) {
      return `rgb(${match[1]},${match[2]},${match[3]})`;
    }
    
    console.log(`Could not parse AI response for ${logoUrl}: "${text}"`);
    return null;
  } catch (e) {
    console.error("AI extraction error:", e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reset = false, batch_size = 10 } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Reset all colors if requested
    if (reset) {
      const { error: resetError } = await supabase
        .from("developers")
        .update({ logo_bg_color: null })
        .not("logo_url", "is", null);
      
      if (resetError) throw resetError;
      console.log("Reset all logo_bg_color values");
    }

    // Get developers that have a logo but no bg color
    const { data: developers, error } = await supabase
      .from("developers")
      .select("id, name, slug, logo_url, logo_bg_color")
      .not("logo_url", "is", null)
      .is("logo_bg_color", null)
      .limit(batch_size);

    if (error) throw error;

    if (!developers || developers.length === 0) {
      // Check total remaining
      const { count } = await supabase
        .from("developers")
        .select("id", { count: "exact", head: true })
        .not("logo_url", "is", null)
        .is("logo_bg_color", null);

      return new Response(
        JSON.stringify({ message: "All developers processed", processed: 0, remaining: count || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;
    const results: { name: string; color: string | null }[] = [];

    for (const dev of developers) {
      const color = await extractColorViaAI(dev.logo_url, apiKey);
      const finalColor = color || "rgb(255,255,255)";

      const { error: updateError } = await supabase
        .from("developers")
        .update({ logo_bg_color: finalColor })
        .eq("id", dev.id);

      if (!updateError) {
        processed++;
      } else {
        failed++;
      }
      results.push({ name: dev.name, color: finalColor });
      console.log(`${dev.name}: ${finalColor}`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    // Check remaining
    const { count } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .not("logo_url", "is", null)
      .is("logo_bg_color", null);

    return new Response(
      JSON.stringify({
        message: `Processed ${processed}, failed ${failed}`,
        remaining: count || 0,
        processed,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
