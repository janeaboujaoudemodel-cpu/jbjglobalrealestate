import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cf-connecting-ip, x-forwarded-for, x-real-ip",
};

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
}

// Get location from IP using free ipapi.co service
async function getLocationFromIP(ip: string): Promise<{ city: string | null; country: string | null }> {
  try {
    // Skip private/local IPs
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LeadCaptureRequest = await req.json();

    if (!data.email || !data.source) {
      return new Response(
        JSON.stringify({ error: "Email and source are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP for geolocation
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     '';
    
    // Auto-detect location from IP if not provided
    let detectedLocation = { city: data.detectedCity || null, country: data.detectedCountry || null };
    if (!data.currentLocation && clientIP) {
      detectedLocation = await getLocationFromIP(clientIP);
      console.log('Detected location from IP:', detectedLocation);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = data.email.toLowerCase().trim();
    const normalizedPhone = data.phone?.replace(/[\s\-\(\)]/g, '') || null;

    // Determine contact type from role
    let contactType: 'client' | 'broker' | 'investor' | 'visitor' | 'other' = 'client';
    if (data.role === 'broker') {
      contactType = 'broker';
    } else if (data.role === 'visitor') {
      contactType = 'client';
    } else if (data.buyerType === 'investor') {
      contactType = 'investor';
    }

    // Build tags from source, role info, and sub-source
    const tags: string[] = [data.source.replace(/_/g, '-')];
    if (data.subSource) tags.push(`subsource-${data.subSource.replace(/\s+/g, '-').toLowerCase()}`);
    if (data.role) tags.push(`role-${data.role}`);
    if (data.buyerType) tags.push(`buyer-type-${data.buyerType}`);
    if (data.pageSource) tags.push(`page-${data.pageSource.replace(/\//g, '-').replace(/^-/, '')}`);

    // Use provided location or detected location
    const locationCity = data.currentLocation || detectedLocation.city;
    const locationCountry = detectedLocation.country;

    // 1. Upsert to leads table
    const { error: leadsError } = await supabase
      .from('leads')
      .upsert({
        email: normalizedEmail,
        full_name: data.fullName || null,
        phone: normalizedPhone,
        nationality: data.nationality || null,
        language: data.language || null,
        birthday: data.birthday || null,
        current_location: locationCity || null,
        age_range: data.ageRange || null,
        source: 'website',
        page_source: data.pageSource || null,
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

    if (existingLead) {
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          full_name: data.fullName || existingLead.id,
          phone_e164: normalizedPhone,
          nationality: data.nationality || null,
          preferred_language: data.language || null,
          current_location_country: locationCountry || null,
          current_location_city: locationCity || null,
          age_range: data.ageRange || null,
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
          full_name: data.fullName || normalizedEmail.split('@')[0],
          email_lower: normalizedEmail,
          phone_e164: normalizedPhone,
          nationality: data.nationality || null,
          preferred_language: data.language || null,
          current_location_country: locationCountry || null,
          current_location_city: locationCity || null,
          age_range: data.ageRange || null,
          source: data.source,
          owner_type: 'company_assigned',
          lead_source_type: 'website',
          contact_type: contactType,
          tags: tags,
        })
        .select('id')
        .single();

      if (crmError) {
        console.error('Error inserting CRM lead:', crmError);
        return new Response(
          JSON.stringify({ error: "Failed to save lead to CRM", details: crmError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log('Created new CRM lead:', newLead?.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead captured successfully",
        email: normalizedEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in capture-lead:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
