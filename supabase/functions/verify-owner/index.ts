import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * verify-owner v4 — email-locked owner check with founder aliases
 *
 * The Owner back end is locked to the founder's registered inboxes. A database
 * `owner`/`admin` role alone must never grant access to /owner or owner edge
 * functions.
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

    const OWNER_BACKEND_EMAILS = new Set([
      "janeaboujaoudemodel@gmail.com",
      "janeaboujaoudenails@gmail.com",
      "contact@janeaboujaoude.net",
      "infoo.jane@gmail.com",
    ]);
    const userEmailLower = (user.email || "").toLowerCase().trim();

    // Source 1: app_settings.owner_email, but only when it resolves to one of
    // the founder's registered backend inboxes. This lets deployment config
    // stay compatible without allowing arbitrary admin/owner rows to open the
    // back end.
    const { data: setting } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "owner_email")
      .maybeSingle();

    const configuredOwnerEmail = String(setting?.value || "").toLowerCase().trim();
    if (configuredOwnerEmail && OWNER_BACKEND_EMAILS.has(configuredOwnerEmail)) {
      OWNER_BACKEND_EMAILS.add(configuredOwnerEmail);
    }

    if (!OWNER_BACKEND_EMAILS.has(userEmailLower)) {
      return new Response(
        JSON.stringify({
          isOwner: false,
          reason: "email_mismatch",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email matched. Roles are now only an additional sanity check/source label;
    // the email above is the real gate.
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasOwnerRole = (roles || []).some(
      (r: { role: string }) => r.role === "owner" || r.role === "admin"
    );

    if (hasOwnerRole) {
      return new Response(
        JSON.stringify({ isOwner: true, source: "owner_email_and_role" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The registered owner email still opens Owner mode even before a role row
    // exists (first registration / migration state).
    return new Response(
      JSON.stringify({ isOwner: true, source: "registered_owner_email" }),
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
