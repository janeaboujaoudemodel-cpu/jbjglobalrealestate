/**
 * instagram-process-scheduled
 * Called by pg_cron every minute. Finds all scheduled posts whose
 * scheduled_at ≤ now() and publishes them via the Instagram Graph API.
 */
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all due posts
  const { data: duePosts, error: fetchErr } = await supabase
    .from("instagram_scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .limit(20); // cap per-run to avoid timeouts

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!duePosts || duePosts.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: "No posts due" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Processing ${duePosts.length} scheduled post(s)…`);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const post of duePosts) {
    // Mark as processing first to prevent double-fire
    await supabase
      .from("instagram_scheduled_posts")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", post.id);

    try {
      if (!post.access_token || !post.account_id) {
        throw new Error("Missing Instagram credentials on scheduled post");
      }

      // 1. Create media container
      const containerParams = new URLSearchParams({
        image_url: post.image_url,
        caption: post.caption || "",
        access_token: post.access_token,
      });

      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${post.account_id}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: containerParams.toString(),
        }
      );
      const containerData = await containerRes.json();

      if (!containerRes.ok || containerData.error) {
        throw new Error(
          containerData.error?.message || "Failed to create Instagram media container"
        );
      }

      // 2. Publish container
      const publishParams = new URLSearchParams({
        creation_id: containerData.id,
        access_token: post.access_token,
      });

      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${post.account_id}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: publishParams.toString(),
        }
      );
      const publishData = await publishRes.json();

      if (!publishRes.ok || publishData.error) {
        throw new Error(
          publishData.error?.message || "Failed to publish to Instagram"
        );
      }

      const postId = publishData.id;
      const postUrl = `https://www.instagram.com/p/${postId}/`;

      // 3. Mark as published
      await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "published",
          ig_post_id: postId,
          ig_post_url: postUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      console.log(`✅ Published post ${post.id} → ${postUrl}`);
      results.push({ id: post.id, status: "published" });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`❌ Failed post ${post.id}:`, errMsg);

      await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "failed",
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      results.push({ id: post.id, status: "failed", error: errMsg });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
