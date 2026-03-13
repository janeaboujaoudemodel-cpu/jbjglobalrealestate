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

const arabicFont = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';

// ─── Color tokens ────────────────────────────────────────────────
// Primary = #1a2744 — outer borders, main text
// Secondary = #2a3a5c — inner rings, decorative accents, location text
// Accent = #8b6914 — monogram, center dividers, registration number
const C_PRI = "#1a2744";
const C_SEC = "#2a3a5c";
const C_ACC = "#8b6914";

/** Business type → recommended style mapping */
const BUSINESS_STYLE_MAP: Record<string, { theme: string; border: string; density: number }> = {
  'Real Estate': { theme: 'LUXURY', border: 'RING', density: 3 },
  'General Trading': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Technology': { theme: 'MODERN', border: 'SINGLE', density: 2 },
  'Consulting': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Construction': { theme: 'BOLD', border: 'DOUBLE', density: 3 },
  'Healthcare': { theme: 'MODERN', border: 'DOUBLE', density: 3 },
  'Education': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Food & Beverage': { theme: 'VINTAGE', border: 'ROPE', density: 2 },
  'Tourism': { theme: 'LUXURY', border: 'RING', density: 2 },
  'Finance': { theme: 'LUXURY', border: 'RING', density: 3 },
  'Legal': { theme: 'CLASSIC', border: 'DOUBLE', density: 4 },
};

function autoFontSize(text: string, base: number, maxChars = 20): number {
  if (text.length <= maxChars) return base;
  if (text.length <= maxChars + 8) return Math.round(base * 0.85);
  return Math.round(base * 0.72);
}

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(7, fitted);
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

/** Top arc text via textPath — works for Arabic (RTL) and English */
function topArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, isArabic = false): string {
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  return `
    <defs><path id="${id}" d="${arcPath}"/></defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${isArabic ? 1 : 2.5}" font-weight="800">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>`;
}

