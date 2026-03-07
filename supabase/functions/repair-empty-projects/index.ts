import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/reelly-types.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Repair Empty Projects
 * 
 * Deletes projects that were bulk-approved without any data
 * (no cover image, no description, no price - completely empty shells).
 * Also cleans up corresponding pending_project_imports.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "repair", limit = 200, dryRun = false } = body;

    // STATS mode
    if (action === "stats") {
      const { count: totalEmpty } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("cover_image_url", null)
        .is("description", null);

      const { count: totalProjects } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true });

      return json(200, {
        success: true,
        total_projects: totalProjects || 0,
        empty_shell_projects: totalEmpty || 0,
      });
    }

    // REPAIR mode: fetch empty projects in batch
    const { data: emptyProjects, error: fetchErr } = await supabase
      .from("projects")
      .select("id, name, slug")
      .is("cover_image_url", null)
      .is("description", null)
      .is("price_from", null)
      .order("name", { ascending: true })
      .limit(limit);

    if (fetchErr) return json(500, { error: fetchErr.message });
    if (!emptyProjects || emptyProjects.length === 0) {
      return json(200, { success: true, message: "No empty projects found", deleted: 0 });
    }

    console.log(`[repair-empty] Deleting ${emptyProjects.length} empty shell projects (dryRun=${dryRun})`);

    const projectIds = emptyProjects.map(p => p.id);
    let deleted = 0;

    if (!dryRun) {
      // Batch delete related records first
      const batchSize = 50;
      for (let i = 0; i < projectIds.length; i += batchSize) {
        const batch = projectIds.slice(i, i + batchSize);
        
        await Promise.all([
          supabase.from("project_images").delete().in("project_id", batch),
          supabase.from("project_documents").delete().in("project_id", batch),
          // Nullify FK references from pending_project_imports
          supabase.from("pending_project_imports").update({ matched_project_id: null }).in("matched_project_id", batch),
        ]);

        const { error: delErr } = await supabase
          .from("projects")
          .delete()
          .in("id", batch);

        if (delErr) {
          console.error(`[repair-empty] Batch delete error:`, delErr);
        } else {
          deleted += batch.length;
          console.log(`[repair-empty] Deleted batch of ${batch.length} (total: ${deleted})`);
        }
      }
    } else {
      deleted = emptyProjects.length;
    }

    const names = emptyProjects.slice(0, 20).map(p => p.name);
    console.log(`[repair-empty] Done. Deleted ${deleted} empty projects.`);

    return json(200, {
      success: true,
      dryRun,
      deleted,
      total_found: emptyProjects.length,
      sample_names: names,
    });

  } catch (err) {
    console.error("[repair-empty] Fatal:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
