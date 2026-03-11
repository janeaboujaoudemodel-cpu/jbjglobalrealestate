import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ALLOWED_ORIGINS = [
  "https://JBJ.ae",
  "https://www.JBJ.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 30;

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function checkIPBlocklist(supabaseAdmin: any, clientIp: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("ip_blocklist")
      .select("*")
      .eq("ip_address", clientIp)
      .maybeSingle();

    if (!data) return false;
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function checkRateLimit(supabaseAdmin: any, rateKey: string): Promise<boolean> {
  const functionName = "ai-chat-stream";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: entry } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("function_name", functionName)
    .eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString())
    .maybeSingle();

  if (entry) {
    if (entry.request_count >= MAX_REQUESTS_PER_WINDOW) return false;
    await supabaseAdmin
      .from("function_rate_limits")
      .update({ request_count: entry.request_count + 1 })
      .eq("id", entry.id);
  } else {
    await supabaseAdmin
      .from("function_rate_limits")
      .insert({
        function_name: functionName,
        rate_key: rateKey,
        window_start: new Date().toISOString(),
        request_count: 1,
      });
  }
  return true;
}

const APPROVED_CONTACT_INFO = {
  phone: '+971 56 591 1000',
  email: 'contact@JBJ.ae',
};

function sanitizeContactInfo(text: string): string {
  const phonePatterns = [
    /\+971[\s\-]?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
  ];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const toCanonicalJbjEmail = (value: string) => value.replace(/@jbj\.ae$/i, "@JBJ.ae");
  
  let sanitized = text;
  phonePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => {
      const normalized = match.replace(/[\s\-]/g, '');
      if (normalized === '+971565911000') return match;
      return APPROVED_CONTACT_INFO.phone;
    });
  });
  sanitized = sanitized.replace(emailPattern, (match) => {
    const lowerMatch = match.toLowerCase();
    if (lowerMatch.endsWith('@jbj.ae')) return toCanonicalJbjEmail(match);
    return APPROVED_CONTACT_INFO.email;
  });
  return sanitized;
}

const RequestSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).max(20).optional().default([]),
  service: z.string().optional(),
  userName: z.string().max(100).optional(),
});

