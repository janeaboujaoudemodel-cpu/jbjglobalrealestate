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
JBJ GLOBAL REAL ESTATE - DUBAI REAL ESTATE BROKERAGE
- Email: ${APPROVED_CONTACT_INFO.email}
- Phone: ${APPROVED_CONTACT_INFO.phone}
- Services: Property Sales (Buy/Sell), Rentals, Holiday Homes, Design & Build, Partner Introductions (Mortgage, Legal, Visa, Company Setup)
- Partner services are INTRODUCTIONS ONLY - JBJ is licensed for BUY, SELL & RENT

AREAS: Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JBR, Dubai Hills, JVC (high ROI 7-9%), Creek Harbour, DAMAC Hills, Arabian Ranches, Sobha Hartland, Meydan, Al Furjan, Town Square, Dubai South, JLT, DIFC

DEVELOPERS: Emaar (largest - Burj Khalifa, Dubai Hills), DAMAC (luxury branded), Nakheel (Palm Jumeirah), Sobha (quality), Meraas (lifestyle), Azizi (affordable luxury), Binghatti, Ellington, Select Group, Omniyat

KEY FACTS:
- DLD Transfer Fee: 4% of property value
- Registration Fee: AED 4,000 (properties >AED 500K)
- Agency Fee: 2% (sale), 5% annual rent (rental)
- Golden Visa: AED 2M+ property investment = 10-year visa
- 0% property tax, 0% income tax
- Rental yields: 5-9% (among highest globally)
- Off-plan: lower prices, payment plans (10-20% down, installments, balance on handover)
- Foreigners can buy freehold in designated areas
- Ejari registration mandatory for all rentals
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
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
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
