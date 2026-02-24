import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Simple inline validation (avoiding external zod import for deployment stability)
const validateRequest = (data: unknown): { success: boolean; data?: any; error?: string } => {
  if (!data || typeof data !== 'object') return { success: false, error: 'Invalid request body' };
  const obj = data as Record<string, unknown>;
  
  if (!obj.message || typeof obj.message !== 'string' || obj.message.length === 0 || obj.message.length > 5000) {
    return { success: false, error: 'Message is required and must be 1-5000 characters' };
  }
  
  const history = Array.isArray(obj.history) ? obj.history.slice(0, 20) : [];
  const validServices = ['real_estate', 'partner_intro', 'legal', 'design_build', 'mortgage', 'property_management', 'general', 'buy', 'sell', 'rent', 'visa', 'company_setup'];
  const service = typeof obj.service === 'string' && validServices.includes(obj.service) ? obj.service : 'general';
  const userName = typeof obj.userName === 'string' ? obj.userName.slice(0, 100) : undefined;
  const leadId = typeof obj.leadId === 'string' ? obj.leadId : undefined;
  
  return { success: true, data: { message: obj.message, history, service, userName, leadId } };
};

const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
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

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 30;
const AUTO_BLOCK_THRESHOLD = 5;
const AUTO_BLOCK_DURATION_HOURS = 12;

interface RateLimitEntry {
  id: string;
  function_name: string;
  rate_key: string;
  window_start: string;
  request_count: number;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function checkIPBlocklist(
  supabaseAdmin: any,
  clientIp: string
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ip_blocklist")
      .select("*")
      .eq("ip_address", clientIp)
      .maybeSingle();

    if (error || !data) return { blocked: false };

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }

    await supabaseAdmin
      .from("ip_blocklist")
      .update({ 
        last_attempt_at: new Date().toISOString(),
        block_count: (data.block_count || 1) + 1
      })
      .eq("id", data.id);

    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check exception:", err);
    return { blocked: false };
  }
}

async function checkRateLimit(
  supabaseAdmin: any,
  rateKey: string,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number; shouldAutoBlock?: boolean }> {
  const functionName = "ai-chat-support";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits")
    .select("*")
    .eq("function_name", functionName)
    .eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString())
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Rate limit check error:", fetchError);
    return { allowed: true };
  }

  const entry = existingEntry as RateLimitEntry | null;

  if (entry) {
    if (entry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(entry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
    }

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

  return { allowed: true };
}

// Approved contact information
const APPROVED_CONTACT_INFO = {
  phone: '+971 56 591 1000',
  email: 'contact@jbj.ae',
  privacyEmail: 'privacy@jbj.ae',
  website: 'jbj.ae',
};

const APPROVED_EMAILS = [
  "contact@jbj.ae",
  "privacy@jbj.ae",
  "partnerships@jbj.ae",
  "collaboration@jbj.ae",
  "careers@jbj.ae",
  "security@jbj.ae",
  "jane@jbj.ae",
];

function sanitizeContactInfo(text: string): string {
  const phonePatterns = [
    /\+971[\s\-]?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /0?5[0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
    /\+971[\s\-]?[0-9]{9,10}/g,
  ];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  let sanitized = text;
  
  phonePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => {
      const normalized = match.replace(/[\s\-]/g, '');
      if (normalized.includes('565911000')) return match;
      return APPROVED_CONTACT_INFO.phone;
    });
  });
  
  sanitized = sanitized.replace(emailPattern, (match) => {
    const lowerMatch = match.toLowerCase();
    if (APPROVED_EMAILS.includes(lowerMatch) || lowerMatch.endsWith('@jbj.ae')) return match;
    return APPROVED_CONTACT_INFO.email;
  });
  
  return sanitized;
}

// ============================================
// INTENT CLASSIFICATION (BUY/SELL/RENT)
// ============================================

type LeadIntent = 'buy' | 'sell' | 'rent_lease' | 'broker_registration' | 'partner_services' | 'general';
type RentalUserType = 'tenant' | 'landlord' | null;

