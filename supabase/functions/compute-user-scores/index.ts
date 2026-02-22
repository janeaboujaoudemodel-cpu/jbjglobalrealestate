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

    // Gather all user IDs from multiple sources
    const userIdSet = new Set<string>();

    if (targetUserId) {
      userIdSet.add(targetUserId);
    } else {
      // From visitor_sessions (primary tracking)
      const { data: vs } = await supabase
        .from("visitor_sessions")
        .select("user_id")
        .not("user_id", "is", null);
      (vs || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });

      // From user_events
      const { data: ue } = await supabase
        .from("user_events")
        .select("user_id");
      (ue || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });

      // From user_daily_activity
      const { data: da } = await supabase
        .from("user_daily_activity")
        .select("user_id")
        .gte("day_date", new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0]);
      (da || []).forEach((s: any) => { if (s.user_id) userIdSet.add(s.user_id); });
    }

    const userIds = Array.from(userIdSet);
    const results: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    for (const userId of userIds) {
      try {
        // Get visitor session IDs for this user
        const { data: userSessions } = await supabase
          .from("visitor_sessions")
          .select("session_id, device_type, total_time_spent, pages_visited, created_at, last_activity_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(500);

        const vSessions = userSessions || [];
        const sessionIds = vSessions.map((s: any) => s.session_id);

        // Parallel data fetch from all sources
        const [visitorEventsRes, userEventsRes, userSessionsRes, dailyRes, pointsRes, leadsRes, scannedRes, docsRes, activityLogRes] = await Promise.all([
          // Visitor events (primary tracking - 30d)
          sessionIds.length > 0
            ? supabase.from("visitor_events")
                .select("event_type, event_name, page_path, created_at, event_data")
                .in("session_id", sessionIds.slice(0, 100))
                .gte("created_at", thirtyDaysAgo.toISOString())
                .limit(1000)
            : Promise.resolve({ data: [] }),
          // User events (secondary tracking)
          supabase.from("user_events")
            .select("event_name, page_path, created_at, metadata, points_awarded")
            .eq("user_id", userId)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .limit(500),
          // User sessions table
          supabase.from("user_sessions")
            .select("started_at, duration_seconds, device_type")
            .eq("user_id", userId)
            .gte("started_at", thirtyDaysAgo.toISOString())
            .limit(200),
          // Daily activity
          supabase.from("user_daily_activity")
            .select("day_date, total_events, points_earned")
            .eq("user_id", userId)
            .gte("day_date", thirtyDaysAgo.toISOString().split("T")[0]),
          // Points
          supabase.from("user_points_ledger")
            .select("points")
            .eq("user_id", userId),
          // Leads
          supabase.from("crm_leads")
            .select("id, created_at")
            .eq("user_id", userId),
          // Scanned cards
          supabase.from("admin_scanned_cards")
            .select("id")
            .eq("user_id", userId),
          // Documents
          sessionIds.length > 0
            ? supabase.from("visitor_documents")
                .select("id, action, document_type")
                .in("session_id", sessionIds.slice(0, 100))
            : Promise.resolve({ data: [] }),
          // Activity log
          supabase.from("user_activity_log")
            .select("event_type, created_at")
            .eq("user_id", userId)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .limit(500),
        ]);

        const visitorEvents = visitorEventsRes.data || [];
        const userEvents = userEventsRes.data || [];
        const uSessions = userSessionsRes.data || [];
        const daily = dailyRes.data || [];
        const totalPoints = (pointsRes.data || []).reduce((s: number, p: any) => s + (p.points || 0), 0);
        const leads = leadsRes.data || [];
        const scannedCards = scannedRes.data || [];
        const docs = docsRes.data || [];
        const activityLog = activityLogRes.data || [];

        // === AGGREGATE METRICS ===
        const totalVisitorSessions = vSessions.length;
        const totalUserSessions = uSessions.length;
        const totalSessions = Math.max(totalVisitorSessions, totalUserSessions);
        
        const visitorTimeSpent = vSessions.reduce((s: number, se: any) => s + (se.total_time_spent || 0), 0);
        const userTimeSpent = uSessions.reduce((s: number, se: any) => s + (se.duration_seconds || 0), 0);
        const totalTimeSeconds = Math.max(visitorTimeSpent, userTimeSpent);

        // Sessions in last 7d
        const vSessionsLast7d = vSessions.filter((s: any) => new Date(s.created_at) >= sevenDaysAgo).length;
        const uSessionsLast7d = uSessions.filter((s: any) => new Date(s.started_at) >= sevenDaysAgo).length;
        const sessionsLast7d = Math.max(vSessionsLast7d, uSessionsLast7d);

        // Device mix (merge both sources)
        const deviceMap: Record<string, number> = {};
        vSessions.forEach((s: any) => { const d = s.device_type || "unknown"; deviceMap[d] = (deviceMap[d] || 0) + 1; });
        uSessions.forEach((s: any) => { const d = s.device_type || "unknown"; deviceMap[d] = (deviceMap[d] || 0) + 1; });

        // Event type counts from visitor_events
        const pageViews = visitorEvents.filter((e: any) => e.event_type === "page_view").length;
        const clicks = visitorEvents.filter((e: any) => e.event_type === "click").length;
        const vSearches = visitorEvents.filter((e: any) => e.event_type === "search").length;
        const formSubmits = visitorEvents.filter((e: any) => e.event_type === "form_submit").length;
        const toolUsages = visitorEvents.filter((e: any) => e.event_type === "tool_usage").length;
        const downloads = docs.filter((d: any) => d.action === "download").length;
        const uploads = docs.filter((d: any) => d.action === "upload").length;

        // Event counts from user_events
        const ueEventCounts: Record<string, number> = {};
        userEvents.forEach((e: any) => { ueEventCounts[e.event_name] = (ueEventCounts[e.event_name] || 0) + 1; });
        const ueLeads = ueEventCounts["lead_submit"] || 0;
        const ueSaves = (ueEventCounts["listing_save"] || 0) + (ueEventCounts["favorite"] || 0);
        const ueSearches = ueEventCounts["search"] || 0;
        const ueContactClicks = (ueEventCounts["click_call"] || 0) + (ueEventCounts["click_whatsapp"] || 0) + (ueEventCounts["click_email"] || 0);

        // Merge counts (take max from both sources)
        const totalLeads = Math.max(leads.length, ueLeads);
        const totalSaves = Math.max(ueSaves, visitorEvents.filter((e: any) => e.event_name?.toLowerCase().includes("save")).length);
        const totalSearches = Math.max(vSearches, ueSearches);
        const totalContactClicks = Math.max(ueContactClicks, visitorEvents.filter((e: any) => 
          e.event_name?.toLowerCase().includes("contact") || e.event_name?.toLowerCase().includes("whatsapp") || e.event_name?.toLowerCase().includes("call")
        ).length);
        const totalFormSubmits = formSubmits;

        // Feature diversity
        const allEventTypes = new Set([
          ...visitorEvents.map((e: any) => e.event_type),
          ...userEvents.map((e: any) => e.event_name),
        ]);
        const featureDiversity = allEventTypes.size;

        // Unique pages
        const uniquePages = new Set([
          ...visitorEvents.map((e: any) => e.page_path),
          ...userEvents.map((e: any) => e.page_path),
        ].filter(Boolean));

        // Top pages
        const pageMap: Record<string, number> = {};
        visitorEvents.filter((e: any) => e.event_type === "page_view").forEach((e: any) => {
          if (e.page_path) pageMap[e.page_path] = (pageMap[e.page_path] || 0) + 1;
        });
        const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p]) => p);

        // Tools used
        const toolSet = new Set<string>();
        visitorEvents.filter((e: any) => e.event_type === "tool_usage").forEach((e: any) => {
          const name = e.event_data?.tool_name || e.event_name?.replace("Used ", "");
          if (name) toolSet.add(name);
        });

        // === INTENT SCORE (0-100) ===
        let intentScore = 0;
        intentScore += Math.min(totalLeads * 12, 35);           // Leads: up to 35
        intentScore += Math.min(totalSaves * 4, 15);            // Saves: up to 15
        intentScore += Math.min(totalContactClicks * 5, 15);    // Contact clicks: up to 15
        intentScore += Math.min(totalSearches * 2, 10);         // Searches: up to 10
        intentScore += Math.min(totalFormSubmits * 8, 10);      // Form submits: up to 10
        intentScore += Math.min(downloads * 5, 5);              // Downloads: up to 5
        intentScore += scannedCards.length > 0 ? 5 : 0;         // Business cards: 5
        intentScore += uploads > 0 ? 5 : 0;                     // Document uploads: 5
        intentScore = Math.min(Math.round(intentScore), 100);

        // === ENGAGEMENT SCORE (0-100) ===
        let engagementScore = 0;
        engagementScore += Math.min(sessionsLast7d * 5, 25);             // Recent sessions: up to 25
        engagementScore += Math.min(Math.round(totalTimeSeconds / 300), 20); // Time (5min blocks): up to 20
        engagementScore += Math.min(featureDiversity * 3, 15);           // Feature diversity: up to 15
        engagementScore += Math.min(Math.round(clicks / 50), 15);       // Click depth: up to 15
        engagementScore += Math.min(uniquePages.size, 15);               // Page diversity: up to 15
        engagementScore += Math.min(activityLog.length > 0 ? 5 : 0, 5); // Activity log presence: 5
        engagementScore += scannedCards.length > 0 ? 5 : 0;             // Business card: 5
        engagementScore = Math.min(Math.round(engagementScore), 100);

        // === CONVERSION PROBABILITY (0-100) ===
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

        // === CONFIDENCE SCORE (0-100) ===
        // How reliable are our scores based on data volume
        const totalEventCount = visitorEvents.length + userEvents.length;
        let confidenceScore = 0;
        confidenceScore += Math.min(totalSessions * 4, 20);       // Sessions
        confidenceScore += Math.min(totalEventCount / 20, 25);    // Events volume
        confidenceScore += totalTimeSeconds > 600 ? 15 : Math.round(totalTimeSeconds / 40); // Time
        confidenceScore += totalLeads > 0 ? 15 : 0;              // Has leads
        confidenceScore += sessionsLast7d > 0 ? 10 : 0;          // Recent
        confidenceScore += uniquePages.size >= 5 ? 10 : Math.round(uniquePages.size * 2);
        confidenceScore += scannedCards.length > 0 ? 5 : 0;
        confidenceScore = Math.min(Math.round(confidenceScore), 100);

        // === BUDGET ESTIMATION (AED) ===
        // Check property pages visited
        const propertyPageViews = visitorEvents.filter((e: any) => 
          e.page_path?.includes("/project/") || e.page_path?.includes("/listing/") || e.page_path?.includes("/property/")
        ).length;

        let budgetEstimate = 500000; // Default casual
        if (totalLeads > 0) budgetEstimate = 2500000;           // Submitted leads = serious
        else if (propertyPageViews > 10) budgetEstimate = 2000000; // Heavy property browsing
        else if (propertyPageViews > 3) budgetEstimate = 1500000;
        else if (totalSessions > 5) budgetEstimate = 1000000;

        // Check price metadata for better accuracy
        const priceSignals: number[] = [];
        userEvents.forEach((e: any) => {
          if (e.metadata?.price) priceSignals.push(Number(e.metadata.price));
          if (e.metadata?.min_price) priceSignals.push(Number(e.metadata.min_price));
          if (e.metadata?.max_price) priceSignals.push(Number(e.metadata.max_price));
        });
        if (priceSignals.length > 0) {
          budgetEstimate = Math.round(priceSignals.reduce((s, p) => s + p, 0) / priceSignals.length);
        }

        // === REVENUE POTENTIAL ===
        const commRate = 0.02; // 2% commission
        const revenuePotential = Math.round(budgetEstimate * commRate * (conversionProbability / 100));

        // === TIME TO CONVERSION ===
        let timeToConversion: number;
        if (conversionProbability >= 70) timeToConversion = 14;
        else if (conversionProbability >= 50) timeToConversion = 30;
        else if (conversionProbability >= 30) timeToConversion = 60;
        else if (conversionProbability >= 15) timeToConversion = 90;
        else timeToConversion = 180;

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

        // Inactivity downgrade
        if (daysSinceActive > 30 && vipTier !== "Royal VIP") {
          const tierOrder = ["Visitor", "Bronze", "Silver", "Gold", "Platinum"];
          const idx = tierOrder.indexOf(vipTier);
          if (idx > 0) vipTier = tierOrder[idx - 1];
        }

        const vipTierReason = `Points:${totalPoints} | Intent:${intentScore}/100 | Engagement:${engagementScore}/100 | Sessions:${totalSessions} | Leads:${totalLeads} | Last active: ${daysSinceActive}d ago`;

        // Upsert
        const profileData = {
          user_id: userId,
          intent_score: intentScore,
          engagement_score: engagementScore,
          conversion_probability: conversionProbability,
          avg_budget_estimate: budgetEstimate,
          revenue_potential: revenuePotential,
          estimated_ticket_aed: budgetEstimate,
          time_to_conversion_days: timeToConversion,
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

        results.push({ userId, intentScore, engagementScore, conversionProbability, vipTier, revenuePotential });
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, total: userIds.length }), {
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
