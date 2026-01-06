import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageSquare, Calendar, Users, TrendingUp, CheckCircle } from "lucide-react";

interface CRMDashboardCardsProps {
  userId: string;
  isAdmin: boolean;
}

interface Stats {
  callsToday: number;
  callsWeek: number;
  callsMonth: number;
  whatsappToday: number;
  whatsappWeek: number;
  followupsCreated: number;
  followupsCompleted: number;
  totalLeads: number;
  pipelineCounts: Record<string, number>;
}

const CRMDashboardCards = ({ userId, isAdmin }: CRMDashboardCardsProps) => {
  const [stats, setStats] = useState<Stats>({
    callsToday: 0,
    callsWeek: 0,
    callsMonth: 0,
    whatsappToday: 0,
    whatsappWeek: 0,
    followupsCreated: 0,
    followupsCompleted: 0,
    totalLeads: 0,
    pipelineCounts: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId, isAdmin]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Build query based on admin status
      let callsQuery = supabase.from("crm_calls").select("id, started_at", { count: "exact" });
      let activitiesQuery = supabase.from("crm_activities").select("id, activity_type, created_at");
      let statesQuery = supabase.from("crm_lead_state_per_user").select("pipeline_status");

      if (!isAdmin) {
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

      // Calculate call stats
      const callsToday = calls.filter(c => c.started_at >= todayStart).length;
      const callsWeek = calls.filter(c => c.started_at >= weekStart).length;
      const callsMonth = calls.filter(c => c.started_at >= monthStart).length;

      // Calculate WhatsApp stats
      const whatsappActivities = activities.filter(a => a.activity_type === 'whatsapp_click');
      const whatsappToday = whatsappActivities.filter(a => a.created_at >= todayStart).length;
      const whatsappWeek = whatsappActivities.filter(a => a.created_at >= weekStart).length;

      // Calculate followup stats
      const followupsCreated = activities.filter(a => a.activity_type === 'followup_created').length;
      const followupsCompleted = activities.filter(a => a.activity_type === 'followup_completed').length;

      // Calculate pipeline counts
      const pipelineCounts: Record<string, number> = {};
      states.forEach(s => {
        pipelineCounts[s.pipeline_status] = (pipelineCounts[s.pipeline_status] || 0) + 1;
      });

      setStats({
        callsToday,
        callsWeek,
        callsMonth,
        whatsappToday,
        whatsappWeek,
        followupsCreated,
        followupsCompleted,
        totalLeads: states.length,
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
      title: "Calls Today",
      value: stats.callsToday,
      subValue: `${stats.callsWeek} this week`,
      icon: Phone,
      color: "text-green-500"
    },
    {
      title: "WhatsApp Clicks",
      value: stats.whatsappToday,
      subValue: `${stats.whatsappWeek} this week`,
      icon: MessageSquare,
      color: "text-emerald-500"
    },
    {
      title: "Follow-ups",
      value: stats.followupsCreated,
      subValue: `${stats.followupsCompleted} completed`,
      icon: Calendar,
      color: "text-blue-500"
    },
    {
      title: "Total Leads",
      value: stats.totalLeads,
      subValue: `${stats.pipelineCounts['qualified'] || 0} qualified`,
      icon: Users,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "" : card.subValue}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CRMDashboardCards;
