import { createClient } from "npm:@supabase/supabase-js@2";
import { enforceRateLimit, logSecurityEvent } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user first for rate limiting by user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: 3 requests per 60 min per user
    const { response: blocked, clientIp, serviceClient } = await enforceRateLimit(req, {
      functionName: 'change-user-email',
      maxRequests: 3,
      windowMinutes: 60,
      keyType: 'user',
      customKey: user.id,
    }, corsHeaders, user.id);
    if (blocked) return blocked;

    const { new_email } = await req.json();

    if (!new_email) {
      return new Response(
        JSON.stringify({ error: "New email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(new_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (user.email?.toLowerCase() === new_email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "New email is the same as current email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from("email_verifications")
      .select("*")
      .eq("email", new_email.toLowerCase())
      .not("verified_at", "is", null)
      .gte("verified_at", tenMinutesAgo)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifyError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify email ownership" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({ error: "Email not verified. Please verify the new email first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === new_email.toLowerCase() && u.id !== user.id
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "This email is already in use by another account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email: new_email, email_confirm: true }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message || "Failed to update email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabaseAdmin
      .from("email_verifications")
      .delete()
      .eq("id", verification.id);

    // Log the sensitive action
    await logSecurityEvent(serviceClient, {
      event_type: 'suspicious_pattern',
      function_name: 'change-user-email',
      client_ip: clientIp,
      user_id: user.id,
      severity: 'low',
      details: { action: 'email_changed', old_email_prefix: (user.email || '').substring(0, 3) + '***' },
    });

    console.log(`Email changed for user ${user.id}: ${user.email} → ${new_email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email changed successfully. Please sign in with your new email." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in change-user-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
