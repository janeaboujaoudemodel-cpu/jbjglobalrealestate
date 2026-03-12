import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  SERIF: 'Georgia, "Times New Roman", serif',
  SANS: 'Arial, Helvetica, sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", serif',
  GOTHIC: '"Copperplate Gothic", Copperplate, "Small Caps", serif',
  ARABIC_MODERN: '"Arabic Typesetting", "Noto Naskh Arabic", serif',
};

const arabicFont = 'Arial, "Noto Naskh Arabic", sans-serif';

function autoFontSize(text: string, base: number, maxChars = 20): number {
  if (text.length <= maxChars) return base;
  if (text.length <= maxChars + 8) return Math.round(base * 0.85);
  return Math.round(base * 0.72);
}

function wrapText(text: string, x: number, y: number, font: string, size: number, color: string, letterSpacing = 1): string {
  if (text.length <= 22) {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">${text}</text>`;
  }
  const mid = Math.floor(text.length / 2);
  let split = text.lastIndexOf(' ', mid);
  if (split < 5) split = text.indexOf(' ', mid);
  if (split < 0) split = mid;
  const line1 = text.slice(0, split).trim();
  const line2 = text.slice(split).trim();
  const lineH = size + 2;
  return `<text text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">
    <tspan x="${x}" dy="-${lineH / 2}">${line1}</tspan>
    <tspan x="${x}" dy="${lineH}">${line2}</tspan>
  </text>`;
}

function ringText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, startOffset = '50%') {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="1.5">
      <textPath href="#${id}" startOffset="${startOffset}" text-anchor="middle">${text}</textPath>
    </text>`;
}

function bottomArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string) {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="2">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>`;
}

function divider(cx: number, y: number, color: string, width = 28) {
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 5}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
    <polygon points="${cx},${y - 3} ${cx + 4},${y} ${cx},${y + 3} ${cx - 4},${y}" fill="${color}"/>
    <line x1="${cx + 5}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
}

