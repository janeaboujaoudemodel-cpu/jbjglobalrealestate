// Generates 4 alternative chrome (header + footer) variants for the JBJ
// PAA template using the Lovable AI Gateway. No API key required from user.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChromeRequest {
  current?: Record<string, unknown>;
  vibe?: string; // e.g. "more minimal", "more institutional", "softer"
}

const HEADER_STYLES = ["monogram-wordmark", "wordmark-only", "crest-address", "minimal-hairline"];
const FOOTER_STYLES = ["three-column", "centered-tagline", "compliance-bar"];

const SYSTEM = `You are JBJ GLOBAL REAL ESTATE's brand chrome designer.
Brand rules (strict):
- Champagne #FDFBF7 / #F7F2EA surface, gold #B89555 hairlines only (NEVER solid gold fills).
- Ink #1A1A1A text. No faded gold text.
- Inter typeface only.
Allowed headerStyle: ${HEADER_STYLES.join(", ")}.
Allowed footerStyle: ${FOOTER_STYLES.join(", ")}.
Return ONLY a JSON object: { "variants": [ { name, accent, ink, surface, headerStyle, footerStyle, tagline, trn, license } x 4 ] }.
Each variant must be visually distinct. accent must be #B89555 or a tasteful champagne hex. surface must be #FFFFFF or #FDFBF7.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json().catch(() => ({}))) as ChromeRequest;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = `Current chrome:\n${JSON.stringify(body.current ?? {}, null, 2)}\nDesigner direction: ${body.vibe || "Generate 4 distinct premium variations across the allowed header/footer styles."}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited, please retry shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI error: ${t.slice(0, 200)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const variants = Array.isArray(parsed.variants) ? parsed.variants.slice(0, 4) : [];

    // Sanitize each variant against allow-lists
    const safe = variants.map((v: any, i: number) => ({
      name: String(v?.name || `Variant ${i + 1}`).slice(0, 40),
      accent: /^#[0-9A-Fa-f]{6}$/.test(v?.accent) ? v.accent : "#B89555",
      ink: /^#[0-9A-Fa-f]{6}$/.test(v?.ink) ? v.ink : "#1A1A1A",
      surface: /^#[0-9A-Fa-f]{6}$/.test(v?.surface) ? v.surface : "#FFFFFF",
      headerStyle: HEADER_STYLES.includes(v?.headerStyle) ? v.headerStyle : HEADER_STYLES[i % HEADER_STYLES.length],
      footerStyle: FOOTER_STYLES.includes(v?.footerStyle) ? v.footerStyle : FOOTER_STYLES[i % FOOTER_STYLES.length],
      tagline: String(v?.tagline || "PRIVATE OFFICE · DUBAI · INSTITUTIONAL REAL ESTATE").slice(0, 80),
      trn: String(v?.trn || "").slice(0, 40),
      license: String(v?.license || "").slice(0, 40),
    }));

    return new Response(JSON.stringify({ variants: safe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
