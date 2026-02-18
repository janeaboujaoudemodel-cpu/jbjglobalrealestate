/**
 * instagram-get-analytics
 * Fetches like_count, comments_count, and reach for a published Instagram post
 * using the Instagram Graph API media insights endpoint.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, accessToken } = await req.json();

    if (!postId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: postId, accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch basic fields: like_count, comments_count, timestamp
    const fieldsRes = await fetch(
      `https://graph.facebook.com/v19.0/${postId}?fields=like_count,comments_count,timestamp,media_type,permalink&access_token=${accessToken}`
    );
    const fieldsData = await fieldsRes.json();

    if (fieldsData.error) {
      return new Response(
        JSON.stringify({ error: fieldsData.error.message, code: fieldsData.error.code }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch insights: reach, impressions, saved (only available for business accounts)
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${postId}/insights?metric=reach,impressions,saved&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();

    // Parse insights — may be empty for very new posts or personal accounts
    const metrics: Record<string, number> = {};
    if (insightsData.data && Array.isArray(insightsData.data)) {
      for (const item of insightsData.data) {
        metrics[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        like_count: fieldsData.like_count ?? 0,
        comments_count: fieldsData.comments_count ?? 0,
        reach: metrics["reach"] ?? null,
        impressions: metrics["impressions"] ?? null,
        saved: metrics["saved"] ?? null,
        timestamp: fieldsData.timestamp,
        media_type: fieldsData.media_type,
        permalink: fieldsData.permalink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("instagram-get-analytics error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
