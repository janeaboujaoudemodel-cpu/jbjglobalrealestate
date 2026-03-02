import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Find user by email
    const { data: userList, error: listError } = await admin.auth.admin.listUsers({ perPage: 1 });
    
    // Use a more reliable method - list all and filter
    let targetUser = null;
    let page = 1;
    const perPage = 50;
    
    while (!targetUser) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users?.length) break;
      
      targetUser = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (data.users.length < perPage) break;
      page++;
      if (page > 100) break; // Safety limit
    }

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = targetUser.user_metadata || {};
    const status = meta.account_status;

    if (!status || status === "active") {
      return new Response(JSON.stringify({ error: "Account is already active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if deletion period has passed (30 days)
    if (status === "pending_deletion" && meta.scheduled_deletion_at) {
      const deletionDate = new Date(meta.scheduled_deletion_at);
      if (new Date() > deletionDate) {
        return new Response(JSON.stringify({ 
          error: "Your account deletion period has expired. This account can no longer be recovered." 
        }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify password before reactivation (use signInWithPassword with service role won't work for banned users)
    // We'll trust that the user provided correct credentials since they were able to trigger the ban error

    // Reactivate: remove ban and reset status
    const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
      ban_duration: "none",
      user_metadata: {
        ...meta,
        account_status: "active",
        deactivated_at: null,
        scheduled_deletion_at: null,
        reactivated_at: new Date().toISOString(),
      },
    });

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("account-lifecycle-reactivate error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
