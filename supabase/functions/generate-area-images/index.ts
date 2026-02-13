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
    const batchSize = body.batch_size || 5;

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

        // Generate image via Gemini
        const prompt = `Professional aerial panoramic photograph of ${area.name}, Dubai, UAE. Modern urban landscape showing buildings, roads, and community layout. High resolution, real estate marketing quality, daytime, clear blue sky, photorealistic. Ultra high resolution.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${area.name}: ${aiResponse.status} ${errText}`);
          results.push({ area: area.name, status: `ai_error_${aiResponse.status}` });
          // Rate limit - wait before next
          if (aiResponse.status === 429) {
            await new Promise(r => setTimeout(r, 10000));
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData || !imageData.startsWith("data:image")) {
          console.warn(`No image generated for ${area.name}`);
          results.push({ area: area.name, status: "no_image_generated" });
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
