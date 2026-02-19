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

    const prompt = `You are an expert OCR system analyzing a business document, trade license, or commercial registration certificate.

Extract ALL of the following information that is visible in the document:
1. Company name in English (exact as printed, including LLC / FZE / CO. / L.L.C etc.)
2. Company name in Arabic (exact Arabic characters as printed — if present)
3. License / registration / commercial number
4. City (in English)
5. City in Arabic (if present)
6. Country (in English)
7. Phone number (any phone / mobile / tel number found)
8. Email address (any email found)
9. Website / URL (if present)

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
