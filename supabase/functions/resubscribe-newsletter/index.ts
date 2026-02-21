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

    const { token, email } = await req.json();

    if (!token && !email) {
      return new Response(
        JSON.stringify({ error: "Token or email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabase.from('newsletter_subscribers').select('*');
    if (token) {
      query = query.eq('unsubscribe_token', token);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: subscriber } = await query.maybeSingle();

    if (!subscriber) {
      return new Response(
        JSON.stringify({ error: "Subscriber not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        unsubscribe_source: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    await supabase.from('newsletter_events').insert({
      email: subscriber.email,
      user_id: subscriber.user_id || null,
      event_type: 'resubscribe',
      source: 'resubscribe_page',
    });

    if (subscriber.user_id) {
      await supabase
        .from('profiles')
        .update({ marketing_consent: true })
        .eq('id', subscriber.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Resubscribed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[resubscribe-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
