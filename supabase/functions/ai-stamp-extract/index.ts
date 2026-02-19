import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are an expert OCR system analyzing a business document, trade license, or commercial registration certificate — most likely issued in the United Arab Emirates.

Extract ALL of the following information that is visible in the document:
1. Company name in English (exact as printed, including LLC / FZE / CO. / L.L.C etc.)
2. Company name in Arabic (exact Arabic characters as printed — if present)
3. License / registration / commercial number
4. City (in English) — the city where the COMPANY is registered (e.g. Dubai, Abu Dhabi, Sharjah, Ajman)
5. City in Arabic (if present)
6. Country (in English) — the country where the COMPANY is registered, NOT the nationality of the owner or director. For UAE documents this is always "United Arab Emirates". Common UAE cities: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain.
7. Phone number — format as international: start with + and country code (e.g. +971 for UAE). Convert 04/05 local UAE format to +971 4 / +971 5. Remove all dashes; use spaces as separators: +971 4 123 4567.
8. Email address (any email found)
9. Website / URL (if present)

CRITICAL RULES:
- "country" = where the COMPANY is registered, NEVER the nationality of a person.
- If the document is a UAE trade license and any city is Dubai / Abu Dhabi / Sharjah etc., set country to "United Arab Emirates".
- Do NOT put Lebanon, Egypt, India, Pakistan, Jordan, Syria, or any personal nationality in the "country" field.
- Phone: always use international format starting with +. Remove all dashes.

Return ONLY a valid JSON object with these exact keys (omit any key where the information is not found or not legible):
{
  "company_name": "...",
  "arabic_company_name": "...",
  "registration_number": "...",
  "city": "...",
  "arabic_city": "...",
  "country": "...",
  "phone": "...",
  "email": "...",
  "website": "..."
}

Rules:
- Return ONLY the JSON object. No markdown, no explanation, no code fences.
- For Arabic text, preserve exact Arabic characters including diacritics.
- If a field is not clearly visible, omit it entirely — do not guess.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let extracted: Record<string, string> = {};
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object from content
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { extracted = JSON.parse(match[0]); } catch { /* fall through */ }
      }
    }

    // Clean up empty values
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(extracted)) {
      if (val && typeof val === 'string' && val.trim() && val.trim() !== 'N/A' && val.trim() !== 'n/a') {
        result[key] = val.trim();
      }
    }

    // Server-side country correction: if city is UAE but country is a personal nationality, override
    const uaeCities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain'];
    const nonUaeNationalities = ['lebanon', 'egypt', 'india', 'pakistan', 'jordan', 'syria', 'philippines', 'iraq', 'morocco'];
    if (result.city && result.country) {
      const cityLower = result.city.toLowerCase();
      const countryLower = result.country.toLowerCase();
      const isUaeCity = uaeCities.some(c => cityLower.includes(c));
      const isPersonalNationality = nonUaeNationalities.some(n => countryLower.includes(n));
      if (isUaeCity && isPersonalNationality) {
        result.country = 'United Arab Emirates';
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-stamp-extract error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
