import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDataUrl, caption, accessToken, accountId } = await req.json();

    if (!imageDataUrl || !accessToken || !accountId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageDataUrl, accessToken, accountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Upload image to storage to get a public URL
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Convert base64 data URL to blob
    const base64Match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!base64Match) {
      return new Response(
        JSON.stringify({ error: "Invalid image data URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const ext = mimeType.split("/")[1] || "jpg";
    const fileName = `instagram-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `temp/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("instagram-grid-photos")
      .upload(filePath, binaryData, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("instagram-grid-photos")
      .getPublicUrl(filePath);

    const publicImageUrl = urlData.publicUrl;
    console.log("Uploaded image public URL:", publicImageUrl);

    // 2. Create media container on Instagram
    const containerParams = new URLSearchParams({
      image_url: publicImageUrl,
      caption: caption || "",
      access_token: accessToken,
    });

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerParams.toString(),
      }
    );

    const containerData = await containerRes.json();
    console.log("Instagram container response:", containerData);

    if (!containerRes.ok || containerData.error) {
      // Clean up uploaded file
      await supabase.storage.from("instagram-grid-photos").remove([filePath]);
      return new Response(
        JSON.stringify({
          error: containerData.error?.message || "Failed to create Instagram media container",
          details: containerData.error,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const containerId = containerData.id;

    // 3. Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishParams.toString(),
      }
    );

    const publishData = await publishRes.json();
    console.log("Instagram publish response:", publishData);

    if (!publishRes.ok || publishData.error) {
      await supabase.storage.from("instagram-grid-photos").remove([filePath]);
      return new Response(
        JSON.stringify({
          error: publishData.error?.message || "Failed to publish to Instagram",
          details: publishData.error,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postId = publishData.id;
    const postUrl = `https://www.instagram.com/p/${postId}/`;

    // Clean up temp file after successful publish
    await supabase.storage.from("instagram-grid-photos").remove([filePath]);

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        postUrl,
        message: "Successfully published to Instagram!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("instagram-publish error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
