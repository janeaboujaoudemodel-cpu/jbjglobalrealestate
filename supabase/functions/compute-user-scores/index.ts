import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id;

    // Gather user IDs
    const userIdSet = new Set<string>();

    if (targetUserId) {
      userIdSet.add(targetUserId);
    } else {
      const [vsRes, ueRes, daRes] = await Promise.all([
        supabase.from("visitor_sessions").select("user_id").not("user_id", "is", null).limit(1000),
        supabase.from("user_events").select("user_id").limit(1000),
        supabase.from("user_daily_activity").select("user_id").gte("day_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0]).limit(1000),
      ]);
      (vsRes.data || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });
      (ueRes.data || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });
      (daRes.data || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });
    }

    const userIds = Array.from(userIdSet);
    const results: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    for (const userId of userIds) {
      try {
        // Get visitor sessions
        const { data: userSessions } = await supabase
          .from("visitor_sessions")
          .select("session_id, device_type, total_time_spent, pages_visited, created_at, last_activity_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(500);

        const vSessions = userSessions || [];
        const sessionIds = vSessions.map((s: any) => s.session_id);

        // Parallel data fetch
        const [visitorEventsRes, userEventsRes, userSessionsRes, dailyRes, pointsRes, leadsRes, scannedRes, docsRes] = await Promise.all([
          sessionIds.length > 0
            ? supabase.from("visitor_events")
                .select("event_type, event_name, page_path, created_at, event_data")
                .in("session_id", sessionIds.slice(0, 100))
                .gte("created_at", thirtyDaysAgo.toISOString())
                .limit(1000)
            : Promise.resolve({ data: [] }),
          supabase.from("user_events")
            .select("event_name, page_path, created_at, metadata, points_awarded")
            .eq("user_id", userId)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .limit(500),
          supabase.from("user_sessions")
            .select("started_at, duration_seconds, device_type")
            .eq("user_id", userId)
            .gte("started_at", thirtyDaysAgo.toISOString())
            .limit(200),
          supabase.from("user_daily_activity")
            .select("day_date, total_events, points_earned")
            .eq("user_id", userId)
            .gte("day_date", thirtyDaysAgo.toISOString().split("T")[0]),
          supabase.from("user_points_ledger")
            .select("points")
            .eq("user_id", userId),
          // Leads: use created_by_user_id (correct column)
          supabase.from("crm_leads")
            .select("id, created_at")
            .eq("created_by_user_id", userId),
          supabase.from("admin_scanned_cards")
            .select("id")
            .eq("user_id", userId),
          sessionIds.length > 0
            ? supabase.from("visitor_documents")
                .select("id, action, document_type")
                .in("session_id", sessionIds.slice(0, 100))
            : Promise.resolve({ data: [] }),
        ]);

        const visitorEvents = visitorEventsRes.data || [];
        const userEvents = userEventsRes.data || [];
        const uSessions = userSessionsRes.data || [];
        const daily = dailyRes.data || [];
        const totalPoints = (pointsRes.data || []).reduce((s: number, p: any) => s + (p.points || 0), 0);
        const leads = leadsRes.data || [];
        const scannedCards = scannedRes.data || [];
        const docs = docsRes.data || [];

        // === METRICS ===
        const totalVisitorSessions = vSessions.length;
        const totalUserSessions = uSessions.length;
        const totalSessions = Math.max(totalVisitorSessions, totalUserSessions);
        
        const visitorTimeSpent = vSessions.reduce((s: number, se: any) => s + (se.total_time_spent || 0), 0);
        const userTimeSpent = uSessions.reduce((s: number, se: any) => s + (se.duration_seconds || 0), 0);
        const totalTimeSeconds = Math.max(visitorTimeSpent, userTimeSpent);

        const vSessionsLast7d = vSessions.filter((s: any) => new Date(s.created_at) >= sevenDaysAgo).length;
        const uSessionsLast7d = uSessions.filter((s: any) => new Date(s.started_at) >= sevenDaysAgo).length;
        const sessionsLast7d = Math.max(vSessionsLast7d, uSessionsLast7d);

        // Device mix
        const deviceMap: Record<string, number> = {};
        vSessions.forEach((s: any) => { const d = s.device_type || "unknown"; deviceMap[d] = (deviceMap[d] || 0) + 1; });
        uSessions.forEach((s: any) => { const d = s.device_type || "unknown"; deviceMap[d] = (deviceMap[d] || 0) + 1; });

        // Event counts
        const clicks = visitorEvents.filter((e: any) => e.event_type === "click").length;
        const vSearches = visitorEvents.filter((e: any) => e.event_type === "search").length;
        const formSubmits = visitorEvents.filter((e: any) => e.event_type === "form_submit").length;
        const downloads = docs.filter((d: any) => d.action === "download").length;
        const uploads = docs.filter((d: any) => d.action === "upload").length;

        const ueEventCounts: Record<string, number> = {};
        userEvents.forEach((e: any) => { ueEventCounts[e.event_name] = (ueEventCounts[e.event_name] || 0) + 1; });
        const ueSaves = (ueEventCounts["listing_save"] || 0) + (ueEventCounts["favorite"] || 0);
        const ueSearches = ueEventCounts["search"] || 0;
        const ueContactClicks = (ueEventCounts["click_call"] || 0) + (ueEventCounts["click_whatsapp"] || 0) + (ueEventCounts["click_email"] || 0);

        const totalLeads = leads.length;
        const totalSaves = Math.max(ueSaves, visitorEvents.filter((e: any) => e.event_name?.toLowerCase().includes("save")).length);
        const totalSearches = Math.max(vSearches, ueSearches);
        const totalContactClicks = Math.max(ueContactClicks, visitorEvents.filter((e: any) => 
          e.event_name?.toLowerCase().includes("contact") || e.event_name?.toLowerCase().includes("whatsapp") || e.event_name?.toLowerCase().includes("call")
        ).length);

        const allEventTypes = new Set([
          ...visitorEvents.map((e: any) => e.event_type),
          ...userEvents.map((e: any) => e.event_name),
        ]);
        const featureDiversity = allEventTypes.size;

        const uniquePages = new Set([
          ...visitorEvents.map((e: any) => e.page_path),
          ...userEvents.map((e: any) => e.page_path),
        ].filter(Boolean));

        const pageMap: Record<string, number> = {};
        visitorEvents.filter((e: any) => e.event_type === "page_view").forEach((e: any) => {
          if (e.page_path) pageMap[e.page_path] = (pageMap[e.page_path] || 0) + 1;
        });
        const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p]) => p);

        const toolSet = new Set<string>();
        visitorEvents.filter((e: any) => e.event_type === "tool_usage").forEach((e: any) => {
          const name = e.event_data?.tool_name || e.event_name?.replace("Used ", "");
          if (name) toolSet.add(name);
        });

        // === INTENT (0-100) ===
        let intentScore = 0;
        intentScore += Math.min(totalLeads * 12, 35);
        intentScore += Math.min(totalSaves * 4, 15);
        intentScore += Math.min(totalContactClicks * 5, 15);
        intentScore += Math.min(totalSearches * 2, 10);
        intentScore += Math.min(formSubmits * 8, 10);
        intentScore += Math.min(downloads * 5, 5);
        intentScore += scannedCards.length > 0 ? 5 : 0;
        intentScore += uploads > 0 ? 5 : 0;
        intentScore = Math.min(Math.round(intentScore), 100);

        // === ENGAGEMENT (0-100) ===
        let engagementScore = 0;
        engagementScore += Math.min(sessionsLast7d * 5, 25);
        engagementScore += Math.min(Math.round(totalTimeSeconds / 300), 20);
        engagementScore += Math.min(featureDiversity * 3, 15);
        engagementScore += Math.min(Math.round(clicks / 50), 15);
        engagementScore += Math.min(uniquePages.size, 15);
        engagementScore += scannedCards.length > 0 ? 5 : 0;
        engagementScore += docs.length > 0 ? 5 : 0;
        engagementScore = Math.min(Math.round(engagementScore), 100);

        // === CONVERSION (0-100) ===
        const lastActiveDate = vSessions.length > 0 
          ? new Date(vSessions[0].last_activity_at || vSessions[0].created_at)
          : thirtyDaysAgo;
        const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / 86400000);
        const recencyMultiplier = Math.max(0.3, 1.0 - (daysSinceActive / 45));
        
        let conversionProbability = Math.round(
          (intentScore * 0.5 + engagementScore * 0.3) * recencyMultiplier +
          (totalLeads > 0 ? 15 : 0) +
          (totalContactClicks > 0 ? 5 : 0)
        );
        conversionProbability = Math.min(95, Math.max(0, conversionProbability));

        // === CONFIDENCE (0-100) ===
        const totalEventCount = visitorEvents.length + userEvents.length;
        let confidenceScore = 0;
        confidenceScore += Math.min(totalSessions * 4, 20);
        confidenceScore += Math.min(totalEventCount / 20, 25);
        confidenceScore += totalTimeSeconds > 600 ? 15 : Math.round(totalTimeSeconds / 40);
        confidenceScore += totalLeads > 0 ? 15 : 0;
        confidenceScore += sessionsLast7d > 0 ? 10 : 0;
        confidenceScore += uniquePages.size >= 5 ? 10 : Math.round(uniquePages.size * 2);
        confidenceScore += scannedCards.length > 0 ? 5 : 0;
        confidenceScore = Math.min(Math.round(confidenceScore), 100);

        // === STREAK ===
        const allDates = new Set<string>();
        daily.forEach((d: any) => allDates.add(d.day_date));
        vSessions.forEach((s: any) => { if (s.created_at) allDates.add(s.created_at.split("T")[0]); });
        const sortedDates = [...allDates].sort().reverse();
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

        // === VIP TIER ===
        let vipTier = "Visitor";
        const combinedScore = intentScore + engagementScore;
        if (totalPoints >= 50000 || combinedScore >= 160) vipTier = "Royal VIP";
        else if (totalPoints >= 25000 || combinedScore >= 130) vipTier = "Platinum";
        else if (totalPoints >= 10000 || combinedScore >= 100) vipTier = "Gold";
        else if (totalPoints >= 3000 || combinedScore >= 60) vipTier = "Silver";
        else if (totalPoints >= 500 || combinedScore >= 25) vipTier = "Bronze";

        if (daysSinceActive > 30 && vipTier !== "Royal VIP") {
          const tierOrder = ["Visitor", "Bronze", "Silver", "Gold", "Platinum"];
          const idx = tierOrder.indexOf(vipTier);
          if (idx > 0) vipTier = tierOrder[idx - 1];
        }

        const vipTierReason = `Points: ${totalPoints} | Intent: ${intentScore}/100 | Engagement: ${engagementScore}/100 | Sessions: ${totalSessions} | Leads: ${totalLeads} | Cards scanned: ${scannedCards.length} | Docs: ${docs.length} | Last active: ${daysSinceActive}d ago`;

        const profileData = {
          user_id: userId,
          intent_score: intentScore,
          engagement_score: engagementScore,
          conversion_probability: conversionProbability,
          avg_budget_estimate: 0,
          revenue_potential: 0,
          estimated_ticket_aed: 0,
          time_to_conversion_days: 0,
          confidence_score: confidenceScore,
          vip_tier: vipTier,
          vip_tier_reason: vipTierReason,
          total_sessions: totalSessions,
          total_time_seconds: totalTimeSeconds,
          total_points: totalPoints,
          current_streak: streak,
          longest_streak: streak,
          device_mix: deviceMap,
          top_pages: topPages,
          tools_used: [...toolSet],
          lead_count_30d: totalLeads,
          saves_count_30d: totalSaves,
          compares_count_30d: 0,
          contact_clicks_30d: totalContactClicks,
          sessions_last_7d: sessionsLast7d,
          feature_diversity: featureDiversity,
          searches_30d: totalSearches,
          last_active_at: lastActiveDate.toISOString(),
          last_updated_at: now.toISOString(),
        };

        const { error } = await supabase.from("user_interest_profile").upsert(profileData, { onConflict: "user_id" });
        if (error) console.error(`Error upserting ${userId}:`, error);

        results.push({ userId, intentScore, engagementScore, conversionProbability, vipTier });
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, total: userIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
