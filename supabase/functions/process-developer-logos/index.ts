import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Developer {
  id: string;
  name: string;
  logo_url: string | null;
  logo_url_processed: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 10, force_reprocess = false, developer_id = null } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query developers with logos that need processing
    let query = supabase
      .from("developers")
      .select("id, name, logo_url, logo_url_processed")
      .not("logo_url", "is", null);

    if (developer_id) {
      query = query.eq("id", developer_id);
    } else if (!force_reprocess) {
      query = query.is("logo_url_processed", null);
    }

    const { data: developers, error: fetchError } = await query.limit(batch_size);

    if (fetchError) {
      throw new Error(`Failed to fetch developers: ${fetchError.message}`);
    }

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No developers need logo processing",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${developers.length} developer logos...`);

    const results: { id: string; name: string; success: boolean; error?: string }[] = [];

    for (const developer of developers as Developer[]) {
      try {
        if (!developer.logo_url) {
          results.push({ id: developer.id, name: developer.name, success: false, error: "No logo URL" });
          continue;
        }

        console.log(`Processing logo for: ${developer.name}`);

        // Call Lovable AI to remove background from logo
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Remove the background from this logo completely, making it fully transparent. Keep ONLY the logo itself with absolutely no background. Output a clean PNG with transparent background. The logo should be crisp and clear on any background color."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: developer.logo_url
                    }
                  }
                ]
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI error for ${developer.name}:`, errorText);
          
          if (aiResponse.status === 429) {
            results.push({ id: developer.id, name: developer.name, success: false, error: "Rate limited" });
            // Wait a bit before continuing
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          results.push({ id: developer.id, name: developer.name, success: false, error: `AI error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const processedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!processedImageUrl) {
          console.error(`No processed image returned for ${developer.name}`);
          results.push({ id: developer.id, name: developer.name, success: false, error: "No image in AI response" });
          continue;
        }

        // Extract base64 data from data URL
        const base64Match = processedImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          results.push({ id: developer.id, name: developer.name, success: false, error: "Invalid image format" });
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `${developer.id}-processed.${imageFormat === 'png' ? 'png' : 'webp'}`;
        const { error: uploadError } = await supabase.storage
          .from("developer-logos")
          .upload(fileName, imageBuffer, {
            contentType: `image/${imageFormat}`,
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${developer.name}:`, uploadError);
          results.push({ id: developer.id, name: developer.name, success: false, error: `Upload failed: ${uploadError.message}` });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("developer-logos")
          .getPublicUrl(fileName);

        // Update developer record
        const { error: updateError } = await supabase
          .from("developers")
          .update({ logo_url_processed: publicUrlData.publicUrl })
          .eq("id", developer.id);

        if (updateError) {
          console.error(`Update error for ${developer.name}:`, updateError);
          results.push({ id: developer.id, name: developer.name, success: false, error: `DB update failed: ${updateError.message}` });
          continue;
        }

        console.log(`Successfully processed logo for: ${developer.name}`);
        results.push({ id: developer.id, name: developer.name, success: true });

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`Error processing ${developer.name}:`, err);
        results.push({ 
          id: developer.id, 
          name: developer.name, 
          success: false, 
          error: err instanceof Error ? err.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${successCount} logos successfully, ${failureCount} failed`,
        processed: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in process-developer-logos:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
