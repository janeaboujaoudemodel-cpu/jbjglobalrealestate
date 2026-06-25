import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageSquare, Calendar, Users, TrendingUp, CheckCircle, Clock, Target, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconTile } from "@/components/ui/icon-tile";

interface CRMDashboardCardsProps {
  userId: string;
  hasOwnerAccess: boolean;
}

interface Stats {
  callsToday: number;
  callsWeek: number;
  callsMonth: number;
  whatsappSent: number; // Only when message actually sent
  whatsappWeek: number;
  followupsCreated: number;
  followupsCompleted: number;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  staleLeads: number;
  conversionRate: number;
  responseRate: number;
  pipelineCounts: Record<string, number>;
}

const CRMDashboardCards = ({ userId, hasOwnerAccess }: CRMDashboardCardsProps) => {
  const [stats, setStats] = useState<Stats>({
    callsToday: 0,
    callsWeek: 0,
    callsMonth: 0,
    whatsappSent: 0,
    whatsappWeek: 0,
    followupsCreated: 0,
    followupsCompleted: 0,
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    staleLeads: 0,
    conversionRate: 0,
    responseRate: 0,
    pipelineCounts: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId, hasOwnerAccess]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Build query based on admin status
      let callsQuery = supabase.from("crm_calls").select("id, started_at, duration_seconds, outcome", { count: "exact" });
      let activitiesQuery = supabase.from("crm_activities").select("id, activity_type, created_at, metadata");
      let statesQuery = supabase.from("crm_lead_state_per_user").select("pipeline_status, last_touch_at");

      if (!hasOwnerAccess) {
        callsQuery = callsQuery.eq("user_id", userId);
        activitiesQuery = activitiesQuery.eq("user_id", userId);
        statesQuery = statesQuery.eq("user_id", userId);
      }

      const [callsRes, activitiesRes, statesRes] = await Promise.all([
        callsQuery,
        activitiesQuery,
        statesQuery
      ]);

      const calls = callsRes.data || [];
      const activities = activitiesRes.data || [];
      const states = statesRes.data || [];

      // Calculate call stats - ONLY count calls that were actually made (with duration > 0)
      const actualCalls = calls.filter(c => (c.duration_seconds || 0) > 0);
      const callsToday = actualCalls.filter(c => c.started_at >= todayStart).length;
      const callsWeek = actualCalls.filter(c => c.started_at >= weekStart).length;
      const callsMonth = actualCalls.filter(c => c.started_at >= monthStart).length;

      // Calculate WhatsApp stats - count whatsapp_click activities
      const whatsappActivities = activities.filter(a => 
        a.activity_type === 'whatsapp_click'
      );
      const whatsappSent = whatsappActivities.filter(a => a.created_at >= todayStart).length;
      const whatsappWeek = whatsappActivities.filter(a => a.created_at >= weekStart).length;

      // Calculate followup stats
      const followupsCreated = activities.filter(a => a.activity_type === 'followup_created').length;
      const followupsCompleted = activities.filter(a => a.activity_type === 'followup_completed').length;

      // Calculate pipeline counts and lead scoring
      const pipelineCounts: Record<string, number> = {};
      let hotLeads = 0;
      let warmLeads = 0;
      let coldLeads = 0;
      let staleLeads = 0;
      
      // Scoring based on REAL engagement - not clicks
      states.forEach(s => {
        const status = s.pipeline_status || 'new';
        pipelineCounts[status] = (pipelineCounts[status] || 0) + 1;
        
        // Check if stale (no contact in 7 days)
        if (s.last_touch_at && new Date(s.last_touch_at) < new Date(sevenDaysAgo)) {
          staleLeads++;
        }
        
        // Lead temperature based on pipeline status (verified engagement)
        const hotStatuses = ['interested', 'qualified', 'negotiation', 'viewing', 'viewing_done'];
        const warmStatuses = ['contacted', 'callback', 'followup'];
        const coldStatuses = ['new', 'no_answer'];
        
        if (hotStatuses.includes(status)) hotLeads++;
        else if (warmStatuses.includes(status)) warmLeads++;
        else if (coldStatuses.includes(status)) coldLeads++;
      });

      // Calculate conversion rate - ONLY from verified closed deals
      const wonCount = pipelineCounts['closed_won'] || 0;
      const lostCount = pipelineCounts['closed_lost'] || 0;
      const totalClosed = wonCount + lostCount;
      const conversionRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

      // Calculate response rate - leads that responded after contact
      const contactedCount = states.filter(s => 
        s.pipeline_status && s.pipeline_status !== 'new'
      ).length;
      const responseRate = states.length > 0 ? (contactedCount / states.length) * 100 : 0;

      setStats({
        callsToday,
        callsWeek,
        callsMonth,
        whatsappSent,
        whatsappWeek,
        followupsCreated,
        followupsCompleted,
        totalLeads: states.length,
        hotLeads,
        warmLeads,
        coldLeads,
        staleLeads,
        conversionRate,
        responseRate,
        pipelineCounts
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Calls Made",
      value: stats.callsToday,
      subValue: `${stats.callsWeek} this week`,
      icon: Phone,
      tooltip: "Only counts calls with recorded duration"
    },
    {
      title: "WhatsApp Sent",
      value: stats.whatsappSent,
      subValue: `${stats.whatsappWeek} this week`,
      icon: MessageSquare,
      tooltip: "Only counts messages actually sent"
    },
    {
      title: "Follow-ups",
      value: stats.followupsCreated,
      subValue: `${stats.followupsCompleted} completed`,
      icon: Calendar,
      tooltip: "Tasks created and completed"
    },
    {
      title: "Total Leads",
      value: stats.totalLeads,
      subValue: `${stats.pipelineCounts['qualified'] || 0} qualified`,
      icon: Users,
      tooltip: "All leads in pipeline"
    },
    {
      title: "Hot Leads",
      value: stats.hotLeads,
      subValue: "High engagement",
      icon: Target,
      tooltip: "Interested, Qualified, Negotiation stages"
    },
    {
      title: "Warm Leads",
      value: stats.warmLeads,
      subValue: "Follow-up needed",
      icon: TrendingUp,
      tooltip: "Contacted, Callback, Follow-up stages"
    },
    {
      title: "Cold Leads",
      value: stats.coldLeads,
      subValue: "New or no answer",
      icon: Clock,
      tooltip: "New leads or no response yet"
    },
    {
      title: "Stale Leads",
      value: stats.staleLeads,
      subValue: "No contact 7+ days",
      icon: AlertTriangle,
      tooltip: "Leads with no activity for 7+ days"
    }
  ];

  // Additional metrics row
  const metricsCards = [
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      subValue: "Won vs Lost",
      icon: CheckCircle,
      tooltip: "Percentage of closed deals that were won"
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate.toFixed(1)}%`,
      subValue: "After first contact",
      icon: TrendingUp,
      tooltip: "Leads that responded after initial contact"
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="border-2 border-[#B89555]/30 bg-[#FDFBF7]/80 hover:shadow-md hover:shadow-[#B89555]/10 transition-all cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">
                      {card.title}
                    </CardTitle>
                    <IconTile icon={card.icon} tone="emerald" size="sm" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-[#1A1A1A]">
                      {loading ? "..." : card.value}
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/70 mt-0.5 whitespace-nowrap">
                      {loading ? "" : card.subValue}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricsCards.map((card, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="border-2 border-[#B89555]/30 bg-[#FDFBF7]/80 hover:shadow-md hover:shadow-[#B89555]/10 transition-all cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">
                      {card.title}
                    </CardTitle>
                    <IconTile icon={card.icon} tone="emerald" size="sm" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-[#1A1A1A]">
                      {loading ? "..." : card.value}
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/70 mt-0.5 whitespace-nowrap">
                      {loading ? "" : card.subValue}
                    </p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CRMDashboardCards;
