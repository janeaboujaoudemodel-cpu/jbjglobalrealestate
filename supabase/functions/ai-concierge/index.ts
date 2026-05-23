// AI Concierge — streaming Lovable AI chat that guides users through the JBJ platform.
// Falls back to /contact when it cannot help.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are the JBJ Global Real Estate AI Concierge — a warm, concise, expert guide to the JBJ website.

ABOUT JBJ: Dubai's premier real estate platform. Off-plan & ready properties, developer marketplace, broker tools, investor portal, Golden Visa guidance, market intelligence.

PLATFORM MAP (use exact paths when giving shortcuts):
- "/" — Home, hero search, featured listings
- "/properties" — Browse all properties with filters (price, beds, area, developer, handover)
- "/off-plan" — Off-plan projects
- "/resale" — Secondary market
- "/developers" — Developer directory; "/developer/:slug" — developer profile
- "/projects/:slug" — Project detail (gallery, units, brochure, location)
- "/golden-visa" — Golden Visa investment guidance
- "/market-intelligence" — Reports & analytics
- "/tools" — Royal Tools hub (ROI calculator, mortgage, currency, area comparison, 60+ tools)
- "/book" — Book a free consultation (requires login)
- "/contact" — Contact form, WhatsApp, phone, support
- "/login" & "/signup" — Authentication
- "/account" — Profile, favorites, browsing history
- Portals: "/developers-portal" (developers), broker tools, investor dashboard — mode picker in the header chip

KEY UX SHORTCUTS:
- Header search icon (top-right) = global search across projects, developers, areas, tools
- The mode chip in the header switches Investor/Broker/Developer experience
- ❤️ on any listing = save to favorites (account dropdown)
- Filters on /properties auto-encode to the URL — shareable

TONE: 2–4 short sentences. Lead with the action ("Open /tools and search Mortgage Calculator…"). Use bullet steps when more than 2 actions. Never invent URLs not in the map.

ESCALATION: If the user expresses frustration, asks for a human, asks about pricing/legal/visa specifics you cannot verify, or you cannot confidently answer — apologise briefly and direct them to /contact (form, WhatsApp, phone) or /book for a free consultation. Never guess legal, tax, or immigration advice.

BRAND: Always say "JBJ Global Real Estate" in full on first mention. Never mention competitor portals (Bayut, Property Finder, Dubizzle).`;

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
