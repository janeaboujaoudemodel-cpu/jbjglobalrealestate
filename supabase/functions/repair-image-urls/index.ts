import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Bulk repair broken image URLs in the database.
 * 
 * Problem: Images were being upscaled to /x/1200x800/ which returns 403 on Provident's CDN.
 * Solution: Replace with /x/464x312/ which is known to work.
 * 
 * This function scans:
 * - pending_project_imports.images (JSON array)
 * - project_images.image_url
 */

// Pattern to match ANY upscaled sizes that may 403 on Provident's CDN
const BROKEN_SIZE_PATTERN = /\/x\/(\d{3,4})x(\d{3,4})\//g;
const SAFE_SIZE = "/x/464x312/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { dryRun = false, limit = 500 } = body;

    const stats = {
      pending_scanned: 0,
      pending_repaired: 0,
      project_images_scanned: 0,
      project_images_repaired: 0,
      errors: 0,
    };

    // Phase 1: Repair pending_project_imports.images
    console.log("[ImageRepair] Phase 1: Scanning pending_project_imports...");
    
    let offset = 0;
    const BATCH_SIZE = 100;
    
    while (offset < limit) {
      const { data: pendingRows, error: pendingErr } = await supabase
        .from("pending_project_imports")
        .select("id, images")
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (pendingErr) {
        console.error("[ImageRepair] Error fetching pending:", pendingErr);
        break;
      }
      
      if (!pendingRows || pendingRows.length === 0) break;
      
      for (const row of pendingRows) {
        stats.pending_scanned++;
        
        if (!row.images || !Array.isArray(row.images)) continue;
        
        const imagesJson = JSON.stringify(row.images);
        if (!BROKEN_SIZE_PATTERN.test(imagesJson)) continue;
        
        // Repair needed
        const repairedJson = imagesJson.replace(BROKEN_SIZE_PATTERN, SAFE_SIZE);
        const repairedImages = JSON.parse(repairedJson);
        
        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from("pending_project_imports")
            .update({ images: repairedImages })
            .eq("id", row.id);
          
          if (updateErr) {
            console.error(`[ImageRepair] Failed to update pending ${row.id}:`, updateErr);
            stats.errors++;
          } else {
            stats.pending_repaired++;
          }
        } else {
          stats.pending_repaired++;
        }
      }
      
      offset += BATCH_SIZE;
      if (pendingRows.length < BATCH_SIZE) break;
    }

    // Phase 2: Repair project_images.image_url
    console.log("[ImageRepair] Phase 2: Scanning project_images...");
    
    offset = 0;
    while (offset < limit) {
      const { data: imageRows, error: imageErr } = await supabase
        .from("project_images")
        .select("id, image_url")
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (imageErr) {
        console.error("[ImageRepair] Error fetching project_images:", imageErr);
        break;
      }
      
      if (!imageRows || imageRows.length === 0) break;
      
      for (const row of imageRows) {
        stats.project_images_scanned++;
        
        if (!row.image_url || !BROKEN_SIZE_PATTERN.test(row.image_url)) continue;
        
        const repairedUrl = row.image_url.replace(BROKEN_SIZE_PATTERN, SAFE_SIZE);
        
        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from("project_images")
            .update({ image_url: repairedUrl })
            .eq("id", row.id);
          
          if (updateErr) {
            console.error(`[ImageRepair] Failed to update project_images ${row.id}:`, updateErr);
            stats.errors++;
          } else {
            stats.project_images_repaired++;
          }
        } else {
          stats.project_images_repaired++;
        }
      }
      
      offset += BATCH_SIZE;
      if (imageRows.length < BATCH_SIZE) break;
    }

    console.log("[ImageRepair] Complete:", stats);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ImageRepair] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
