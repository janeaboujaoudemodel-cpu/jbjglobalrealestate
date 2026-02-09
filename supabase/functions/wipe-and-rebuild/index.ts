import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * WIPE AND REBUILD - Full restart or Reelly-only cleanup
 * 
 * Modes:
 * - "full" (default): Delete all projects, images, docs, and queue
 * - "reelly_only": Only delete non-Reelly data (areas without reelly_id, queue items not from Reelly)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { confirm = false, mode = "full", preserveManual = true } = await req.json().catch(() => ({}));

    if (!confirm) {
      return new Response(JSON.stringify({ 
        error: "Confirmation required. Pass confirm: true to proceed.",
        warning: mode === "reelly_only" 
          ? "This will DELETE non-Reelly areas and queue items!" 
          : "This will DELETE all projects and queue items!" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== REELLY-ONLY MODE ==========
    if (mode === "reelly_only") {
      console.log("[Wipe] Starting Reelly-only cleanup...");

      // 1. Delete areas WITHOUT reelly_id (manually created)
      const { error: areasErr, count: areasDeleted } = await supabase
        .from("areas")
        .delete({ count: "exact" })
        .is("reelly_id", null);

      if (areasErr) console.error("[Wipe] Error deleting non-Reelly areas:", areasErr);
      else console.log(`[Wipe] Deleted ${areasDeleted} non-Reelly areas`);

      // 2. Delete queue items NOT from Reelly (Provident-sourced)
      // Reelly items have source_url containing "reelly_"
      const { error: queueErr, count: queueDeleted } = await supabase
        .from("pending_project_imports")
        .delete({ count: "exact" })
        .not("source_url", "ilike", "%reelly_%");

      if (queueErr) console.error("[Wipe] Error deleting non-Reelly queue:", queueErr);
      else console.log(`[Wipe] Deleted ${queueDeleted} non-Reelly queue items`);

      // 3. Get remaining counts
      const { count: remainingAreas } = await supabase
        .from("areas")
        .select("id", { count: "exact", head: true });

      const { count: remainingQueue } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true });

      return new Response(JSON.stringify({
        success: true,
        mode: "reelly_only",
        deleted: {
          non_reelly_areas: areasDeleted ?? 0,
          non_reelly_queue_items: queueDeleted ?? 0,
        },
        remaining: {
          areas: remainingAreas ?? 0,
          queue_items: remainingQueue ?? 0,
        },
        message: "Non-Reelly data cleaned. Ready for fresh Reelly sync.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== FULL WIPE MODE ==========
    console.log("[Wipe] Starting full wipe...");

    // 1. Get count of what we're deleting
    const { count: projectCount } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });

    const { count: queueCount } = await supabase
      .from("pending_project_imports")
      .select("id", { count: "exact", head: true });

    console.log(`[Wipe] Found ${projectCount} projects, ${queueCount} queue items`);

    // 2. Delete project_documents (foreign key to projects)
    const { error: docErr, count: docCount } = await supabase
      .from("project_documents")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (docErr) console.error("[Wipe] Error deleting documents:", docErr);
    else console.log(`[Wipe] Deleted ${docCount} project documents`);

    // 3. Delete project_images (foreign key to projects)
    const { error: imgErr, count: imgCount } = await supabase
      .from("project_images")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (imgErr) console.error("[Wipe] Error deleting images:", imgErr);
    else console.log(`[Wipe] Deleted ${imgCount} project images`);

    // 4. Delete projects
    let projectsDeleted = 0;
    if (preserveManual) {
      // Only delete projects that have a source_url (scraped from Provident)
      const { error: projErr, count } = await supabase
        .from("projects")
        .delete({ count: "exact" })
        .not("source_url", "is", null);

      if (projErr) console.error("[Wipe] Error deleting projects:", projErr);
      projectsDeleted = count ?? 0;
    } else {
      const { error: projErr, count } = await supabase
        .from("projects")
        .delete({ count: "exact" })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (projErr) console.error("[Wipe] Error deleting projects:", projErr);
      projectsDeleted = count ?? 0;
    }
    console.log(`[Wipe] Deleted ${projectsDeleted} projects`);

    // 5. Clear the queue
    const { error: queueErr, count: queueDeleted } = await supabase
      .from("pending_project_imports")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (queueErr) console.error("[Wipe] Error clearing queue:", queueErr);
    else console.log(`[Wipe] Cleared ${queueDeleted} queue items`);

    return new Response(JSON.stringify({
      success: true,
      mode: "full",
      deleted: {
        projects: projectsDeleted,
        project_images: imgCount ?? 0,
        project_documents: docCount ?? 0,
        queue_items: queueDeleted ?? 0,
      },
      message: "Database wiped. Call discover-all-projects to rebuild the queue.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Wipe] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});