 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "npm:@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 /**
  * RESTORE TO REELLY-ONLY
  * 
  * Modes:
  * - "single": Restore a single project by ID
  * - "global": Restore all projects that have Provident enrichments
  * - "pending_only": Just clear pending Provident suggestions
  * - "stats": Get stats about Provident enrichments without modifying data
  */
 
 interface RestoreRequest {
   mode: "single" | "global" | "pending_only" | "stats";
   projectId?: string;
   confirm?: boolean;
 }
 
 interface EnrichmentData {
   fields_added?: string[];
   images_added?: string[];
   documents_added?: string[];
   enriched_at?: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
   const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
   const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
   try {
     const body: RestoreRequest = await req.json().catch(() => ({ mode: "stats" }));
     const { mode = "stats", projectId, confirm = false } = body;
 
     console.log(`[RestoreReelly] Mode: ${mode}, ProjectId: ${projectId || "N/A"}`);
 
     // ========== STATS MODE ==========
     if (mode === "stats") {
       // Count projects with Provident enrichments
       const { count: enrichedProjects } = await supabase
         .from("projects")
         .select("id", { count: "exact", head: true })
         .not("provident_enrichments", "is", null);
 
       // Count images from Provident
       const { count: providentImages } = await supabase
         .from("project_images")
         .select("id", { count: "exact", head: true })
         .eq("data_source", "provident_enrichment");
 
       // Count documents from Provident
       const { count: providentDocs } = await supabase
         .from("project_documents")
         .select("id", { count: "exact", head: true })
         .eq("data_source", "provident_enrichment");
 
       // Count pending imports from Provident
       const { count: pendingProvident } = await supabase
         .from("pending_project_imports")
         .select("id", { count: "exact", head: true })
         .eq("status", "pending")
         .ilike("source_url", "%providentestate.com%");
 
       // Count projects from Reelly
       const { count: reellyProjects } = await supabase
         .from("projects")
         .select("id", { count: "exact", head: true })
         .ilike("source_url", "%reelly%");
 
       return new Response(JSON.stringify({
         success: true,
         stats: {
           projects_from_reelly: reellyProjects ?? 0,
           projects_with_provident_enrichments: enrichedProjects ?? 0,
           provident_images: providentImages ?? 0,
           provident_documents: providentDocs ?? 0,
           pending_provident_suggestions: pendingProvident ?? 0,
         },
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ========== PENDING ONLY MODE ==========
     if (mode === "pending_only") {
       if (!confirm) {
         // Get count first
         const { count } = await supabase
           .from("pending_project_imports")
           .select("id", { count: "exact", head: true })
           .eq("status", "pending")
           .ilike("source_url", "%providentestate.com%");
 
         return new Response(JSON.stringify({
           success: true,
           preview: true,
           pending_to_delete: count ?? 0,
           message: `Found ${count ?? 0} pending Provident suggestions. Pass confirm: true to delete.`,
         }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Delete pending Provident imports
       const { error, count } = await supabase
         .from("pending_project_imports")
         .delete({ count: "exact" })
         .eq("status", "pending")
         .ilike("source_url", "%providentestate.com%");
 
       if (error) throw error;
 
       console.log(`[RestoreReelly] Deleted ${count} pending Provident suggestions`);
 
       return new Response(JSON.stringify({
         success: true,
         deleted_pending: count ?? 0,
         message: `Deleted ${count ?? 0} pending Provident suggestions`,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ========== SINGLE PROJECT MODE ==========
     if (mode === "single" && projectId) {
       // Get project's provident_enrichments
       const { data: project, error: fetchErr } = await supabase
         .from("projects")
         .select("id, name, provident_enrichments")
         .eq("id", projectId)
         .single();
 
       if (fetchErr || !project) {
         return new Response(JSON.stringify({
           success: false,
           error: "Project not found",
         }), {
           status: 404,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       const enrichments = project.provident_enrichments as EnrichmentData | null;
 
       if (!enrichments) {
         return new Response(JSON.stringify({
           success: true,
           message: "Project has no Provident enrichments to restore",
           restored: false,
         }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Build update to null out enriched fields
       const updates: Record<string, null> = { provident_enrichments: null };
       for (const field of enrichments.fields_added || []) {
         updates[field] = null;
       }
 
       // Update the project
       const { error: updateErr } = await supabase
         .from("projects")
         .update(updates)
         .eq("id", projectId);
 
       if (updateErr) throw updateErr;
 
       let imagesDeleted = 0;
       let docsDeleted = 0;
 
       // Remove added images (by data_source)
       const { count: imgCount } = await supabase
         .from("project_images")
         .delete({ count: "exact" })
         .eq("project_id", projectId)
         .eq("data_source", "provident_enrichment");
       imagesDeleted = imgCount ?? 0;
 
       // Remove added documents (by data_source)
       const { count: docCount } = await supabase
         .from("project_documents")
         .delete({ count: "exact" })
         .eq("project_id", projectId)
         .eq("data_source", "provident_enrichment");
       docsDeleted = docCount ?? 0;
 
       console.log(`[RestoreReelly] Restored project ${project.name}: ${enrichments.fields_added?.length || 0} fields, ${imagesDeleted} images, ${docsDeleted} docs`);
 
       return new Response(JSON.stringify({
         success: true,
         restored: true,
         project_id: projectId,
         project_name: project.name,
         fields_cleared: enrichments.fields_added || [],
         images_deleted: imagesDeleted,
         documents_deleted: docsDeleted,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // ========== GLOBAL MODE ==========
     if (mode === "global") {
       if (!confirm) {
         // Preview what will be affected
         const { count: enrichedCount } = await supabase
           .from("projects")
           .select("id", { count: "exact", head: true })
           .not("provident_enrichments", "is", null);
 
         const { count: imgCount } = await supabase
           .from("project_images")
           .select("id", { count: "exact", head: true })
           .eq("data_source", "provident_enrichment");
 
         const { count: docCount } = await supabase
           .from("project_documents")
           .select("id", { count: "exact", head: true })
           .eq("data_source", "provident_enrichment");
 
         const { count: pendingCount } = await supabase
           .from("pending_project_imports")
           .select("id", { count: "exact", head: true })
           .eq("status", "pending")
           .ilike("source_url", "%providentestate.com%");
 
         return new Response(JSON.stringify({
           success: true,
           preview: true,
           projects_to_restore: enrichedCount ?? 0,
           images_to_delete: imgCount ?? 0,
           documents_to_delete: docCount ?? 0,
           pending_to_delete: pendingCount ?? 0,
           message: "Pass confirm: true to execute global restore",
         }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Execute global restore
       let projectsRestored = 0;
       let imagesDeleted = 0;
       let docsDeleted = 0;
       let pendingDeleted = 0;
 
       // 1. Get all projects with enrichments
       const { data: enrichedProjects } = await supabase
         .from("projects")
         .select("id, provident_enrichments")
         .not("provident_enrichments", "is", null)
         .limit(1000); // Process in batches if needed
 
       // 2. For each project, clear the enriched fields
       for (const project of enrichedProjects || []) {
         const enrichments = project.provident_enrichments as EnrichmentData | null;
         if (!enrichments) continue;
 
         const updates: Record<string, null> = { provident_enrichments: null };
         for (const field of enrichments.fields_added || []) {
           updates[field] = null;
         }
 
         const { error } = await supabase
           .from("projects")
           .update(updates)
           .eq("id", project.id);
 
         if (!error) projectsRestored++;
       }
 
       // 3. Delete all Provident-sourced images
       const { count: imgDel } = await supabase
         .from("project_images")
         .delete({ count: "exact" })
         .eq("data_source", "provident_enrichment");
       imagesDeleted = imgDel ?? 0;
 
       // 4. Delete all Provident-sourced documents
       const { count: docDel } = await supabase
         .from("project_documents")
         .delete({ count: "exact" })
         .eq("data_source", "provident_enrichment");
       docsDeleted = docDel ?? 0;
 
       // 5. Delete pending Provident imports
       const { count: pendDel } = await supabase
         .from("pending_project_imports")
         .delete({ count: "exact" })
         .eq("status", "pending")
         .ilike("source_url", "%providentestate.com%");
       pendingDeleted = pendDel ?? 0;
 
       console.log(`[RestoreReelly] Global restore: ${projectsRestored} projects, ${imagesDeleted} images, ${docsDeleted} docs, ${pendingDeleted} pending`);
 
       return new Response(JSON.stringify({
         success: true,
         restored: {
           projects: projectsRestored,
           images_deleted: imagesDeleted,
           documents_deleted: docsDeleted,
           pending_deleted: pendingDeleted,
         },
         message: `Restored ${projectsRestored} projects to Reelly-only state`,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(JSON.stringify({
       success: false,
       error: "Invalid mode. Use: stats, single, global, or pending_only",
     }), {
       status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
 
   } catch (error) {
     console.error("[RestoreReelly] Error:", error);
     return new Response(JSON.stringify({
       success: false,
       error: error instanceof Error ? error.message : "Unknown error",
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });