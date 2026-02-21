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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { token, email, source } = await req.json();

    if (!token && !email) {
      return new Response(
        JSON.stringify({ error: "Token or email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find subscriber
    let query = supabase.from('newsletter_subscribers').select('*');
    if (token) {
      query = query.eq('unsubscribe_token', token);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: subscriber, error: findError } = await query.maybeSingle();

    if (findError || !subscriber) {
      return new Response(
        JSON.stringify({ success: true, message: "Unsubscribed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update subscriber status
    await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_source: source || 'email_link',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    // Log event
    await supabase.from('newsletter_events').insert({
      email: subscriber.email,
      user_id: subscriber.user_id || null,
      event_type: 'unsubscribe',
      source: source || 'email_link',
    });

    // Update profiles.marketing_consent if linked
    if (subscriber.user_id) {
      await supabase
        .from('profiles')
        .update({ marketing_consent: false })
        .eq('id', subscriber.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Unsubscribed successfully", email: subscriber.email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[unsubscribe-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
