import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, MessageSquare, Calendar, Users, TrendingUp, CheckCircle,
  Target, Clock, Zap, Award, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

interface EnhancedDashboardProps {
  userId: string;
  hasOwnerAccess: boolean;
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
  conversionRate: number;
  avgResponseTime: number;
  weeklyTrend: { day: string; calls: number; whatsapp: number }[];
  pipelineData: { name: string; value: number; color: string }[];
  topPerformers: { name: string; score: number }[];
}

const PIPELINE_COLORS: Record<string, string> = {
  new: "#3B82F6",
  contacted: "#8B5CF6",
  interested: "#10B981",
  qualified: "#059669",
  negotiation: "#F59E0B",
  closed_won: "#22C55E",
  closed_lost: "#EF4444",
  junk: "#6B7280"
};

const CRMEnhancedDashboard = ({ userId, hasOwnerAccess }: EnhancedDashboardProps) => {
  const [stats, setStats] = useState<Stats>({
    callsToday: 0,
    callsWeek: 0,
    callsMonth: 0,
    whatsappToday: 0,
    whatsappWeek: 0,
    followupsCreated: 0,
    followupsCompleted: 0,
    totalLeads: 0,
    pipelineCounts: {},
    conversionRate: 0,
    avgResponseTime: 0,
    weeklyTrend: [],
    pipelineData: [],
    topPerformers: []
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

      let callsQuery = supabase.from("crm_calls").select("id, started_at", { count: "exact" });
      let activitiesQuery = supabase.from("crm_activities").select("id, activity_type, created_at");
      let statesQuery = supabase.from("crm_lead_state_per_user").select("pipeline_status");

      if (!hasOwnerAccess) {
        callsQuery = callsQuery.eq("user_id", userId);
        activitiesQuery = activitiesQuery.eq("user_id", userId);
        statesQuery = statesQuery.eq("user_id", userId);
      }

      const [callsRes, activitiesRes, statesRes, leadsCountRes] = await Promise.all([
        callsQuery,
        activitiesQuery,
        statesQuery,
        hasOwnerAccess
          ? supabase.from("crm_leads").select("id", { count: "exact", head: true })
          : Promise.resolve({ count: 0 } as any),
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

      // Total leads (no placeholders)
      const totalLeads = hasOwnerAccess ? (leadsCountRes.count || 0) : states.length;

      // Calculate conversion rate
      const totalClosed = (pipelineCounts['closed_won'] || 0) + (pipelineCounts['closed_lost'] || 0);
      const conversionRate = totalClosed > 0 
        ? Math.round((pipelineCounts['closed_won'] || 0) / totalClosed * 100)
        : 0;

      // Generate weekly trend data
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        
        weeklyTrend.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          calls: calls.filter(c => c.started_at >= dayStart && c.started_at < dayEnd).length,
          whatsapp: whatsappActivities.filter(a => a.created_at >= dayStart && a.created_at < dayEnd).length
        });
      }

      // Generate pipeline chart data
      const pipelineData = Object.entries(pipelineCounts).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: PIPELINE_COLORS[name] || "#6B7280"
      }));

      setStats({
        callsToday,
        callsWeek,
        callsMonth,
        whatsappToday,
        whatsappWeek,
        followupsCreated,
        followupsCompleted,
        totalLeads,
        pipelineCounts,
        conversionRate,
        avgResponseTime: 0,
        weeklyTrend,
        pipelineData,
        topPerformers: []
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const primaryCards = [
    {
      title: "Calls Today",
      value: stats.callsToday,
      subValue: `${stats.callsWeek} this week`,
      icon: Phone,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      trend: stats.callsToday > 0 ? "up" : "neutral"
    },
    {
      title: "WhatsApp Messages",
      value: stats.whatsappToday,
      subValue: `${stats.whatsappWeek} this week`,
      icon: MessageSquare,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      trend: stats.whatsappToday > 0 ? "up" : "neutral"
    },
    {
      title: "Total Leads",
      value: stats.totalLeads,
      subValue: `${stats.pipelineCounts['qualified'] || 0} qualified`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: "up"
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      subValue: "Won vs Lost",
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: stats.conversionRate > 50 ? "up" : "down"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
        {primaryCards.map((card, index) => (
          <Card key={index} className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-600 truncate">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg flex-shrink-0 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-xl md:text-2xl font-bold text-black truncate">
                    {loading ? "..." : card.value}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    {loading ? "" : card.subValue}
                  </p>
                </div>
                {card.trend === "up" && (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                )}
                {card.trend === "down" && (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Trend */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-black flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Weekly Activity
              <span className="text-xs font-normal text-zinc-500 ml-2">Your weekly activity summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyTrend}>
                  <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="whatsappGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e4e4e7',
                      borderRadius: '8px',
                      color: '#18181b'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#3B82F6" 
                    fill="url(#callsGradient)" 
                    name="Calls"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="whatsapp" 
                    stroke="#10B981" 
                    fill="url(#whatsappGradient)" 
                    name="WhatsApp"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Distribution */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-black flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pipelineData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#71717a', fontSize: 10 }} 
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e4e4e7',
                      borderRadius: '8px',
                      color: '#18181b'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.avgResponseTime}h</p>
                <p className="text-xs text-zinc-500">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.followupsCreated}</p>
                <p className="text-xs text-zinc-500">Follow-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.followupsCompleted}</p>
                <p className="text-xs text-zinc-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.pipelineCounts['closed_won'] || 0}</p>
                <p className="text-xs text-zinc-500">Deals Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMEnhancedDashboard;
