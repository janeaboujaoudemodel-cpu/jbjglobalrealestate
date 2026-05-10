import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, subDays } from "date-fns";
import { Loader2, TrendingUp, Users, MessageSquare, Mail, Phone } from "lucide-react";

interface BrokerDailyStats {
  stat_date: string;
  messages_sent: number;
  messages_received: number;
  leads_contacted: number;
  leads_converted: number;
  leads_escalated: number;
  emails_sent: number;
  calls_made: number;
  avg_response_time_seconds: number;
}

interface AIBrokerStatsDialogProps {
  brokerId: string | null;
  brokerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_COLORS = ["#A8925A", "#059669", "#3B82F6", "#8B5CF6", "#F59E0B"];

export function AIBrokerStatsDialog({
  brokerId,
  brokerName,
  open,
  onOpenChange,
}: AIBrokerStatsDialogProps) {
  const [stats, setStats] = useState<BrokerDailyStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (brokerId && open) {
      fetchStats();
    }
  }, [brokerId, open]);

  const fetchStats = async () => {
    if (!brokerId) return;
    setLoading(true);
    try {
      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("broker_daily_stats")
        .select("*")
        .eq("broker_id", brokerId)
        .gte("stat_date", startDate)
        .order("stat_date", { ascending: true });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error("Error fetching broker stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = stats.reduce(
    (acc, day) => ({
      messages_sent: acc.messages_sent + (day.messages_sent || 0),
      messages_received: acc.messages_received + (day.messages_received || 0),
      leads_contacted: acc.leads_contacted + (day.leads_contacted || 0),
      leads_converted: acc.leads_converted + (day.leads_converted || 0),
      leads_escalated: acc.leads_escalated + (day.leads_escalated || 0),
      emails_sent: acc.emails_sent + (day.emails_sent || 0),
      calls_made: acc.calls_made + (day.calls_made || 0),
    }),
    {
      messages_sent: 0,
      messages_received: 0,
      leads_contacted: 0,
      leads_converted: 0,
      leads_escalated: 0,
      emails_sent: 0,
      calls_made: 0,
    }
  );

  const conversionRate =
    totals.leads_contacted > 0
      ? ((totals.leads_converted / totals.leads_contacted) * 100).toFixed(1)
      : "0";

  const channelData = [
    { name: "WhatsApp", value: totals.messages_sent },
    { name: "Email", value: totals.emails_sent },
    { name: "Calls", value: totals.calls_made },
  ];

  const chartData = stats.map((day) => ({
    date: format(new Date(day.stat_date), "MMM dd"),
    messages: day.messages_sent || 0,
    leads: day.leads_contacted || 0,
    conversions: day.leads_converted || 0,
    responseTime: Math.round((day.avg_response_time_seconds || 0) / 60),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Analytics: {brokerName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="bg-[#1A1A1A] border-[#1A1A1A]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1A1A1A]/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Leads Contacted</span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {totals.leads_contacted}
                  </p>
                </div>
                <div className="bg-[#1A1A1A]/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Conversions</span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {totals.leads_converted}
                  </p>
                  <p className="text-emerald-500 text-sm">{conversionRate}% rate</p>
                </div>
                <div className="bg-[#1A1A1A]/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Messages Sent</span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {totals.messages_sent}
                  </p>
                </div>
                <div className="bg-[#1A1A1A]/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Emails Sent</span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {totals.emails_sent}
                  </p>
                </div>
              </div>

              {/* Channel Distribution */}
              <div className="bg-[#1A1A1A]/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Channel Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#27272a",
                          border: "1px solid #3f3f46",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-4">
              {/* Daily Activity Chart */}
              <div className="bg-[#1A1A1A]/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">
                  Daily Activity (Last 30 Days)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#27272a",
                          border: "1px solid #3f3f46",
                        }}
                      />
                      <Bar
                        dataKey="messages"
                        fill="#A8925A"
                        name="Messages"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="leads"
                        fill="#3B82F6"
                        name="Leads"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-4">
              {/* Conversion Trend */}
              <div className="bg-[#1A1A1A]/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Conversion Trend</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#27272a",
                          border: "1px solid #3f3f46",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conversions"
                        stroke="#059669"
                        strokeWidth={2}
                        name="Conversions"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="leads"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name="Leads"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response Time Trend */}
              <div className="bg-[#1A1A1A]/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">
                  Average Response Time (minutes)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#27272a",
                          border: "1px solid #3f3f46",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Response Time"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
