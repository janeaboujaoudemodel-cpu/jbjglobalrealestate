import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STOCK_IMAGE_URL = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c";

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

    if (mode === "check") {
      const { data: developers } = await supabase
        .from("developers")
        .select("id, name, slug, feature_image_url")
        .order("name");

      const imageCounts: Record<string, string[]> = {};
      for (const dev of developers || []) {
        if (dev.feature_image_url) {
          if (!imageCounts[dev.feature_image_url]) imageCounts[dev.feature_image_url] = [];
          imageCounts[dev.feature_image_url].push(dev.name);
        }
      }

      const duplicates = Object.entries(imageCounts)
        .filter(([_, names]) => names.length > 1)
        .map(([url, names]) => ({ url: url.substring(0, 80), count: names.length, developers: names.slice(0, 5) }));

      const stockImageCount = (developers || []).filter(d => d.feature_image_url?.includes(STOCK_IMAGE_URL)).length;
      const nullCount = (developers || []).filter(d => !d.feature_image_url).length;

      return new Response(
        JSON.stringify({ success: true, mode: "check", total_developers: developers?.length || 0, with_stock_image: stockImageCount, with_null_image: nullCount, duplicate_image_groups: duplicates.length, duplicates: duplicates.slice(0, 20) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[FixDevPhotos] Starting ${mode} mode batch_size=${batch_size} offset=${offset}`);

    const { data: allDevelopers } = await supabase
      .from("developers")
      .select("id, name, slug, feature_image_url")
      .or(`feature_image_url.ilike.%unsplash%,feature_image_url.is.null`)
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (!allDevelopers || allDevelopers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No developers need fixing", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[FixDevPhotos] Found ${allDevelopers.length} developers to process`);

    // Source 1: project cover images
    const { data: dbProjects } = await supabase
      .from("projects")
      .select("id, name, developer_name, developer_id, cover_image_url")
      .not("cover_image_url", "is", null)
      .not("cover_image_url", "ilike", "%unsplash%")
      .order("created_at", { ascending: false });

    const developerProjectImages: Record<string, string[]> = {};
    for (const project of dbProjects || []) {
      if (!project.cover_image_url) continue;
      const devName = project.developer_name?.toLowerCase().trim();
      if (devName) {
        if (!developerProjectImages[devName]) developerProjectImages[devName] = [];
        if (!developerProjectImages[devName].includes(project.cover_image_url)) {
          developerProjectImages[devName].push(project.cover_image_url);
        }
      }
    }

    // Source 2: project_images gallery (first image per project)
    const devIds = allDevelopers.map(d => d.id);
    const { data: galleryImages } = await supabase
      .from("projects")
      .select("developer_name, id")
      .in("developer_id", devIds);

    if (galleryImages && galleryImages.length > 0) {
      const projectIds = galleryImages.map(p => p.id);
      // Fetch first gallery image per project
      const { data: piImages } = await supabase
        .from("project_images")
        .select("project_id, image_url")
        .in("project_id", projectIds)
        .eq("display_order", 0)
        .not("image_url", "is", null)
        .not("image_url", "ilike", "%unsplash%");

      if (piImages) {
        // Map project_id -> developer_name
        const projDevMap: Record<string, string> = {};
        for (const gp of galleryImages) {
          if (gp.developer_name) projDevMap[gp.id] = gp.developer_name.toLowerCase().trim();
        }
        for (const pi of piImages) {
          const devName = projDevMap[pi.project_id];
          if (devName && pi.image_url) {
            if (!developerProjectImages[devName]) developerProjectImages[devName] = [];
            if (!developerProjectImages[devName].includes(pi.image_url)) {
              developerProjectImages[devName].push(pi.image_url);
            }
          }
        }
      }
    }

    // Source 3: Reelly API
    if (mode === "fix-reelly" && reellyApiKey) {
      console.log("[FixDevPhotos] Fetching from Reelly API...");
      try {
        const reellyResponse = await fetch(
          `https://api-reelly.up.railway.app/api/v2/clients/projects?limit=500&offset=0`,
          { headers: { "X-API-Key": reellyApiKey, "Authorization": `Bearer ${reellyApiKey}`, "Content-Type": "application/json" } }
        );
        if (reellyResponse.ok) {
          const reellyData = await reellyResponse.json();
          const reellyProjects = Array.isArray(reellyData) ? reellyData : reellyData.results || [];
          console.log(`[FixDevPhotos] Got ${reellyProjects.length} projects from Reelly`);
          for (const project of reellyProjects) {
            if (!project.cover_image?.url || !project.developer?.name) continue;
            const devName = project.developer.name.toLowerCase().trim();
            if (!developerProjectImages[devName]) developerProjectImages[devName] = [];
            if (!developerProjectImages[devName].includes(project.cover_image.url)) {
              developerProjectImages[devName].push(project.cover_image.url);
            }
          }
        }
      } catch (err) {
        console.error("[FixDevPhotos] Reelly API error:", err);
      }
    }

    console.log(`[FixDevPhotos] Image map covers ${Object.keys(developerProjectImages).length} developer names`);

    const usedImages = new Set<string>();
    const { data: existingImages } = await supabase
      .from("developers")
      .select("feature_image_url")
      .not("feature_image_url", "is", null)
      .not("feature_image_url", "ilike", "%unsplash%");
    for (const img of existingImages || []) {
      if (img.feature_image_url) usedImages.add(img.feature_image_url);
    }

    let updated = 0;
    let noProjectImage = 0;
    const results: { name: string; status: string; image?: string }[] = [];

    for (const developer of allDevelopers) {
      const devNameLower = developer.name.toLowerCase().trim();
      let projectImages = developerProjectImages[devNameLower] || [];

      // Partial matching
      if (projectImages.length === 0) {
        for (const [key, images] of Object.entries(developerProjectImages)) {
          if ((key.includes(devNameLower) || devNameLower.includes(key)) && Math.min(key.length, devNameLower.length) >= 4) {
            projectImages = [...projectImages, ...images];
          }
        }
        projectImages = [...new Set(projectImages)];
      }

      let selectedImage: string | null = null;
      for (const img of projectImages) {
        if (!usedImages.has(img) && !img.includes("unsplash")) {
          selectedImage = img;
          usedImages.add(img);
          break;
        }
      }

      // Fallback: pending_developer_imports
      if (!selectedImage) {
        const { data: providentData } = await supabase
          .from("pending_developer_imports")
          .select("feature_image_url")
          .eq("slug", developer.slug)
          .eq("source", "provident_estate")
          .maybeSingle();
        if (providentData?.feature_image_url && !usedImages.has(providentData.feature_image_url)) {
          selectedImage = providentData.feature_image_url;
          usedImages.add(selectedImage);
        }
      }

      if (selectedImage) {
        const { error } = await supabase.from("developers").update({ feature_image_url: selectedImage }).eq("id", developer.id);
        if (!error) {
          updated++;
          results.push({ name: developer.name, status: "updated", image: selectedImage.substring(0, 80) });
        } else {
          results.push({ name: developer.name, status: "error", image: error.message });
        }
      } else {
        noProjectImage++;
        results.push({ name: developer.name, status: "no_unique_image" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, mode, processed: allDevelopers.length, updated, no_unique_image: noProjectImage, next_offset: offset + batch_size, results: results.slice(0, 100) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[FixDevPhotos] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
