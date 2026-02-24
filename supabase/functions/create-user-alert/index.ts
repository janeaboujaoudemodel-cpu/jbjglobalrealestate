import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertRequest {
  // Notification fields
  notification?: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  };
  // Task fields
  task?: {
    user_id: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is the owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    if (!ownerEmail || user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Forbidden: owner only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to insert (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: AlertRequest = await req.json();
    const results: Record<string, unknown> = {};

    // Insert notification
    if (body.notification) {
      const { error: notifErr } = await serviceClient
        .from("user_notifications")
        .insert({
          user_id: body.notification.user_id,
          type: body.notification.type,
          title: body.notification.title,
          message: body.notification.message,
          metadata: body.notification.metadata || null,
          is_read: false,
        });
      results.notification = notifErr ? { error: notifErr.message } : { success: true };
    }

    // Insert task
    if (body.task) {
      const { error: taskErr } = await serviceClient
        .from("admin_tasks")
        .insert({
          user_id: body.task.user_id,
          title: body.task.title,
          description: body.task.description || null,
          category: body.task.category || null,
          priority: body.task.priority || "medium",
          status: "pending",
        });
      results.task = taskErr ? { error: taskErr.message } : { success: true };
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-user-alert:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