const INTENT_KEYWORDS = {
  buy: ['buy', 'purchase', 'invest', 'investment', 'looking to buy', 'want to buy', 'buying', 'off-plan', 'offplan', 'investor', 'freehold', 'own', 'ownership', 'first home', 'golden visa property', 'roi', 'yield', 'returns'],
  sell: ['sell', 'selling', 'want to sell', 'looking to sell', 'property valuation', 'market price', 'home value', 'list for sale', 'seller'],
  rent_lease: ['rent', 'rental', 'tenant', 'landlord', 'renting', 'monthly rent', 'annual rent', 'looking to rent', 'want to rent', 'short term', 'long term', 'furnished', 'unfurnished', 'move in', 'ejari', 'tenancy', 'let', 'letting'],
  broker_registration: ['become a broker', 'join as broker', 'broker registration', 'agent career', 'real estate career', 'work as broker', 'join jbj', 'career in real estate'],
  partner_services: ['mortgage', 'home loan', 'financing', 'legal', 'lawyer', 'contract', 'company setup', 'business setup', 'free zone', 'visa', 'golden visa', 'investor visa', 'residency', 'schengen']
};

const RENTAL_TENANT_KEYWORDS = ['looking for apartment', 'looking for villa', 'need to rent', 'want to rent', 'move in', 'relocating', 'moving to dubai', 'monthly budget'];
const RENTAL_LANDLORD_KEYWORDS = ['list my property', 'rent out', 'rent my', 'find tenant', 'my property', 'vacant property', 'rental income', 'property management'];

function classifyIntent(message: string): { intent: LeadIntent; rentalUserType: RentalUserType; confidence: number } {
  const lowerMessage = message.toLowerCase();
  const scores: Record<LeadIntent, number> = { buy: 0, sell: 0, rent_lease: 0, broker_registration: 0, partner_services: 0, general: 0 };

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[intent as LeadIntent] += keyword.split(' ').length;
      }
    }
  }

  let maxScore = 0;
  let primaryIntent: LeadIntent = 'general';
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryIntent = intent as LeadIntent;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;

  let rentalUserType: RentalUserType = null;
  if (primaryIntent === 'rent_lease') {
    const tenantScore = RENTAL_TENANT_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    const landlordScore = RENTAL_LANDLORD_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    rentalUserType = landlordScore > tenantScore ? 'landlord' : (tenantScore > 0 ? 'tenant' : null);
  }

  return { intent: primaryIntent, rentalUserType, confidence };
}

function needsSellRentClarification(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const ambiguousPhrases = ['list my property', 'list property', 'put my property', 'i have a property', 'i own a property', 'vacant property'];
  return ambiguousPhrases.some(phrase => lowerMessage.includes(phrase));
}

// ============================================
// KNOWLEDGE BASE
// ============================================

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


// ============================================
// RENTAL QUALIFICATION PROMPTS
// ============================================

