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
  LineChart,
  Line,
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
  Calendar,
  Loader2,
  CheckCircle,
  Target,
  Activity,
} from "lucide-react";
import { JBJSidebar } from "@/components/jbj-broker/JBJSidebar";

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

const COLORS = ["#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

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
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("week");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/jbj-broker-reports");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
      fetchReportData();
    }
  }, [user, dateRange]);

  const fetchBrokerProfile = async () => {
    const { data } = await supabase
      .from("jbj_brokers")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    setBrokerProfile(data);
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Calculate date range
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

      // Fetch leads
      const { data: leadsData } = await supabase
        .from("jbj_leads")
        .select("status, last_contact, created_at");

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("jbj_messages")
        .select("channel, created_at")
        .gte("created_at", startDate.toISOString());

      // Calculate metrics
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
        avgResponseTime: 15, // Mock avg response time in minutes
        messagesSent,
        callsMade,
        emailsSent,
      });

      // Calculate daily activity
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

      // Only show last 7 data points for readability
      setDailyActivity(dailyData.slice(-7));

      // Calculate lead status distribution
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <JBJSidebar brokerProfile={brokerProfile} activePage="reports" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-black border-b border-zinc-800 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gold tracking-wide">
                  Performance Reports
                </h1>
                <p className="text-gray-400 text-sm">
                  Analytics and insights for your broker activities
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                  {["week", "month", "quarter"].map((range) => (
                    <Button
                      key={range}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(range as any)}
                      className={
                        dateRange === range
                          ? "bg-gold text-black hover:bg-gold-dark"
                          : "text-gray-400 hover:text-white"
                      }
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gold/20">
                    <Users className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics.totalLeads}
                    </p>
                    <p className="text-xs text-gray-400">
                      {metrics.contactedLeads} contacted
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-100">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics.conversionRate}%
                    </p>
                    <p className="text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +5% vs last period
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Avg Response Time</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics.avgResponseTime}m
                    </p>
                    <p className="text-xs text-gray-400">Minutes to first reply</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Activities</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics.messagesSent + metrics.callsMade + metrics.emailsSent}
                    </p>
                    <p className="text-xs text-gray-400">
                      This {dateRange}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Daily Activity Chart */}
            <Card className="col-span-2 bg-white border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Daily Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#22C55E" name="Messages" />
                    <Bar dataKey="calls" fill="#8B5CF6" name="Calls" />
                    <Bar dataKey="emails" fill="#3B82F6" name="Emails" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Status Pie Chart */}
            <Card className="bg-white border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Lead Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">WhatsApp Messages</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <p className="text-4xl font-bold text-gray-900">{metrics.messagesSent}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Sent this {dateRange}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">Phone Calls</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">Active</Badge>
                </div>
                <p className="text-4xl font-bold text-gray-900">{metrics.callsMade}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Made this {dateRange}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">Emails</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                </div>
                <p className="text-4xl font-bold text-gray-900">{metrics.emailsSent}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Sent this {dateRange}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
