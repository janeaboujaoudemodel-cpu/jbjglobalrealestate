/**
 * create-config-snapshot — Creates point-in-time snapshots of system configuration
 * Captures: app_settings, AI tool versions, user_roles, feature_flags,
 *           core templates (broker, marketing, executive, owner, design),
 *           critical config (marketing_config, points_config, activity_points_config)
 */

import { corsHeaders, getServiceClient, jsonResponse } from "../_shared/safe-execution.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = getServiceClient();

  try {
    // Verify caller is owner/admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Unauthorized" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }
    const { data: roleCheck } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleCheck) {
      return jsonResponse(403, { error: "Forbidden" });
    }

    const snapshot: Record<string, unknown> = {};

    // 1. App settings
    const { data: settings } = await sb.from("app_settings").select("*");
    snapshot.app_settings = settings || [];

    // 2. AI tool versions (current/published)
    const { data: toolVersions } = await sb
      .from("ai_tool_versions")
      .select("id, tool_id, version_number, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    snapshot.ai_tool_versions = toolVersions || [];

    // 3. User roles snapshot
    const { data: roles } = await sb.from("user_roles").select("user_id, role");
    snapshot.user_roles = roles || [];

    // 4. Feature flags / safety config from app_settings
    const { data: featureFlags } = await sb
      .from("app_settings")
      .select("key, value")
      .like("key", "feature_%");
    snapshot.feature_flags = featureFlags || [];

    // 5. Broker email templates
    const { data: brokerTemplates } = await sb
      .from("broker_email_templates")
      .select("id, name, subject, category, is_active");
    snapshot.broker_email_templates = brokerTemplates || [];

    // 6. Marketing templates
    const { data: marketingTemplates } = await sb
      .from("marketing_templates")
      .select("id, name, type, status");
    snapshot.marketing_templates = marketingTemplates || [];

    // 7. Executive response templates
    const { data: execTemplates } = await sb
      .from("executive_response_templates")
      .select("id, name, category, is_active");
    snapshot.executive_response_templates = execTemplates || [];

    // 8. Owner comm templates
    const { data: ownerTemplates } = await sb
      .from("owner_comm_templates")
      .select("id, name, type, is_active");
    snapshot.owner_comm_templates = ownerTemplates || [];

    // 9. Design templates
    const { data: designTemplates } = await sb
      .from("design_templates")
      .select("id, name, category, is_active");
    snapshot.design_templates = designTemplates || [];

    // 10. Marketing config
    const { data: marketingConfig } = await sb
      .from("marketing_config")
      .select("*");
    snapshot.marketing_config = marketingConfig || [];

    // 11. Points config
    const { data: pointsConfig } = await sb
      .from("points_config")
      .select("*");
    snapshot.points_config = pointsConfig || [];

    // 12. Activity points config
    const { data: activityPointsConfig } = await sb
      .from("activity_points_config")
      .select("*");
    snapshot.activity_points_config = activityPointsConfig || [];

    const snapshotJson = JSON.stringify(snapshot);
    const sizeBytes = new TextEncoder().encode(snapshotJson).length;

    const categoryCounts: Record<string, number> = {};
    for (const [key, val] of Object.entries(snapshot)) {
      categoryCounts[key] = Array.isArray(val) ? val.length : 1;
    }

    // Insert backup record
    const { data: record, error: insertErr } = await sb
      .from("system_backup_records")
      .insert({
        backup_type: "config",
        status: "completed",
        source_module: "create-config-snapshot",
        snapshot_data: snapshot,
        size_bytes: sizeBytes,
        created_by: user.id,
        notes: `Full config snapshot: ${Object.entries(categoryCounts).map(([k, v]) => `${k}(${v})`).join(", ")}`,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("Failed to save snapshot:", insertErr.message);
      return jsonResponse(500, { error: "Failed to save snapshot" });
    }

    return jsonResponse(200, {
      success: true,
      backup_id: record.id,
      created_at: record.created_at,
      size_bytes: sizeBytes,
      categories_captured: Object.keys(snapshot).length,
      summary: categoryCounts,
    });
  } catch (err) {
    console.error("Snapshot error:", err);
    return jsonResponse(500, { error: "Internal error" });
  }
});
