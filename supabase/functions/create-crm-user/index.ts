import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, password, displayName, crmRole, jobTitle, phone } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Enforce JBJ staff email standard
    if (!normalizedEmail.endsWith("@jbj.ae")) {
      return new Response(JSON.stringify({ error: "Staff emails must be @jbj.ae" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!normalizedEmail || !password || !displayName || !crmRole) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName, force_password_change: true },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    await supabaseAdmin.from("profiles").upsert({
      id: newUser.user.id, email: normalizedEmail, full_name: displayName, phone_number: phone,
    });

    // Create CRM profile
    const { error: crmError } = await supabaseAdmin.from("crm_users_profile").insert({
      user_id: newUser.user.id, crm_role: crmRole, is_active: true, display_name: displayName,
      job_title: jobTitle, phone, email: normalizedEmail, force_password_change: true,
    });

    if (crmError) {
      return new Response(JSON.stringify({ error: crmError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true, user: { id: newUser.user.id, email: newUser.user.email, displayName, crmRole },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