/** Bottom arc text — per-character placement so English reads right-side up */
function bottomArcTextChars(cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, isArabic = false): string {
  if (!text) return '';
  const chars = text.split('');
  const n = chars.length;
  if (n === 0) return '';
  const spreadDeg = Math.min(150, n * 11);
  const startDeg = 270 - spreadDeg / 2;
  const stepDeg = n > 1 ? spreadDeg / (n - 1) : 0;
  let result = '';
  for (let i = 0; i < n; i++) {
    const deg = n === 1 ? 270 : startDeg + i * stepDeg;
    const rad = (deg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const rotation = deg + 90;
    result += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" dominant-baseline="central"
      font-family="${font}" font-size="${fontSize}" fill="${color}" font-weight="800"
      letter-spacing="${isArabic ? 1 : 2}"
      transform="rotate(${rotation.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)})">${chars[i]}</text>\n`;
  }
  return result;
}

function separatorDots(cx: number, cy: number, r: number, color: string): string {
  return `
    <text x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="${color}" font-weight="bold">●</text>
    <text x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="${color}" font-weight="bold">●</text>`;
}

function divider(cx: number, y: number, color: string, width = 28): string {
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 5}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
    <polygon points="${cx},${y - 3} ${cx + 4},${y} ${cx},${y + 3} ${cx - 4},${y}" fill="${color}"/>
    <line x1="${cx + 5}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
}

function monogramEl(cx: number, cy: number, text: string, font: string, size: number, color: string): string {
  return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${text.toUpperCase().slice(0, 3)}</text>`;
}

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

// ─── buildSVG — uses color tokens so StampSVGRenderer tinting works ──────────
function buildSVG(project: any, templateKey: string): string {
  const cx = 150, cy = 150;
  const R = 108;
  const font = fontMap[project.typography_style] || fontMap.SERIF;
  const name = (project.company_name || "COMPANY NAME").toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();
  
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const city = (cityParts.join(', ') || "UAE").toUpperCase();
  const arabicCity = (project.arabic_city || '').trim();
  
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : "";
  const hasMono = project.icon_style === 'MONOGRAM';
  const hasLogo = project.icon_style === 'UPLOADED_LOGO' && project.uploaded_logo_url;
  const isBilingual = project.language_mode === 'BILINGUAL' || project.language_mode === 'AR';
  const ba = borderAttrs(project.border_style || 'DOUBLE');
  const showLocation = project.show_location !== false;
  const showReg = project.show_license_number !== false && regNo;

  // Common helper for bilingual circular stamps
  function bilingualCircularStamp(opts: {
    outerR: number;
    innerR: number;
    extraRings?: string;
    centerExtra?: string;
    pathPrefix: string;
  }): string {
    const { outerR, innerR, extraRings = '', centerExtra = '', pathPrefix } = opts;
    const textR = innerR + (outerR - innerR) * 0.5;
    const arcLen = textR * Math.PI;
    const safeArc = arcLen * 0.70;
    
    // Top: Arabic or name
    const topText = isBilingual && arabicName ? arabicName : `✦  ${name}  ✦`;
    const topIsAr = isBilingual && !!arabicName;
    const topFont = topIsAr ? arabicFont : font;
    const topSize = fitFontSize(topText, topIsAr ? 10 : 8.5, safeArc, topIsAr ? 0.48 : 0.54);
    
    // Bottom: English name (per-character)
    const bottomText = isBilingual ? name : city;
    const bottomSize = fitFontSize(bottomText, 8, safeArc, 0.54);
    
    // Location ring
    const locR = outerR * 0.44;
    const locTextR = locR - 2;
    let locationContent = '';
    if (showLocation) {
      const locEn = city;
      const locAr = arabicCity || city;
      const locArcLen = locTextR * Math.PI * 0.70;
      const locEnSize = fitFontSize(locEn, 7, locArcLen, 0.55);
      const locArSize = fitFontSize(locAr, 8, locArcLen, 0.48);
      locationContent = `
        <circle cx="${cx}" cy="${cy}" r="${locR}" fill="none" stroke="${C_SEC}" stroke-width="1.2"/>
        ${topArcText(`${pathPrefix}-loc`, cx, cy, locTextR, locAr, arabicFont, locArSize, C_SEC, true)}
        ${bottomArcTextChars(cx, cy, locTextR, locEn, font, locEnSize, C_SEC)}
      `;
    }

    const centerR = showLocation ? locR - 6 : outerR * 0.30;
    
    // Center: monogram or logo
    let centerContent = '';
    if (hasLogo && project.uploaded_logo_url) {
      const imgS = centerR * 1.6;
      centerContent = `
        <defs><clipPath id="${pathPrefix}-clip"><circle cx="${cx}" cy="${cy}" r="${centerR - 1}"/></clipPath></defs>
        <image href="${project.uploaded_logo_url}" x="${cx - imgS/2}" y="${cy - imgS/2}" width="${imgS}" height="${imgS}" 
          clip-path="url(#${pathPrefix}-clip)" preserveAspectRatio="xMidYMid meet"/>`;
    } else if (hasMono) {
      const monoSize = mono.length <= 2 ? centerR * 0.75 : centerR * 0.55;
      centerContent = monogramEl(cx, cy, mono, font, monoSize, C_ACC);
    }

    // Reg number
    let regContent = '';
    if (showReg) {
      const regY = cy + centerR + 4;
      if (regY < cy + innerR - 4) {
        regContent = `<text x="${cx}" y="${regY}" text-anchor="middle" font-family="${font}" font-size="6" fill="${C_ACC}" letter-spacing="0.8" opacity="0.8">${regNo}</text>`;
      }
    }

    return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${C_PRI}" stroke-width="${ba.outerWidth}" stroke-dasharray="${ba.dash}"/>
      ${ba.innerRing ? `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${C_PRI}" stroke-width="${ba.innerWidth}" stroke-dasharray="${ba.innerDash}"/>` : ''}
      ${extraRings}
      ${topArcText(`${pathPrefix}-top`, cx, cy, textR, topText, topFont, topSize, C_PRI, topIsAr)}
      ${bottomArcTextChars(cx, cy, textR, bottomText, font, bottomSize, C_PRI)}
      ${separatorDots(cx, cy, textR, C_PRI)}
      ${locationContent}
      ${centerContent}
      ${centerExtra}
      ${regContent}
    </svg>`;
  }

  switch (templateKey) {
    case "classic-double": {
      return bilingualCircularStamp({
        outerR: R, innerR: R - 10, pathPrefix: 'cd',
        centerExtra: divider(cx, cy + (hasMono ? 16 : 8), C_SEC, 28),
      });
    }
    case "modern-minimal": {
      const r = R - 8;
      return bilingualCircularStamp({
        outerR: r, innerR: r - 6, pathPrefix: 'mm',
      });
    }
    case "luxury-ring": {
      const r1 = R, r2 = R - 13, r3 = R - 18;
      return bilingualCircularStamp({
        outerR: r1, innerR: r3, pathPrefix: 'lr',
        extraRings: `<circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${C_SEC}" stroke-width="0.5"/>`,
        centerExtra: `${divider(cx, cy + 34, C_SEC, 22)}<text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${C_SEC}" letter-spacing="5">EST.</text>`,
      });
    }
    case "bold-rectangle": {
      const rw = 190, rh = 100;
      const x1 = 0, y1 = 0;
      const rcx = rw / 2, rcy = rh / 2;
      const nameFontSize = autoFontSize(name, 11, 22);
      const arSize = autoFontSize(arabicName || name, 10, 18);
      return `<svg viewBox="0 0 ${rw} ${rh}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${x1 + 2}" y="${y1 + 2}" width="${rw - 4}" height="${rh - 4}" rx="4" fill="none" stroke="${C_PRI}" stroke-width="${ba.outerWidth}" stroke-dasharray="${ba.dash}"/>
        ${ba.innerRing ? `<rect x="${x1 + 7}" y="${y1 + 7}" width="${rw - 14}" height="${rh - 14}" rx="2" fill="none" stroke="${C_SEC}" stroke-width="${ba.innerWidth}" stroke-dasharray="${ba.innerDash}"/>` : ''}
        <text x="${rcx}" y="${y1 + 22}" text-anchor="middle" font-family="${font}" font-size="7" fill="${C_SEC}" letter-spacing="3">${city}</text>
        <line x1="${x1 + 14}" y1="${y1 + 28}" x2="${rw - 14}" y2="${y1 + 28}" stroke="${C_SEC}" stroke-width="0.7"/>
        ${wrapText(name, rcx, rcy + 2, font, nameFontSize, C_PRI, 2)}
        ${isBilingual && arabicName ? `<text x="${rcx}" y="${rcy + 18}" text-anchor="middle" font-family="${arabicFont}" font-size="${arSize}" fill="${C_PRI}" direction="rtl" unicode-bidi="bidi-override">${arabicName}</text>` : ''}
        <line x1="${x1 + 14}" y1="${rh - 28}" x2="${rw - 14}" y2="${rh - 28}" stroke="${C_SEC}" stroke-width="0.7"/>
        ${showReg ? `<text x="${rcx}" y="${rh - 12}" text-anchor="middle" font-family="${font}" font-size="6" fill="${C_ACC}">${regNo}</text>` : ''}
      </svg>`;
    }
    case "vintage-ornate": {
      return bilingualCircularStamp({
        outerR: R, innerR: R - 18, pathPrefix: 'vo',
        extraRings: `<circle cx="${cx}" cy="${cy}" r="${R - 12}" fill="none" stroke="${C_SEC}" stroke-width="0.6" stroke-dasharray="3,2.5"/>`,
        centerExtra: divider(cx, cy + (hasMono ? 18 : 14), C_SEC, 24),
      });
    }
    case "bilingual-official": {
      return bilingualCircularStamp({
        outerR: R, innerR: R - 9, pathPrefix: 'bo',
        centerExtra: `<line x1="${cx - 45}" y1="${cy + 2}" x2="${cx + 45}" y2="${cy + 2}" stroke="${C_SEC}" stroke-width="0.6"/>`,
      });
    }
    case "geometric-modern": {
      const r = R - 6;
      const innerGeo = hasMono
        ? `<rect x="${cx - 30}" y="${cy - 30}" width="60" height="60" fill="none" stroke="${C_SEC}" stroke-width="1" transform="rotate(45, ${cx}, ${cy})"/>`
        : `<rect x="${cx - 38}" y="${cy - 18}" width="76" height="36" rx="2" fill="none" stroke="${C_SEC}" stroke-width="0.8"/>`;
      return bilingualCircularStamp({
        outerR: r, innerR: r - 6, pathPrefix: 'gm',
        extraRings: innerGeo,
      });
    }
    case "square-premium": {
      const s = 130;
      const nameFontSize = autoFontSize(name, 10, 20);
      const arSize = autoFontSize(arabicName || name, 10, 16);
      return `<svg viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="${s - 6}" height="${s - 6}" rx="3" fill="none" stroke="${C_PRI}" stroke-width="${ba.outerWidth}" stroke-dasharray="${ba.dash}"/>
        ${ba.innerRing ? `<rect x="9" y="9" width="${s - 18}" height="${s - 18}" rx="2" fill="none" stroke="${C_SEC}" stroke-width="${ba.innerWidth}" stroke-dasharray="${ba.innerDash}"/>` : ''}
        ${hasMono ? monogramEl(s/2, s/2 - 16, mono, font, 28, C_ACC) : ''}
        ${wrapText(name, s/2, s/2 + (hasMono ? 10 : -2), font, nameFontSize, C_PRI, 1.5)}
        ${isBilingual && arabicName ? `<text x="${s/2}" y="${s/2 + (hasMono ? 24 : 12)}" text-anchor="middle" font-family="${arabicFont}" font-size="${arSize}" fill="${C_PRI}" direction="rtl" unicode-bidi="bidi-override">${arabicName}</text>` : ''}
        <text x="${s/2}" y="${s - 20}" text-anchor="middle" font-family="${font}" font-size="7" fill="${C_SEC}" letter-spacing="3">${city}</text>
        ${showReg ? `<text x="${s/2}" y="${s - 11}" text-anchor="middle" font-family="${font}" font-size="5.5" fill="${C_ACC}">${regNo}</text>` : ''}
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = user.id;
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

      // Business type → style suggestion enrichment
      const businessType = project?.business_type || '';
      const styleSuggestion = BUSINESS_STYLE_MAP[businessType];
      let styleHint = '';
      if (styleSuggestion) {
        styleHint = ` Business type is "${businessType}" which works best with ${styleSuggestion.theme} theme and ${styleSuggestion.border} border.`;
      }

      // Smart ordering via AI
      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              messages: [
                { role: "system", content: `You are a stamp design expert. Order these template keys best to worst for the given project. Available: ${orderedTemplates.map(t => t.key).join(", ")}. Return ONLY JSON array like ["key1","key2",...] with ALL keys.` },
                { role: "user", content: `Style: ${project.style_theme}, Shape: ${project.stamp_type}, Language: ${project.language_mode}, Border: ${project.border_style}, Typography: ${project.typography_style}.${styleHint}` },
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
          } else if (aiRes.status === 429) {
            console.warn("AI rate limited, using default template order");
          } else if (aiRes.status === 402) {
            console.warn("AI credits exhausted, using default template order");
          }
        } catch (e) {
          console.error("AI ordering error:", e);
        }
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
          ai_prompt: `${project.style_theme} ${project.stamp_type} ${project.border_style}${businessType ? ` [${businessType}]` : ''}`,
          style_snapshot_json: project,
          svg_source: c.svgSource,
          template_key: c.templateKey,
          is_favorite: false,
        }));
        await supabase.from("stamp_designs").insert(inserts);
      }

      return new Response(JSON.stringify({ 
        concepts,
        styleSuggestion: styleSuggestion ? {
          businessType,
          recommendedTheme: styleSuggestion.theme,
          recommendedBorder: styleSuggestion.border,
          recommendedDensity: styleSuggestion.density,
        } : null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REFINE action ─────────────────────────────────────────────────────────
    if (action === "refine") {
      if (!instruction) {
        return new Response(JSON.stringify({ error: "Instruction required" }), { 
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      let refinedSvg = currentSvg || buildSVG(project, "classic-double");
      let message = "Design refined based on your instructions.";

      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              messages: [
                {
                  role: "system",
                  content: `You are an expert SVG stamp designer. You will receive an existing stamp SVG and instructions to modify it.
Return ONLY the modified SVG code (starting with <svg) with NO explanation. Keep it as a valid SVG.
Guidelines:
- All text must stay inside the border rings with at least 2px clearance
- Do not add text that overlaps borders
- Keep the stamp professional and clean
- Use these specific color hex codes:
  - Primary (borders, company name): #1a2744
  - Secondary (inner rings, accents, location): #2a3a5c
  - Accent (monogram, registration, dividers): #8b6914
- Do not add any external images or base64 data
- For bottom arc text, use individual <text> elements at calculated positions (per-character), NOT textPath
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
              message = `Applied: "${instruction}"`;
            }
          } else if (aiRes.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } else if (aiRes.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          console.error("AI refine error:", e);
        }
      }

      let savedId = crypto.randomUUID();
      if (projectId) {
        const { data } = await supabase.from("stamp_designs").insert({
          project_id: projectId,
          user_id: userId,
          design_version: 2,
          ai_prompt: instruction,
          style_snapshot_json: project,
          svg_source: refinedSvg,
          template_key: "refined",
          is_favorite: false,
        }).select("id").single();
        if (data) savedId = data.id;
      }

      return new Response(JSON.stringify({ svgSource: refinedSvg, id: savedId, message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (err) {
    console.error("stamp-generator error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
