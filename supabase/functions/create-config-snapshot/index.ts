/**
 * create-config-snapshot — Creates point-in-time snapshots of system configuration
 * Captures: app_settings, AI tool versions, user_roles, document templates metadata
 */

import { corsHeaders, getServiceClient, jsonResponse } from "../_shared/safe-execution.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = getServiceClient();

  try {
    // Verify caller is owner/admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const { data: roleCheck } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleCheck) {
      return jsonResponse({ error: "Forbidden" }, 403);
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

    const snapshotJson = JSON.stringify(snapshot);
    const sizeBytes = new TextEncoder().encode(snapshotJson).length;

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
        notes: `Config snapshot with ${(settings || []).length} settings, ${(toolVersions || []).length} tool versions, ${(roles || []).length} role assignments`,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("Failed to save snapshot:", insertErr.message);
      return jsonResponse({ error: "Failed to save snapshot" }, 500);
    }

    return jsonResponse({
      success: true,
      backup_id: record.id,
      created_at: record.created_at,
      size_bytes: sizeBytes,
      summary: {
        app_settings: (settings || []).length,
        ai_tool_versions: (toolVersions || []).length,
        user_roles: (roles || []).length,
        feature_flags: (featureFlags || []).length,
      },
    });
  } catch (err) {
    console.error("Snapshot error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