function monogram(cx: number, cy: number, text: string, font: string, size: number, color: string) {
  return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${text.toUpperCase().slice(0, 3)}</text>`;
}

/** Get border stroke attributes based on border_style */
function borderAttrs(borderStyle: string): { dash: string; outerWidth: number; innerRing: boolean; innerDash: string; innerWidth: number } {
  switch (borderStyle) {
    case 'SINGLE': return { dash: 'none', outerWidth: 2.2, innerRing: false, innerDash: 'none', innerWidth: 0 };
    case 'DOUBLE': return { dash: 'none', outerWidth: 2.2, innerRing: true, innerDash: 'none', innerWidth: 0.8 };
    case 'RING': return { dash: 'none', outerWidth: 3.5, innerRing: true, innerDash: 'none', innerWidth: 2 };
    case 'DOTTED': return { dash: '2,2', outerWidth: 2, innerRing: false, innerDash: 'none', innerWidth: 0 };
    case 'ROPE': return { dash: '5,3', outerWidth: 2.5, innerRing: false, innerDash: 'none', innerWidth: 0 };
    case 'CUSTOM': return { dash: 'none', outerWidth: 2.2, innerRing: true, innerDash: '2,4', innerWidth: 0.6 };
    default: return { dash: 'none', outerWidth: 2.2, innerRing: true, innerDash: 'none', innerWidth: 0.8 };
  }
}

function buildSVG(project: any, templateKey: string): string {
  const COLOR = "#1a2744";
  const cx = 150, cy = 150;
  const R = 108;
  const font = fontMap[project.typography_style] || fontMap.SERIF;
  const name = (project.company_name || "COMPANY NAME").toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();
  
  // Fixed: city + country combined
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const city = (cityParts.join(', ') || "UAE").toUpperCase();
  const arabicCity = (project.arabic_city || '').trim();
  
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : "";
  const hasMono = project.icon_style === 'MONOGRAM';
  const isBilingual = project.language_mode === 'BILINGUAL' || project.language_mode === 'AR';
  const ba = borderAttrs(project.border_style || 'DOUBLE');

  switch (templateKey) {
    case "classic-double": {
      const innerR = R - 10, ringR = R - 5;
      const nameFontSize = autoFontSize(name, 10, 20);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${COLOR}" stroke-width="${ba.outerWidth}" stroke-dasharray="${ba.dash}"/>
        ${ba.innerRing ? `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="${ba.innerWidth}" stroke-dasharray="${ba.innerDash}"/>` : ''}
        ${ringText('cp1t', cx, cy, ringR, `✦  ${name}  ✦`, font, 8.5, COLOR, '25%')}
        ${bottomArcText('cp1b', cx, cy, ringR, city, font, 8, COLOR)}
        ${hasMono ? monogram(cx, cy - 8, mono, font, 44, COLOR) : ''}
        ${hasMono
          ? `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>`
          : wrapText(name, cx, cy - 4, font, nameFontSize, COLOR, 1.5)
        }
        ${!hasMono ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>` : ''}
        ${regNo ? `<text x="${cx}" y="${cy + (hasMono ? 44 : 36)}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
        ${divider(cx, cy + (hasMono ? 16 : 8), COLOR, 28)}
      </svg>`;
    }
    case "modern-minimal": {
      const r = R - 8, innerPad = 22;
      const nameFontSize = autoFontSize(name, 11, 20);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="${ba.outerWidth}" stroke-dasharray="${ba.dash}"/>
        ${ba.innerRing ? `<circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${COLOR}" stroke-width="${ba.innerWidth}" stroke-dasharray="${ba.innerDash}"/>` : ''}
        <line x1="${cx - r + innerPad}" y1="${cy - 22}" x2="${cx + r - innerPad}" y2="${cy - 22}" stroke="${COLOR}" stroke-width="0.7"/>
        <line x1="${cx - r + innerPad}" y1="${cy + 22}" x2="${cx + r - innerPad}" y2="${cy + 22}" stroke="${COLOR}" stroke-width="0.7"/>
        ${hasMono ? monogram(cx, cy - 50, mono, font, 30, COLOR) : ''}
        ${wrapText(name, cx, cy + (hasMono ? -4 : -8), font, nameFontSize, COLOR, 2)}
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>
        ${regNo ? `<text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      </svg>`;
    }
    case "luxury-ring": {
      const r1 = R, r2 = R - 13, r3 = R - 18, ringR = R - 7;
      const nameFontSize = autoFontSize(name, 10, 18);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${COLOR}" stroke-width="2.8"/>
        <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
        <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="1.2"/>
        ${ringText('cp3', cx, cy, ringR, `★  ${name}  ★  ${city}  ★`, font, 7.5, COLOR, '50%')}
        ${hasMono ? monogram(cx, cy, mono, font, 52, COLOR) : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1)}
        ${!hasMono ? `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>` : ''}
        ${divider(cx, cy + 34, COLOR, 22)}
        <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}" letter-spacing="5">EST.</text>
      </svg>`;
    }
    case "bold-rectangle": {
      const rw = 128, rh = 82;
      const x1 = cx - rw, y1 = cy - rh;
      const nameFontSize = autoFontSize(name, 11, 22);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="${x1}" y="${y1}" width="${rw * 2}" height="${rh * 2}" rx="4" fill="none" stroke="${COLOR}" stroke-width="3"/>
        <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${rh * 2 - 10}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
        <text x="${cx}" y="${y1 + 26}" text-anchor="middle" font-family="${font}" font-size="8.5" fill="${COLOR}" letter-spacing="4">${city}</text>
        <line x1="${x1 + 14}" y1="${y1 + 34}" x2="${x1 + rw * 2 - 14}" y2="${y1 + 34}" stroke="${COLOR}" stroke-width="0.7"/>
        ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 2)}
        <line x1="${x1 + 14}" y1="${y1 + rh * 2 - 34}" x2="${x1 + rw * 2 - 14}" y2="${y1 + rh * 2 - 34}" stroke="${COLOR}" stroke-width="0.7"/>
        <text x="${cx}" y="${y1 + rh * 2 - 18}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
        ${regNo ? `<text x="${cx}" y="${y1 + rh * 2 - 8}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      </svg>`;
    }
    case "vintage-ornate": {
      const r = R, innerR = R - 18, ringR = R - 5;
      const nameFontSize = autoFontSize(name, 9.5, 18);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.6" stroke-dasharray="3,2.5"/>
        ${ringText('cp5', cx, cy, ringR, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8, COLOR, '50%')}
        ${hasMono ? monogram(cx, cy - 6, mono, font, 40, COLOR) : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1.5)}
        ${divider(cx, cy + (hasMono ? 18 : 14), COLOR, 24)}
        <text x="${cx}" y="${cy + (hasMono ? 30 : 26)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="4">SINCE 2010</text>
      </svg>`;
    }
    case "bilingual-official": {
      const r = R, innerR = R - 9;
      const displayArabic = arabicName || name;
      const displayArabicCity = arabicCity || city;
      const enFontSize = autoFontSize(name, 9.5, 22);
      const arFontSize = autoFontSize(displayArabic, 11, 16);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2.2"/>
        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.7"/>
        <line x1="${cx - 55}" y1="${cy}" x2="${cx + 55}" y2="${cy}" stroke="${COLOR}" stroke-width="1"/>
        <text x="${cx}" y="${cy - 28}" text-anchor="middle" font-family="${font}" font-size="${enFontSize}" font-weight="bold" fill="${COLOR}">${name}</text>
        <text x="${cx}" y="${cy - 14}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="2">${city}</text>
        <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}" direction="rtl" unicode-bidi="bidi-override">${displayArabic}</text>
        <text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="${arabicFont}" font-size="8" fill="${COLOR}" direction="rtl">${displayArabicCity}</text>
        ${regNo ? `<text x="${cx}" y="${cy + 52}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
        <text x="${cx}" y="${cy - 52}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>
      </svg>`;
    }
    case "geometric-modern": {
      const r = R - 6;
      const nameFontSize = autoFontSize(name, 10, 20);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="1.8"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
        ${hasMono
          ? `<rect x="${cx - 36}" y="${cy - 36}" width="72" height="72" fill="none" stroke="${COLOR}" stroke-width="1" transform="rotate(45, ${cx}, ${cy})"/>
             ${monogram(cx, cy - 2, mono, font, 28, COLOR)}`
          : `<rect x="${cx - 45}" y="${cy - 22}" width="90" height="44" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>`
        }
        ${ringText('cp7', cx, cy, r - 3, `${name}  ◆  ${city}`, font, 7.5, COLOR, '50%')}
        ${!hasMono ? wrapText(name, cx, cy, font, nameFontSize, COLOR, 2) : ''}
      </svg>`;
    }
    case "square-premium": {
      const s = 100;
      const nameFontSize = autoFontSize(name, 10, 20);
      return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="3" fill="none" stroke="${COLOR}" stroke-width="2.5"/>
        <rect x="${cx - s + 6}" y="${cy - s + 6}" width="${s * 2 - 12}" height="${s * 2 - 12}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
        ${hasMono ? monogram(cx, cy - 22, mono, font, 42, COLOR) : ''}
        ${wrapText(name, cx, cy + (hasMono ? 18 : 0), font, nameFontSize, COLOR, 1.5)}
        <text x="${cx}" y="${cy + (hasMono ? 38 : 18)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
        ${regNo ? `<text x="${cx}" y="${cy + (hasMono ? 52 : 32)}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
        <text x="${cx}" y="${cy - s + 18}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
        <line x1="${cx - s + 10}" y1="${cy - s + 24}" x2="${cx + s - 10}" y2="${cy - s + 24}" stroke="${COLOR}" stroke-width="0.7"/>
      </svg>`;
    }
    default:
      return buildSVG(project, "classic-double");
  }
}

