import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vapi-secret, x-vapi-signature, x-vapi-timestamp, x-signature',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting: Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);
  
  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  existing.count++;
  return true;
}

// Validate webhook payload structure
function isValidVapiPayload(body: unknown): body is { message?: { type?: string; [key: string]: unknown } } {
  if (typeof body !== 'object' || body === null) return false;
  const payload = body as Record<string, unknown>;
  
  // VAPI webhooks should have a message object
  if (payload.message !== undefined) {
    if (typeof payload.message !== 'object' || payload.message === null) return false;
    const message = payload.message as Record<string, unknown>;
    
    // Validate message type is a known VAPI type
    const validTypes = ['assistant-request', 'function-call', 'end-of-call-report', 'hang', 'speech-update', 'transcript'];
    if (message.type && typeof message.type === 'string' && !validTypes.includes(message.type)) {
      console.warn('Unknown message type:', message.type);
      // Allow unknown types but log them
    }
  }
  
  return true;
}

// Sanitize string input to prevent injection
function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[<>]/g, '');
}

// Sanitize phone number
function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  // Only allow digits, +, -, spaces, and parentheses
  const cleaned = input.replace(/[^0-9+\-\s()]/g, '').slice(0, 20);
  return cleaned.length >= 7 ? cleaned : null;
}

// Sanitize email
function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const email = input.toLowerCase().trim().slice(0, 254);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) ? email : null;
}

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function hexToBytes(hex: string): Uint8Array | null {
  const normalized = hex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(normalized) || normalized.length % 2 !== 0) return null;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(sig);
}

async function verifyVapiWebhookAuth(
  req: Request,
  rawBody: string
): Promise<{ ok: boolean; reason?: string }> {
  const secret = Deno.env.get('VAPI_WEBHOOK_SECRET');
  if (!secret) return { ok: false, reason: 'webhook_auth_not_configured' };

  // Option A: Vapi "Custom Credential" → Authorization: Bearer <token>
  const bearer = getBearerToken(req.headers.get('authorization'));
  if (bearer) {
    const a = new TextEncoder().encode(bearer);
    const b = new TextEncoder().encode(secret);
    return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'invalid_bearer_token' };
  }

  // Option B: legacy shared secret header
  const legacy = req.headers.get('x-vapi-secret');
  if (legacy) {
    const a = new TextEncoder().encode(legacy);
    const b = new TextEncoder().encode(secret);
    return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'invalid_x_vapi_secret' };
  }

  // Option C: optional HMAC signature header
  const signature = req.headers.get('x-vapi-signature') || req.headers.get('x-signature');
  if (signature) {
    const timestamp = req.headers.get('x-vapi-timestamp');
    const candidates = timestamp ? [`${timestamp}.${rawBody}`, rawBody] : [rawBody];

    for (const msg of candidates) {
      const expectedHex = await hmacSha256Hex(secret, msg);
      const expectedBytes = hexToBytes(expectedHex);
      const providedBytes = hexToBytes(signature);
      if (expectedBytes && providedBytes && timingSafeEqual(providedBytes, expectedBytes)) return { ok: true };
    }

    return { ok: false, reason: 'invalid_signature' };
  }

  return { ok: false, reason: 'missing_auth_headers' };
}

