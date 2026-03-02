import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Phone, MessageSquare, TrendingUp, Eye, Mail, Calendar, Target, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EmployeeProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  job_title: string | null;
  photo_url: string | null;
  is_active: boolean;
}

interface DailyMetrics {
  id: string;
  employee_id: string | null;
  user_id: string | null;
  metric_date: string;
  total_hours_worked: number;
  calls_made: number;
  emails_sent: number;
  chats_handled: number;
  leads_contacted: number;
  tasks_completed: number;
  meetings_attended: number;
  documents_processed: number;
  performance_score: number | null;
}

interface PerformanceSummary {
  user_id: string;
  month: string;
  total_logins: number | null;
  total_active_hours: number | null;
  leads_handled: number | null;
  leads_converted: number | null;
  conversion_rate: number | null;
  calls_made: number | null;
  messages_sent: number | null;
  deals_closed: number | null;
  revenue_generated: number | null;
  activity_score_avg: number | null;
}

interface RealActivityData {
  callsByUser: Record<string, number>;
  chatsByUser: Record<string, number>;
  leadUpdatesByUser: Record<string, number>;
}

export function EmployeePerformanceDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [summaries, setSummaries] = useState<PerformanceSummary[]>([]);
  const [realActivity, setRealActivity] = useState<RealActivityData>({ callsByUser: {}, chatsByUser: {}, leadUpdatesByUser: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const [empRes, metricsRes, summaryRes, callsRes, chatsRes] = await Promise.all([
        supabase.from("crm_users_profile").select("id, user_id, display_name, email, job_title, photo_url, is_active").eq("is_active", true),
        supabase.from("employee_daily_metrics").select("*").order("metric_date", { ascending: false }).limit(500),
        supabase.from("employee_performance_summary").select("*").order("month", { ascending: false }).limit(50),
        // Real activity: calls from broker_call_logs
        supabase.from("broker_call_logs").select("user_id, id").gte("created_at", thirtyDaysAgoStr),
        // Real activity: chats from broker_chat_logs
        supabase.from("broker_chat_logs").select("user_id, id, message_count").gte("created_at", thirtyDaysAgoStr),
      ]);

      setEmployees(empRes.data || []);
      setDailyMetrics(metricsRes.data || []);
      setSummaries(summaryRes.data || []);

      // Aggregate real activity data by user
      const callsByUser: Record<string, number> = {};
      (callsRes.data || []).forEach((c: any) => {
        callsByUser[c.user_id] = (callsByUser[c.user_id] || 0) + 1;
      });

      const chatsByUser: Record<string, number> = {};
      (chatsRes.data || []).forEach((c: any) => {
        chatsByUser[c.user_id] = (chatsByUser[c.user_id] || 0) + (c.message_count || 1);
      });

      setRealActivity({ callsByUser, chatsByUser, leadUpdatesByUser: {} });
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Aggregate today's metrics
  const today = new Date().toISOString().split("T")[0];
  const todayMetrics = dailyMetrics.filter(m => m.metric_date === today);
  
  // Combine recorded metrics + real activity
  const totalCallsAllUsers = Object.values(realActivity.callsByUser).reduce((s, v) => s + v, 0);
  const totalChatsAllUsers = Object.values(realActivity.chatsByUser).reduce((s, v) => s + v, 0);
  
  const totalHoursToday = todayMetrics.reduce((s, m) => s + (m.total_hours_worked || 0), 0);
  const totalCallsToday = todayMetrics.reduce((s, m) => s + (m.calls_made || 0), 0) || totalCallsAllUsers;
  const totalMessagesToday = todayMetrics.reduce((s, m) => s + (m.emails_sent || 0) + (m.chats_handled || 0), 0) || totalChatsAllUsers;
  const totalLeadsToday = todayMetrics.reduce((s, m) => s + (m.leads_contacted || 0), 0);

  const getEmployeeMetrics = (userId: string) => {
    const empMetrics = dailyMetrics.filter(m => m.user_id === userId);
    const empSummary = summaries.find(s => s.user_id === userId);
    
    // Merge real activity data
    const realCalls = realActivity.callsByUser[userId] || 0;
    const realChats = realActivity.chatsByUser[userId] || 0;
    
    const metricCalls = empMetrics.reduce((s, m) => s + (m.calls_made || 0), 0);
    const metricEmails = empMetrics.reduce((s, m) => s + (m.emails_sent || 0), 0);
    const metricChats = empMetrics.reduce((s, m) => s + (m.chats_handled || 0), 0);
    
    return {
      totalHours: empMetrics.reduce((s, m) => s + (m.total_hours_worked || 0), 0),
      totalCalls: Math.max(metricCalls, realCalls),
      totalEmails: metricEmails,
      totalChats: Math.max(metricChats, realChats),
      totalLeads: empMetrics.reduce((s, m) => s + (m.leads_contacted || 0), 0),
      totalTasks: empMetrics.reduce((s, m) => s + (m.tasks_completed || 0), 0),
      totalMeetings: empMetrics.reduce((s, m) => s + (m.meetings_attended || 0), 0),
      avgScore: empMetrics.filter(m => m.performance_score != null).reduce((s, m, _, a) => s + (m.performance_score || 0) / a.length, 0),
      daysTracked: empMetrics.length,
      summary: empSummary,
      hasRealActivity: realCalls > 0 || realChats > 0,
    };
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours Today</p>
                <p className="text-2xl font-bold text-foreground">{totalHoursToday > 0 ? `${Math.floor(totalHoursToday)}h ${Math.round((totalHoursToday % 1) * 60)}m` : "0h 0m"}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calls Made (30d)</p>
                <p className="text-2xl font-bold text-foreground">{totalCallsToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages Sent (30d)</p>
                <p className="text-2xl font-bold text-foreground">{totalMessagesToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Contacted</p>
                <p className="text-2xl font-bold text-foreground">{totalLeadsToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance List */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-gold" />
            Employee Performance Overview
            <Badge className="ml-2 bg-gold/20 text-gold border-gold/30">{employees.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active employees found</p>
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => {
                const metrics = getEmployeeMetrics(emp.user_id);
                const score = metrics.avgScore || (metrics.summary?.activity_score_avg ?? 0);
                const isExpanded = selectedEmployee === emp.id;

                return (
                  <div key={emp.id} className="border border-gold/20 rounded-xl overflow-hidden bg-white/60 hover:bg-white/80 transition-all">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setSelectedEmployee(isExpanded ? null : emp.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border-2 border-gold/40">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.display_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="font-bold text-gold text-lg">{emp.display_name?.charAt(0) || "?"}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{emp.display_name}</p>
                          <p className="text-sm text-muted-foreground">{emp.job_title || "Employee"}</p>
                          {metrics.hasRealActivity && (
                            <Badge variant="outline" className="text-[10px] mt-1 border-emerald-500/40 text-emerald-600">Live Data</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Calls</p>
                            <p className="font-semibold text-foreground">{metrics.totalCalls}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Chats</p>
                            <p className="font-semibold text-foreground">{metrics.totalChats}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Leads</p>
                            <p className="font-semibold text-foreground">{metrics.totalLeads}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Tasks</p>
                            <p className="font-semibold text-foreground">{metrics.totalTasks}</p>
                          </div>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <div className={`text-xl font-bold ${score > 0 ? getPerformanceColor(score) : "text-muted-foreground"}`}>
                            {score > 0 ? `${Math.round(score)}%` : "—"}
                          </div>
                          <p className="text-xs text-muted-foreground">{score > 0 ? getPerformanceLabel(score) : "No data"}</p>
                        </div>

                        <Eye className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-90 text-gold" : "text-muted-foreground"}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gold/20 p-4 bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7]/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <MetricCard icon={<Clock className="h-4 w-4" />} label="Total Hours" value={`${metrics.totalHours.toFixed(1)}h`} />
                          <MetricCard icon={<Phone className="h-4 w-4" />} label="Calls Made" value={String(metrics.totalCalls)} />
                          <MetricCard icon={<MessageSquare className="h-4 w-4" />} label="Chats" value={String(metrics.totalChats)} />
                          <MetricCard icon={<Mail className="h-4 w-4" />} label="Emails Sent" value={String(metrics.totalEmails)} />
                          <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Leads Contacted" value={String(metrics.totalLeads)} />
                          <MetricCard icon={<Target className="h-4 w-4" />} label="Tasks Completed" value={String(metrics.totalTasks)} />
                          <MetricCard icon={<Calendar className="h-4 w-4" />} label="Meetings" value={String(metrics.totalMeetings)} />
                          <MetricCard icon={<BarChart3 className="h-4 w-4" />} label="Days Tracked" value={String(metrics.daysTracked)} />
                        </div>

                        {metrics.summary && (
                          <div className="mt-4 p-3 rounded-lg bg-white/60 border border-gold/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Monthly Summary</p>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                              <div><p className="text-muted-foreground">Logins</p><p className="font-bold text-foreground">{metrics.summary.total_logins ?? 0}</p></div>
                              <div><p className="text-muted-foreground">Active Hrs</p><p className="font-bold text-foreground">{metrics.summary.total_active_hours?.toFixed(1) ?? 0}</p></div>
                              <div><p className="text-muted-foreground">Leads</p><p className="font-bold text-foreground">{metrics.summary.leads_handled ?? 0}</p></div>
                              <div><p className="text-muted-foreground">Converted</p><p className="font-bold text-foreground">{metrics.summary.leads_converted ?? 0}</p></div>
                              <div><p className="text-muted-foreground">Deals</p><p className="font-bold text-foreground">{metrics.summary.deals_closed ?? 0}</p></div>
                              <div><p className="text-muted-foreground">Revenue</p><p className="font-bold text-foreground">{metrics.summary.revenue_generated ? `$${(metrics.summary.revenue_generated / 1000).toFixed(0)}K` : "—"}</p></div>
                            </div>
                          </div>
                        )}

                        {metrics.daysTracked === 0 && !metrics.summary && !metrics.hasRealActivity && (
                          <p className="text-center text-sm text-muted-foreground mt-4 italic">
                            No performance data recorded yet. Activity will appear as they make calls, chats, and update leads.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/80 border border-gold/20">
      <div className="text-gold">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground text-sm">{value}</p>
      </div>
    </div>
  );
}
