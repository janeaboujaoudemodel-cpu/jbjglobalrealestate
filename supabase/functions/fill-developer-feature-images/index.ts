import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 50, fallback_image = null } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Default fallback - Dubai skyline
    const defaultFallback = fallback_image || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80";

    // 1. Get developers without feature images
    const { data: developers, error: fetchError } = await supabase
      .from("developers")
      .select("id, name, slug, feature_image_url")
      .is("feature_image_url", null)
      .limit(batch_size);

    if (fetchError) {
      throw new Error(`Failed to fetch developers: ${fetchError.message}`);
    }

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "All developers have feature images",
          updated: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${developers.length} developers without feature images`);

    let updatedWithProject = 0;
    let updatedWithFallback = 0;
    const results: { id: string; name: string; source: string }[] = [];

    for (const developer of developers) {
      // Try to find a project cover image by developer name
      const { data: projectWithImage, error: projectError } = await supabase
        .from("projects")
        .select("cover_image_url, name")
        .or(`developer_name.ilike.%${developer.name}%,developer_id.eq.${developer.id}`)
        .not("cover_image_url", "is", null)
        .not("cover_image_url", "ilike", "%placeholder%")
        .not("cover_image_url", "ilike", "%Base64%")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let imageUrl: string;
      let source: string;

      if (projectWithImage?.cover_image_url) {
        imageUrl = projectWithImage.cover_image_url;
        source = `project:${projectWithImage.name}`;
        updatedWithProject++;
      } else {
        imageUrl = defaultFallback;
        source = "fallback";
        updatedWithFallback++;
      }

      // Update the developer
      const { error: updateError } = await supabase
        .from("developers")
        .update({ feature_image_url: imageUrl })
        .eq("id", developer.id);

      if (updateError) {
        console.error(`Failed to update ${developer.name}:`, updateError);
        continue;
      }

      results.push({ id: developer.id, name: developer.name, source });
      console.log(`Updated ${developer.name} with ${source}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedWithProject + updatedWithFallback} developers`,
        updatedWithProject,
        updatedWithFallback,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fill-developer-feature-images:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
