import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Repair Project Images
 * Finds projects without images and retrieves images from their corresponding 
 * approved pending_project_imports records.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { limit = 100, dryRun = false } = await req.json().catch(() => ({}));

    console.log(`[RepairImages] Starting repair (limit=${limit}, dryRun=${dryRun})...`);

    // Find projects without images
    const { data: projectsWithoutImages, error: fetchError } = await supabase
      .from("projects")
      .select("id, name, slug")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fetchError) {
      return new Response(JSON.stringify({ error: "Failed to fetch projects", details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = {
      checked: 0,
      repaired: 0,
      alreadyHasImages: 0,
      noSourceFound: 0,
      errors: 0,
    };

    for (const project of projectsWithoutImages || []) {
      stats.checked++;

      // Check if project already has images
      const { count } = await supabase
        .from("project_images")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      if (count && count > 0) {
        stats.alreadyHasImages++;
        continue;
      }

      // Find corresponding approved OR merged import (supports both statuses)
      const { data: importRecord } = await supabase
        .from("pending_project_imports")
        .select("id, images")
        .eq("slug", project.slug)
        .in("status", ["approved", "merged"])
        .maybeSingle();

      if (!importRecord || !importRecord.images) {
        console.log(`[RepairImages] No source found for: ${project.name}`);
        stats.noSourceFound++;
        continue;
      }

      const images = Array.isArray(importRecord.images) 
        ? importRecord.images 
        : (typeof importRecord.images === 'string' ? JSON.parse(importRecord.images) : []);

      if (images.length === 0) {
        stats.noSourceFound++;
        continue;
      }

      if (dryRun) {
        console.log(`[DryRun] Would repair: ${project.name} with ${images.length} images`);
        stats.repaired++;
        continue;
      }

      // Insert images
      const imageInserts = images.map((img: { url: string; alt_text?: string; display_order?: number }, idx: number) => ({
        project_id: project.id,
        image_url: img.url,
        alt_text: img.alt_text || `${project.name} - Image ${idx + 1}`,
        display_order: img.display_order ?? idx,
      }));

      const { error: imgError } = await supabase
        .from("project_images")
        .insert(imageInserts);

      if (imgError) {
        console.error(`[RepairImages] Failed to insert images for ${project.name}:`, imgError);
        stats.errors++;
      } else {
        console.log(`[RepairImages] ✓ Repaired: ${project.name} (${images.length} images)`);
        stats.repaired++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Repair images error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
