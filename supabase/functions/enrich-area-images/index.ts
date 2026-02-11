import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enrich area images:
 * 1. Try to find a project image from projects in that area
 * 2. If no project image exists, generate one using Gemini AI
 * 3. Upload to Supabase Storage and update the area record
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;
    const useAiFallback = body.use_ai_fallback !== false; // default true

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

    const results: { area: string; image_url: string | null; status: string; source: string }[] = [];

    for (const area of areas) {
      // Step 1: Try project images
      let imageUrl: string | null = null;
      let source = "none";

      const { data: projects } = await supabase
        .from("projects")
        .select("id, main_image_url")
        .eq("area_name", area.name)
        .not("main_image_url", "is", null)
        .limit(1);

      if (projects && projects.length > 0 && projects[0].main_image_url) {
        imageUrl = projects[0].main_image_url;
        source = "project";
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
            source = "project_images";
          }
        }
      }

      // Step 2: AI fallback - generate image with Gemini
      if (!imageUrl && useAiFallback && lovableApiKey) {
        try {
          const prompt = `Professional aerial panoramic photograph of ${area.name}, Dubai, UAE. Modern architecture, community master plan view, luxury real estate photography, golden hour lighting, ultra high resolution, 16:9 aspect ratio.`;
          
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

            if (base64Url) {
              // Extract base64 data
              const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
              const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

              // Upload to storage
              const fileName = `${area.slug}.webp`;
              const { error: uploadErr } = await supabase.storage
                .from("area-images")
                .upload(fileName, binaryData, {
                  contentType: "image/png",
                  upsert: true,
                });

              if (!uploadErr) {
                const { data: publicUrl } = supabase.storage
                  .from("area-images")
                  .getPublicUrl(fileName);
                imageUrl = publicUrl.publicUrl;
                source = "ai_generated";
              } else {
                console.error(`Upload error for ${area.name}:`, uploadErr.message);
              }
            }
          } else {
            console.error(`AI generation failed for ${area.name}: ${aiResponse.status}`);
          }
        } catch (aiErr) {
          console.error(`AI error for ${area.name}:`, aiErr);
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
          source,
        });
      } else {
        results.push({ area: area.name, image_url: null, status: "no_image_source", source: "none" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        no_image: results.filter(r => r.status === "no_image_source").length,
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