const RENTAL_QUALIFICATION_FLOW = {
  rentalUserType: "Are you a **tenant** looking to rent a property, or a **landlord** looking to rent out your property?",
  budget: {
    tenant: "What's your **monthly budget range** for rent? (e.g., AED 5,000 - 10,000)",
    landlord: "What's your **expected monthly rent** for the property?"
  },
  areas: "Which **areas** are you interested in? (e.g., Dubai Marina, Downtown, JVC, Business Bay)",
  propertyType: "What **type of property** are you looking for? (Studio, Apartment, Villa, Townhouse, Commercial)",
  duration: "Are you looking for a **short-term** (less than 1 year) or **long-term** rental?",
  moveIn: "When do you need to **move in**?"
};

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
        JSON.stringify({ 
          error: 'Authentication required',
          response: `Please sign in to use the AI chat assistant. Contact our team:\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          response: `Your session has expired. Please sign in again.\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = getClientIp(req);
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    
    if (blocklistResult.blocked) {
      return new Response(
        JSON.stringify({ error: 'Access denied', response: 'Your access has been restricted.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: `Too many messages. Please wait ${Math.ceil((rateLimitResult.retryAfterSeconds || 300) / 60)} minutes.\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfterSeconds || 300) } }
      );
    }

    const rawBody = await req.json();
    const parseResult = validateRequest(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', response: 'Please try again with a shorter message.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history, service, userName, leadId } = parseResult.data;

    // ============================================
    // INTENT CLASSIFICATION & CRM UPDATE
    // ============================================
    const classification = classifyIntent(message);
    const needsClarification = needsSellRentClarification(message);
    
    // Update lead intent in CRM if leadId provided
    if (leadId && classification.intent !== 'general') {
      await supabaseService.from('crm_leads').update({
        intent: classification.intent,
        pipeline: classification.intent === 'buy' ? 'buy_pipeline' : 
                  classification.intent === 'sell' ? 'sell_pipeline' : 
                  classification.intent === 'rent_lease' ? 'rent_lease_pipeline' : 'general_pipeline',
        metadata: {
          rental_user_type: classification.rentalUserType,
          intent_confidence: classification.confidence,
          classified_at: new Date().toISOString()
        }
      }).eq('id', leadId);
    }

    // ============================================
    // BUILD CONTEXT BASED ON INTENT & SERVICE
    // ============================================
    let serviceContext = '';
    let intentContext = '';

    // Intent-based context
    switch(classification.intent) {
      case 'buy':
        intentContext = `
DETECTED INTENT: BUY PROPERTY
The user wants to purchase property. Ask these QUALIFICATION questions ONE AT A TIME:
1. "Are you currently located in Dubai, or will you be relocating?"
2. "Have you invested in Dubai real estate before?"
3. "What is your approximate budget range? (e.g., AED 1M - 2M)"
4. "Which areas are you interested in? (e.g., Dubai Marina, Downtown, JVC, Business Bay)"
5. "What type of property are you looking for? (Apartment, Villa, Townhouse, Off-Plan)"
6. "When are you planning to make a decision? (Immediately, 1-3 months, 6+ months)"
7. "Are you interested in Golden Visa eligibility? (Properties above AED 2M qualify)"

Focus on:
- Property types (off-plan, ready)
- Budgets and payment plans
- Popular areas and developers
- Investment benefits (Golden Visa, ROI)
- Next steps: schedule viewing or consultation`;
        break;
      case 'sell':
        intentContext = `
DETECTED INTENT: SELL PROPERTY
The user wants to sell their property. Ask these QUALIFICATION questions ONE AT A TIME:
1. "What type of property do you own? (Apartment, Villa, Townhouse, Plot)"
2. "Where is your property located? (Area/Community)"
3. "Is the property currently occupied or vacant?"
4. "Do you have an idea of your expected selling price?"
5. "When would you like to list the property?"
6. "Do you have the title deed ready?"

Focus on:
- Property valuation process
- Marketing approach
- Timeline expectations
- Documentation needed
- Next steps: schedule property assessment`;
        break;
      case 'rent_lease':
        intentContext = `
DETECTED INTENT: RENT
Rental User Type: ${classification.rentalUserType || 'Unknown - need to clarify'}

${classification.rentalUserType === 'tenant' ? `
USER IS A TENANT looking to rent. Ask these qualification questions (one at a time):
1. Monthly budget range
2. Preferred areas (Dubai Marina, Downtown, JVC, etc.)
3. Property type (Studio, 1BR, 2BR, Villa, etc.)
4. Rental duration (short/long term)
5. Move-in timeline
` : ''}
${classification.rentalUserType === 'landlord' ? `
USER IS A LANDLORD wanting to rent out property. Ask:
1. Property location and type
2. Expected monthly rent
3. Furnished or unfurnished
4. Property availability
5. Property management needs
` : ''}
${!classification.rentalUserType ? `
CLARIFY: Ask if they are a tenant looking to rent OR a landlord wanting to rent out.
` : ''}`;
        break;
      case 'broker_registration':
        intentContext = `
DETECTED INTENT: BROKER REGISTRATION
Direct them to the broker careers page at /careers/brokers or contact careers@jbj.ae`;
        break;
      case 'partner_services':
        intentContext = `
DETECTED INTENT: PARTNER SERVICES
CRITICAL COMPLIANCE: You MUST say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for [service]."
NEVER claim we provide these services directly.`;
        break;
    }

    // Service-based context (from explicit service selection)
    switch(service) {
      case 'buy':
        serviceContext = 'Focus on buying properties - off-plan, ready, investment opportunities.';
        break;
      case 'sell':
        serviceContext = 'Focus on selling properties - valuation, marketing, listings.';
        break;
      case 'rent':
        serviceContext = 'Focus on renting - tenant search, landlord services, property management partner intros.';
        break;
      case 'mortgage':
      case 'legal':
      case 'visa':
      case 'company_setup':
      case 'partner_intro':
        serviceContext = `PARTNER SERVICE: ${service}. CRITICAL: Say "JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for ${service}." NEVER say "We provide" or "We handle" for this service.`;
        break;
      case 'real_estate':
        serviceContext = 'General real estate inquiries about buying, selling, or renting in UAE.';
        break;
      default:
        serviceContext = 'Help discover which service suits their needs. JBJ is licensed for BUY, SELL & RENT only. Partner services via licensed partners.';
    }

    // Add clarification if needed
    const clarificationNote = needsClarification ? 
      `\n\nIMPORTANT: The user said they want to "list their property". You MUST ask: "Would you like to **sell** the property or **rent** it out?" Do NOT assume.` : '';

    // ============================================
    // BUILD MESSAGES
    // ============================================
    const messages = [
      {
        role: 'system',
        content: `You are Sara, a property consultant at JBJ Global Real Estate.

## WHO YOU ARE:
- Your name is Sara - friendly and professional
- Expert on Dubai real estate - buying, selling, and renting
- You work for JBJ GLOBAL REAL ESTATE

## CRITICAL COMPLIANCE RULES:

### JBJ IS LICENSED FOR (Direct Services):
- BUY properties
- SELL properties  
- RENT properties

### PARTNER SERVICES ONLY (NOT in-house):
For Mortgage, Legal, Visa, Company Setup - ALWAYS say:
"JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for [service]."

NEVER SAY:
- "We provide visa services"
- "We handle mortgage approvals"
- "We process legal documents"
- "Our legal/visa/mortgage team"

### ALWAYS INTRODUCE YOURSELF AS:
"I'm an AI assistant for JBJ GLOBAL REAL ESTATE."

${intentContext}
${serviceContext}
${clarificationNote}

## KNOWLEDGE BASE:
${WEBSITE_KNOWLEDGE}

## TALKING TO:
${userName || 'this client'}

## RENTAL QUALIFICATION (when intent is rent):
Ask these questions ONE AT A TIME:
${Object.entries(RENTAL_QUALIFICATION_FLOW).map(([k, v]) => typeof v === 'string' ? `- ${v}` : '').filter(Boolean).join('\n')}

## CONTACT INFO (only use these):
📧 ${APPROVED_CONTACT_INFO.email}
📞 ${APPROVED_CONTACT_INFO.phone}

Keep responses SHORT (2-3 sentences). Be helpful and conversational.`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // ============================================
    // CALL AI
    // ============================================
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable',
          response: `Please contact our team directly:\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || `Contact our team:\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`;

    aiResponse = sanitizeContactInfo(aiResponse);

    // Return response with classification metadata
    return new Response(JSON.stringify({ 
      response: aiResponse,
      classification: {
        intent: classification.intent,
        rentalUserType: classification.rentalUserType,
        confidence: classification.confidence,
        needsClarification
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-chat-support function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred',
        response: `Contact our team:\n📧 ${APPROVED_CONTACT_INFO.email}\n📞 ${APPROVED_CONTACT_INFO.phone}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
