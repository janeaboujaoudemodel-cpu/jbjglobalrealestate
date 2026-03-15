import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check — accept both service-role (cron) and user JWT (dashboard)
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;

    if (authHeader?.includes(serviceKey)) {
      // Called by cron
      isAuthorized = true;
    } else if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const svc = createClient(supabaseUrl, serviceKey);
        const { data: role } = await svc
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        isAuthorized = role?.role === "owner" || user.email === Deno.env.get("OWNER_EMAIL");
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const svc = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check";

    // ── CHECK: evaluate all keys and flag overdue ones ──
    if (action === "check") {
      const now = new Date();

      const { data: keys, error } = await svc
        .from("key_rotation_schedule")
        .select("*")
        .neq("status", "disabled");

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to query rotation schedule" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const alerts: Array<{ key_name: string; days_overdue: number; severity: string }> = [];
      const updates: Array<{ id: string; status: string }> = [];

      for (const key of keys || []) {
        const lastRotated = key.last_rotated_at ? new Date(key.last_rotated_at) : new Date("2026-01-01");
        const daysSince = Math.floor((now.getTime() - lastRotated.getTime()) / (1000 * 60 * 60 * 24));
        const daysOverdue = daysSince - key.rotation_interval_days;

        if (daysSince >= key.rotation_interval_days) {
          updates.push({ id: key.id, status: "overdue" });
          alerts.push({
            key_name: key.key_name,
            days_overdue: daysOverdue,
            severity: daysOverdue > 30 ? "critical" : "warning",
          });
        } else if (daysSince >= key.alert_threshold_days) {
          alerts.push({
            key_name: key.key_name,
            days_overdue: -(key.rotation_interval_days - daysSince),
            severity: "info",
          });
        } else if (key.status === "overdue") {
          updates.push({ id: key.id, status: "active" });
        }
      }

      // Batch update statuses
      for (const u of updates) {
        await svc
          .from("key_rotation_schedule")
          .update({ status: u.status, updated_at: now.toISOString() })
          .eq("id", u.id);
      }

      // Log alerts to audit
      if (alerts.length > 0) {
        await svc.from("encryption_audit_log").insert({
          action: "rotation_check",
          data_class: "key_management",
          record_id: "scheduled",
          details: { alerts, checked_at: now.toISOString() },
        });
      }

      // Send email alert for critical overdue keys
      const criticalAlerts = alerts.filter(a => a.severity === "critical");
      if (criticalAlerts.length > 0) {
        const ownerEmail = Deno.env.get("OWNER_EMAIL");
        if (ownerEmail) {
          // Log the alert — email sending uses existing send-owner-email function
          await svc.functions.invoke("send-owner-email", {
            body: {
              subject: `🔑 CRITICAL: ${criticalAlerts.length} encryption key(s) overdue for rotation`,
              html: `
                <h2>Key Rotation Alert</h2>
                <p>The following encryption keys are significantly overdue for rotation:</p>
                <ul>
                  ${criticalAlerts.map(a => `<li><strong>${a.key_name}</strong> — ${a.days_overdue} days overdue</li>`).join("")}
                </ul>
                <p>Please rotate these keys immediately via the Encryption Audit Dashboard.</p>
              `,
            },
          });
        }
      }

      return new Response(
        JSON.stringify({
          checked: (keys || []).length,
          alerts,
          overdue_count: alerts.filter(a => a.severity !== "info").length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ROTATE: record a key rotation ──
    if (action === "rotate") {
      const { key_name } = body;
      if (!key_name) {
        return new Response(
          JSON.stringify({ error: "key_name is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date().toISOString();
      const { error } = await svc
        .from("key_rotation_schedule")
        .update({
          last_rotated_at: now,
          status: "active",
          notified_at: null,
          updated_at: now,
        })
        .eq("key_name", key_name);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to update rotation record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Audit log
      await svc.from("encryption_audit_log").insert({
        action: "key_rotated",
        data_class: "key_management",
        record_id: key_name,
        details: { rotated_at: now },
      });

      return new Response(
        JSON.stringify({ success: true, key_name, rotated_at: now }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: check, rotate" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
