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
  message?: string;
  context?: Record<string, unknown>;
}

function escapeHtml(input: string | null | undefined): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeContext(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>).slice(0, 30)) {
    const cleanKey = sanitizeString(key, 60);
    if (!cleanKey) continue;
    if (typeof value === "string") out[cleanKey] = sanitizeString(value, 300);
    else if (typeof value === "number" || typeof value === "boolean") out[cleanKey] = value;
    else if (value == null) out[cleanKey] = null;
    else out[cleanKey] = sanitizeString(JSON.stringify(value), 500);
  }
  return out;
}

function buildSuggestedResponse(params: {
  name: string | null;
  source: string;
  phone: string | null;
  message: string | null;
  context: Record<string, unknown>;
}): string {
  const firstName = (params.name || "there").split(/\s+/)[0];
  const projectName = typeof params.context.projectName === "string" ? params.context.projectName : null;
  const service = typeof params.context.serviceNeeded === "string" ? params.context.serviceNeeded : null;
  const timeline = typeof params.context.timeline === "string" ? params.context.timeline : null;
  const budget = typeof params.context.budgetRange === "string" ? params.context.budgetRange : null;
  const preferred = typeof params.context.contactMethod === "string" ? params.context.contactMethod : "WhatsApp";
  const details = [
    projectName ? `project: ${projectName}` : null,
    service ? `service: ${service}` : null,
    timeline ? `timeline: ${timeline}` : null,
    budget ? `budget: ${budget}` : null,
  ].filter(Boolean).join(", ");
  return [
    `Hi ${firstName}, thank you for contacting JBJ Global Real Estate${projectName ? ` about ${projectName}` : ""}.`,
    details ? `I saw your request details (${details}) and I can help you with the next best options.` : `I received your enquiry and I can help you with the next best options.`,
    params.message ? `I also noted: “${params.message}”.` : null,
    `Would you prefer that I continue by ${preferred}, or should I send you the key details here first?`,
  ].filter(Boolean).join("\n\n");
}

async function notifyOwnersAboutLead(supabase: any, params: {
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  pageSource: string | null;
  message: string | null;
  context: Record<string, unknown>;
  suggestedResponse: string;
}) {
  const { data: ownerRoles, error: ownerError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "owner");

  if (ownerError) {
    console.error("Owner lookup failed:", ownerError);
    return;
  }

  const ownerIds = Array.from(new Set((ownerRoles ?? []).map((r: any) => r.user_id).filter(Boolean)));
  if (!ownerIds.length) return;

  const actionUrl = `/owner/crm/leads/${params.leadId}`;
  const dueAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const notificationRows = ownerIds.map((user_id: string) => ({
    user_id,
    title: "New lead received",
    body: `${params.name} submitted ${params.source}${params.phone ? ` · ${params.phone}` : ""}`,
    notification_type: "new_lead",
    action_url: actionUrl,
    metadata: {
      lead_id: params.leadId,
      source: params.source,
      page_source: params.pageSource,
      email: params.email,
      phone: params.phone,
      sound: "lead-pop",
      suggested_response: params.suggestedResponse,
    },
  }));
  await supabase.from("notifications").insert(notificationRows);

  const taskRows = ownerIds.map((user_id: string) => ({
    user_id,
    lead_id: params.leadId,
    title: `Follow up with ${params.name}`,
    notes: `New website lead from ${params.source}. Phone: ${params.phone || "not provided"}. Suggested opener:\n\n${params.suggestedResponse}`,
    due_at: dueAt,
    status: "open",
  }));
  await supabase.from("crm_tasks").insert(taskRows);

  await supabase.from("crm_ai_drafts").insert({
    lead_id: params.leadId,
    draft_type: "first_response",
    subject: `First response for ${params.name}`,
    content: params.suggestedResponse,
    status: "draft",
    metadata: { source: params.source, page_source: params.pageSource, context: params.context },
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("email")
    .in("id", ownerIds);
  const ownerEmails = Array.from(new Set((profiles ?? []).map((p: any) => String(p.email || "").toLowerCase()).filter(Boolean)));
  const notifyEmails = ownerEmails.length ? ownerEmails : ["contact@jbj.ae"];
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;

  const contextRows = Object.entries(params.context)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .slice(0, 12)
    .map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #EFE6D6;color:#1A1A1A;font-weight:700;">${escapeHtml(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #EFE6D6;color:#1A1A1A;">${escapeHtml(String(v))}</td></tr>`)
    .join("");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "JBJ CRM <contact@jbj.ae>",
        to: notifyEmails,
        reply_to: params.email,
        subject: `New lead: ${params.name} · ${params.source}`,
        html: `<div style="font-family:Arial,sans-serif;background:#fff;padding:24px;color:#1A1A1A;"><div style="max-width:680px;margin:0 auto;border:1px solid #B89555;border-radius:14px;overflow:hidden;"><div style="background:linear-gradient(135deg,#064E3B,#042C1C,#000);padding:18px 22px;color:#fff;"><h1 style="margin:0;font-size:22px;color:#fff;">New lead received</h1><p style="margin:6px 0 0;color:#fff;">${escapeHtml(params.source)}</p></div><div style="padding:22px;background:#FDFBF7;"><p><strong>Name:</strong> ${escapeHtml(params.name)}</p><p><strong>Email:</strong> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a></p><p><strong>Phone:</strong> ${params.phone ? `<a href="https://wa.me/${escapeHtml(params.phone.replace(/\D/g, ""))}">${escapeHtml(params.phone)}</a>` : "Not provided"}</p><p><strong>CRM:</strong> <a href="https://www.jbj.ae${actionUrl}">Open lead in CRM</a></p>${params.message ? `<p><strong>Message:</strong><br>${escapeHtml(params.message)}</p>` : ""}${contextRows ? `<table style="border-collapse:collapse;width:100%;margin-top:14px;">${contextRows}</table>` : ""}<div style="margin-top:18px;padding:14px;border-left:4px solid #064E3B;background:#fff;"><strong>Prepared response</strong><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;color:#1A1A1A;">${escapeHtml(params.suggestedResponse)}</pre></div></div></div></div>`,
      }),
    });
  } catch (err) {
    console.error("Owner email notification failed:", err);
  }
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
    const sanitizedMessage = sanitizeString(data.message, 1000);
    const sanitizedContext = safeContext(data.context);

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
          pipeline_stage: 'qualified',
          priority: sanitizedPhone ? 'high' : 'normal',
          notes: sanitizedMessage || undefined,
          raw_import: {
            ...(sanitizedContext ?? {}),
            source: sanitizedSource,
            page_source: sanitizedPageSource,
            message: sanitizedMessage,
            last_capture_at: new Date().toISOString(),
          },
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
          pipeline_stage: 'qualified',
          priority: sanitizedPhone ? 'high' : 'normal',
          notes: sanitizedMessage,
          raw_import: {
            ...sanitizedContext,
            source: sanitizedSource,
            page_source: sanitizedPageSource,
            message: sanitizedMessage,
            captured_at: new Date().toISOString(),
          },
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

    if (resolvedLeadId) {
      const suggestedResponse = buildSuggestedResponse({
        name: sanitizedFullName,
        source: sanitizedSource,
        phone: sanitizedPhone,
        message: sanitizedMessage,
        context: sanitizedContext,
      });
      await notifyOwnersAboutLead(supabase, {
        leadId: resolvedLeadId,
        name: sanitizedFullName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: sanitizedPhone,
        source: sanitizedSource,
        pageSource: sanitizedPageSource,
        message: sanitizedMessage,
        context: sanitizedContext,
        suggestedResponse,
      });
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