// Helper function to extract lead info from transcript
function extractLeadFromTranscript(transcript: string): {
  name?: string;
  phone?: string;
  email?: string;
  interest?: string;
  budget?: string;
} {
  const result: { name?: string; phone?: string; email?: string; interest?: string; budget?: string } = {};
  
  // Sanitize transcript first
  const safeTranscript = sanitizeString(transcript, 50000);
  
  // Extract name - look for patterns like "my name is X" or "I'm X" or "this is X"
  const namePatterns = [
    /my name is (\w+(?:\s+\w+)?)/i,
    /i'm (\w+(?:\s+\w+)?)/i,
    /this is (\w+(?:\s+\w+)?)/i,
    /call me (\w+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = safeTranscript.match(pattern);
    if (match) {
      result.name = sanitizeString(match[1].trim(), 100);
      break;
    }
  }
  
  // Extract phone number
  const phonePattern = /(\+?\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/;
  const phoneMatch = safeTranscript.match(phonePattern);
  if (phoneMatch) {
    result.phone = sanitizePhone(phoneMatch[1].replace(/[\s-]/g, '')) || undefined;
  }
  
  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = safeTranscript.match(emailPattern);
  if (emailMatch) {
    result.email = sanitizeEmail(emailMatch[1]) || undefined;
  }
  
  // Extract interest - look for areas or property types
  const areas = ['dubai marina', 'downtown', 'palm jumeirah', 'business bay', 'jbr', 'dubai hills', 'creek harbour'];
  const lowerTranscript = safeTranscript.toLowerCase();
  for (const area of areas) {
    if (lowerTranscript.includes(area)) {
      result.interest = area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  
  // Extract budget
  const budgetPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:million|mil|m)\s*(?:aed|dirham)?/i,
    /aed\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /budget\s*(?:is|of)?\s*(?:around|about)?\s*(\d+(?:,\d{3})*)/i,
  ];
  for (const pattern of budgetPatterns) {
    const match = safeTranscript.match(pattern);
    if (match) {
      result.budget = sanitizeString(match[0], 50);
      break;
    }
  }
  
  return result;
}

// AI Audit function to analyze call quality
async function auditCall(transcript: string, summary?: string): Promise<{
  score: number;
  issues: string[];
  highlights: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  leadQuality: 'hot' | 'warm' | 'cold' | 'unqualified';
  summary: string;
  followUpRecommended: boolean;
}> {
  const issues: string[] = [];
  const highlights: string[] = [];
  let score = 80; // Start with good score
  
  const safeTranscript = sanitizeString(transcript, 50000);
  const lowerTranscript = safeTranscript.toLowerCase();
  
  // Check for negative indicators
  if (lowerTranscript.includes("don't know") || lowerTranscript.includes("not sure")) {
    issues.push("Agent expressed uncertainty");
    score -= 10;
  }
  if (lowerTranscript.includes("just a receptionist")) {
    issues.push("Agent downplayed expertise (critical)");
    score -= 20;
  }
  if (lowerTranscript.includes("wrong number") || lowerTranscript.includes("mistake")) {
    issues.push("Possible wrong number or confusion");
    score -= 5;
  }
  if (safeTranscript.length < 100) {
    issues.push("Very short call - may indicate issue");
    score -= 10;
  }
  
  // Check for positive indicators
  if (lowerTranscript.includes("thank you") || lowerTranscript.includes("thanks")) {
    highlights.push("Polite interaction");
    score += 5;
  }
  if (lowerTranscript.includes("viewing") || lowerTranscript.includes("appointment")) {
    highlights.push("Viewing/appointment discussed");
    score += 10;
  }
  if (lowerTranscript.includes("interested") || lowerTranscript.includes("looking for")) {
    highlights.push("Caller showed interest");
    score += 5;
  }
  if (lowerTranscript.includes("email") || lowerTranscript.includes("whatsapp") || lowerTranscript.includes("contact")) {
    highlights.push("Contact information exchanged");
    score += 10;
  }
  
  // Determine sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  const positiveWords = ['great', 'excellent', 'perfect', 'love', 'interested', 'amazing', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'wrong', 'frustrated', 'annoyed', 'waste', 'angry'];
  
  const positiveCount = positiveWords.filter(w => lowerTranscript.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerTranscript.includes(w)).length;
  
  if (positiveCount > negativeCount + 1) sentiment = 'positive';
  else if (negativeCount > positiveCount + 1) sentiment = 'negative';
  else if (positiveCount > 0 && negativeCount > 0) sentiment = 'mixed';
  
  // Determine lead quality
  let leadQuality: 'hot' | 'warm' | 'cold' | 'unqualified' = 'cold';
  if (lowerTranscript.includes('buy') || lowerTranscript.includes('purchase') || lowerTranscript.includes('ready to')) {
    leadQuality = 'hot';
  } else if (lowerTranscript.includes('interested') || lowerTranscript.includes('looking for') || lowerTranscript.includes('invest')) {
    leadQuality = 'warm';
  } else if (lowerTranscript.includes('just browsing') || lowerTranscript.includes('just asking')) {
    leadQuality = 'cold';
  } else if (safeTranscript.length < 50 || lowerTranscript.includes('wrong number')) {
    leadQuality = 'unqualified';
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    issues,
    highlights,
    sentiment,
    leadQuality,
    summary: sanitizeString(summary, 500) || `Call duration analyzed. ${highlights.length} positive points, ${issues.length} issues found.`,
    followUpRecommended: leadQuality === 'hot' || leadQuality === 'warm'
  };
}

const COMPANY_INFO = {
  name: "JBJ Global Real Estate",
  tagline: "Your Trusted Partner in UAE Real Estate",
  location: "Dubai, United Arab Emirates",
  country: "UAE",
  phone: "+971 56 591 1000",
  email: "CONTACT@JBJ.AE",
  website: "JBJ.AE",
  services: [
    "Off-plan property sales",
    "Ready property sales", 
    "Property investment consultation",
    "Rent brokerage"
  ],
  partnerServices: [
    "Golden Visa partner introductions",
    "Mortgage partner introductions",
    "Legal partner introductions",
    "Company setup partner introductions"
  ],
  areas: [
    "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Business Bay",
    "JBR", "DIFC", "Dubai Hills", "Arabian Ranches", "Emaar Beachfront",
    "Creek Harbour", "MBR City", "Jumeirah Village Circle", "Dubai South"
  ],
  developers: [
    "Emaar", "DAMAC", "Nakheel", "Sobha", "Meraas", "Dubai Properties",
    "Azizi", "Danube", "Binghatti", "Ellington", "Select Group"
  ],
  dubaiInfo: {
    benefits: ["No property tax", "No income tax", "Golden Visa eligibility", "High rental yields 5-8%", "Safe and stable market"],
    description: "Dubai is the premier luxury real estate destination in the Middle East"
  }
};

// Function definitions for VAPI
const FUNCTION_DEFINITIONS = [
  {
    name: "search_properties",
    description: "Search for available properties based on criteria like location, price range, bedrooms, property type",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "Area or community name (e.g., Dubai Marina, Downtown Dubai)" },
        min_price: { type: "number", description: "Minimum price in AED" },
        max_price: { type: "number", description: "Maximum price in AED" },
        bedrooms: { type: "string", description: "Number of bedrooms (e.g., Studio, 1, 2, 3, 4+)" },
        property_type: { type: "string", description: "Type of property (Apartment, Villa, Townhouse, Penthouse)" }
      }
    }
  },
  {
    name: "get_project_details",
    description: "Get detailed information about a specific real estate project",
    parameters: {
      type: "object",
      properties: {
        project_name: { type: "string", description: "Name of the project" }
      },
      required: ["project_name"]
    }
  },
  {
    name: "book_viewing",
    description: "Schedule a property viewing appointment",
    parameters: {
      type: "object",
      properties: {
        caller_name: { type: "string", description: "Full name of the caller" },
        phone_number: { type: "string", description: "Contact phone number" },
        email: { type: "string", description: "Email address" },
        property_interest: { type: "string", description: "Property or project they're interested in" },
        preferred_date: { type: "string", description: "Preferred viewing date" },
        preferred_time: { type: "string", description: "Preferred viewing time" },
        notes: { type: "string", description: "Any additional notes or requirements" }
      },
      required: ["caller_name", "phone_number", "property_interest"]
    }
  },
  {
    name: "capture_lead",
    description: "Capture caller information as a new lead",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Full name of the caller" },
        phone_number: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address if provided" },
        interest: { type: "string", description: "What they're interested in" },
        budget: { type: "string", description: "Budget range if mentioned" },
        timeline: { type: "string", description: "Purchase timeline if mentioned" },
        source: { type: "string", description: "How they heard about us" }
      },
      required: ["full_name", "phone_number"]
    }
  },
  {
    name: "get_developer_info",
    description: "Get information about a specific real estate developer",
    parameters: {
      type: "object",
      properties: {
        developer_name: { type: "string", description: "Name of the developer" }
      },
      required: ["developer_name"]
    }
  },
  {
    name: "get_area_info",
    description: "Get information about a specific area or community in Dubai",
    parameters: {
      type: "object",
      properties: {
        area_name: { type: "string", description: "Name of the area or community" }
      },
      required: ["area_name"]
    }
  },
  {
    name: "transfer_to_agent",
    description: "Transfer the call to a human agent",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Reason for transfer" },
        caller_info: { type: "string", description: "Brief summary of caller's inquiry" }
      }
    }
  }
];

