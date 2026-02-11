import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enrich area images by finding the best project image from projects in that area.
 * This is fast because it uses only database queries — no external API calls.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 50;

    // Get areas missing images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug")
      .is("image_url", null)
      .is("hero_image_url", null)
      .eq("is_active", true)
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All areas have images", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: remaining } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .is("image_url", null)
      .is("hero_image_url", null)
      .eq("is_active", true);

    const results: { area: string; image_url: string | null; status: string }[] = [];

    for (const area of areas) {
      // Find project images for this area
      const { data: projects } = await supabase
        .from("projects")
        .select("id, main_image_url")
        .eq("area_name", area.name)
        .not("main_image_url", "is", null)
        .limit(1);

      let imageUrl: string | null = null;

      if (projects && projects.length > 0 && projects[0].main_image_url) {
        imageUrl = projects[0].main_image_url;
      } else {
        // Try project_images table
        const { data: projectsInArea } = await supabase
          .from("projects")
          .select("id")
          .eq("area_name", area.name)
          .limit(5);

        if (projectsInArea && projectsInArea.length > 0) {
          const projectIds = projectsInArea.map(p => p.id);
          const { data: images } = await supabase
            .from("project_images")
            .select("image_url, display_order")
            .in("project_id", projectIds)
            .order("display_order", { ascending: true })
            .limit(1);

          if (images && images.length > 0) {
            imageUrl = images[0].image_url;
          }
        }
      }

      if (imageUrl) {
        const { error: updateErr } = await supabase
          .from("areas")
          .update({
            image_url: imageUrl,
            hero_image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", area.id);

        results.push({
          area: area.name,
          image_url: imageUrl,
          status: updateErr ? `error: ${updateErr.message}` : "updated",
        });
      } else {
        results.push({ area: area.name, image_url: null, status: "no_projects_with_images" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        no_image: results.filter(r => r.status === "no_projects_with_images").length,
        remaining: (remaining || 0) - results.filter(r => r.status === "updated").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
