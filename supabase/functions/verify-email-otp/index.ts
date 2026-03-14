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

  // Rate limit: 10 requests per 15 min per IP
  const { response: blocked, clientIp, serviceClient } = await enforceRateLimit(req, {
    functionName: 'verify-email-otp',
    maxRequests: 10,
    windowMinutes: 15,
    keyType: 'ip',
  }, corsHeaders);
  if (blocked) return blocked;

  try {
    const { email, otp_code } = await req.json();

    if (!email || !otp_code) {
      return new Response(
        JSON.stringify({ error: "Email and OTP code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^\d{6}$/.test(otp_code)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching verification:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({ error: "No valid verification code found. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (verification.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (verification.otp_code !== otp_code) {
      await supabase
        .from("email_verifications")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);

      // Log auth failure for credential stuffing detection
      await logSecurityEvent(serviceClient, {
        event_type: 'auth_failure',
        function_name: 'verify-email-otp',
        client_ip: clientIp,
        severity: 'low',
        details: { email_prefix: email.substring(0, 3) + '***', attempt: verification.attempts + 1 },
      });

      const remainingAttempts = 4 - verification.attempts;
      return new Response(
        JSON.stringify({ 
          error: remainingAttempts > 0 
            ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
            : "Invalid code. Please request a new verification code."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to complete verification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email verified: ${email}`);

    return new Response(
      JSON.stringify({ success: true, verified: true, message: "Email verified successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-email-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
