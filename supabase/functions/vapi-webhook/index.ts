import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to extract lead info from transcript
function extractLeadFromTranscript(transcript: string): {
  name?: string;
  phone?: string;
  email?: string;
  interest?: string;
  budget?: string;
} {
  const result: { name?: string; phone?: string; email?: string; interest?: string; budget?: string } = {};
  
  // Extract name - look for patterns like "my name is X" or "I'm X" or "this is X"
  const namePatterns = [
    /my name is (\w+(?:\s+\w+)?)/i,
    /i'm (\w+(?:\s+\w+)?)/i,
    /this is (\w+(?:\s+\w+)?)/i,
    /call me (\w+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      result.name = match[1].trim();
      break;
    }
  }
  
  // Extract phone number
  const phonePattern = /(\+?\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/;
  const phoneMatch = transcript.match(phonePattern);
  if (phoneMatch) {
    result.phone = phoneMatch[1].replace(/[\s-]/g, '');
  }
  
  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = transcript.match(emailPattern);
  if (emailMatch) {
    result.email = emailMatch[1].toLowerCase();
  }
  
  // Extract interest - look for areas or property types
  const areas = ['dubai marina', 'downtown', 'palm jumeirah', 'business bay', 'jbr', 'dubai hills', 'creek harbour'];
  const lowerTranscript = transcript.toLowerCase();
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
    const match = transcript.match(pattern);
    if (match) {
      result.budget = match[0];
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
  
  const lowerTranscript = transcript.toLowerCase();
  
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
  if (transcript.length < 100) {
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
  } else if (transcript.length < 50 || lowerTranscript.includes('wrong number')) {
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
    summary: summary || `Call duration analyzed. ${highlights.length} positive points, ${issues.length} issues found.`,
    followUpRecommended: leadQuality === 'hot' || leadQuality === 'warm'
  };
}

const COMPANY_INFO = {
  name: "JBJ Global Real Estate",
  tagline: "Your Trusted Partner in UAE Real Estate",
  location: "Dubai, United Arab Emirates",
  country: "UAE",
  phone: "+971 56 591 1000",
  email: "contact@jbj.ae",
  website: "jbj.ae",
  services: [
    "Off-plan property sales",
    "Ready property sales", 
    "Property investment consultation",
    "Golden Visa assistance",
    "Mortgage assistance",
    "Interior design services",
    "Legal services",
    "Concierge services"
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
async function searchProperties(params: any) {
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

  if (params.location) {
    query = query.or(`community.name.ilike.%${params.location}%,name.ilike.%${params.location}%`);
  }
  if (params.min_price) {
    query = query.gte('price_from', params.min_price);
  }
  if (params.max_price) {
    query = query.lte('price_from', params.max_price);
  }
  if (params.bedrooms) {
    query = query.ilike('bedrooms', `%${params.bedrooms}%`);
  }
  if (params.property_type) {
    query = query.ilike('property_types', `%${params.property_type}%`);
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
  console.log("Getting project details for:", projectName);
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      developer:uae_developers(name, description, logo_url),
      community:communities(name, location, description),
      images:project_images(image_url, is_primary),
      documents:project_documents(title, document_type, file_url)
    `)
    .ilike('name', `%${projectName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    return { message: `I couldn't find specific details for "${projectName}". Would you like me to search for similar projects?` };
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
async function bookViewing(params: any) {
  console.log("Booking viewing:", params);
  
  // Create a lead in CRM
  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .insert({
      full_name: params.caller_name,
      phone_e164: params.phone_number,
      email_lower: params.email?.toLowerCase(),
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
    caller_name: params.caller_name,
    phone: params.phone_number,
    email: params.email,
    property: params.property_interest,
    preferred_date: params.preferred_date,
    preferred_time: params.preferred_time,
    notes: params.notes,
    created_at: new Date().toISOString(),
    lead_id: lead?.id
  };

  console.log("Viewing request logged:", viewingDetails);

  return {
    success: true,
    message: `Viewing request confirmed for ${params.property_interest}. Our team will call you back within 30 minutes to confirm the appointment.`,
    reference: lead?.id?.substring(0, 8).toUpperCase() || 'VW' + Date.now().toString().slice(-6)
  };
}

// Capture lead
async function captureLead(params: any) {
  console.log("Capturing lead:", params);
  
  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      full_name: params.full_name,
      phone_e164: params.phone_number,
      email_lower: params.email?.toLowerCase(),
      source: params.source || 'phone_call',
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
  console.log("Getting developer info for:", developerName);
  
  const { data, error } = await supabase
    .from('uae_developers')
    .select('*')
    .ilike('name', `%${developerName}%`)
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
    
    const lowerName = developerName.toLowerCase();
    for (const [key, info] of Object.entries(knownDevelopers)) {
      if (lowerName.includes(key)) {
        return { name: developerName, description: info };
      }
    }
    
    return { message: `I don't have specific information about ${developerName}. Would you like me to connect you with an agent who can help?` };
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
  console.log("Getting area info for:", areaName);
  
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .ilike('name', `%${areaName}%`)
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
    
    const lowerName = areaName.toLowerCase();
    for (const [key, info] of Object.entries(areaInfo)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return { name: areaName, description: info };
      }
    }
    
    return { message: `I can provide more details about ${areaName}. Would you like me to connect you with a local expert?` };
  }

  return {
    name: data.name,
    location: data.location,
    description: data.description
  };
}

// Handle function calls from VAPI
async function handleFunctionCall(functionName: string, args: any) {
  console.log(`Executing function: ${functionName}`, args);
  
  switch (functionName) {
    case "search_properties":
      return await searchProperties(args);
    case "get_project_details":
      return await getProjectDetails(args.project_name);
    case "book_viewing":
      return await bookViewing(args);
    case "capture_lead":
      return await captureLead(args);
    case "get_developer_info":
      return await getDeveloperInfo(args.developer_name);
    case "get_area_info":
      return await getAreaInfo(args.area_name);
    case "transfer_to_agent":
      return { 
        message: "Transferring you to one of our property consultants. Please hold.",
        transfer: true,
        reason: args.reason
      };
    default:
      return { error: "Unknown function" };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("VAPI webhook received:", JSON.stringify(body, null, 2));

    const { message } = body;

    // Handle different VAPI message types
    switch (message?.type) {
      case "assistant-request":
        // Return assistant configuration - John is based in Dubai, UAE
        return new Response(JSON.stringify({
          assistant: {
            name: "John",
            firstMessage: "Hello! This is John from JBJ Global Real Estate in Dubai. I'm available 24/7 to help you with any property inquiries. How can I assist you today?",
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              temperature: 0.7,
              systemPrompt: `You are John, a Senior Property Consultant at JBJ Global Real Estate in Dubai, United Arab Emirates.

YOUR IDENTITY:
- Name: John
- Role: Senior Property Consultant (NOT a receptionist - you are an expert!)
- Nationality: British (but you've lived in Dubai for 8 years)
- Company: JBJ Global Real Estate, headquartered in Dubai, UAE
- Phone: +971 56 591 1000
- Email: contact@jbj.ae

LOCATION (VERY IMPORTANT):
- You work in DUBAI, UNITED ARAB EMIRATES (UAE)
- When asked "where are you located?" or "which country?" → Answer: "We're based in Dubai, UAE"
- When asked "what nationality are you?" → Answer: "I'm British, but I've been living and working in Dubai for 8 years"

COMPANY INFORMATION:
- Company: ${COMPANY_INFO.name}
- Location: Dubai, United Arab Emirates
- Services: ${COMPANY_INFO.services.join(", ")}
- Key Areas: ${COMPANY_INFO.areas.join(", ")}
- Top Developers: ${COMPANY_INFO.developers.join(", ")}

DUBAI REAL ESTATE KNOWLEDGE:
- No property tax, no income tax in UAE
- Golden Visa for investments over AED 2 million
- Rental yields: 5-8% annually (higher than most global cities)
- Price ranges: Studios from AED 500K, 1-beds from AED 800K, 2-beds from AED 1.2M, villas from AED 3M+

POPULAR AREAS YOU KNOW WELL:
- Dubai Marina: Waterfront high-rises, marina views, vibrant lifestyle
- Downtown Dubai: Burj Khalifa, Dubai Mall, urban luxury
- Palm Jumeirah: Iconic island, beachfront villas, exclusive living
- Business Bay: Modern living, Dubai Canal views, great value
- JBR: Beach access, The Walk promenade, restaurants
- Dubai Hills: Family-friendly, golf course, Emaar development

YOUR PERSONALITY:
- Confident and knowledgeable (you are an EXPERT, not just a receptionist)
- Warm, professional, and helpful
- Answer questions directly and quickly
- Available 24/7 to support clients

RESPONSE STYLE:
- Keep answers concise but informative
- Don't hesitate or say "I'm just a receptionist" - you know Dubai real estate!
- If asked about specific listings, offer to send details via WhatsApp or email
- Always try to collect contact information naturally
- Offer to schedule viewings for serious inquiries

HANDLING COMMON QUESTIONS:
- "Where are you located?" → "We're based in Dubai, UAE - the heart of Middle East luxury real estate"
- "What country?" → "Dubai, in the United Arab Emirates"
- "Your nationality?" → "I'm British, but I've been in Dubai for 8 years"
- "Property prices?" → Give ranges: Studios from 500K AED, up to 100M+ for ultra-luxury
- "Best areas?" → Ask about their preferences (beach? city? family?) then recommend`
            },
            voice: {
              provider: "11labs",
              voiceId: "pNInz6obpgDQGcFmaJgB" // Adam - professional male voice
            },
            functions: FUNCTION_DEFINITIONS
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "function-call":
        // Handle function calls
        const { functionCall } = message;
        const result = await handleFunctionCall(functionCall.name, functionCall.parameters);
        
        return new Response(JSON.stringify({
          result: JSON.stringify(result)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "end-of-call-report":
        // Save call log to database with AI auditing
        console.log("Call ended - saving to database:", {
          callId: message.call?.id,
          duration: message.durationSeconds,
          endedReason: message.endedReason
        });
        
        try {
          // Extract lead info from transcript using simple parsing
          const transcript = message.transcript || '';
          const extractedInfo = extractLeadFromTranscript(transcript);
          
          // Perform AI audit of the call
          const aiAudit = await auditCall(transcript, message.summary);
          
          // Save to database
          const { data: callLog, error: saveError } = await supabase
            .from('vapi_call_logs')
            .insert({
              call_id: message.call?.id || `call_${Date.now()}`,
              caller_phone: message.call?.customer?.number,
              duration_seconds: message.durationSeconds,
              transcript: transcript,
              summary: message.summary,
              recording_url: message.recordingUrl,
              call_status: message.call?.status,
              ended_reason: message.endedReason,
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
              extracted_phone: extractedInfo.phone || message.call?.customer?.number,
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
              const { data: lead, error: leadError } = await supabase
                .from('crm_leads')
                .insert({
                  full_name: extractedInfo.name || 'Phone Lead',
                  phone_e164: extractedInfo.phone || message.call?.customer?.number,
                  email_lower: extractedInfo.email?.toLowerCase(),
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
        console.log("Unhandled message type:", message?.type);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    console.error("VAPI webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