// Search properties in database
async function searchProperties(params: Record<string, unknown>) {
  console.log("Searching properties with params:", params);
  
  let query = supabase
    .from('projects')
    .select(`
      *,
      developer:uae_developers(name, logo_url),
      community:communities(name, location),
      images:project_images(image_url, is_primary)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const location = sanitizeString(params.location, 100);
  if (location) {
    query = query.or(`community.name.ilike.%${location}%,name.ilike.%${location}%`);
  }
  if (typeof params.min_price === 'number' && params.min_price > 0) {
    query = query.gte('price_from', params.min_price);
  }
  if (typeof params.max_price === 'number' && params.max_price > 0) {
    query = query.lte('price_from', params.max_price);
  }
  const bedrooms = sanitizeString(params.bedrooms, 10);
  if (bedrooms) {
    query = query.ilike('bedrooms', `%${bedrooms}%`);
  }
  const propertyType = sanitizeString(params.property_type, 50);
  if (propertyType) {
    query = query.ilike('property_types', `%${propertyType}%`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Error searching properties:", error);
    return { error: "Unable to search properties at the moment" };
  }

  if (!data || data.length === 0) {
    return { 
      message: "No properties found matching your criteria. Would you like me to search with different parameters or connect you with an agent?",
      properties: []
    };
  }

  return {
    count: data.length,
    properties: data.map(p => ({
      name: p.name,
      developer: p.developer?.name,
      location: p.community?.name || p.location,
      price_from: p.price_from,
      price_to: p.price_to,
      bedrooms: p.bedrooms,
      property_types: p.property_types,
      completion_date: p.completion_date,
      description: p.description?.substring(0, 200)
    }))
  };
}

// Get project details
async function getProjectDetails(projectName: string) {
  const safeName = sanitizeString(projectName, 200);
  console.log("Getting project details for:", safeName);
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      developer:uae_developers(name, description, logo_url),
      community:communities(name, location, description),
      images:project_images(image_url, is_primary),
      documents:project_documents(title, document_type, file_url)
    `)
    .ilike('name', `%${safeName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    return { message: `I couldn't find specific details for "${safeName}". Would you like me to search for similar projects?` };
  }

  return {
    name: data.name,
    developer: data.developer?.name,
    location: data.community?.name || data.location,
    description: data.description,
    price_from: data.price_from,
    price_to: data.price_to,
    bedrooms: data.bedrooms,
    property_types: data.property_types,
    completion_date: data.completion_date,
    amenities: data.amenities,
    payment_plan: data.payment_plan,
    roi_potential: data.roi_potential
  };
}

