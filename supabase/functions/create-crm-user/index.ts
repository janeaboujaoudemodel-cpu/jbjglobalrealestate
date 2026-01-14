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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin/owner
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    const { data: isOwner } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "owner",
    });
    const { data: isCrmAdmin } = await supabaseAdmin.rpc("is_crm_admin", {
      _user_id: caller.id,
    });

    if (!isAdmin && !isOwner && !isCrmAdmin) {
      return new Response(JSON.stringify({ error: "Access denied: Admin privileges required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, displayName, crmRole, jobTitle, phone } = await req.json();

    if (!email || !password || !displayName || !crmRole) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: displayName,
        force_password_change: true,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email: email,
        full_name: displayName,
        phone_number: phone,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Create CRM profile with force password change
    const { error: crmProfileError } = await supabaseAdmin
      .from("crm_users_profile")
      .insert({
        user_id: newUser.user.id,
        crm_role: crmRole,
        is_active: true,
        display_name: displayName,
        job_title: jobTitle,
        phone: phone,
        email: email,
        force_password_change: true,
      });

    if (crmProfileError) {
      console.error("Error creating CRM profile:", crmProfileError);
      return new Response(JSON.stringify({ error: crmProfileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the security event
    await supabaseAdmin.rpc("log_security_event", {
      p_action_type: "user_created",
      p_resource_type: "crm_user",
      p_resource_id: newUser.user.id,
      p_success: true,
      p_metadata: { created_by: caller.id, role: crmRole, job_title: jobTitle },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          displayName,
          crmRole,
          jobTitle,
        },
        message: `User created successfully. Temporary password: ${password}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in create-crm-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
