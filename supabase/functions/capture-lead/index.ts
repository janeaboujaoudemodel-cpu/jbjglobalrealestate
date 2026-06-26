import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cf-connecting-ip, x-forwarded-for, x-real-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting: max 10 submissions per IP per 15 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

// Partner service types for compliance tracking
type PartnerServiceType = 'mortgage' | 'legal' | 'company_setup' | 'visa' | 'golden_visa' | 'schengen' | null;
type LeadIntent = 'buy' | 'sell' | 'rent' | 'broker' | 'partner_service' | null;

interface LeadCaptureRequest {
  email: string;
  fullName?: string;
  phone?: string;
  nationality?: string;
  language?: string;
  birthday?: string;
  currentLocation?: string;
  ageRange?: string;
  source: string;
  pageSource?: string;
  subSource?: string;
  contactType?: 'client' | 'broker' | 'investor' | 'visitor';
  role?: 'buyer' | 'broker' | 'visitor';
  buyerType?: 'homeowner' | 'investor';
  message?: string;
  detectedCity?: string;
  detectedCountry?: string;
  // Partner service compliance fields
  intent?: LeadIntent;
  partnerServiceType?: PartnerServiceType;
  partnerConsentGiven?: boolean;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Sanitize string input to prevent injection
function sanitizeString(input: string | undefined | null, maxLength: number = 200): string | null {
  if (!input) return null;
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML-like tags
    .replace(/\${/g, ''); // Remove template literal injection
}

// Get location from IP using free ipapi.co service
async function getLocationFromIP(ip: string): Promise<{ city: string | null; country: string | null }> {
  try {
    // Skip private/local IPs
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1' || ip === 'unknown') {
      return { city: null, country: null };
    }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'JBJ-Global-Real-Estate/1.0' }
    });
    
    if (!response.ok) {
      console.log('IP geolocation failed:', response.status);
      return { city: null, country: null };
    }
    
    const data = await response.json();
    return {
      city: data.city || null,
      country: data.country_name || null
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    return { city: null, country: null };
  }
}

