import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) =>
      origin === allowed ||
      origin.endsWith(".lovableproject.com") ||
      origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ============================================================================
// NARRATIVE MODE DEFINITIONS
// ============================================================================

type NarrativeMode = 'public' | 'internal';
type NarrativeType = 
  | 'market_overview' 
  | 'area_intelligence' 
  | 'rental_trends'
  | 'broker_focus'
  | 'client_objection'
  | 'area_prioritization'
  | 'custom';

// ============================================================================
// PUBLIC NARRATIVE SYSTEM PROMPTS (AUTHORITY MODE)
// ============================================================================

const PUBLIC_SYSTEM_PROMPT = `You are an expert Dubai real estate market analyst for JBJ Global Real Estate.

STRICT RULES FOR PUBLIC NARRATIVES:
1. Your role is to EDUCATE, EXPLAIN, and BUILD TRUST
2. NEVER optimize for closing deals or expose sales tactics
3. Use calm, editorial, objective, non-promotional language
4. Only reference official government Open Data sources

ALLOWED OUTPUTS:
- "What happened" (past tense observations)
- "What changed" (trend direction)
- "Why this matters" (contextual significance)
- "How to interpret the data" (educational framing)

STRICTLY FORBIDDEN:
- Price predictions or forecasts
- Investment advice or ROI promises
- "Buy now" or urgency language
- Specific financial recommendations
- Any predictive statements about future prices

TONE: Professional, educational, neutral, transparent

Always end with: "This analysis is based on aggregated government Open Data and is provided for informational purposes only."`;

const PUBLIC_TEMPLATES = {
  market_overview: `Based on official government Open Data, analyze the current Dubai real estate market:
- Recent transaction volume trends
- Price movement direction (up/stable/down)
- Key demand indicators
- Supply dynamics

Use measured language. State what the data shows, not what will happen.`,

  area_intelligence: `Based on official government Open Data, provide intelligence for the specified area:
- Historical price trend observations
- Rent trend direction
- Demand vs supply signals
- Population and housing growth context
- "Why this area behaves this way" (editorial explanation)

Use educational, explanatory language.`,

  rental_trends: `Based on official government Open Data, analyze rental market dynamics:
- Rental price movement observations
- Household formation impact
- Mobility patterns
- Inventory availability effects

Explain how these dynamics are playing out, not what will happen next.`,
};

// ============================================================================
// INTERNAL NARRATIVE SYSTEM PROMPTS (EXECUTION MODE)
// ============================================================================

const INTERNAL_SYSTEM_PROMPT = `You are an internal market intelligence analyst for JBJ Global Real Estate brokers.

STRICT RULES FOR INTERNAL NARRATIVES:
1. Your role is to help brokers and management ACT BETTER and FASTER
2. Be direct, tactical, practical, and outcome-aware
3. Provide actionable intelligence for deal execution
4. NEVER for public sharing or external publishing

ALLOWED OUTPUTS:
- Demand pressure signals
- Area momentum interpretation
- Client hesitation patterns
- RENT vs sale prioritization
- Conversation framing suggestions
- Broker focus recommendations

STRICTLY FORBIDDEN:
- Price predictions or guarantees
- Content suitable for external publishing
- Financial advice

TONE: Direct, tactical, practical, confident

Always end with: "Internal AI insights are descriptive analytics intended to support brokerage execution, not predictive forecasts."`;

const INTERNAL_TEMPLATES = {
  broker_focus: `Analyze current market data to provide broker focus recommendations:
- Which areas show increased inquiry activity
- Inventory vs demand imbalances
- Prioritization guidance for brokers
- Time-sensitive opportunities

Be specific and actionable.`,

  client_objection: `Provide support for handling client objections based on market data:
- Price sensitivity patterns by segment
- Value driver emphasis points
- Conversation framing suggestions
- Objection response frameworks

Focus on practical conversation guidance.`,

  area_prioritization: `Analyze area performance for broker prioritization:
- Transaction velocity comparisons
- Rent absorption rates
- Area outperformance indicators
- Where broker attention may yield faster outcomes

Provide clear prioritization guidance.`,
};

// ============================================================================
// REQUEST HANDLER
// ============================================================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      mode, 
      narrativeType, 
      context,
      area,
      customPrompt 
    }: {
      mode: NarrativeMode;
      narrativeType: NarrativeType;
      context?: string;
      area?: string;
      customPrompt?: string;
    } = await req.json();

    // Validate mode
    if (!mode || !['public', 'internal'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid narrative mode. Must be "public" or "internal".' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For internal mode, verify user is authenticated
    if (mode === 'internal') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required for internal narratives.' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user has internal access
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication for internal narratives.' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check CRM profile for internal access
      const { data: crmProfile } = await supabase
        .from('crm_users_profile')
        .select('crm_role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      const allowedRoles = ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'];
      if (!crmProfile?.is_active || !allowedRoles.includes(crmProfile?.crm_role || '')) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions for internal narratives.' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Select system prompt and template based on mode
    const systemPrompt = mode === 'public' ? PUBLIC_SYSTEM_PROMPT : INTERNAL_SYSTEM_PROMPT;
    
    let userPrompt = '';
    
    if (customPrompt) {
      userPrompt = customPrompt;
    } else if (mode === 'public') {
      userPrompt = PUBLIC_TEMPLATES[narrativeType as keyof typeof PUBLIC_TEMPLATES] || PUBLIC_TEMPLATES.market_overview;
    } else {
      userPrompt = INTERNAL_TEMPLATES[narrativeType as keyof typeof INTERNAL_TEMPLATES] || INTERNAL_TEMPLATES.broker_focus;
    }

    // Add area context if provided
    if (area) {
      userPrompt = `FOCUS AREA: ${area}\n\n${userPrompt}`;
    }

    // Add additional context if provided
    if (context) {
      userPrompt = `${userPrompt}\n\nADDITIONAL CONTEXT:\n${context.substring(0, 1000)}`;
    }

    console.log(`Generating ${mode} narrative: ${narrativeType}`, { area });

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured.' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate narrative.' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No narrative generated.' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log narrative generation for audit
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      await supabaseAdmin.from("ai_usage_logs").insert({
        function_name: 'ai-market-narratives',
        model: 'google/gemini-2.5-flash',
        success: true,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Usage logging error:", logErr);
    }

    return new Response(
      JSON.stringify({
        narrative: content,
        mode,
        narrativeType,
        area: area || null,
        generatedAt: new Date().toISOString(),
        disclaimer: mode === 'public'
          ? 'AI-generated insights are based on aggregated government Open Data and are provided for informational purposes only.'
          : 'Internal AI insights are descriptive analytics intended to support brokerage execution, not predictive forecasts.',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Narrative generation error:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate market narrative.' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