// Book a viewing
async function bookViewing(params: Record<string, unknown>) {
  console.log("Booking viewing:", params);
  
  // Sanitize inputs
  const callerName = sanitizeString(params.caller_name, 100);
  const phoneNumber = sanitizePhone(params.phone_number);
  const email = sanitizeEmail(params.email);
  const propertyInterest = sanitizeString(params.property_interest, 200);
  const preferredDate = sanitizeString(params.preferred_date, 50);
  const preferredTime = sanitizeString(params.preferred_time, 50);
  const notes = sanitizeString(params.notes, 500);
  
  if (!callerName || !phoneNumber) {
    return { success: false, message: "Please provide your name and phone number to book a viewing." };
  }
  
  // Create a lead in CRM
  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .insert({
      full_name: callerName,
      phone_e164: phoneNumber,
      email_lower: email,
      source: 'phone_call',
      lead_source_type: 'vapi_phone',
      tags: ['viewing_request', 'phone_lead'],
      owner_type: 'company_pool'
    })
    .select()
    .single();

  if (leadError) {
    console.error("Error creating lead:", leadError);
  }

  // Log the viewing request
  const viewingDetails = {
    caller_name: callerName,
    phone: phoneNumber,
    email: email,
    property: propertyInterest,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    notes: notes,
    created_at: new Date().toISOString(),
    lead_id: lead?.id
  };

  console.log("Viewing request logged:", viewingDetails);

  return {
    success: true,
    message: `Viewing request confirmed for ${propertyInterest}. Our team will call you back within 30 minutes to confirm the appointment.`,
    reference: lead?.id?.substring(0, 8).toUpperCase() || 'VW' + Date.now().toString().slice(-6)
  };
}