// Check rate limit for IP
async function checkRateLimit(
  supabase: any,
  clientIp: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const functionName = "capture-lead";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  try {
    const { data: existingEntry, error: fetchError } = await supabase
      .from("function_rate_limits")
      .select("*")
      .eq("function_name", functionName)
      .eq("rate_key", clientIp)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Rate limit check error:", fetchError);
      return { allowed: true }; // Allow on error to not block legitimate users
    }

    if (existingEntry) {
      if (existingEntry.request_count >= MAX_REQUESTS_PER_WINDOW) {
        const windowEndTime = new Date(existingEntry.window_start).getTime() + RATE_LIMIT_WINDOW_MS;
        const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
        console.warn(`Rate limit exceeded for IP: ${clientIp.substring(0, 8)}***`);
        return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
      }

      await supabase
        .from("function_rate_limits")
        .update({ request_count: existingEntry.request_count + 1 })
        .eq("id", existingEntry.id);
    } else {
      await supabase
        .from("function_rate_limits")
        .insert({
          function_name: functionName,
          rate_key: clientIp,
          window_start: new Date().toISOString(),
          request_count: 1,
        });
    }

    return { allowed: true };
  } catch (err) {
    console.error("Rate limit error:", err);
    return { allowed: true };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit first
    const rateLimitResult = await checkRateLimit(supabase, clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfterSeconds || 900)
          } 
        }
      );
    }

    const data: LeadCaptureRequest = await req.json();

    // Validate required fields
    if (!data.email || !data.source) {
      return new Response(
        JSON.stringify({ error: "Email and source are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const normalizedEmail = data.email.toLowerCase().trim().substring(0, 255);
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate source is from allowed list
    const allowedSources = [
      'website', 'homepage', 'market_report', 'property-evaluation',
      'contact_form', 'newsletter', 'ai_chat', 'inquiry', 'comparison',
      'broker_signup', 'project_inquiry', 'schedule_call',
      // Partner service sources
      'partner_mortgage', 'partner_legal', 'partner_company_setup', 'partner_visa'
    ];
    const sanitizedSource = sanitizeString(data.source, 50) || 'website';
    if (!allowedSources.includes(sanitizedSource.replace(/-/g, '_'))) {
      console.warn(`Unknown source attempted: ${sanitizedSource}`);
      // Still allow but log for monitoring
    }

    // Validate partner service intent
    const validIntents: LeadIntent[] = ['buy', 'sell', 'rent', 'broker', 'partner_service'];
    const leadIntent: LeadIntent = data.intent && validIntents.includes(data.intent) ? data.intent : null;
    
    // Validate partner service type
    const validPartnerTypes: PartnerServiceType[] = ['mortgage', 'legal', 'company_setup', 'visa', 'golden_visa', 'schengen'];
    const partnerServiceType: PartnerServiceType = data.partnerServiceType && validPartnerTypes.includes(data.partnerServiceType) 
      ? data.partnerServiceType : null;
    
    // For partner services, consent must be given
    const partnerConsentGiven = data.partnerConsentGiven === true;

    // Sanitize all input fields
    const sanitizedFullName = sanitizeString(data.fullName, 100);
    const sanitizedPhone = data.phone?.replace(/[^\d+\-\s\(\)]/g, '').substring(0, 20) || null;
    const sanitizedNationality = sanitizeString(data.nationality, 100);
    const sanitizedLanguage = sanitizeString(data.language, 50);
    const sanitizedLocation = sanitizeString(data.currentLocation, 100);
    const sanitizedAgeRange = sanitizeString(data.ageRange, 20);
    const sanitizedPageSource = sanitizeString(data.pageSource, 100);
    const sanitizedSubSource = sanitizeString(data.subSource, 100);

    // Validate contact type
    const validContactTypes = ['client', 'broker', 'investor', 'visitor'];
    let contactType: 'client' | 'broker' | 'investor' | 'visitor' | 'other' = 'client';
    if (data.role === 'broker' && validContactTypes.includes('broker')) {
      contactType = 'broker';
    } else if (data.buyerType === 'investor') {
      contactType = 'investor';
    }

    // Auto-detect location from IP if not provided
    let detectedLocation = { city: data.detectedCity || null, country: data.detectedCountry || null };
    if (!sanitizedLocation && clientIp !== 'unknown') {
      detectedLocation = await getLocationFromIP(clientIp);
      console.log('Detected location from IP:', detectedLocation);
    }

    // Build tags with sanitized values
    const tags: string[] = [sanitizedSource.replace(/_/g, '-')];
    if (sanitizedSubSource) tags.push(`subsource-${sanitizedSubSource.replace(/\s+/g, '-').toLowerCase()}`);
    if (data.role) tags.push(`role-${data.role}`);
    if (data.buyerType) tags.push(`buyer-type-${data.buyerType}`);
    if (sanitizedPageSource) tags.push(`page-${sanitizedPageSource.replace(/\//g, '-').replace(/^-/, '')}`);
    
    // Partner service tags for compliance tracking
    if (leadIntent === 'partner_service') {
      tags.push('intent-partner-service');
      if (partnerServiceType) {
        tags.push(`partner-type-${partnerServiceType.replace(/_/g, '-')}`);
      }
      if (partnerConsentGiven) {
        tags.push('partner-consent-given');
      }
    } else if (leadIntent) {
      tags.push(`intent-${leadIntent}`);
    }

    const locationCity = sanitizedLocation || detectedLocation.city;
    const locationCountry = detectedLocation.country;

    // 1. Upsert to leads table
    const { error: leadsError } = await supabase
      .from('leads')
      .upsert({
        email: normalizedEmail,
        full_name: sanitizedFullName,
        phone: sanitizedPhone,
        nationality: sanitizedNationality,
        language: sanitizedLanguage,
        birthday: data.birthday ? sanitizeString(data.birthday, 20) : null,
        current_location: locationCity,
        age_range: sanitizedAgeRange,
        source: 'website',
        page_source: sanitizedPageSource,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (leadsError) {
      console.error('Error saving to leads table:', leadsError);
    }

    // 2. Check if lead already exists in crm_leads
    const { data: existingLead } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('email_lower', normalizedEmail)
      .maybeSingle();

    let resolvedLeadId: string | null = existingLead?.id ?? null;

    if (existingLead) {
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          full_name: sanitizedFullName || existingLead.id,
          phone_e164: sanitizedPhone,
          nationality: sanitizedNationality,
          preferred_language: sanitizedLanguage,
          current_location_country: locationCountry,
          current_location_city: locationCity,
          age_range: sanitizedAgeRange,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating CRM lead:', updateError);
      }

      console.log('Updated existing CRM lead:', existingLead.id);
    } else {
      const { data: newLead, error: crmError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: sanitizedFullName || normalizedEmail.split('@')[0],
          email_lower: normalizedEmail,
          phone_e164: sanitizedPhone,
          nationality: sanitizedNationality,
          preferred_language: sanitizedLanguage,
          current_location_country: locationCountry,
          current_location_city: locationCity,
          age_range: sanitizedAgeRange,
          source: sanitizedSource,
          owner_type: 'company_assigned',
          lead_source_type: 'website',
          contact_type: contactType,
          tags: tags.slice(0, 10), // Limit tags
        })
        .select('id')
        .single();

      if (crmError) {
        console.error('Error inserting CRM lead:', crmError);
        // Return generic error - don't expose database details
        return new Response(
          JSON.stringify({ error: "Unable to process your request. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resolvedLeadId = newLead?.id ?? null;
      console.log('Created new CRM lead:', newLead?.id);
    }

    // SECURITY: do NOT return leadId or any internal identifier. Returning
    // a server-issued lead UUID would allow correlation/enumeration attacks
    // from anonymous form submissions.
    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead captured successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in capture-lead:", error);
    // Return generic error message - don't expose internal details
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