const WEBSITE_KNOWLEDGE = `
JBJ GLOBAL REAL ESTATE - COMPLETE SERVICES & INFORMATION:

COMPANY OVERVIEW:
- JBJ GLOBAL REAL ESTATE is a Dubai-based real estate brokerage licensed for BUY, SELL & RENT only
- Founded by Jane Bou Jaoude
- Headquarters: Dubai, UAE
- Mission: Delivering premium real estate services with transparency and integrity
- USPs: Multilingual team, AI-powered property matching, 24/7 support, end-to-end service

CONTACT INFORMATION (USE ONLY THESE):
- Email: ${APPROVED_CONTACT_INFO.email}
- Phone: ${APPROVED_CONTACT_INFO.phone}
- WhatsApp: ${APPROVED_CONTACT_INFO.phone}
- Website: ${APPROVED_CONTACT_INFO.website}

LICENSED SERVICES (Direct Services):
1. BUYING PROPERTIES - Off-plan and ready properties across UAE
2. SELLING PROPERTIES - Property listings and marketing
3. RENTING - Tenant placements and landlord services

PARTNER INTRODUCTIONS ONLY (NOT in-house services):
- Mortgage services - We facilitate introductions to licensed mortgage brokers
- Legal services - We facilitate introductions to licensed law firms
- Visa services - We facilitate introductions to licensed immigration consultants
- Company setup - We facilitate introductions to licensed corporate service providers
- Property management - We facilitate introductions to property management firms

DUBAI AREAS & COMMUNITIES:
- Dubai Marina: Waterfront living, high-rise towers, walk-to-beach lifestyle. Avg rent: AED 80-150K/yr for 1BR
- Downtown Dubai: Home to Burj Khalifa & Dubai Mall. Premium address. Avg rent: AED 90-180K/yr for 1BR
- Palm Jumeirah: Iconic man-made island, luxury villas & apartments. Premium pricing
- Business Bay: Central business district, canal views, mixed-use. Avg rent: AED 60-120K/yr for 1BR
- JBR (Jumeirah Beach Residence): Beachfront community, tourist-friendly. Great for holiday homes
- Dubai Hills Estate: Master-planned by Emaar, golf course community, family-friendly
- JVC (Jumeirah Village Circle): Affordable, family-friendly, high ROI (7-9%). Avg rent: AED 40-70K/yr for 1BR
- Dubai Creek Harbour: Emerging waterfront, future Creek Tower, by Emaar
- DAMAC Hills: Golf community by DAMAC, villas and apartments
- Arabian Ranches: Established villa community, family-friendly, parks & schools
- Sobha Hartland: Premium green community by Sobha, MBR City location
- Meydan: Horse racing district, emerging luxury residential
- Al Furjan: Affordable villas and townhouses near Metro, family-friendly
- Town Square: Budget-friendly community by Nshama, parks & retail
- Dubai South/Expo City: Near Al Maktoum Airport, future growth area
- Jumeirah Lakes Towers (JLT): Lake-view towers, commercial & residential
- DIFC: Financial center, luxury residences, premium lifestyle

KEY DEVELOPERS:
- Emaar Properties: Burj Khalifa, Dubai Mall, Dubai Hills, Creek Harbour, Arabian Ranches. UAE's largest developer
- DAMAC Properties: DAMAC Hills, Cavalli Tower, Safa One. Known for luxury branded residences
- Nakheel: Palm Jumeirah, The World Islands, Dragon City, Ibn Battuta. Government-backed
- Sobha Realty: Sobha Hartland, Sobha One. Known for quality construction
- Meraas: Bluewaters, City Walk, La Mer, Port de La Mer. Lifestyle-focused
- Azizi Developments: Riviera, Creek Views, Victoria. Affordable luxury
- Binghatti: Known for unique architecture, affordable options in Business Bay & JVC
- Ellington Properties: DT1, Belgravia, The Crestmark. Boutique design-led
- MAG Property Development: MAG City, MAG Eye. Affordable segment
- Select Group: Marina Gate, Peninsula, Six Senses. Premium waterfront
- Omniyat: One Palm, The Opus by Zaha Hadid. Ultra-luxury segment

BUYING PROCESS IN DUBAI:
1. Define budget and requirements
2. Property search and shortlisting
3. Schedule viewings (virtual or in-person)
4. Make an offer / sign MOU (Memorandum of Understanding)
5. Pay 10% deposit to escrow
6. Apply for NOC (No Objection Certificate) from developer
7. Transfer at Dubai Land Department (DLD)
8. Receive title deed

SELLING PROCESS:
1. Property valuation and market analysis
2. Professional photography and marketing
3. List on major portals (Bayut, Property Finder, Dubizzle)
4. Conduct viewings
5. Negotiate offers
6. Sign Form F (listing agreement)
7. Complete DLD transfer

RENTAL PROCESS (Tenants):
1. Define requirements and budget
2. Property search and viewings
3. Negotiate terms
4. Sign tenancy contract
5. Register Ejari (mandatory rental registration)
6. Pay security deposit (typically 5% for unfurnished, 10% for furnished)
7. Move in

FEES & COSTS:
- DLD Transfer Fee: 4% of property value (paid by buyer)
- DLD Registration Fee: AED 4,000 for properties over AED 500,000; AED 2,000 for under
- Agency Commission (Buy/Sell): Typically 2% of property value
- Agency Commission (Rent): 5% of annual rent
- Mortgage Registration Fee: 0.25% of loan amount
- Service Charges: Vary by community (AED 10-30/sqft/year typical)
- DEWA connection: AED 2,000 deposit (apartment), AED 4,000 (villa)

GOLDEN VISA INFORMATION:
- Property investment of AED 2M+ qualifies for 10-year Golden Visa
- Can be single or multiple properties totaling AED 2M+
- Off-plan properties from approved developers may qualify
- Visa covers spouse, children, and domestic workers
- No minimum stay requirement
- Can sponsor parents on separate visa

PAYMENT PLANS (Off-Plan):
- Typical structure: 10-20% down payment, installments during construction, remainder on handover
- Some developers offer 1% monthly payment plans
- Post-handover payment plans available (up to 3-5 years after handover)
- DLD fee can sometimes be waived by developer as promotion

HOLIDAY HOMES & SHORT-TERM RENTALS:
- DTCM (Department of Tourism) license required
- Managed by licensed holiday home operators
- Popular areas: Dubai Marina, JBR, Palm Jumeirah, Downtown
- Average ROI: 8-12% for well-managed holiday homes
- JBJ facilitates introductions to licensed holiday home management companies

ROI EXPECTATIONS:
- Rental yields in Dubai: 5-9% average (among highest globally)
- JVC, Dubai South, Al Furjan: 7-9% yields
- Dubai Marina, Downtown: 5-7% yields
- Capital appreciation: varies by area, 5-15% annually in growth areas
- Off-plan discount: typically 10-20% below ready market value

FREQUENTLY ASKED QUESTIONS:
Q: Is Dubai real estate a good investment?
A: Yes - 0% property tax, 0% income tax, high rental yields (5-9%), strong capital appreciation, Golden Visa eligibility

Q: Can foreigners buy property in Dubai?
A: Yes, foreigners can buy freehold property in designated areas (most popular communities are freehold)

Q: What is off-plan vs ready?
A: Off-plan = under construction (lower price, payment plans). Ready = completed (immediate move-in/rental income)

Q: How long does a property transfer take?
A: Typically 2-4 weeks from signing MOU to receiving title deed

Q: What documents do I need to buy?
A: Passport copy, UAE ID (if resident), proof of funds. Non-residents can buy with passport only
`;


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = getClientIp(req);
    if (await checkIPBlocklist(supabaseService, clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!await checkRateLimit(supabaseService, user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history, service, userName } = parseResult.data;

    const messages = [
      {
        role: 'system',
        content: `You are Sara, a friendly property specialist at JBJ Global Real Estate. Be conversational, warm, and helpful. Keep answers SHORT (2-3 sentences). Use emojis occasionally 😊.

LANGUAGE RULES:
- Detect the user's language from their first message and respond in that same language throughout.
- You are fluent in English, Arabic, French, Russian, Chinese, Hindi, Spanish, Portuguese, German, Urdu, Farsi, Turkish, Filipino, and Korean.
- If the user switches language mid-conversation, follow them.
- Keep professional terms in English when needed (Golden Visa, DLD, RERA).

${WEBSITE_KNOWLEDGE}

User name: ${userName || 'friend'}
Service context: ${service || 'general inquiry'}

ONLY use these contacts:
📧 ${APPROVED_CONTACT_INFO.email}
📞 ${APPROVED_CONTACT_INFO.phone}`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages,
        max_tokens: 800,
        temperature: 0.6,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit - try again shortly' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI API failed');
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith(':') || line.trim() === '') continue;
              if (!line.startsWith('data: ')) continue;
              
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                break;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  const sanitized = sanitizeContactInfo(content);
                  fullContent += sanitized;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: sanitized })}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
