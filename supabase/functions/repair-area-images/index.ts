import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find all areas with Unsplash URLs
    const { data: unsplashAreas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, image_url")
      .like("image_url", "%unsplash%");

    if (fetchErr) throw fetchErr;
    if (!unsplashAreas || unsplashAreas.length === 0) {
      return new Response(
        JSON.stringify({ message: "No Unsplash areas found", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { area: string; old_url: string; new_url: string | null; status: string }[] = [];

    for (const area of unsplashAreas) {
      // Find the first project image for this area via projects table
      const { data: projectImg } = await supabase
        .from("projects")
        .select("id, project_images(image_url, display_order)")
        .eq("area_name", area.name)
        .limit(1)
        .maybeSingle();

      let newUrl: string | null = null;

      if (projectImg?.project_images && projectImg.project_images.length > 0) {
        // Sort by display_order, pick first
        const sorted = [...projectImg.project_images].sort(
          (a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999)
        );
        newUrl = sorted[0].image_url;
      }

      // Update the area
      const { error: updateErr } = await supabase
        .from("areas")
        .update({ image_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", area.id);

      results.push({
        area: area.name,
        old_url: area.image_url,
        new_url: newUrl,
        status: updateErr ? `error: ${updateErr.message}` : "updated",
      });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} areas`,
        updated: results.filter((r) => r.status === "updated").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