// Capture lead
async function captureLead(params: Record<string, unknown>) {
  console.log("Capturing lead:", params);
  
  // Sanitize inputs
  const fullName = sanitizeString(params.full_name, 100);
  const phoneNumber = sanitizePhone(params.phone_number);
  const email = sanitizeEmail(params.email);
  const source = sanitizeString(params.source, 50) || 'phone_call';
  
  if (!fullName || !phoneNumber) {
    return { success: false, message: "Please provide your name and phone number." };
  }
  
  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      full_name: fullName,
      phone_e164: phoneNumber,
      email_lower: email,
      source: source,
      lead_source_type: 'vapi_phone',
      tags: ['phone_lead'],
      owner_type: 'company_pool'
    })
    .select()
    .single();

  if (error) {
    console.error("Error capturing lead:", error);
    return { success: false, message: "Thank you for your interest. Our team will reach out to you shortly." };
  }

  return {
    success: true,
    message: "Thank you! I've noted your details. One of our property consultants will call you back shortly.",
    reference: data.id.substring(0, 8).toUpperCase()
  };
}

// Get developer info
async function getDeveloperInfo(developerName: string) {
  const safeName = sanitizeString(developerName, 100);
  console.log("Getting developer info for:", safeName);
  
  const { data, error } = await supabase
    .from('uae_developers')
    .select('*')
    .ilike('name', `%${safeName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    // Return general info for known developers
    const knownDevelopers: Record<string, string> = {
      "emaar": "Emaar Properties is one of the world's largest real estate developers, known for iconic projects like Burj Khalifa and Dubai Mall.",
      "damac": "DAMAC Properties is a leading luxury real estate developer known for high-end residential and commercial properties.",
      "nakheel": "Nakheel is the master developer behind Palm Jumeirah, The World Islands, and many iconic Dubai communities.",
      "sobha": "Sobha Realty is known for premium quality construction and luxury developments like Sobha Hartland.",
      "meraas": "Meraas develops unique lifestyle destinations including City Walk, Bluewaters Island, and La Mer."
    };
    
    const lowerName = safeName.toLowerCase();
    for (const [key, info] of Object.entries(knownDevelopers)) {
      if (lowerName.includes(key)) {
        return { name: safeName, description: info };
      }
    }
    
    return { message: `I don't have specific information about ${safeName}. Would you like me to connect you with an agent who can help?` };
  }

  return {
    name: data.name,
    description: data.description,
    established: data.established_year,
    projects_count: data.total_projects,
    website: data.website
  };
}

