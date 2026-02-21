import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Users,
  Building2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Database,
  Globe,
  Lock,
  Eye,
  MessageSquare,
  FileText,
  Briefcase,
} from "lucide-react";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  auth: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
  edgeFunctions: "healthy" | "degraded" | "down";
}

interface QuickStat {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  href?: string;
}

interface RecentActivity {
  id: string;
  type: "security" | "lead" | "project" | "user" | "ai";
  title: string;
  description: string;
  timestamp: string;
  severity?: "info" | "warning" | "error" | "success";
}

export const AdminOverviewDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "healthy",
    auth: "healthy",
    storage: "healthy",
    edgeFunctions: "healthy",
  });
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalLeads: 0,
    totalBrokers: 0,
    aiInteractions: 0,
    blockedIPs: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    todayVisitors: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      // Get 24 hours ago timestamp
      const last24Hours = subDays(new Date(), 1).toISOString();

      const [
        projectsRes,
        leadsRes,
        brokersRes,
        blockedRes,
        aiLogsRes,
        pendingRes,
        visitorSessionsRes,
        visitorEventsRes,
      ] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("crm_leads").select("id", { count: "exact", head: true }),
        supabase.from("broker_profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ip_blocklist").select("id", { count: "exact", head: true }),
        supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }).gte("created_at", subDays(new Date(), 7).toISOString()),
        supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        // Real visitor session count (last 24h)
        supabase.from("visitor_sessions").select("id", { count: "exact", head: true }).gte("started_at", last24Hours),
        // Real visitor event count (last 24h)
        supabase.from("visitor_events").select("id", { count: "exact", head: true }).gte("created_at", last24Hours),
      ]);

      setStats({
        totalProjects: projectsRes.count || 0,
        totalLeads: leadsRes.count || 0,
        totalBrokers: brokersRes.count || 0,
        aiInteractions: aiLogsRes.count || 0,
        blockedIPs: blockedRes.count || 0,
        activeUsers: visitorSessionsRes.count || 0, // Real: visitor sessions (24h)
        pendingApprovals: pendingRes.count || 0,
        todayVisitors: visitorEventsRes.count || 0, // Real: visitor events (24h)
      });

      // Fetch recent activities (simulated from multiple sources)
      const activities: RecentActivity[] = [];

      // Get recent blocked IPs
      const { data: blockedData } = await supabase
        .from("ip_blocklist")
        .select("id, ip_address, reason, blocked_at")
        .order("blocked_at", { ascending: false })
        .limit(3);

      blockedData?.forEach((ip) => {
        activities.push({
          id: `blocked-${ip.id}`,
          type: "security",
          title: "IP Blocked",
          description: `${ip.ip_address} - ${ip.reason || "Manual block"}`,
          timestamp: ip.blocked_at,
          severity: "warning",
        });
      });

      // Get recent AI logs
      const { data: aiData } = await supabase
        .from("ai_usage_logs")
        .select("id, function_name, created_at, success")
        .order("created_at", { ascending: false })
        .limit(3);

      aiData?.forEach((log) => {
        activities.push({
          id: `ai-${log.id}`,
          type: "ai",
          title: "AI Interaction",
          description: log.function_name.replace(/-/g, " "),
          timestamp: log.created_at,
          severity: log.success ? "success" : "error",
        });
      });

      // Sort and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 8));

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const quickStats: QuickStat[] = useMemo(() => [
    {
      label: "Published Projects",
      value: stats.totalProjects,
      icon: <Building2 className="w-5 h-5" />,
      trend: "up",
      change: 12,
      href: "#properties",
    },
    {
      label: "Active Leads",
      value: stats.totalLeads,
      icon: <Users className="w-5 h-5" />,
      trend: "up",
      change: 8,
      href: "/admin/leads",
    },
    {
      label: "Active Brokers",
      value: stats.totalBrokers,
      icon: <Briefcase className="w-5 h-5" />,
      trend: "neutral",
      href: "#brokers",
    },
    {
      label: "AI Interactions (7d)",
      value: stats.aiInteractions,
      icon: <Brain className="w-5 h-5" />,
      trend: "up",
      change: 24,
      href: "#ai-analytics",
    },
    {
      label: "Blocked IPs",
      value: stats.blockedIPs,
      icon: <Shield className="w-5 h-5" />,
      trend: stats.blockedIPs > 10 ? "down" : "neutral",
      href: "#ip-blocklist",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <Clock className="w-5 h-5" />,
      trend: stats.pendingApprovals > 0 ? "down" : "neutral",
      href: "/listing-admin",
    },
  ], [stats]);

  const getHealthColor = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy": return "text-emerald-500";
      case "degraded": return "text-amber-500";
      case "down": return "text-red-500";
    }
  };

  const getHealthBg = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy": return "bg-emerald-500/10";
      case "degraded": return "bg-amber-500/10";
      case "down": return "bg-red-500/10";
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "security": return <Shield className="w-4 h-4" />;
      case "lead": return <Users className="w-4 h-4" />;
      case "project": return <Building2 className="w-4 h-4" />;
      case "user": return <Users className="w-4 h-4" />;
      case "ai": return <Brain className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: RecentActivity["severity"]) => {
    switch (severity) {
      case "success": return "text-emerald-500 bg-emerald-500/10";
      case "warning": return "text-amber-500 bg-amber-500/10";
      case "error": return "text-red-500 bg-red-500/10";
      default: return "text-blue-500 bg-blue-500/10";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Dashboard Overview</h2>
          <p className="text-zinc-500 text-sm">
            Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Panel - Champagne theme */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-black flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Database", status: systemHealth.database, icon: <Database className="w-5 h-5" /> },
              { name: "Auth", status: systemHealth.auth, icon: <Lock className="w-5 h-5" /> },
              { name: "Storage", status: systemHealth.storage, icon: <Server className="w-5 h-5" /> },
              { name: "Edge Functions", status: systemHealth.edgeFunctions, icon: <Zap className="w-5 h-5" /> },
            ].map((service) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl bg-white border-2 border-gold/20 shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div className={getHealthColor(service.status)}>{service.icon}</div>
                  <div>
                    <p className="text-black font-medium text-sm">{service.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === "healthy" ? "bg-emerald-500" :
                        service.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                      } animate-pulse`} />
                      <span className={`text-xs capitalize ${getHealthColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="bg-white border-2 border-gold/20 hover:border-gold/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl"
              onClick={() => stat.href?.startsWith("/") ? navigate(stat.href) : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                    {stat.icon}
                  </div>
                  {stat.trend && stat.change && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === "up" ? "text-emerald-600" : 
                      stat.trend === "down" ? "text-red-600" : "text-zinc-500"
                    }`}>
                      {stat.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                      {stat.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-black">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout: Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border-2 border-gold/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Manage Leads", icon: <Users className="w-4 h-4" />, href: "/admin/leads" },
                { label: "View Projects", icon: <Building2 className="w-4 h-4" />, href: "/admin" },
                { label: "Listing Admin", icon: <FileText className="w-4 h-4" />, href: "/listing-admin" },
                { label: "CRM Dashboard", icon: <MessageSquare className="w-4 h-4" />, href: "/admin/crm" },
                { label: "Brokers", icon: <Brain className="w-4 h-4" />, href: "/admin", tabValue: "ai-brokers" },
                { label: "Security Logs", icon: <Shield className="w-4 h-4" />, href: "/admin", tabValue: "security" },
                { label: "HR Hub", icon: <Users className="w-4 h-4" />, href: "/hr-dashboard" },
                { label: "IT Department", icon: <Server className="w-4 h-4" />, href: "/it-department" },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => navigate(action.href)}
                >
                  <span className="p-1.5 rounded bg-gold/10 text-gold mr-3">
                    {action.icon}
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="bg-white border-2 border-gold/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-gold" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <div className="divide-y divide-zinc-100">
                {recentActivities.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-4 hover:bg-zinc-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getSeverityColor(activity.severity)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black">{activity.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items Alert */}
      {stats.pendingApprovals > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-amber-50 border-2 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">
                      {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-amber-600">
                      New project imports require your review
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/listing-admin")}
                >
                  Review Now
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AdminOverviewDashboard;
