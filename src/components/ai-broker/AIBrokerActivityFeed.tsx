import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  TrendingUp,
  Users,
  Loader2,
  Activity,
} from "lucide-react";

interface DailyStat {
  id: string;
  stat_date: string;
  leads_contacted: number | null;
  messages_sent: number | null;
  emails_sent: number | null;
  calls_made: number | null;
  leads_converted: number | null;
  avg_response_time_seconds: number | null;
}

interface AIBrokerActivityFeedProps {
  brokerId: string;
}

export function AIBrokerActivityFeed({ brokerId }: AIBrokerActivityFeedProps) {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brokerId) {
      fetchStats();
    }
  }, [brokerId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("broker_daily_stats")
        .select("*")
        .eq("broker_id", brokerId)
        .order("stat_date", { ascending: false })
        .limit(14);

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatResponseTime = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  // Calculate totals
  const totals = stats.reduce(
    (acc, stat) => ({
      leads: acc.leads + (stat.leads_contacted || 0),
      messages: acc.messages + (stat.messages_sent || 0),
      emails: acc.emails + (stat.emails_sent || 0),
      calls: acc.calls + (stat.calls_made || 0),
      conversions: acc.conversions + (stat.leads_converted || 0),
    }),
    { leads: 0, messages: 0, emails: 0, calls: 0, conversions: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Leads</span>
            </div>
            <p className="text-white text-2xl font-bold">{totals.leads}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-1">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Messages</span>
            </div>
            <p className="text-white text-2xl font-bold">{totals.messages}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-1">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Emails</span>
            </div>
            <p className="text-white text-2xl font-bold">{totals.emails}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-1">
              <Phone className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Calls</span>
            </div>
            <p className="text-white text-2xl font-bold">{totals.calls}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 mb-1">
              <TrendingUp className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-sm">Conversions</span>
            </div>
            <p className="text-[#1A1A1A] text-2xl font-bold">{totals.conversions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1A1A1A]" />
            Activity History (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-[#1A1A1A]/70 mx-auto mb-4" />
              <p className="text-[#1A1A1A]/70">No activity recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="bg-[#1A1A1A]/50 rounded-lg p-4 border border-[#1A1A1A]/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">
                        {formatDate(stat.stat_date)}
                      </h3>
                      {stat.avg_response_time_seconds && (
                        <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]/70">
                          <Clock className="h-3 w-3 mr-1" />
                          Avg: {formatResponseTime(stat.avg_response_time_seconds)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-[#1A1A1A]/70 text-xs mb-1">Leads</p>
                        <p className="text-white font-semibold">
                          {stat.leads_contacted || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#1A1A1A]/70 text-xs mb-1">Messages</p>
                        <p className="text-emerald-400 font-semibold">
                          {stat.messages_sent || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#1A1A1A]/70 text-xs mb-1">Emails</p>
                        <p className="text-blue-400 font-semibold">
                          {stat.emails_sent || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#1A1A1A]/70 text-xs mb-1">Calls</p>
                        <p className="text-purple-400 font-semibold">
                          {stat.calls_made || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#1A1A1A]/70 text-xs mb-1">Converted</p>
                        <p className="text-[#1A1A1A] font-semibold">
                          {stat.leads_converted || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
