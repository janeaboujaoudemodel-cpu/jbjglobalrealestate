import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[summarize-user-profiles] Starting summarization job");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all unique emails from newsletter_subscribers + leads + journey events
    const { data: subscribers } = await supabase
      .from("newsletter_subscribers")
      .select("email, name, full_name, phone, is_active, subscribed_at, user_id")
      .limit(1000);

    const { data: leads } = await supabase
      .from("crm_leads")
      .select("email, full_name, phone")
      .limit(1000);

    // Build unique email map
    const emailMap = new Map<string, {
      full_name: string | null;
      phone: string | null;
      user_id: string | null;
      subscribed: boolean;
      subscribed_at: string | null;
    }>();

    for (const sub of subscribers || []) {
      if (!sub.email) continue;
      emailMap.set(sub.email, {
        full_name: sub.full_name || sub.name || null,
        phone: sub.phone || null,
        user_id: sub.user_id || null,
        subscribed: sub.is_active ?? false,
        subscribed_at: sub.subscribed_at || null,
      });
    }

    for (const lead of leads || []) {
      if (!lead.email) continue;
      if (!emailMap.has(lead.email)) {
        emailMap.set(lead.email, {
          full_name: lead.full_name || null,
          phone: lead.phone || null,
          user_id: null,
          subscribed: false,
          subscribed_at: null,
        });
      } else {
        const existing = emailMap.get(lead.email)!;
        if (!existing.full_name && lead.full_name) existing.full_name = lead.full_name;
        if (!existing.phone && lead.phone) existing.phone = lead.phone;
      }
    }

    // 2. Get journey events for behavioral analysis
    const { data: journeyEvents } = await supabase
      .from("user_journey_events")
      .select("user_id, session_id, event_type, page_path, event_data, device_type, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    // 3. Get activity logs
    const { data: activityLogs } = await supabase
      .from("user_activity_log")
      .select("lead_email, event_type, activity_data, page_path, created_at")
      .limit(1000);

    // Build per-email behavioral stats from activity logs
    const behaviorByEmail = new Map<string, {
      sessions: Set<string>;
      pages: string[];
      device: string;
      lastActive: string;
      totalTime: number;
      areas: string[];
      projects: string[];
      tools: string[];
      inquiries: number;
      views: number;
      searches: { budgets: number[]; bedrooms: string[]; types: string[] };
    }>();

    const getOrCreate = (email: string) => {
      if (!behaviorByEmail.has(email)) {
        behaviorByEmail.set(email, {
          sessions: new Set(),
          pages: [],
          device: "unknown",
          lastActive: "",
          totalTime: 0,
          areas: [],
          projects: [],
          tools: [],
          inquiries: 0,
          views: 0,
          searches: { budgets: [], bedrooms: [], types: [] },
        });
      }
      return behaviorByEmail.get(email)!;
    };

    // Process activity logs
    for (const log of activityLogs || []) {
      if (!log.lead_email) continue;
      const b = getOrCreate(log.lead_email);
      if (log.page_path) b.pages.push(log.page_path);
      if (log.created_at > b.lastActive) b.lastActive = log.created_at;

      const data = log.activity_data as Record<string, unknown> | null;
      if (data) {
        if (data.duration_seconds) b.totalTime += Number(data.duration_seconds);
        if (data.tool_name) b.tools.push(String(data.tool_name));
      }

      if (log.event_type === "inquiry" || log.event_type === "form_submission") b.inquiries++;
      if (log.event_type === "page_view") b.views++;
    }

    // Process journey events (match by user_id to email where possible)
    const userIdToEmail = new Map<string, string>();
    for (const [email, data] of emailMap) {
      if (data.user_id) userIdToEmail.set(data.user_id, email);
    }

    for (const evt of journeyEvents || []) {
      const email = evt.user_id ? userIdToEmail.get(evt.user_id) : null;
      if (!email) continue;
      const b = getOrCreate(email);
      if (evt.session_id) b.sessions.add(evt.session_id);
      if (evt.device_type) b.device = evt.device_type;
      if (evt.created_at > b.lastActive) b.lastActive = evt.created_at;
      if (evt.page_path) {
        b.pages.push(evt.page_path);
        // Extract area from URL like /community/xxx or /area/xxx
        const areaMatch = evt.page_path.match(/\/(community|area)\/([^/?]+)/);
        if (areaMatch) b.areas.push(areaMatch[2]);
        const projectMatch = evt.page_path.match(/\/project\/([^/?]+)/);
        if (projectMatch) b.projects.push(projectMatch[1]);
      }

      const data = evt.event_data as Record<string, unknown> | null;
      if (data) {
        if (data.tool_name) b.tools.push(String(data.tool_name));
        if (data.search_query) {
          // Try to extract budget info
          const priceMatch = String(data.search_query).match(/(\d[\d,.]+)/);
          if (priceMatch) b.searches.budgets.push(parseFloat(priceMatch[1].replace(/,/g, "")));
        }
        if (data.bedrooms) b.searches.bedrooms.push(String(data.bedrooms));
        if (data.property_type) b.searches.types.push(String(data.property_type));
      }

      if (evt.event_type === "property_view") b.views++;
      if (evt.event_type === "inquiry") b.inquiries++;
    }

    // 4. Compute summaries and upsert
    let processed = 0;
    for (const [email, info] of emailMap) {
      const behavior = behaviorByEmail.get(email);

      // Compute engagement score (0-100)
      let engagementScore = 0;
      if (behavior) {
        const sessionBonus = Math.min(behavior.sessions.size * 10, 30);
        const viewBonus = Math.min(behavior.views * 2, 20);
        const inquiryBonus = Math.min(behavior.inquiries * 15, 30);
        const toolBonus = Math.min(behavior.tools.length * 5, 20);
        engagementScore = Math.min(sessionBonus + viewBonus + inquiryBonus + toolBonus, 100);
      }

      // Intent score
      let intentScore = "low";
      if (behavior && behavior.inquiries >= 2) intentScore = "high";
      else if (behavior && (behavior.inquiries >= 1 || behavior.views >= 5)) intentScore = "medium";

      // Segment tag
      let segmentTag = "Passive Browser";
      if (behavior) {
        const avgBudget = behavior.searches.budgets.length > 0
          ? behavior.searches.budgets.reduce((a, b) => a + b, 0) / behavior.searches.budgets.length
          : 0;
        if (avgBudget > 5000000) segmentTag = "Luxury Buyer";
        else if (avgBudget > 1000000) segmentTag = "Mid-Market Investor";
        else if (behavior.pages.some(p => p.includes("off-plan") || p.includes("handover"))) segmentTag = "Off-Plan Focused";
        else if (behavior.pages.some(p => p.includes("rent") || p.includes("rental"))) segmentTag = "Rental Yield Investor";
        else if (intentScore !== "low") segmentTag = "End User Buyer";
      }

      // Top areas / projects (unique, top 3)
      const topAreas = behavior ? [...new Set(behavior.areas)].slice(0, 3).join(", ") : null;
      const topProjects = behavior ? [...new Set(behavior.projects)].slice(0, 3).join(", ") : null;
      const toolsUsed = behavior ? [...new Set(behavior.tools)].slice(0, 5).join(", ") : null;

      // Budget estimate
      const avgBudget = behavior && behavior.searches.budgets.length > 0
        ? Math.round(behavior.searches.budgets.reduce((a, b) => a + b, 0) / behavior.searches.budgets.length)
        : null;

      const preferredBedrooms = behavior && behavior.searches.bedrooms.length > 0
        ? [...new Set(behavior.searches.bedrooms)].slice(0, 2).join(", ")
        : null;

      const preferredPropertyType = behavior && behavior.searches.types.length > 0
        ? [...new Set(behavior.searches.types)].slice(0, 2).join(", ")
        : null;

      const summary: Record<string, unknown> = {
        email,
        full_name: info.full_name,
        phone: info.phone,
        user_id: info.user_id,
        subscribed: info.subscribed,
        subscribed_at: info.subscribed_at,
        last_active_at: behavior?.lastActive || null,
        device_type: behavior?.device || null,
        sessions_count: behavior?.sessions.size || 0,
        avg_time_on_site: behavior ? Math.round(behavior.totalTime) : 0,
        top_areas: topAreas,
        top_projects: topProjects,
        avg_budget_estimate: avgBudget ? `AED ${avgBudget.toLocaleString()}` : null,
        preferred_bedrooms: preferredBedrooms,
        preferred_property_type: preferredPropertyType,
        viewed_count: behavior?.views || 0,
        saved_count: 0,
        inquiries_count: behavior?.inquiries || 0,
        tools_used: toolsUsed,
        intent_score: intentScore,
        engagement_score: engagementScore,
        segment_tag: segmentTag,
        recommended_campaign_tag: segmentTag,
        ai_summary: `${info.full_name || "User"} — ${segmentTag}, ${intentScore} intent, ${engagementScore}/100 engagement`,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_profile_summaries")
        .upsert(summary, { onConflict: "email" });

      if (error) {
        console.error(`[summarize] Error upserting ${email}:`, error.message);
      } else {
        processed++;
      }
    }

    console.log(`[summarize-user-profiles] Processed ${processed} users`);

    return new Response(
      JSON.stringify({ success: true, processed }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("[summarize-user-profiles] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
