import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REELLY_API_BASE = "https://api-reelly.up.railway.app/api/v2/clients/projects";

async function searchReellyDeveloperProjects(
  developerName: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = `${REELLY_API_BASE}?developer=${encodeURIComponent(developerName)}&limit=5`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    const projects = data.results || [];
    
    if (!Array.isArray(projects)) return null;
    
    for (const project of projects) {
      // Look for cover image
      const cover = project.cover_image?.url || project.cover_image_url;
      if (cover && typeof cover === "string" && (cover.includes("reelly-backend.s3") || cover.includes("amazonaws.com"))) {
        return cover;
      }
      
      // Try gallery images
      const images = project.images || project.gallery || [];
      if (Array.isArray(images)) {
        for (const img of images) {
          const imgUrl = typeof img === "string" ? img : img?.url || img?.image_url;
          if (imgUrl && typeof imgUrl === "string" && (imgUrl.includes("reelly-backend.s3") || imgUrl.includes("amazonaws.com"))) {
            return imgUrl;
          }
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error(`Reelly search failed for ${developerName}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun ?? false;
    const batchSize = body.batchSize ?? 30;
    const forceSlugs: string[] = body.forceSlugs ?? [];

    let developers: any[] = [];
    let error: any = null;

    if (forceSlugs.length > 0) {
      // Force-replace mode: update specific developers regardless of current URL
      const result = await supabase
        .from("developers")
        .select("id, name, slug, feature_image_url, logo_url")
        .in("slug", forceSlugs);
      developers = result.data || [];
      error = result.error;
    } else {
      // Find developers with non-S3/non-cloudfront feature images
      const result = await supabase
        .from("developers")
        .select("id, name, slug, feature_image_url, logo_url")
        .not("feature_image_url", "is", null)
        .not("feature_image_url", "ilike", "%reelly-backend.s3%")
        .not("feature_image_url", "ilike", "%d3h330vgpwpjr8.cloudfront%")
        .limit(batchSize);
      developers = result.data || [];
      error = result.error;
    }

    if (error) throw error;

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No developers to fix", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          developersToFix: developers.length,
          names: developers.map(d => d.name),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("REELLY_API_KEY")!;

    // Get a pool of high-quality S3 project cover images as fallback
    const { data: imagePool } = await supabase
      .from("projects")
      .select("cover_image_url")
      .like("cover_image_url", "%reelly-backend.s3%")
      .eq("is_published", true)
      .limit(200);
    
    const s3Images = (imagePool || []).map(p => p.cover_image_url).filter(Boolean);

    let updated = 0;
    let failed = 0;
    const results: Array<{ name: string; status: string; image?: string }> = [];

    for (const dev of developers) {
      // First check if there's a local project with cover image
      const { data: localProject } = await supabase
        .from("projects")
        .select("cover_image_url")
        .or(`developer_id.eq.${dev.id},developer_name.ilike.%${dev.name}%`)
        .not("cover_image_url", "is", null)
        .limit(1)
        .maybeSingle();

      let newImage: string | null = localProject?.cover_image_url || null;

      // If no local project, try Reelly API
      if (!newImage) {
        newImage = await searchReellyDeveloperProjects(dev.name, apiKey);
      }

      // If still no image, use a random S3 project image from the pool
      if (!newImage && s3Images.length > 0) {
        const randomIndex = Math.floor(Math.random() * s3Images.length);
        newImage = s3Images[randomIndex];
      }

      if (newImage) {
        const { error: updateErr } = await supabase
          .from("developers")
          .update({ feature_image_url: newImage, updated_at: new Date().toISOString() })
          .eq("id", dev.id);

        if (updateErr) {
          failed++;
          results.push({ name: dev.name, status: "update_failed" });
        } else {
          updated++;
          results.push({ name: dev.name, status: "fixed", image: newImage });
        }
      } else {
        results.push({ name: dev.name, status: "no_image_found" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: developers.length,
        updated,
        failed,
        noImageFound: developers.length - updated - failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fixing developer feature images:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
