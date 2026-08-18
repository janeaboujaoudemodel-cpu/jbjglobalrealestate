// Edge function: compare-extract
// Accepts { url?, fileBase64?, mimeType?, text? } and returns canonical
// comparison fields extracted via Lovable AI gateway (Gemini Flash).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

type ExtractInput = {
  url?: string;
  fileBase64?: string;
  mimeType?: string;
  text?: string;
};

const TOOL = {
  type: 'function',
  function: {
    name: 'extract_comparison_fields',
    description:
      'Extract canonical real-estate project comparison fields from the provided source. Use null when a value is not present — never invent.',
    parameters: {
      type: 'object',
      properties: {
        projectName: { type: ['string', 'null'] },
        developer: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        priceFromAed: { type: ['number', 'null'], description: 'Starting price in AED, integer' },
        priceToAed: { type: ['number', 'null'] },
        bedrooms: { type: ['string', 'null'], description: 'e.g. "1-3" or "Studio-2BR"' },
        sizeFromSqft: { type: ['number', 'null'] },
        sizeToSqft: { type: ['number', 'null'] },
        pricePerSqftAed: { type: ['number', 'null'] },
        handover: { type: ['string', 'null'], description: 'e.g. "Q4 2026"' },
        paymentPlan: { type: ['string', 'null'], description: 'e.g. "60/40" or "Post-handover"' },
        serviceChargeAedPerSqft: { type: ['number', 'null'] },
        rentalYieldPct: { type: ['number', 'null'] },
        amenities: { type: 'array', items: { type: 'string' } },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        sourceUrl: { type: ['string', 'null'] },
      },
      required: ['amenities', 'keyFeatures'],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Audit 4.3 — anonymous callers can burn third-party AI/voice credits
  // through this endpoint. Shared DB-backed per-IP limiter.
  const { response: rateLimited } = await enforceRateLimit(
    req,
    { functionName: 'compare-extract', maxRequests: 15, windowMinutes: 15, keyType: 'ip' },
    corsHeaders,
  );
  if (rateLimited) return rateLimited;

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as ExtractInput;
    if (!body.url && !body.fileBase64 && !body.text) {
      return new Response(
        JSON.stringify({ error: 'Provide one of: url, fileBase64, text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build multi-modal user content
    const userContent: Array<Record<string, unknown>> = [
      {
        type: 'text',
        text:
          'Extract the canonical real-estate comparison fields from the following source. Return only fields the source actually states; use null for missing values. Never fabricate.',
      },
    ];

    if (body.text) {
      userContent.push({ type: 'text', text: body.text.slice(0, 30_000) });
    }

    if (body.url) {
      userContent.push({ type: 'text', text: `Source URL: ${body.url}` });
      // For an image URL, also pass it as an image so vision can read it
      if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(body.url)) {
        userContent.push({ type: 'image_url', image_url: { url: body.url } });
      }
    }

    if (body.fileBase64 && body.mimeType) {
      if (body.mimeType.startsWith('image/')) {
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${body.mimeType};base64,${body.fileBase64}` },
        });
      } else {
        // Non-image (e.g. PDF): include as text hint; AI will still attempt extraction from any url context
        userContent.push({
          type: 'text',
          text: `[Attached file mimeType=${body.mimeType}, base64 length=${body.fileBase64.length}]`,
        });
      }
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a precise data-extraction engine for real-estate project comparisons. Return only verifiable facts from the source. Never invent prices, yields, or handover dates.',
          },
          { role: 'user', content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: 'function', function: { name: 'extract_comparison_fields' } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limited — please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: 'AI credits exhausted. Add credits in Lovable settings.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return new Response(
        JSON.stringify({ error: 'AI gateway error', status: aiResp.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: 'No structured output from AI', raw: json }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    if (body.url && !extracted.sourceUrl) extracted.sourceUrl = body.url;

    return new Response(
      JSON.stringify({ ok: true, data: extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('compare-extract error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
