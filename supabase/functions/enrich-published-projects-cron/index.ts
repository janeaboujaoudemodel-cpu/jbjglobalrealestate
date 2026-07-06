// enrich-published-projects-cron
// Scheduled scan over every live project. For each project it:
//   1. Records a scan attempt in `enrichment_scan_log`
//   2. Bumps `projects.last_enrichment_scan_at`
//   3. (Extension point) — when whitelisted source adapters are added, this is
//      where their extracted patch is passed through mergeProjectEnrichment
//      with the project's locked_fields honoured.
//
// Runs unauthenticated — invoked by pg_cron via pg_net with the anon key.
// All writes use the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mergeProjectEnrichment } from "../_shared/mergeProjectEnrichment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE);

    // Oldest-scanned first so coverage rotates evenly.
    const { data: projects, error } = await admin
      .from("projects")
      .select("id, name, developer_id, locked_fields, last_enrichment_scan_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("last_enrichment_scan_at", { ascending: true, nullsFirst: true })
      .limit(BATCH);

    if (error) throw error;

    const runId = crypto.randomUUID();
    const scannedAt = new Date().toISOString();
    let mergedTotal = 0;

    for (const p of projects ?? []) {
      // Source adapters live here. Empty until owner supplies the whitelist.
      // Each adapter returns { source: string, patch: Record<string,unknown> }.
      const extracted: Array<{ source: string; patch: Record<string, unknown> }> = [];

      let changedKeys: string[] = [];
      const conflicts: Array<{ field: string; sources: Record<string, unknown> }> = [];

      if (extracted.length) {
        // Detect cross-source disagreement on the same non-empty field.
        const perField = new Map<string, Record<string, unknown>>();
        for (const { source, patch } of extracted) {
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === "") continue;
            if (!perField.has(k)) perField.set(k, {});
            perField.get(k)![source] = v;
          }
        }
        for (const [field, sources] of perField) {
          const values = Object.values(sources).map((v) => JSON.stringify(v));
          if (new Set(values).size > 1) conflicts.push({ field, sources });
        }

        // Merge every source in order, never overwriting existing values.
        let running = p as Record<string, unknown>;
        for (const { patch } of extracted) {
          const { merged, changedKeys: ck } = mergeProjectEnrichment(
            running,
            patch,
            (p.locked_fields as string[] | null) ?? [],
          );
          running = merged;
          changedKeys = Array.from(new Set([...changedKeys, ...ck]));
        }

        if (changedKeys.length) {
          const updatePatch: Record<string, unknown> = { last_enrichment_scan_at: scannedAt };
          for (const k of changedKeys) updatePatch[k] = running[k];
          await admin.from("projects").update(updatePatch).eq("id", p.id);
          mergedTotal += changedKeys.length;
        } else {
          await admin.from("projects").update({ last_enrichment_scan_at: scannedAt }).eq("id", p.id);
        }
      } else {
        await admin.from("projects").update({ last_enrichment_scan_at: scannedAt }).eq("id", p.id);
      }

      await admin.from("enrichment_scan_log").insert({
        run_id: runId,
        project_id: p.id,
        project_name: p.name,
        sources_checked: extracted.map((e) => e.source),
        changed_keys: changedKeys,
        conflicts,
      });
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        run_id: runId,
        scanned: projects?.length ?? 0,
        fields_merged: mergedTotal,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("enrich-published-projects-cron error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