const TEMPLATES = [
  { key: "classic-double", label: "Classic Double Ring", tags: ["classic", "professional"] },
  { key: "modern-minimal", label: "Modern Minimal", tags: ["modern", "clean"] },
  { key: "luxury-ring", label: "Luxury Triple Ring", tags: ["luxury", "premium"] },
  { key: "bold-rectangle", label: "Bold Corporate Rectangle", tags: ["bold", "corporate"] },
  { key: "vintage-ornate", label: "Vintage Seal", tags: ["vintage", "classic"] },
  { key: "geometric-modern", label: "Geometric Modern", tags: ["geometric", "modern"] },
  { key: "square-premium", label: "Square Premium", tags: ["square", "corporate"] },
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
    const { action, project, projectId, instruction, currentSvg } = body;

    if (isBlocked(project?.company_name || "")) {
      return new Response(JSON.stringify({ blocked: true, reason: "Official government or authority seal generation is not permitted." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // ── GENERATE action ──────────────────────────────────────────────────────
    if (action === "generate") {
      let orderedTemplates = [...TEMPLATES];

      // Add bilingual template if needed
      const isBilingual = project?.language_mode === 'BILINGUAL' || project?.language_mode === 'AR';
      if (isBilingual) {
        orderedTemplates = [
          { key: "bilingual-official", label: "Bilingual Official", tags: ["bilingual", "arabic", "official"] },
          ...orderedTemplates,
        ];
      }

      // AI ordering
      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: `You are a stamp design expert. Order these template keys best to worst for the given project. Available: ${orderedTemplates.map(t => t.key).join(", ")}. Return ONLY JSON array like ["key1","key2",...] with ALL keys.` },
                { role: "user", content: `Style: ${project.style_theme}, Shape: ${project.stamp_type}, Language: ${project.language_mode}, Border: ${project.border_style}, Typography: ${project.typography_style}` },
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
              const reordered = ordered.map((k: string) => orderedTemplates.find(t => t.key === k)).filter(Boolean) as typeof orderedTemplates;
              if (reordered.length >= 4) orderedTemplates = reordered;
            }
          }
        } catch (_) {}
      }

      // Delete non-favorite existing designs for this project
      if (projectId) {
        await supabase.from("stamp_designs").delete().eq("project_id", projectId).eq("is_favorite", false);
      }

      const concepts = orderedTemplates.map(t => ({
        id: crypto.randomUUID(),
        templateKey: t.key,
        label: t.label,
        tags: t.tags,
        svgSource: buildSVG(project, t.key),
      }));

      if (projectId) {
        const inserts = concepts.map(c => ({
          project_id: projectId,
          user_id: userId,
          design_version: 1,
          ai_prompt: `${project.style_theme} ${project.stamp_type} ${project.border_style}`,
          style_snapshot_json: project,
          svg_source: c.svgSource,
          template_key: c.templateKey,
          is_favorite: false,
        }));
        await supabase.from("stamp_designs").insert(inserts);
      }

      return new Response(JSON.stringify({ concepts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REFINE action (AI Designer Chat) ─────────────────────────────────────
    if (action === "refine") {
      if (!instruction) {
        return new Response(JSON.stringify({ error: "Instruction required" }), { status: 400, headers: corsHeaders });
      }

      let refinedSvg = currentSvg || buildSVG(project, "classic-double");
      let message = "Design refined based on your instructions.";

      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `You are an expert SVG stamp designer. You will receive an existing stamp SVG and instructions to modify it.
Return ONLY the modified SVG code (starting with <svg) with NO explanation. Keep it as a valid SVG viewBox="0 0 300 300".
Guidelines:
- All text must remain within the safe zone (inside the border)
- Do not add text that overlaps borders
- Keep the stamp professional and clean
- Company color is #1a2744 (dark navy) by default
- Do not add any external images or base64 data
- Return ONLY the SVG, nothing else`,
                },
                {
                  role: "user",
                  content: `Company: ${project.company_name}\nInstruction: ${instruction}\n\nCurrent SVG:\n${currentSvg || 'Use a classic double ring design'}`,
                },
              ],
              stream: false,
            }),
          });

          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            const raw = aiJson.choices?.[0]?.message?.content || "";
            const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
            if (svgMatch) {
              refinedSvg = svgMatch[0];
              message = `AI Designer applied: "${instruction}"`;
            }
          }
        } catch (_) {}
      }

      // Save the refined design to DB
      let savedId = crypto.randomUUID();
      if (projectId) {
        const { data } = await supabase.from("stamp_designs").insert({
          project_id: projectId,
          user_id: userId,
          design_version: 2,
          ai_prompt: instruction,
          style_snapshot_json: project,
          svg_source: refinedSvg,
          template_key: "ai-refined",
          is_favorite: false,
        }).select("id").single();
        if (data) savedId = data.id;
      }

      return new Response(JSON.stringify({ svgSource: refinedSvg, id: savedId, message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
