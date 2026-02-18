import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Government / authority keywords block list
const BLOCKED_KEYWORDS = [
  "government", "ministry", "federal", "municipality", "authority",
  "دائرة", "حكومة", "وزارة", "بلدية", "هيئة الحكومة", "وطني",
  "official seal of", "seal of the state",
];

function isBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw));
}

const fontMap: Record<string, string> = {
  SERIF: '"Georgia", "Times New Roman", serif',
  SANS: '"Arial", "Helvetica", sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", serif',
};

function circleTextPath(
  id: string, cx: number, cy: number, r: number,
  text: string, font: string, fontSize: number, color: string
) {
  return `<defs><path id="${id}" d="M ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy}"/></defs>
  <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="2"><textPath href="#${id}" startOffset="12%">${text}</textPath></text>`;
}

function buildSVG(project: any, templateKey: string): string {
  const COLOR = "#1a2744";
  const W = 300, H = 300;
  const cx = W / 2, cy = H / 2;
  const r = 110;
  const font = fontMap[project.typography_style] || fontMap.SERIF;
  const name = (project.company_name || "COMPANY NAME").toUpperCase();
  const city = ((project.city_optional || project.country_optional || "UAE")).toUpperCase();
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : "";

  switch (templateKey) {
    case "classic-double":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="none" stroke="${COLOR}" stroke-width="1"/>
        ${circleTextPath("cp1", cx, cy, r - 4, `${name}  ✦  ${city}`, font, 9, COLOR)}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="44" font-weight="bold" fill="${COLOR}">${mono}</text>
        ${regNo ? `<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}">${regNo}</text>` : ""}
      </svg>`;
    case "modern-minimal":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="${COLOR}" stroke-width="1.5"/>
        <line x1="${cx - 80}" y1="${cy - 18}" x2="${cx + 80}" y2="${cy - 18}" stroke="${COLOR}" stroke-width="0.8"/>
        <line x1="${cx - 80}" y1="${cy + 18}" x2="${cx + 80}" y2="${cy + 18}" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${cy - 40}" text-anchor="middle" font-family="${font}" font-size="30" font-weight="bold" fill="${COLOR}">${mono}</text>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="${font}" font-size="${name.length > 20 ? 9 : 11}" font-weight="bold" fill="${COLOR}" letter-spacing="2">${name}</text>
        <text x="${cx}" y="${cy + 32}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
      </svg>`;
    case "luxury-ring":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="3"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 16}" fill="none" stroke="${COLOR}" stroke-width="1"/>
        ${circleTextPath("cp3", cx, cy, r - 8, `★  ${name}  ★  ${city}  ★`, font, 8, COLOR)}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="50" font-weight="bold" fill="${COLOR}">${mono}</text>
      </svg>`;
    case "bold-rectangle":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="85" width="260" height="130" rx="3" fill="none" stroke="${COLOR}" stroke-width="3"/>
        <rect x="26" y="91" width="248" height="118" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${cy - 20}" text-anchor="middle" font-family="${font}" font-size="9" fill="${COLOR}" letter-spacing="3">${city}</text>
        <line x1="40" y1="${cy - 8}" x2="260" y2="${cy - 8}" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="${font}" font-size="${name.length > 22 ? 9 : 11}" font-weight="bold" fill="${COLOR}" letter-spacing="1">${name}</text>
        <line x1="40" y1="${cy + 22}" x2="260" y2="${cy + 22}" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>
      </svg>`;
    case "vintage-ornate":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 22}" fill="none" stroke="${COLOR}" stroke-width="0.5" stroke-dasharray="3,2"/>
        ${circleTextPath("cp5", cx, cy, r - 5, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8.5, COLOR)}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="38" font-weight="bold" fill="${COLOR}">${mono}</text>
        <text x="${cx}" y="${cy + 48}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="4">SINCE 2000</text>
      </svg>`;
    case "minimalist-circle":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="none" stroke="${COLOR}" stroke-width="1"/>
        <text x="${cx}" y="${cy - 16}" text-anchor="middle" font-family="${font}" font-size="36" font-weight="bold" fill="${COLOR}">${mono}</text>
        <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="${font}" font-size="${name.length > 22 ? 8 : 10}" fill="${COLOR}" letter-spacing="1">${name}</text>
        <text x="${cx}" y="${cy + 38}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>
      </svg>`;
    case "square-box":
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="${cx - r + 5}" y="${cy - r + 5}" width="${(r - 5) * 2}" height="${(r - 5) * 2}" fill="none" stroke="${COLOR}" stroke-width="2.5"/>
        <rect x="${cx - r + 11}" y="${cy - r + 11}" width="${(r - 11) * 2 + 12}" height="${(r - 11) * 2 + 12}" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${cy - 18}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="44" font-weight="bold" fill="${COLOR}">${mono}</text>
        <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${font}" font-size="${name.length > 18 ? 8 : 10}" font-weight="bold" fill="${COLOR}" letter-spacing="1">${name}</text>
        <text x="${cx}" y="${cy + 36}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
      </svg>`;
    default:
      return buildSVG(project, "classic-double");
  }
}

const TEMPLATES = [
  { key: "classic-double", label: "Classic Double Border", tags: ["classic", "professional"] },
  { key: "modern-minimal", label: "Modern Minimal", tags: ["modern", "clean"] },
  { key: "luxury-ring", label: "Luxury Ring", tags: ["luxury", "premium"] },
  { key: "bold-rectangle", label: "Bold Rectangle", tags: ["bold", "corporate"] },
  { key: "vintage-ornate", label: "Vintage Ornate", tags: ["vintage", "classic"] },
  { key: "minimalist-circle", label: "Minimalist Circle", tags: ["minimal", "simple"] },
  { key: "square-box", label: "Square Box", tags: ["square", "corporate"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.claims.sub;
    const body = await req.json();
    const { action, project, projectId } = body;

    // BLOCK check
    if (isBlocked(project?.company_name || "")) {
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: "Official government or authority seal generation is not permitted.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "generate") {
      // Use AI to pick best template ordering based on style
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let orderedTemplates = TEMPLATES;

      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `You are a stamp design expert. Given stamp project parameters, return an ordered JSON array of template keys best suited for this project. Available keys: ${TEMPLATES.map((t) => t.key).join(", ")}. Return ONLY a JSON array like ["key1","key2",...] with all 7 keys.`,
                },
                {
                  role: "user",
                  content: `Style: ${project.style_theme}, Shape: ${project.stamp_type}, Language: ${project.language_mode}, Border: ${project.border_style}, Typography: ${project.typography_style}`,
                },
              ],
              stream: false,
            }),
          });

          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            const raw = aiJson.choices?.[0]?.message?.content || "";
            const match = raw.match(/\[.*\]/s);
            if (match) {
              const ordered: string[] = JSON.parse(match[0]);
              const reordered = ordered
                .map((k: string) => TEMPLATES.find((t) => t.key === k))
                .filter(Boolean) as typeof TEMPLATES;
              if (reordered.length >= 4) orderedTemplates = reordered;
            }
          }
        } catch (_) {
          // fallback to default order
        }
      }

      // Generate SVG for each template
      const concepts = orderedTemplates.map((t) => ({
        id: crypto.randomUUID(),
        templateKey: t.key,
        label: t.label,
        tags: t.tags,
        svgSource: buildSVG(project, t.key),
      }));

      // Save designs to DB
      if (projectId) {
        const inserts = concepts.map((c) => ({
          project_id: projectId,
          user_id: userId,
          design_version: 1,
          ai_prompt: `${project.style_theme} ${project.stamp_type} ${project.border_style}`,
          style_snapshot_json: project,
          svg_source: c.svgSource,
          template_key: c.templateKey,
        }));
        await supabase.from("stamp_designs").insert(inserts);
      }

      return new Response(JSON.stringify({ concepts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
