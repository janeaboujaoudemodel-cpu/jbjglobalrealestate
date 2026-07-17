/**
 * dedup-projects
 *
 * Two modes:
 *   POST { action: "scan", developer_id }  → returns duplicate clusters (no writes)
 *   POST { action: "merge", keep_id, duplicate_ids: [] } → merges duplicates into keep, appends developer_merge_log
 *
 * "Richest" record = has cover image + description + handover + bedrooms. When merging we copy any missing
 * fields from duplicates into the keep row, repoint child rows (project_images, project_videos, project_documents,
 * resale_listings), then delete the duplicates.
 */
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\b(residences?|towers?|the|by|at|integrated|wellness|resort|apartments?|villas?|homes?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

type Row = Record<string, unknown> & {
  id: string;
  developer_id: string | null;
  name: string;
  emirate: string | null;
  location: string | null;
  handover_date: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  description: string | null;
};

function richness(r: Row & { cover?: string | null }): number {
  let s = 0;
  if (r.cover) s += 3;
  if (r.description && r.description.length > 120) s += 2;
  if (r.handover_date && r.handover_date !== "TBD") s += 1;
  if (r.bedrooms_min != null || r.bedrooms_max != null) s += 1;
  if (r.location) s += 1;
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "scan") {
      const developer_id = body.developer_id;
      if (!developer_id) return json({ error: "developer_id required" }, 400);

      const { data: projects, error } = await supa
        .from("projects")
        .select("id, developer_id, name, emirate, location, handover_date, bedrooms_min, bedrooms_max, description")
        .eq("developer_id", developer_id);
      if (error) throw error;

      const list = (projects ?? []) as Row[];
      // pull cover image existence in bulk
      const ids = list.map((p) => p.id);
      const covers = new Map<string, string>();
      if (ids.length) {
        const { data: imgs } = await supa
          .from("project_images")
          .select("project_id, image_url")
          .in("project_id", ids);
        for (const img of imgs ?? []) {
          if (!covers.has(img.project_id)) covers.set(img.project_id, img.image_url);
        }
      }

      // cluster by fuzzy match within same emirate
      const clusters: Row[][] = [];
      const seen = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        if (seen.has(list[i].id)) continue;
        const cluster: Row[] = [list[i]];
        seen.add(list[i].id);
        const ta = tokens(list[i].name);
        for (let j = i + 1; j < list.length; j++) {
          if (seen.has(list[j].id)) continue;
          if ((list[i].emirate || "") !== (list[j].emirate || "")) continue;
          const tb = tokens(list[j].name);
          const sim = jaccard(ta, tb);
          const containment =
            ta.size && tb.size && ([...ta].every((t) => tb.has(t)) || [...tb].every((t) => ta.has(t)));
          if (sim >= 0.6 || containment) {
            cluster.push(list[j]);
            seen.add(list[j].id);
          }
        }
        if (cluster.length > 1) clusters.push(cluster);
      }

      const result = clusters.map((c) => {
        const enriched = c.map((r) => ({ ...r, cover: covers.get(r.id) ?? null }));
        enriched.sort((a, b) => richness(b) - richness(a));
        return {
          keep: enriched[0],
          duplicates: enriched.slice(1),
        };
      });

      return json({ clusters: result });
    }

    if (action === "merge") {
      const { keep_id, duplicate_ids } = body;
      if (!keep_id || !Array.isArray(duplicate_ids) || duplicate_ids.length === 0) {
        return json({ error: "keep_id and duplicate_ids required" }, 400);
      }

      const { data: keep, error: keepErr } = await supa.from("projects").select("*").eq("id", keep_id).single();
      if (keepErr || !keep) return json({ error: "keep not found" }, 404);

      const { data: dupes, error: dupeErr } = await supa
        .from("projects")
        .select("*")
        .in("id", duplicate_ids);
      if (dupeErr) throw dupeErr;

      const merged: Record<string, unknown> = { ...keep };
      for (const d of dupes ?? []) {
        for (const [k, v] of Object.entries(d)) {
          if (k === "id" || k === "created_at" || k === "updated_at" || k === "slug") continue;
          if (merged[k] == null || merged[k] === "" || merged[k] === "TBD") {
            if (v != null && v !== "" && v !== "TBD") merged[k] = v;
          }
        }
      }

      // update keep row with enriched fields
      const { id: _, created_at: __, updated_at: ___, ...updates } = merged as any;
      await supa.from("projects").update(updates).eq("id", keep_id);

      let repointed = 0;
      const childTables = ["project_images", "project_videos", "project_documents", "resale_listings"];
      for (const tbl of childTables) {
        const { count } = await supa
          .from(tbl)
          .update({ project_id: keep_id })
          .in("project_id", duplicate_ids)
          .select("*", { count: "exact", head: true });
        if (count) repointed += count;
      }

      // audit log + delete
      for (const d of dupes ?? []) {
        await supa.from("developer_merge_log").insert({
          canonical_name: (keep as Row).name,
          keep_id,
          duplicate_id: d.id,
          duplicate_slug: (d as Row & { slug?: string }).slug ?? null,
          duplicate_snapshot: d,
          projects_repointed: repointed,
        });
      }
      await supa.from("projects").delete().in("id", duplicate_ids);

      return json({ ok: true, merged_into: keep_id, deleted: duplicate_ids.length, child_rows_repointed: repointed });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("dedup-projects error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
