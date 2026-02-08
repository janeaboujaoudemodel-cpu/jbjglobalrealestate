import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Count developers without feature images
    const { count: missingCount } = await supabase
      .from("developers")
      .select("*", { count: "exact", head: true })
      .is("feature_image_url", null);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          developersWithoutFeatureImage: missingCount,
          message: `Found ${missingCount} developers without feature images. Run with dryRun: false to update.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all developers without feature images
    const { data: developers, error: devError } = await supabase
      .from("developers")
      .select("id, name")
      .is("feature_image_url", null);

    if (devError) throw devError;

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All developers already have feature images",
          updated: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;
    let failed = 0;
    const results: Array<{ id: string; name: string; imageUrl: string | null }> = [];

    // Process each developer
    for (const dev of developers) {
      // Find the best project cover image for this developer
      const { data: projects } = await supabase
        .from("projects")
        .select("cover_image_url")
        .eq("developer_id", dev.id)
        .not("cover_image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      const coverUrl = projects?.[0]?.cover_image_url;

      if (coverUrl) {
        const { error: updateError } = await supabase
          .from("developers")
          .update({ 
            feature_image_url: coverUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", dev.id);

        if (updateError) {
          failed++;
          results.push({ id: dev.id, name: dev.name, imageUrl: null });
        } else {
          updated++;
          results.push({ id: dev.id, name: dev.name, imageUrl: coverUrl });
        }
      } else {
        // No project images found for this developer
        results.push({ id: dev.id, name: dev.name, imageUrl: null });
      }
    }

    // Get final count
    const { count: remainingCount } = await supabase
      .from("developers")
      .select("*", { count: "exact", head: true })
      .is("feature_image_url", null);

    return new Response(
      JSON.stringify({
        success: true,
        processed: developers.length,
        updated,
        failed,
        remainingWithoutImage: remainingCount,
        sampleResults: results.slice(0, 10)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error syncing developer feature images:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
