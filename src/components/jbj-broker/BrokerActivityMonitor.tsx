import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Phone, 
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Send
} from "lucide-react";

interface BrokerStats {
  brokerId: string;
  brokerName: string;
  leadsContacted: number;
  messagesSent: number;
  callsMade: number;
  conversionRate: number;
  avgResponseTime: number;
  missedLeads: number;
}

export function BrokerActivityMonitor() {
  const [stats, setStats] = useState<BrokerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotals, setTodayTotals] = useState({
    totalLeads: 0,
    totalMessages: 0,
    totalCalls: 0,
    avgConversion: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch AI brokers
      const { data: brokers, error: brokersError } = await supabase
        .from("ai_brokers")
        .select("*")
        .eq("status", "active");

      if (brokersError) throw brokersError;

      // Fetch today's stats
      const today = new Date().toISOString().split("T")[0];
      const { data: dailyStats, error: statsError } = await supabase
        .from("broker_daily_stats")
        .select("*")
        .eq("stat_date", today);

      if (statsError) throw statsError;

      // Combine broker info with stats
      const combinedStats: BrokerStats[] = (brokers || []).map((broker) => {
        const brokerStat = dailyStats?.find((s) => s.broker_id === broker.id);
        return {
          brokerId: broker.id,
          brokerName: broker.name,
          leadsContacted: brokerStat?.leads_contacted || 0,
          messagesSent: brokerStat?.messages_sent || 0,
          callsMade: brokerStat?.calls_made || 0,
          conversionRate: brokerStat?.leads_converted 
            ? Math.round((brokerStat.leads_converted / (brokerStat.leads_contacted || 1)) * 100) 
            : 0,
          avgResponseTime: brokerStat?.avg_response_time_seconds || 0,
          missedLeads: brokerStat?.leads_escalated || 0
        };
      });

      setStats(combinedStats);

      // Calculate totals
      setTodayTotals({
        totalLeads: combinedStats.reduce((sum, s) => sum + s.leadsContacted, 0),
        totalMessages: combinedStats.reduce((sum, s) => sum + s.messagesSent, 0),
        totalCalls: combinedStats.reduce((sum, s) => sum + s.callsMade, 0),
        avgConversion: combinedStats.length > 0 
          ? Math.round(combinedStats.reduce((sum, s) => sum + s.conversionRate, 0) / combinedStats.length)
          : 0
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load activity monitor");
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("Stats refreshed");
  };

  const sendDailyReport = async () => {
    try {
      toast.loading("Sending daily report...");
      
      const { error } = await supabase.functions.invoke("broker-daily-report", {
        body: { manual: true }
      });

      if (error) throw error;
      
      toast.dismiss();
      toast.success("Daily report sent to Admin and Founder");
    } catch (error) {
      console.error("Error sending report:", error);
      toast.dismiss();
      toast.error("Failed to send daily report");
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 text-[#1A1A1A] animate-spin mx-auto" />
          <p className="text-[#1A1A1A]/70 mt-4">Loading activity monitor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white">Broker Activity Monitor</CardTitle>
              <p className="text-[#1A1A1A]/70 text-sm mt-1">
                Real-time performance tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={refreshing}
              className="border-[#1A1A1A] text-[#1A1A1A]/70"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={sendDailyReport}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A]"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-center">
            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{todayTotals.totalLeads}</div>
            <div className="text-xs text-[#1A1A1A]/70">Leads Contacted</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-center">
            <MessageSquare className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{todayTotals.totalMessages}</div>
            <div className="text-xs text-[#1A1A1A]/70">Messages Sent</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-center">
            <Phone className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{todayTotals.totalCalls}</div>
            <div className="text-xs text-[#1A1A1A]/70">Calls Made</div>
          </div>
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-center">
            <TrendingUp className="h-6 w-6 text-[#1A1A1A] mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#1A1A1A]">{todayTotals.avgConversion}%</div>
            <div className="text-xs text-[#1A1A1A]/70">Conversion Rate</div>
          </div>
        </div>

        {/* Individual Broker Stats */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#1A1A1A]/70">Broker Performance</h4>
          
          {stats.map((stat) => (
            <div
              key={stat.brokerId}
              className="p-4 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-[#1A1A1A] font-bold">
                    {stat.brokerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{stat.brokerName}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        Active
                      </Badge>
                      {stat.missedLeads > 0 && (
                        <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {stat.missedLeads} escalated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Avg: {formatTime(stat.avgResponseTime)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-white">{stat.leadsContacted}</div>
                  <div className="text-xs text-[#1A1A1A]/70">Leads</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{stat.messagesSent}</div>
                  <div className="text-xs text-[#1A1A1A]/70">Messages</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{stat.callsMade}</div>
                  <div className="text-xs text-[#1A1A1A]/70">Calls</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#1A1A1A]">{stat.conversionRate}%</div>
                  <div className="text-xs text-[#1A1A1A]/70">Conversion</div>
                </div>
              </div>
            </div>
          ))}

          {stats.length === 0 && (
            <div className="text-center py-8 text-[#1A1A1A]/70">
              No active brokers found
            </div>
          )}
        </div>

        {/* Schedule Info */}
        <div className="p-3 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1A1A1A]" />
            <span className="text-sm text-[#1A1A1A]">
              Daily reports are automatically sent at 8:00 PM GST
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
