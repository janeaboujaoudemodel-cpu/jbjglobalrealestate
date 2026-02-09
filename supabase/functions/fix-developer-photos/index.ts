import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stock image URL that we want to replace
const STOCK_IMAGE_URL = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c";

interface ReellyProject {
  id: number;
  name: string;
  cover_image?: { url: string } | null;
  developer?: { id: number; name: string } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = "check", batch_size = 100, offset = 0 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const reellyApiKey = Deno.env.get("REELLY_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Mode: "check" - report duplicates
    if (mode === "check") {
      const { data: developers } = await supabase
        .from("developers")
        .select("id, name, slug, feature_image_url")
        .order("name");

      const imageCounts: Record<string, string[]> = {};
      for (const dev of developers || []) {
        if (dev.feature_image_url) {
          if (!imageCounts[dev.feature_image_url]) {
            imageCounts[dev.feature_image_url] = [];
          }
          imageCounts[dev.feature_image_url].push(dev.name);
        }
      }

      const duplicates = Object.entries(imageCounts)
        .filter(([_, names]) => names.length > 1)
        .map(([url, names]) => ({ url: url.substring(0, 80), count: names.length, developers: names.slice(0, 5) }));

      const stockImageCount = (developers || []).filter(d => 
        d.feature_image_url?.includes(STOCK_IMAGE_URL)
      ).length;

      return new Response(
        JSON.stringify({
          success: true,
          mode: "check",
          total_developers: developers?.length || 0,
          with_stock_image: stockImageCount,
          duplicate_image_groups: duplicates.length,
          duplicates: duplicates.slice(0, 20)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode: "fix" or "fix-reelly"
    console.log(`[FixDevPhotos] Starting ${mode} mode with batch_size=${batch_size}, offset=${offset}`);

    // Get developers that need fixing (stock image or duplicates)
    const { data: allDevelopers } = await supabase
      .from("developers")
      .select("id, name, slug, feature_image_url")
      .or(`feature_image_url.ilike.%unsplash%,feature_image_url.is.null`)
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (!allDevelopers || allDevelopers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No developers need fixing in this batch", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[FixDevPhotos] Found ${allDevelopers.length} developers to process`);

    // Get projects from database first
    const { data: dbProjects } = await supabase
      .from("projects")
      .select("id, name, developer_name, developer_id, cover_image_url")
      .not("cover_image_url", "is", null)
      .not("cover_image_url", "ilike", "%placeholder%")
      .not("cover_image_url", "ilike", "%unsplash%")
      .order("created_at", { ascending: false });

    // Build developer -> images map from database
    const developerProjectImages: Record<string, string[]> = {};
    for (const project of dbProjects || []) {
      if (!project.cover_image_url) continue;
      const devName = project.developer_name?.toLowerCase().trim();
      if (devName) {
        if (!developerProjectImages[devName]) {
          developerProjectImages[devName] = [];
        }
        if (!developerProjectImages[devName].includes(project.cover_image_url)) {
          developerProjectImages[devName].push(project.cover_image_url);
        }
      }
    }

    // If Reelly API key available and mode is fix-reelly, also fetch from Reelly
    if (mode === "fix-reelly" && reellyApiKey) {
      console.log("[FixDevPhotos] Fetching from Reelly API...");
      
      try {
        // Fetch projects from Reelly API
        const reellyResponse = await fetch(
          `https://api-reelly.up.railway.app/api/v2/clients/projects?limit=500&offset=0`,
          {
            headers: {
              "X-API-Key": reellyApiKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (reellyResponse.ok) {
          const reellyData = await reellyResponse.json();
          const reellyProjects: ReellyProject[] = Array.isArray(reellyData) ? reellyData : reellyData.results || [];
          
          console.log(`[FixDevPhotos] Got ${reellyProjects.length} projects from Reelly`);

          for (const project of reellyProjects) {
            if (!project.cover_image?.url || !project.developer?.name) continue;
            const devName = project.developer.name.toLowerCase().trim();
            if (!developerProjectImages[devName]) {
              developerProjectImages[devName] = [];
            }
            if (!developerProjectImages[devName].includes(project.cover_image.url)) {
              developerProjectImages[devName].push(project.cover_image.url);
            }
          }
        }
      } catch (err) {
        console.error("[FixDevPhotos] Reelly API error:", err);
      }
    }

    console.log(`[FixDevPhotos] Built image map for ${Object.keys(developerProjectImages).length} developer names`);

    // Track used images to prevent duplicates within this batch
    const usedImages = new Set<string>();
    
    // Get currently used images from DB to avoid global duplicates
    const { data: existingImages } = await supabase
      .from("developers")
      .select("feature_image_url")
      .not("feature_image_url", "is", null)
      .not("feature_image_url", "ilike", "%unsplash%");
    
    for (const img of existingImages || []) {
      if (img.feature_image_url) {
        usedImages.add(img.feature_image_url);
      }
    }

    let updated = 0;
    let skipped = 0;
    let noProjectImage = 0;
    const results: { name: string; status: string; image?: string }[] = [];

    for (const developer of allDevelopers) {
      const devNameLower = developer.name.toLowerCase().trim();
      
      // Try exact match first
      let projectImages = developerProjectImages[devNameLower] || [];
      
      // Try partial matching if no exact match
      if (projectImages.length === 0) {
        for (const [key, images] of Object.entries(developerProjectImages)) {
          // Only match if one contains the other and they share significant overlap
          if ((key.includes(devNameLower) || devNameLower.includes(key)) && 
              Math.min(key.length, devNameLower.length) >= 4) {
            projectImages = [...projectImages, ...images];
          }
        }
        projectImages = [...new Set(projectImages)];
      }

      // Find an unused image
      let selectedImage: string | null = null;
      for (const img of projectImages) {
        if (!usedImages.has(img) && !img.includes("unsplash")) {
          selectedImage = img;
          usedImages.add(img);
          break;
        }
      }

      // If no image found from projects, try Provident data
      if (!selectedImage) {
        const { data: providentData } = await supabase
          .from("pending_developer_imports")
          .select("feature_image_url, logo_url")
          .eq("slug", developer.slug)
          .eq("source", "provident_estate")
          .maybeSingle();
        
        if (providentData?.feature_image_url && !usedImages.has(providentData.feature_image_url)) {
          selectedImage = providentData.feature_image_url;
          usedImages.add(selectedImage);
          console.log(`[FixDevPhotos] Found Provident image for ${developer.name}`);
        }
      }

      if (selectedImage) {
        const { error } = await supabase
          .from("developers")
          .update({ feature_image_url: selectedImage })
          .eq("id", developer.id);

        if (!error) {
          updated++;
          results.push({ name: developer.name, status: "updated", image: selectedImage.substring(0, 60) });
        } else {
          results.push({ name: developer.name, status: "error", image: error.message });
        }
      } else {
        noProjectImage++;
        results.push({ name: developer.name, status: "no_unique_image" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        processed: allDevelopers.length,
        updated,
        skipped,
        no_unique_image: noProjectImage,
        next_offset: offset + batch_size,
        results: results.slice(0, 100)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[FixDevPhotos] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
