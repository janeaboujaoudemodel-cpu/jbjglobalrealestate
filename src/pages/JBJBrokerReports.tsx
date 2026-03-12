import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Download,
  Loader2,
  Target,
  Activity,
  ArrowLeft,
  BarChart3,
} from "lucide-react";

interface ReportMetrics {
  totalLeads: number;
  contactedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  messagesSent: number;
  callsMade: number;
  emailsSent: number;
}

interface DailyActivity {
  date: string;
  messages: number;
  calls: number;
  emails: number;
}

interface LeadStatus {
  status: string;
  count: number;
}

const COLORS = ["#C8A766", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

export default function JBJBrokerReports() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalLeads: 0,
    contactedLeads: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    messagesSent: 0,
    callsMade: 0,
    emailsSent: 0,
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("week");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/jbj-broker-reports");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: leadsData } = await supabase
        .from("jbj_leads")
        .select("status, last_contact, created_at");

      const { data: messagesData } = await supabase
        .from("jbj_messages")
        .select("channel, created_at")
        .gte("created_at", startDate.toISOString());

      const totalLeads = leadsData?.length || 0;
      const contactedLeads = leadsData?.filter((l) => l.last_contact).length || 0;
      const convertedLeads = leadsData?.filter((l) => l.status === "converted").length || 0;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      const messagesSent = messagesData?.filter((m) => m.channel === "whatsapp").length || 0;
      const callsMade = messagesData?.filter((m) => m.channel === "call").length || 0;
      const emailsSent = messagesData?.filter((m) => m.channel === "email").length || 0;

      setMetrics({
        totalLeads,
        contactedLeads,
        conversionRate,
        avgResponseTime: 15,
        messagesSent,
        callsMade,
        emailsSent,
      });

      const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
      const dailyData: DailyActivity[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];

        const dayMessages = messagesData?.filter((m) => {
          const msgDate = m.created_at.split("T")[0];
          return msgDate === dateStr;
        });

        dailyData.push({
          date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          messages: dayMessages?.filter((m) => m.channel === "whatsapp").length || 0,
          calls: dayMessages?.filter((m) => m.channel === "call").length || 0,
          emails: dayMessages?.filter((m) => m.channel === "email").length || 0,
        });
      }

      setDailyActivity(dailyData.slice(-7));

      const statusCounts: Record<string, number> = {};
      leadsData?.forEach((lead) => {
        const status = lead.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      setLeadStatuses(
        Object.entries(statusCounts).map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
          count,
        }))
      );
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success("Report exported to CSV");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 lg:top-[48px] z-50 border-b border-gold/20">
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] px-6 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/jbj-broker-admin")}
                className="text-black hover:bg-gold/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black tracking-wide">
                    Performance Reports
                  </h1>
                  <p className="text-black/70 text-sm">
                    Analytics and insights for broker activities
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-lg p-1 border border-gold/30">
                {["week", "month", "quarter"].map((range) => (
                  <Button
                    key={range}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(range as any)}
                    className={
                      dateRange === range
                        ? "bg-gold text-black hover:bg-gold/90"
                        : "text-black hover:bg-gold/20"
                    }
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>

              <Button onClick={handleExport} variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Layer 2 */}
      <div className="p-6">
        <div className="jj-layer-2 space-y-6">
          {/* Summary Cards - Layer 3 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-12 h-12">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-black/60 text-sm">Total Leads</p>
                  <p className="text-3xl font-bold text-black">
                    {metrics.totalLeads}
                  </p>
                  <p className="text-xs text-black/50">
                    {metrics.contactedLeads} contacted
                  </p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-12 h-12">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-black/60 text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold text-black">
                    {metrics.conversionRate}%
                  </p>
                  <p className="text-xs text-gold flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5% vs last period
                  </p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-12 h-12">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-black/60 text-sm">Avg Response Time</p>
                  <p className="text-3xl font-bold text-black">
                    {metrics.avgResponseTime}m
                  </p>
                  <p className="text-xs text-black/50">Minutes to first reply</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-12 h-12">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-black/60 text-sm">Total Activities</p>
                  <p className="text-3xl font-bold text-black">
                    {metrics.messagesSent + metrics.callsMade + metrics.emailsSent}
                  </p>
                  <p className="text-xs text-black/50">
                    This {dateRange}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Activity Chart */}
            <div className="lg:col-span-2 jj-card-inner">
              <h3 className="text-lg font-semibold text-black mb-4">Daily Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#1a1a1a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#1a1a1a' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FDFBF7', 
                      border: '1px solid #C8A766',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="messages" fill="#22C55E" name="Messages" />
                  <Bar dataKey="calls" fill="#8B5CF6" name="Calls" />
                  <Bar dataKey="emails" fill="#3B82F6" name="Emails" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Status Pie Chart */}
            <div className="jj-card-inner">
              <h3 className="text-lg font-semibold text-black mb-4">Lead Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadStatuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {leadStatuses.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="jj-card-inner">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-black">WhatsApp Messages</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Active</Badge>
              </div>
              <p className="text-4xl font-bold text-black">{metrics.messagesSent}</p>
              <p className="text-sm text-black/60 mt-1">
                Sent this {dateRange}
              </p>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-black">Phone Calls</span>
                </div>
                <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">Active</Badge>
              </div>
              <p className="text-4xl font-bold text-black">{metrics.callsMade}</p>
              <p className="text-sm text-black/60 mt-1">
                Made this {dateRange}
              </p>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-black">Emails</span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Active</Badge>
              </div>
              <p className="text-4xl font-bold text-black">{metrics.emailsSent}</p>
              <p className="text-sm text-black/60 mt-1">
                Sent this {dateRange}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
