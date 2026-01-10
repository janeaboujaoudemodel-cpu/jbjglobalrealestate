import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  contactType?: 'client' | 'broker' | 'investor' | 'visitor';
  role?: 'buyer' | 'broker' | 'visitor';
  buyerType?: 'homeowner' | 'investor';
  message?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LeadCaptureRequest = await req.json();

    // Validate required fields
    if (!data.email || !data.source) {
      return new Response(
        JSON.stringify({ error: "Email and source are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      contactType = 'client'; // Visitors are potential clients
    } else if (data.buyerType === 'investor') {
      contactType = 'investor';
    }

    // Build tags from source and role info
    const tags: string[] = [data.source.replace(/_/g, '-')];
    if (data.role) tags.push(`role-${data.role}`);
    if (data.buyerType) tags.push(`buyer-type-${data.buyerType}`);

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
        current_location: data.currentLocation || null,
        age_range: data.ageRange || null,
        source: 'website', // Must match allowed sources in RLS
        page_source: data.pageSource || null,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (leadsError) {
      console.error('Error saving to leads table:', leadsError);
      // Don't fail - continue to CRM
    }

    // 2. Check if lead already exists in crm_leads
    const { data: existingLead } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('email_lower', normalizedEmail)
      .maybeSingle();

    if (existingLead) {
      // Update existing lead
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          full_name: data.fullName || existingLead.id,
          phone_e164: normalizedPhone,
          nationality: data.nationality || null,
          preferred_language: data.language || null,
          current_location_country: data.currentLocation || null,
          age_range: data.ageRange || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating CRM lead:', updateError);
      }

      console.log('Updated existing CRM lead:', existingLead.id);
    } else {
      // Insert new lead to crm_leads
      const { data: newLead, error: crmError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: data.fullName || normalizedEmail.split('@')[0],
          email_lower: normalizedEmail,
          phone_e164: normalizedPhone,
          nationality: data.nationality || null,
          preferred_language: data.language || null,
          current_location_country: data.currentLocation || null,
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
