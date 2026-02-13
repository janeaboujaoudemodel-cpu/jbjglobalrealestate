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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const body = await req.json().catch(() => ({}));
    const processAll = body.process_all || false;
    const batchSize = processAll ? 200 : (body.batch_size || 5);

    // Get areas missing images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .is("image_url", null)
      .order("property_count", { ascending: false })
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All areas have images", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: remaining } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("image_url", null);

    const results: { area: string; status: string; image_url?: string }[] = [];

    for (const area of areas) {
      try {
        console.log(`Generating image for: ${area.name}`);

        const prompts = [
          `Ultra-realistic drone aerial photograph of ${area.name} community in Dubai, UAE. Bird's-eye view showing the full master-planned community layout with residential towers, villas, landscaped parks, swimming pools, roads, and surrounding desert or waterfront. Golden hour lighting, crystal clear sky, cinematic composition, 8K resolution, real estate marketing photography, no text or watermarks, no logos.`,
          `Stunning bird's-eye view photograph of a modern urban residential district in the UAE with towers, parks, and pools under a golden sunset sky. Ultra high resolution, photorealistic, no text or watermarks.`,
        ];

        let imageData: string | undefined;

        for (let attempt = 0; attempt < prompts.length; attempt++) {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [{ role: "user", content: prompts[attempt] }],
              modalities: ["image", "text"],
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error(`AI error for ${area.name} (attempt ${attempt + 1}): ${aiResponse.status} ${errText}`);
            if (aiResponse.status === 429) await new Promise(r => setTimeout(r, 5000));
            continue;
          }

          const aiData = await aiResponse.json();
          const candidate = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (candidate && candidate.startsWith("data:image")) {
            imageData = candidate;
            break;
          }
          console.warn(`No image for ${area.name} attempt ${attempt + 1}`);
          await new Promise(r => setTimeout(r, 1000));
        }

        if (!imageData) {
          console.warn(`All prompts failed for ${area.name}`);
          results.push({ area: area.name, status: "no_image_all_attempts" });
          continue;
        }

        // Extract base64 data and upload to storage
        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          results.push({ area: area.name, status: "invalid_base64" });
          continue;
        }

        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const filePath = `${area.slug}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("area-images")
          .upload(filePath, binaryData, {
            contentType: `image/${base64Match[1]}`,
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload error for ${area.name}:`, uploadErr);
          results.push({ area: area.name, status: `upload_error: ${uploadErr.message}` });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("area-images")
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update area record
        const { error: updateErr } = await supabase
          .from("areas")
          .update({
            image_url: publicUrl,
            hero_image_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", area.id);

        if (updateErr) {
          results.push({ area: area.name, status: `db_error: ${updateErr.message}` });
        } else {
          results.push({ area: area.name, status: "success", image_url: publicUrl });
          console.log(`✅ ${area.name}: ${publicUrl}`);
        }

        // Small delay between generations to avoid rate limits
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        console.error(`Error for ${area.name}:`, err);
        results.push({ area: area.name, status: `error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        remaining: (remaining || 0) - results.filter(r => r.status === "success").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-area-images error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
