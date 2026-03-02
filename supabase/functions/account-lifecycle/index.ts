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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();
    if (!["deactivate", "delete", "reactivate", "check_status"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const userMeta = authData.user.user_metadata || {};

    // Check account status
    if (action === "check_status") {
      const status = userMeta.account_status || "active";
      const scheduledDeletion = userMeta.scheduled_deletion_at || null;
      const deactivatedAt = userMeta.deactivated_at || null;

      return new Response(JSON.stringify({ 
        status, 
        scheduled_deletion_at: scheduledDeletion,
        deactivated_at: deactivatedAt,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reactivate account
    if (action === "reactivate") {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: "none",
        user_metadata: {
          ...userMeta,
          account_status: "active",
          deactivated_at: null,
          scheduled_deletion_at: null,
          reactivated_at: new Date().toISOString(),
        },
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, action: "reactivated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate account
    if (action === "deactivate") {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: "876000h",
        user_metadata: {
          ...userMeta,
          account_status: "deactivated",
          deactivated_at: new Date().toISOString(),
        },
      });

      if (error) throw error;
    }

    // Soft delete: schedule permanent deletion in 30 days
    if (action === "delete") {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: "876000h",
        user_metadata: {
          ...userMeta,
          account_status: "pending_deletion",
          deactivated_at: new Date().toISOString(),
          scheduled_deletion_at: deletionDate.toISOString(),
        },
      });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, action }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("account-lifecycle error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
