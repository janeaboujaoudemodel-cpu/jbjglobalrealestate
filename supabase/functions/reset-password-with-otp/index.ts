import { createClient } from "npm:@supabase/supabase-js@2";
import { enforceRateLimit, logSecurityEvent } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 3 requests per 15 min per IP
  const { response: blocked, clientIp, serviceClient } = await enforceRateLimit(req, {
    functionName: 'reset-password-with-otp',
    maxRequests: 3,
    windowMinutes: 15,
    keyType: 'ip',
  }, corsHeaders);
  if (blocked) return blocked;

  try {
    const { email, otp_code, new_password } = await req.json();

    if (!email || !otp_code || !new_password) {
      return new Response(
        JSON.stringify({ error: "Email, OTP code, and new password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
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

    // Hash the submitted OTP to match against the stored hash
    const otpHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(otp_code));
    const otpHash = Array.from(new Uint8Array(otpHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_code", otpHash)
      .not("verified_at", "is", null)
      .gt("expires_at", new Date().toISOString())
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching verification:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verification) {
      await logSecurityEvent(serviceClient, {
        event_type: 'auth_failure',
        function_name: 'reset-password-with-otp',
        client_ip: clientIp,
        severity: 'medium',
        details: { reason: 'invalid_or_expired_otp' },
      });
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifiedAt = new Date(verification.verified_at);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (verifiedAt < tenMinutesAgo) {
      return new Response(
        JSON.stringify({ error: "OTP verification has expired. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userList, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to find user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUser = userList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "No account found with this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("email_verifications")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", verification.id);

    console.log(`Password reset successful for: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in reset-password-with-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