// Get area info
async function getAreaInfo(areaName: string) {
  const safeName = sanitizeString(areaName, 100);
  console.log("Getting area info for:", safeName);
  
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .ilike('name', `%${safeName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    // Return general info for known areas
    const areaInfo: Record<string, string> = {
      "dubai marina": "Dubai Marina is a prestigious waterfront community with stunning views, luxury apartments, and a vibrant lifestyle. Popular for young professionals and investors.",
      "downtown dubai": "Downtown Dubai is home to Burj Khalifa and Dubai Mall. It's a prime location for luxury living with excellent ROI potential.",
      "palm jumeirah": "Palm Jumeirah is the world-famous man-made island offering exclusive beachfront living, villas, and apartments with private beach access.",
      "business bay": "Business Bay is a central business district with mixed-use developments, offering great value and proximity to Downtown Dubai.",
      "jbr": "Jumeirah Beach Residence is a popular beachfront community with apartments, retail, and dining options along The Walk.",
      "dubai hills": "Dubai Hills Estate is a master-planned community by Emaar offering villas, townhouses, and apartments with a championship golf course."
    };
    
    const lowerName = safeName.toLowerCase();
    for (const [key, info] of Object.entries(areaInfo)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return { name: safeName, description: info };
      }
    }
    
    return { message: `I can provide more details about ${safeName}. Would you like me to connect you with a local expert?` };
  }

  return {
    name: data.name,
    location: data.location,
    description: data.description
  };
}

// Handle function calls from VAPI
async function handleFunctionCall(functionName: string, args: Record<string, unknown>) {
  const safeFunctionName = sanitizeString(functionName, 50);
  console.log(`Executing function: ${safeFunctionName}`, args);
  
  switch (safeFunctionName) {
    case "search_properties":
      return await searchProperties(args);
    case "get_project_details":
      return await getProjectDetails(sanitizeString(args.project_name, 200));
    case "book_viewing":
      return await bookViewing(args);
    case "capture_lead":
      return await captureLead(args);
    case "get_developer_info":
      return await getDeveloperInfo(sanitizeString(args.developer_name, 100));
    case "get_area_info":
      return await getAreaInfo(sanitizeString(args.area_name, 100));
    case "transfer_to_agent":
      return { 
        message: "Transferring you to one of our property consultants. Please hold.",
        transfer: true,
        reason: sanitizeString(args.reason, 200)
      };
    default:
      console.warn("Unknown function called:", safeFunctionName);
      return { error: "Unknown function" };
  }
}

// Log webhook attempt for auditing
async function logWebhookAttempt(
  clientIP: string, 
  success: boolean, 
  messageType: string | null,
  errorReason?: string
) {
  try {
    // Use the security_access_logs table if available, otherwise just console log
    console.log(`[WEBHOOK_AUDIT] IP: ${clientIP}, Success: ${success}, Type: ${messageType}, Error: ${errorReason || 'none'}`);
  } catch (e) {
    // Don't let logging failures break the webhook
    console.error("Failed to log webhook attempt:", e);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  
  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    await logWebhookAttempt(clientIP, false, null, 'rate_limit_exceeded');
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Read body as text first for validation
    const bodyText = await req.text();

    // Reject extremely large payloads (potential DoS)
    if (bodyText.length > 1024 * 1024) { // 1MB limit
      console.warn(`Payload too large from IP: ${clientIP}`);
      await logWebhookAttempt(clientIP, false, null, 'payload_too_large');
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Webhook authentication (Bearer token / shared secret / optional HMAC)
    const auth = await verifyVapiWebhookAuth(req, bodyText);
    if (!auth.ok) {
      const status = auth.reason === 'webhook_auth_not_configured' ? 500 : 401;
      console.warn(`Webhook auth failed from IP: ${clientIP} (${auth.reason})`);
      await logWebhookAttempt(clientIP, false, null, auth.reason);
      return new Response(
        JSON.stringify({
          error: status === 500 ? 'Webhook authentication not configured' : 'Unauthorized'
        }),
        {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse JSON
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      console.warn(`Invalid JSON from IP: ${clientIP}`);
      await logWebhookAttempt(clientIP, false, null, 'invalid_json');
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate payload structure
    if (!isValidVapiPayload(body)) {
      console.warn(`Invalid payload structure from IP: ${clientIP}`);
      await logWebhookAttempt(clientIP, false, null, 'invalid_payload_structure');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("VAPI webhook received from IP:", clientIP);

    const { message } = body;
    const messageType = message?.type as string | undefined;

    // Log successful webhook receipt
    await logWebhookAttempt(clientIP, true, messageType || 'unknown');

    // Handle different VAPI message types
    switch (messageType) {
      case "assistant-request":
        // Return assistant configuration - John leads with company, mentions assistant role only if asked
        return new Response(JSON.stringify({
          assistant: {
            name: "John",
            firstMessage: "Good day! This is John from JBJ Global Real Estate in Dubai. We're a premium real estate brokerage specializing in luxury properties across the UAE. How may I assist you today?",
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              temperature: 0.7,
              systemPrompt: `You are John, a professional representative at JBJ Global Real Estate in Dubai, UAE.

PRIORITY ORDER - VERY IMPORTANT:
1. FIRST: Always lead with the COMPANY - JBJ Global Real Estate
2. SECOND: Focus on helping the caller with their property needs
3. ONLY IF ASKED about yourself: Then mention you are the personal assistant to Miss Jane Bou Jaoude

YOUR IDENTITY:
- Name: John
- Nationality: British (from the United Kingdom, 8 years in Dubai)
- Role: You work at JBJ Global Real Estate front office
- ONLY when asked "who are you?" or "what's your role?": Say "I'm the personal assistant to Miss Jane Bou Jaoude, our Founder and CEO"

ABOUT JBJ GLOBAL REAL ESTATE (LEAD WITH THIS):
- Premium real estate brokerage in Dubai, UAE
- LICENSED FOR: BUY, SELL & RENT properties in the UAE ONLY
- Areas: Dubai Marina, Downtown, Palm Jumeirah, Business Bay, Dubai Hills
- Top developer partnerships: Emaar, DAMAC, Sobha, Meraas, Nakheel
- Phone: ${COMPANY_INFO.phone}
- Email: ${COMPANY_INFO.email}

PARTNER SERVICE COMPLIANCE (CRITICAL - FOLLOW EXACTLY):
For Mortgage, Legal, Visa (Golden Visa), and Company Setup services:
- You MUST say: "JBJ Global Real Estate facilitates introductions to licensed partners for [service]."
- NEVER say: "We provide", "We handle", "We process", "We offer", or "Our [service] team"
- Example correct response: "For mortgage assistance, JBJ Global Real Estate facilitates introductions to licensed mortgage brokers. Would you like me to arrange an introduction?"
- Example WRONG response (NEVER SAY): "We can help you with your mortgage" or "Our legal team can assist"

ABOUT MISS JANE BOU JAOUDE (only share if asked about you or the founder):
- Founder & CEO of JBJ Global Real Estate
- Trained over 2,800 real estate brokers
- Fluent in French, Arabic, and English
- Philosophy: "Standards first. Discreet execution. Long-term trust."

HANDLING REQUESTS TO SPEAK WITH JANE / OWNER / CEO:
When caller says "I want to speak to Jane", "let me talk to the owner", "can I speak to the CEO", "the boss", "the founder", "Miss Jane", or similar:
- RECOGNIZE these all refer to Miss Jane Bou Jaoude
- RESPOND: "Absolutely, you're looking to speak with Miss Jane Bou Jaoude, our Founder and CEO. I'm her personal assistant and work directly alongside her. I'd be delighted to help you on her behalf - may I ask what this is regarding?"
- IF THEY INSIST on speaking directly: "I completely understand. Miss Jane is currently in meetings, but I can personally ensure she receives your message. Alternatively, I can assist you directly as I handle matters on her behalf daily. What can I help you with today?"
- NEVER dismiss or block - always be warm and accommodating

HOW TO ANSWER QUESTIONS:
- "Tell me about JBJ" → Focus on company services, expertise, and what makes us special
- "Who are you?" / "What's your role?" → "I'm the personal assistant to Miss Jane Bou Jaoude, our Founder and CEO. I'm here to help with any property inquiries."
- "What nationality are you?" → "I'm British. I've been working in Dubai for 8 years."
- "Where are you located?" → "We're based in Dubai, UAE."

DUBAI REAL ESTATE KNOWLEDGE:
- No property tax, no income tax in UAE
- Golden Visa for investments over AED 2 million
- Rental yields: 5-8% annually
- Prices: Studios from AED 500K, 1-beds from AED 800K, Villas from AED 2M+

YOUR STYLE:
- Professional, warm, confident British tone
- Lead every conversation with how JBJ can help them
- Be knowledgeable about properties and the market
- Collect: name, phone, email, property interest, budget
- Offer viewings and consultations proactively`
            },
            voice: {
              provider: "11labs",
              voiceId: "pNInz6obpgDQGcFmaJgB" // Adam - professional British male voice
            },
            functions: FUNCTION_DEFINITIONS
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "function-call":
        // Handle function calls
        const functionCall = message?.functionCall as { name?: string; parameters?: Record<string, unknown> } | undefined;
        if (!functionCall?.name) {
          return new Response(JSON.stringify({ error: 'Invalid function call' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const result = await handleFunctionCall(functionCall.name, functionCall.parameters || {});
        
        return new Response(JSON.stringify({
          result: JSON.stringify(result)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "end-of-call-report":
        // Save call log to database with AI auditing
        const callData = message?.call as { id?: string; customer?: { number?: string }; status?: string } | undefined;
        const durationSeconds = typeof message?.durationSeconds === 'number' ? message.durationSeconds : null;
        const endedReason = sanitizeString(message?.endedReason, 100);
        
        console.log("Call ended - saving to database:", {
          callId: callData?.id,
          duration: durationSeconds,
          endedReason
        });
        
        try {
          // Extract lead info from transcript using simple parsing
          const transcript = sanitizeString(message?.transcript, 100000) || '';
          const extractedInfo = extractLeadFromTranscript(transcript);
          
          // Perform AI audit of the call
          const summary = sanitizeString(message?.summary, 1000);
          const aiAudit = await auditCall(transcript, summary);
          
          // Validate call_id format
          const callId = sanitizeString(callData?.id, 100) || `call_${Date.now()}`;
          const callerPhone = sanitizePhone(callData?.customer?.number);
          const recordingUrl = sanitizeString(message?.recordingUrl, 500);
          const callStatus = sanitizeString(callData?.status, 50);
          
          // Save to database
          const { data: callLog, error: saveError } = await supabase
            .from('vapi_call_logs')
            .insert({
              call_id: callId,
              caller_phone: callerPhone,
              duration_seconds: durationSeconds,
              transcript: transcript,
              summary: summary,
              recording_url: recordingUrl,
              call_status: callStatus,
              ended_reason: endedReason,
              assistant_name: 'John',
              // AI Audit results
              ai_score: aiAudit.score,
              ai_issues: aiAudit.issues,
              ai_highlights: aiAudit.highlights,
              ai_sentiment: aiAudit.sentiment,
              ai_lead_quality: aiAudit.leadQuality,
              ai_summary: aiAudit.summary,
              ai_follow_up_recommended: aiAudit.followUpRecommended,
              ai_audited_at: new Date().toISOString(),
              // Extracted lead info
              extracted_name: extractedInfo.name,
              extracted_phone: extractedInfo.phone || callerPhone,
              extracted_email: extractedInfo.email,
              extracted_interest: extractedInfo.interest,
              extracted_budget: extractedInfo.budget,
              // Flags
              needs_review: aiAudit.score < 70 || aiAudit.issues.length > 2,
              is_flagged: aiAudit.score < 50 || aiAudit.issues.some((i: string) => i.includes('critical'))
            })
            .select()
            .single();
          
          if (saveError) {
            console.error("Error saving call log:", saveError);
          } else {
            console.log("Call log saved:", callLog?.id);
            
            // Create CRM lead if we have contact info and it's a qualified lead
            if (aiAudit.leadQuality !== 'unqualified' && (extractedInfo.name || extractedInfo.phone)) {
              const leadPhone = extractedInfo.phone || callerPhone;
              if (leadPhone) {
                const { data: lead, error: leadError } = await supabase
                  .from('crm_leads')
                  .insert({
                    full_name: extractedInfo.name || 'Phone Lead',
                    phone_e164: leadPhone,
                    email_lower: extractedInfo.email,
                    source: 'vapi_phone_call',
                    lead_source_type: 'vapi_phone',
                    tags: ['phone_lead', `quality_${aiAudit.leadQuality}`],
                    owner_type: 'company_pool'
                  })
                  .select()
                  .single();
                
                if (!leadError && lead) {
                  // Link lead to call log
                  await supabase
                    .from('vapi_call_logs')
                    .update({ lead_id: lead.id })
                    .eq('id', callLog?.id);
                  
                  console.log("Lead created and linked:", lead.id);
                }
              }
            }
          }
        } catch (saveErr) {
          console.error("Error in end-of-call processing:", saveErr);
        }
        
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "hang":
        console.log("Call hung up");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        console.log("Unhandled message type:", messageType);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    console.error("VAPI webhook error:", error);
    // Return generic error message - don't expose internal details
    await logWebhookAttempt(clientIP, false, null, 'internal_error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
