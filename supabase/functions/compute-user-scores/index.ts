import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id; // optional: score single user

    // Get all users with activity, or just one
    let userIds: string[] = [];
    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      const { data: activeUsers } = await supabase
        .from("user_daily_activity")
        .select("user_id")
        .gte("day_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0]);
      userIds = [...new Set((activeUsers || []).map((u: any) => u.user_id))];
    }

    const results: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    for (const userId of userIds) {
      // Parallel data fetch
      const [eventsRes, sessionsRes, dailyRes, pointsRes] = await Promise.all([
        supabase.from("user_events").select("event_name, event_time, metadata")
          .eq("user_id", userId).gte("event_time", thirtyDaysAgo.toISOString()).limit(1000),
        supabase.from("user_sessions").select("started_at, duration_seconds, device_type")
          .eq("user_id", userId).gte("started_at", thirtyDaysAgo.toISOString()).limit(200),
        supabase.from("user_daily_activity").select("day_date, total_events, points_earned")
          .eq("user_id", userId).gte("day_date", thirtyDaysAgo.toISOString().split("T")[0]),
        supabase.from("user_points_ledger").select("points")
          .eq("user_id", userId),
      ]);

      const events = eventsRes.data || [];
      const sessions = sessionsRes.data || [];
      const daily = dailyRes.data || [];
      const totalPoints = (pointsRes.data || []).reduce((s: number, p: any) => s + (p.points || 0), 0);

      // Count event types
      const eventCounts: Record<string, number> = {};
      events.forEach((e: any) => {
        eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
      });

      const leads = eventCounts["lead_submit"] || 0;
      const saves = (eventCounts["listing_save"] || 0) + (eventCounts["favorite"] || 0);
      const compares = eventCounts["compare_used"] || 0;
      const contactClicks = (eventCounts["click_call"] || 0) + (eventCounts["click_whatsapp"] || 0) + (eventCounts["click_email"] || 0);
      const aiTools = eventCounts["ai_tool_used"] || 0;
      const searches = eventCounts["search"] || 0;
      const totalEvents = events.length;

      // Last active
      const lastEvent = events.length > 0 ? new Date(events[0].event_time) : thirtyDaysAgo;
      const daysSinceActive = Math.floor((now.getTime() - lastEvent.getTime()) / 86400000);

      // Recency multiplier (1.0 if active today, decays to 0.3 if 30+ days inactive)
      const recencyMultiplier = Math.max(0.3, 1.0 - (daysSinceActive / 45));

      // === INTENT SCORE (0-100) ===
      // 40% lead submissions, 20% saves, 15% compares + contact clicks, 10% AI tools, 10% recency, 5% compares
      const intentRaw =
        Math.min(leads * 12, 40) +            // leads: up to 40
        Math.min(saves * 4, 20) +             // saves: up to 20
        Math.min(contactClicks * 3, 15) +     // contact clicks: up to 15
        Math.min(aiTools * 2, 10) +           // AI tools: up to 10
        Math.min(compares * 5, 5) +           // compares: up to 5
        (recencyMultiplier * 10);             // recency: up to 10
      const intentScore = Math.min(100, Math.round(intentRaw));

      // === ENGAGEMENT SCORE (0-100) ===
      const sessions7d = sessions.filter((s: any) => new Date(s.started_at) >= sevenDaysAgo).length;
      const totalDuration = sessions.reduce((s: number, x: any) => s + (x.duration_seconds || 0), 0);
      const uniqueEventTypes = new Set(events.map((e: any) => e.event_name)).size;

      const engagementRaw =
        Math.min(sessions7d * 5, 30) +           // sessions/week: up to 30
        Math.min(totalDuration / 600, 25) +       // total time (per 10min): up to 25
        Math.min(uniqueEventTypes * 3, 20) +      // feature diversity: up to 20
        Math.min(searches * 2, 15) +              // searches: up to 15
        Math.min(saves * 2, 10);                  // saves: up to 10
      const engagementScore = Math.min(100, Math.round(engagementRaw));

      // === CONVERSION PROBABILITY ===
      let conversionProb = intentScore * 0.7 + engagementScore * 0.3;
      if (daysSinceActive > 14) conversionProb *= 0.6;
      if (saves === 0 && leads === 0) conversionProb *= 0.5;
      conversionProb = Math.min(100, Math.round(conversionProb));

      // === BUDGET ESTIMATION ===
      // Look for price-related metadata in events
      let budgetEstimate = 0;
      const priceSignals: number[] = [];
      events.forEach((e: any) => {
        if (e.metadata?.price) priceSignals.push(Number(e.metadata.price));
        if (e.metadata?.min_price) priceSignals.push(Number(e.metadata.min_price));
        if (e.metadata?.max_price) priceSignals.push(Number(e.metadata.max_price));
      });
      if (priceSignals.length > 0) {
        budgetEstimate = Math.round(priceSignals.reduce((s, p) => s + p, 0) / priceSignals.length);
      } else {
        budgetEstimate = 2000000; // default 2M AED
      }

      // === REVENUE PREDICTION ===
      const { data: commRates } = await supabase.from("commission_rates").select("rate_percent").eq("property_type", "off_plan").single();
      const commRate = (commRates?.rate_percent || 5) / 100;
      const revenuePotential = Math.round(budgetEstimate * (conversionProb / 100) * commRate);
      const timeToConversion = leads > 0 ? Math.max(7, 90 - intentScore) : Math.max(30, 180 - intentScore);
      const confidence = Math.min(100, Math.round((events.length / 50) * 50 + (sessions.length / 10) * 30 + (leads > 0 ? 20 : 0)));

      // === VIP TIER ===
      let vipTier = "Visitor";
      if (totalPoints >= 5000 || intentScore >= 90) vipTier = "Royal VIP";
      else if (totalPoints >= 2000 || intentScore >= 70) vipTier = "Platinum";
      else if (totalPoints >= 1000 || intentScore >= 50) vipTier = "Gold";
      else if (totalPoints >= 500 || intentScore >= 30) vipTier = "Silver";
      else if (totalPoints >= 100 || intentScore >= 15) vipTier = "Bronze";

      // Inactivity downgrade (except Royal VIP manual override)
      if (daysSinceActive > 30 && vipTier !== "Royal VIP") {
        const tierOrder = ["Visitor", "Bronze", "Silver", "Gold", "Platinum"];
        const idx = tierOrder.indexOf(vipTier);
        if (idx > 0) vipTier = tierOrder[idx - 1];
      }

      // === STREAK ===
      const sortedDates = daily.map((d: any) => d.day_date).sort().reverse();
      let streak = 0;
      const today = now.toISOString().split("T")[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
      if (sortedDates.length > 0 && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++;
          else break;
        }
      }

      // Device mix
      const deviceMap: Record<string, number> = {};
      sessions.forEach((s: any) => {
        const d = s.device_type || "unknown";
        deviceMap[d] = (deviceMap[d] || 0) + 1;
      });

      // Top pages
      const pageMap: Record<string, number> = {};
      events.forEach((e: any) => {
        if (e.event_name === "page_view" && e.metadata?.title) {
          pageMap[e.metadata.title] = (pageMap[e.metadata.title] || 0) + 1;
        }
      });
      const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p]) => p);

      // Tools used
      const toolSet = new Set<string>();
      events.forEach((e: any) => {
        if (["ai_tool_used", "tool_use"].includes(e.event_name) && e.metadata?.tool_name) {
          toolSet.add(e.metadata.tool_name);
        }
      });

      // Upsert profile
      const profileData = {
        user_id: userId,
        intent_score: intentScore,
        engagement_score: engagementScore,
        conversion_probability: conversionProb,
        avg_budget_estimate: budgetEstimate,
        revenue_potential: revenuePotential,
        estimated_ticket_aed: budgetEstimate,
        time_to_conversion_days: timeToConversion,
        confidence_score: confidence,
        vip_tier: vipTier,
        vip_tier_reason: `Points:${totalPoints} Intent:${intentScore} Engagement:${engagementScore}`,
        total_sessions: sessions.length,
        total_time_seconds: totalDuration,
        total_points: totalPoints,
        current_streak: streak,
        longest_streak: streak, // simplified
        device_mix: deviceMap,
        top_pages: topPages,
        tools_used: [...toolSet],
        lead_count_30d: leads,
        saves_count_30d: saves,
        compares_count_30d: compares,
        contact_clicks_30d: contactClicks,
        sessions_last_7d: sessions7d,
        feature_diversity: uniqueEventTypes,
        searches_30d: searches,
        last_active_at: lastEvent.toISOString(),
        last_updated_at: now.toISOString(),
      };

      const { error } = await supabase.from("user_interest_profile").upsert(profileData, { onConflict: "user_id" });
      if (error) console.error(`Error upserting profile for ${userId}:`, error);
      
      results.push({ userId, intentScore, engagementScore, conversionProb, vipTier, revenuePotential });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scoring error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
