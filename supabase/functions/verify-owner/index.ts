import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * verify-owner v2 — DB-based owner check
 * 
 * Sources of truth (checked in order):
 * 1. user_roles table: user has 'admin' or 'owner' role
 * 2. app_settings table: owner_email matches user email
 * 3. Env var OWNER_EMAIL (legacy fallback only)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ isOwner: false, reason: "no_auth" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // User-scoped client for auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await userClient.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({ isOwner: false, reason: "no_user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service-role client for DB lookups (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check 1: user_roles table
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasOwnerRole = (roles || []).some(
      (r: { role: string }) => r.role === "owner" || r.role === "admin"
    );

    if (hasOwnerRole) {
      return new Response(
        JSON.stringify({ isOwner: true, email: user.email, source: "user_roles" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check 2: app_settings.owner_email
    const { data: setting } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "owner_email")
      .maybeSingle();

    const dbOwnerEmail = setting?.value;

    if (dbOwnerEmail && user.email?.toLowerCase() === dbOwnerEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ isOwner: true, email: user.email, source: "app_settings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check 3: Env var fallback (legacy)
    const envOwnerEmail = Deno.env.get("OWNER_EMAIL");
    if (envOwnerEmail && user.email?.toLowerCase() === envOwnerEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ isOwner: true, email: user.email, source: "env_fallback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definitively not owner
    return new Response(
      JSON.stringify({
        isOwner: false,
        email: user.email,
        reason: "email_mismatch",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying owner:", error);
    return new Response(
      JSON.stringify({ isOwner: false, reason: "error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
