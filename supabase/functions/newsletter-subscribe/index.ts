import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubscribeRequest {
  email: string;
  full_name?: string;
  phone?: string;
  source?: string;
  page_source?: string;
  gdpr_consent?: boolean;
  listId?: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[newsletter-subscribe] Request received");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const defaultListId = Deno.env.get("BREVO_LIST_ID");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: SubscribeRequest = await req.json();

    if (!data.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const normalizedEmail = data.email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 5 per email per hour
    const { data: recentEvents } = await supabase
      .from('newsletter_events')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('event_type', 'subscribe')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (recentEvents && recentEvents.length >= 5) {
      return new Response(
        JSON.stringify({ success: true, message: "Subscription processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if known user (exists in leads or profiles)
    let isKnownUser = false;
    let existingName = data.full_name || null;
    let existingPhone = data.phone || null;

    const { data: existingLead } = await supabase
      .from('crm_leads')
      .select('id, full_name, phone, email')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      isKnownUser = true;
      existingName = existingName || existingLead.full_name;
      existingPhone = existingPhone || existingLead.phone;
    }

    if (!isKnownUser) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, email')
        .eq('email', normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        isKnownUser = true;
        existingName = existingName || existingProfile.full_name;
        existingPhone = existingPhone || existingProfile.phone_number;
      }
    }

    // Upsert into newsletter_subscribers
    const { data: subscriber, error: dbError } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email: normalizedEmail,
        name: existingName || data.full_name || null,
        full_name: existingName || data.full_name || null,
        phone: existingPhone || data.phone || null,
        source: data.source || 'website',
        source_page: data.page_source || null,
        is_active: true,
        subscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        gdpr_consent_at: data.gdpr_consent ? new Date().toISOString() : null,
        unsubscribed_at: null,
        unsubscribe_source: null,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select('unsubscribe_token, id')
      .single();

    if (dbError) {
      console.error("[newsletter-subscribe] DB error:", dbError);
    } else {
      console.log("[newsletter-subscribe] Saved subscriber");
    }

    // Log subscribe event
    await supabase.from('newsletter_events').insert({
      email: normalizedEmail,
      event_type: 'subscribe',
      source: data.source || 'website',
      metadata: { page_source: data.page_source, gdpr_consent: data.gdpr_consent },
    });

    // Send welcome email via welcome-subscriber function
    const unsubscribeToken = subscriber?.unsubscribe_token || '';
    try {
      const welcomeRes = await fetch(`${supabaseUrl}/functions/v1/welcome-subscriber`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: existingName || data.full_name || null,
          unsubscribe_token: unsubscribeToken,
        }),
      });
      const welcomeData = await welcomeRes.json();
      console.log("[newsletter-subscribe] Welcome email result:", welcomeData);

      // Store resend_message_id if available
      if (welcomeData?.emailResponse?.id) {
        await supabase
          .from('newsletter_subscribers')
          .update({
            resend_message_id: welcomeData.emailResponse.id,
            last_email_sent_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail);
      }
    } catch (emailErr) {
      console.warn("[newsletter-subscribe] Welcome email error:", emailErr);
    }

    // Sync to Brevo if configured
    if (brevoApiKey) {
      try {
        const listId = data.listId || (defaultListId ? parseInt(defaultListId) : null);
        const brevoPayload: Record<string, unknown> = {
          email: normalizedEmail,
          updateEnabled: true,
          attributes: {
            FIRSTNAME: (existingName || data.full_name || '').split(' ')[0],
            LASTNAME: (existingName || data.full_name || '').split(' ').slice(1).join(' '),
            SOURCE: data.source || 'website',
            PHONE: existingPhone || data.phone || '',
          },
        };
        if (listId) brevoPayload.listIds = [listId];

        const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(brevoPayload),
        });
        const brevoText = await brevoResponse.text();
        console.log("[newsletter-subscribe] Brevo result:", brevoResponse.status, brevoText);
      } catch (brevoError) {
        console.warn("[newsletter-subscribe] Brevo sync error:", brevoError);
      }
    }

    const requiresDetails = !isKnownUser && !data.full_name && !data.phone;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscribed successfully",
        isKnownUser,
        requiresDetails,
        email: normalizedEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[newsletter-subscribe] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
