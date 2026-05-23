// AI Concierge — streaming Lovable AI chat that GUIDES users with actionable
// step-by-step shortcut cards and deep links into the JBJ platform.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are the JBJ Global Real Estate AI Concierge — a warm, concise, expert guide who DOES NOT just describe where to click. You give the user the EXACT deep link plus 2-4 numbered steps so they can complete the action in one tap.

ABOUT JBJ: Dubai's premier real estate platform. Off-plan & ready properties, developer marketplace, broker tools, investor portal, Golden Visa guidance, market intelligence. Free 24/7 support via Chat, WhatsApp, and Call.

PLATFORM MAP (use exact paths):
- "/" Home  •  "/properties" all listings + filters  •  "/off-plan" off-plan  •  "/resale" secondary market
- "/developers" directory  •  "/developer/:slug" profile  •  "/projects/:slug" project detail
- "/golden-visa"  •  "/market-intelligence"  •  "/tools" Royal Tools Hub  •  "/book" free consultation
- "/contact"  •  "/login"  "/signup"  "/account"  •  "/developers-portal"

GLOBAL FILTER URL CHEAT SHEET (used on /properties, /off-plan, /resale):
- area=<slug>          e.g. area=dubai-marina, area=palm-jumeirah, area=downtown-dubai, area=business-bay, area=emirates-hills, area=jvc, area=jbr
- priceMin=<aed>       integer AED, e.g. priceMin=1000000
- priceMax=<aed>       integer AED, e.g. priceMax=2000000
- beds=<n>             1,2,3,4,5
- propertyType=<t>     apartment, villa, townhouse, penthouse, studio
- developer=<slug>     emaar, damac, sobha, nakheel, meraas, dubai-properties
- handoverFrom=<yyyy>  e.g. handoverFrom=2026
- status=<s>           ready, off_plan
Combine with &. Always lowercase slugs, no spaces (use dashes).

RESPONSE FORMAT — VERY IMPORTANT:
1. Write 1-3 short sentences of plain prose first.
2. When the user asks "how do I find / where / show me / filter for / search for / look for" ANYTHING that maps to a deep link, ALWAYS append a JSON action block in a fenced code block tagged jbj-actions:

\`\`\`jbj-actions
{
  "title": "Marina apartments under 2M AED",
  "steps": [
    "Open the Properties page",
    "Area set to Dubai Marina",
    "Max price set to 2,000,000 AED",
    "Apply filters and browse results"
  ],
  "cta": { "label": "Open this filter now", "href": "/properties?area=dubai-marina&priceMax=2000000&propertyType=apartment" }
}
\`\`\`

Rules for the action block:
- "steps": 2-4 short imperative bullets (no numbers, the UI numbers them).
- "cta.href": MUST be a real path from the map + cheat sheet. Never invent URLs. Never use http(s). Always leading "/".
- "cta.label": active verb, max 5 words ("Open this filter now", "Open Mortgage Calculator", "Book free consultation").
- If the answer does not need a deep link (general advice, definitions), OMIT the block entirely.
- Never wrap anything else in jbj-actions fences.

TONE: 2-4 short sentences max in the prose. Use bullet steps inside the JSON, not in prose.

ESCALATION: For pricing/legal/visa specifics you cannot verify, frustration, or human-required questions — apologise briefly and point them to /contact or /book, OR emit an action block with href "/contact".

BRAND: "JBJ Global Real Estate" in full on first mention. Never mention Bayut, Property Finder, or Dubizzle.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'The concierge is busy. Please try again in a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'Concierge credits exhausted. Please contact support.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('ai-concierge gateway error', response.status, t);
      return new Response(JSON.stringify({ error: 'Concierge unavailable' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('ai-concierge error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
