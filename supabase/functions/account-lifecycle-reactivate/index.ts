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

    // SECURITY: Verify the supplied password BEFORE lifting the ban.
    // Strategy: temporarily lift the ban, attempt signInWithPassword with the
    // supplied credentials using a non-admin client, then re-ban immediately if
    // auth fails. Only when the password is verified do we permanently reactivate.
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Step 1: temporarily lift ban so signInWithPassword can run
    const { error: tempUnbanError } = await admin.auth.admin.updateUserById(targetUser.id, {
      ban_duration: "none",
    });
    if (tempUnbanError) throw tempUnbanError;

    // Step 2: verify credentials
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.user) {
      // Step 2a: re-apply the ban if credentials were wrong
      await admin.auth.admin.updateUserById(targetUser.id, {
        ban_duration: "876000h", // ~100 years (effectively indefinite)
      });
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: invalidate the temporary session we just created
    try {
      await admin.auth.admin.signOut(signInData.session?.access_token || "");
    } catch (_) { /* best-effort */ }

    // Step 4: persist reactivation metadata
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
