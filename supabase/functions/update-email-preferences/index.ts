import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, token, preferences, marketing_enabled, source } = await req.json();

    // Find subscriber by token or email
    let subscriberEmail = email?.toLowerCase().trim();
    
    if (token && !subscriberEmail) {
      const { data: sub } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('unsubscribe_token', token)
        .maybeSingle();
      
      if (sub) subscriberEmail = sub.email;
    }

    if (!subscriberEmail) {
      return new Response(
        JSON.stringify({ error: "Email or token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Update preferences if provided
    if (preferences && Array.isArray(preferences)) {
      updates.preference_tags = JSON.stringify(preferences);
    }

    // Update marketing enabled status
    if (typeof marketing_enabled === 'boolean') {
      updates.is_active = marketing_enabled;
      if (!marketing_enabled) {
        updates.unsubscribed_at = new Date().toISOString();
        updates.unsubscribe_source = source || 'settings_toggle';
      } else {
        updates.unsubscribed_at = null;
        updates.unsubscribe_source = null;
        updates.subscribed_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update(updates)
      .eq('email', subscriberEmail);

    if (updateError) {
      console.error("[update-email-preferences] Update error:", updateError);
    }

    // Log event
    const eventType = typeof marketing_enabled === 'boolean'
      ? (marketing_enabled ? 'toggle_on' : 'toggle_off')
      : 'preference_update';

    await supabase.from('newsletter_events').insert({
      email: subscriberEmail,
      event_type: eventType,
      source: source || 'settings',
      metadata: { preferences, marketing_enabled },
    });

    // Sync profiles if we can find the user
    if (typeof marketing_enabled === 'boolean') {
      const { data: sub } = await supabase
        .from('newsletter_subscribers')
        .select('user_id')
        .eq('email', subscriberEmail)
        .maybeSingle();

      if (sub?.user_id) {
        await supabase
          .from('profiles')
          .update({ marketing_consent: marketing_enabled })
          .eq('id', sub.user_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[update-email-preferences] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
