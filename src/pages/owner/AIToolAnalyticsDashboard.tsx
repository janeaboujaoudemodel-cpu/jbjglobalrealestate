/**
 * AI Tool Analytics & Owner Audit Intelligence Dashboard
 * Owner-only. 5 tabs: Overview, Rankings, User Analysis, Audit Intelligence, Change Impact.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Activity, Users, ShieldAlert, GitCompareArrows, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { AI_TOOLS_CONFIG } from "@/components/ai-tools/AIToolsProvider";
import { format, subDays, startOfDay } from "date-fns";

interface UsageEvent {
  id: string;
  tool_id: string;
  user_id: string;
  user_role: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  error_message: string | null;
  response_time_ms: number | null;
  created_at: string;
}

interface ToolStats {
  toolId: string;
  toolName: string;
  category: string;
  totalUses: number;
  uniqueUsers: number;
  successCount: number;
  failureCount: number;
  abandonedCount: number;
  avgResponseMs: number;
  failureRate: number;
  completionRate: number;
  healthScore: number;
}

interface UserToolStats {
  userId: string;
  userRole: string;
  totalUses: number;
  successCount: number;
  failureCount: number;
  lastUsed: string;
}

// Tool name resolver
const getToolName = (toolId: string): string => {
  const entry = Object.values(AI_TOOLS_CONFIG).find(t => t.function === toolId || t.id === toolId);
  return entry?.name || toolId;
};
const getToolCategory = (toolId: string): string => {
  const entry = Object.values(AI_TOOLS_CONFIG).find(t => t.function === toolId || t.id === toolId);
  return entry?.category || "Unknown";
};

// Health score calculation
function calcHealthScore(stats: { completionRate: number; failureRate: number; avgResponseMs: number }): number {
  const speedScore = Math.max(0, 100 - (stats.avgResponseMs / 100)); // 10s = 0
  const score =
    stats.completionRate * 0.35 +
    (1 - stats.failureRate) * 100 * 0.30 +
    Math.min(speedScore, 100) * 0.20 +
    100 * 0.15; // uptime assumed 100 client-side
  return Math.round(Math.min(100, Math.max(0, score)));
}

function HealthBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-green-600 text-white">{score}</Badge>;
  if (score >= 50) return <Badge className="bg-amber-500 text-white">{score}</Badge>;
  return <Badge variant="destructive">{score}</Badge>;
}

// Recommendation engine
function getRecommendations(stats: ToolStats[]): { toolId: string; toolName: string; recommendation: string; severity: "high" | "medium" | "low" }[] {
  const recs: { toolId: string; toolName: string; recommendation: string; severity: "high" | "medium" | "low" }[] = [];
  for (const s of stats) {
    if (s.failureRate > 0.15) recs.push({ toolId: s.toolId, toolName: s.toolName, recommendation: "High failure rate — review error handling and prompt logic", severity: "high" });
    if (s.avgResponseMs > 8000) recs.push({ toolId: s.toolId, toolName: s.toolName, recommendation: "Slow response — optimize model routing or reduce payload size", severity: "medium" });
    if (s.totalUses < 5) recs.push({ toolId: s.toolId, toolName: s.toolName, recommendation: "Very low usage — consider deprecation or UX improvement", severity: "low" });
    if (s.abandonedCount / Math.max(s.totalUses, 1) > 0.4) recs.push({ toolId: s.toolId, toolName: s.toolName, recommendation: "High abandonment — simplify input requirements", severity: "medium" });
    if (s.healthScore < 50) recs.push({ toolId: s.toolId, toolName: s.toolName, recommendation: "Critical health score — immediate review recommended", severity: "high" });
  }
  return recs.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
}

export default function AIToolAnalyticsDashboard() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_tool_usage_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      setEvents((data as UsageEvent[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  // Aggregate tool stats
  const toolStats = useMemo<ToolStats[]>(() => {
    const map = new Map<string, UsageEvent[]>();
    for (const e of events) {
      if (!map.has(e.tool_id)) map.set(e.tool_id, []);
      map.get(e.tool_id)!.push(e);
    }
    return Array.from(map.entries()).map(([toolId, evts]) => {
      const total = evts.length;
      const success = evts.filter(e => e.status === "success").length;
      const failure = evts.filter(e => e.status === "failure").length;
      const abandoned = evts.filter(e => e.status === "abandoned").length;
      const responseTimes = evts.filter(e => e.response_time_ms).map(e => e.response_time_ms!);
      const avgResp = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
      const failureRate = total ? failure / total : 0;
      const completionRate = total ? (success / total) * 100 : 100;
      const uniqueUsers = new Set(evts.map(e => e.user_id)).size;
      const health = calcHealthScore({ completionRate, failureRate, avgResponseMs: avgResp });
      return { toolId, toolName: getToolName(toolId), category: getToolCategory(toolId), totalUses: total, uniqueUsers, successCount: success, failureCount: failure, abandonedCount: abandoned, avgResponseMs: avgResp, failureRate, completionRate, healthScore: health };
    });
  }, [events]);

  // User-by-tool
  const userToolStats = useMemo(() => {
    const map = new Map<string, Map<string, UserToolStats>>();
    for (const e of events) {
      if (!map.has(e.tool_id)) map.set(e.tool_id, new Map());
      const userMap = map.get(e.tool_id)!;
      if (!userMap.has(e.user_id)) {
        userMap.set(e.user_id, { userId: e.user_id, userRole: e.user_role || "unknown", totalUses: 0, successCount: 0, failureCount: 0, lastUsed: e.created_at });
      }
      const u = userMap.get(e.user_id)!;
      u.totalUses++;
      if (e.status === "success") u.successCount++;
      if (e.status === "failure") u.failureCount++;
      if (e.created_at > u.lastUsed) u.lastUsed = e.created_at;
    }
    return map;
  }, [events]);

  // Daily counts for sparkline-like display
  const dailyCounts = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayStart = startOfDay(subDays(new Date(), i)).toISOString();
      const dayEnd = startOfDay(subDays(new Date(), i - 1)).toISOString();
      days.push({ date: d, count: events.filter(e => e.created_at >= dayStart && e.created_at < dayEnd).length });
    }
    return days;
  }, [events]);

  // Audit intelligence flags
  const auditFlags = useMemo(() => {
    const flags: { type: string; toolId: string; toolName: string; detail: string; severity: "critical" | "warning" | "info" }[] = [];
    const avgDaily = events.length / 30;

    // Check for traffic spikes per tool (today > 3x avg)
    const today = startOfDay(new Date()).toISOString();
    for (const s of toolStats) {
      const todayCount = events.filter(e => e.tool_id === s.toolId && e.created_at >= today).length;
      const toolDailyAvg = s.totalUses / 30;
      if (todayCount > toolDailyAvg * 3 && todayCount > 5) {
        flags.push({ type: "Traffic Spike", toolId: s.toolId, toolName: s.toolName, detail: `${todayCount} uses today vs ${Math.round(toolDailyAvg)} daily avg`, severity: "warning" });
      }
      if (s.failureRate > 0.3) {
        flags.push({ type: "High Failure Rate", toolId: s.toolId, toolName: s.toolName, detail: `${(s.failureRate * 100).toFixed(1)}% failure rate`, severity: "critical" });
      }
      if (s.totalUses > 0 && s.totalUses < 3) {
        flags.push({ type: "Low Engagement", toolId: s.toolId, toolName: s.toolName, detail: `Only ${s.totalUses} total uses`, severity: "info" });
      }
    }

    // Abuse detection: single user >50 calls/day on one tool
    const todayEvents = events.filter(e => e.created_at >= today);
    const userToolCounts = new Map<string, number>();
    for (const e of todayEvents) {
      const key = `${e.user_id}:${e.tool_id}`;
      userToolCounts.set(key, (userToolCounts.get(key) || 0) + 1);
    }
    for (const [key, count] of userToolCounts) {
      if (count > 50) {
        const [userId, toolId] = key.split(":");
        flags.push({ type: "Potential Abuse", toolId, toolName: getToolName(toolId), detail: `User ${userId.slice(0, 8)}… made ${count} calls today`, severity: "critical" });
      }
    }

    return flags.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]));
  }, [events, toolStats]);

  const recommendations = useMemo(() => getRecommendations(toolStats), [toolStats]);

  // KPIs
  const totalUses = events.length;
  const uniqueUsersTotal = new Set(events.map(e => e.user_id)).size;
  const avgResponseAll = (() => {
    const rt = events.filter(e => e.response_time_ms).map(e => e.response_time_ms!);
    return rt.length ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0;
  })();
  const overallFailureRate = events.length ? (events.filter(e => e.status === "failure").length / events.length * 100).toFixed(1) : "0";

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Tool Analytics & Audit Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance metrics, health scores, and security intelligence across all AI tools</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="rankings" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Rankings</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />Audit</TabsTrigger>
          <TabsTrigger value="impact" className="gap-1.5"><GitCompareArrows className="h-3.5 w-3.5" />Impact</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Total Uses</div>
              <div className="text-2xl font-bold text-foreground">{totalUses.toLocaleString()}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Unique Users</div>
              <div className="text-2xl font-bold text-foreground">{uniqueUsersTotal}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Avg Response</div>
              <div className="text-2xl font-bold text-foreground">{(avgResponseAll / 1000).toFixed(1)}s</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Failure Rate</div>
              <div className="text-2xl font-bold text-foreground">{overallFailureRate}%</div>
            </CardContent></Card>
          </div>

          {/* Daily usage mini bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Usage (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-0.5 h-24">
                {dailyCounts.map((d, i) => {
                  const maxCount = Math.max(...dailyCounts.map(x => x.count), 1);
                  const pct = (d.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 group relative">
                      <div className="bg-primary/80 rounded-t-sm transition-all hover:bg-primary" style={{ height: `${Math.max(pct, 2)}%` }} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                        {d.date}: {d.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top tools */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Top 10 Tools by Usage</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...toolStats].sort((a, b) => b.totalUses - a.totalUses).slice(0, 10).map(s => (
                  <div key={s.toolId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{s.toolName}</span>
                      <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{s.totalUses} uses</span>
                      <HealthBadge score={s.healthScore} />
                    </div>
                  </div>
                ))}
                {toolStats.length === 0 && <p className="text-muted-foreground text-sm">No usage data yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== RANKINGS TAB ===== */}
        <TabsContent value="rankings" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Uses</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Avg Response</TableHead>
                    <TableHead className="text-right">Failure %</TableHead>
                    <TableHead className="text-right">Completion %</TableHead>
                    <TableHead className="text-right">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...toolStats].sort((a, b) => b.totalUses - a.totalUses).map(s => (
                    <TableRow key={s.toolId}>
                      <TableCell className="font-medium text-foreground">{s.toolName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.category}</Badge></TableCell>
                      <TableCell className="text-right">{s.totalUses}</TableCell>
                      <TableCell className="text-right">{s.uniqueUsers}</TableCell>
                      <TableCell className="text-right">{(s.avgResponseMs / 1000).toFixed(1)}s</TableCell>
                      <TableCell className="text-right">{(s.failureRate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{s.completionRate.toFixed(0)}%</TableCell>
                      <TableCell className="text-right"><HealthBadge score={s.healthScore} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {toolStats.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No usage data yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== USER ANALYSIS TAB ===== */}
        <TabsContent value="users" className="mt-4 space-y-4">
          {[...toolStats].sort((a, b) => b.totalUses - a.totalUses).map(s => {
            const users = userToolStats.get(s.toolId);
            if (!users || users.size === 0) return null;
            return (
              <Card key={s.toolId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {s.toolName}
                    <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                    <span className="text-muted-foreground font-normal ml-auto">{users.size} users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Uses</TableHead>
                        <TableHead className="text-right">Success</TableHead>
                        <TableHead className="text-right">Failures</TableHead>
                        <TableHead className="text-right">Last Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...users.values()].sort((a, b) => b.totalUses - a.totalUses).slice(0, 20).map(u => (
                        <TableRow key={u.userId}>
                          <TableCell className="font-mono text-xs">{u.userId.slice(0, 12)}…</TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{u.userRole}</Badge></TableCell>
                          <TableCell className="text-right">{u.totalUses}</TableCell>
                          <TableCell className="text-right text-green-600">{u.successCount}</TableCell>
                          <TableCell className="text-right text-red-500">{u.failureCount}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(u.lastUsed), "MMM d, HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
          {toolStats.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No usage data yet.</p>}
        </TabsContent>

        {/* ===== AUDIT INTELLIGENCE TAB ===== */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          {/* Flags */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Security & Audit Flags</CardTitle></CardHeader>
            <CardContent>
              {auditFlags.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm"><CheckCircle2 className="h-4 w-4" />No issues detected — all tools operating normally</div>
              ) : (
                <div className="space-y-2">
                  {auditFlags.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                      {f.severity === "critical" ? <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" /> :
                       f.severity === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> :
                       <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                      <div>
                        <div className="text-sm font-medium text-foreground">{f.type}: {f.toolName}</div>
                        <div className="text-xs text-muted-foreground">{f.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4" />Fix Recommendations</CardTitle></CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
              ) : (
                <div className="space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                      <Badge variant={r.severity === "high" ? "destructive" : r.severity === "medium" ? "default" : "secondary"} className="text-[10px] mt-0.5 shrink-0">{r.severity}</Badge>
                      <div>
                        <div className="text-sm font-medium text-foreground">{r.toolName}</div>
                        <div className="text-xs text-muted-foreground">{r.recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CHANGE IMPACT TAB ===== */}
        <TabsContent value="impact" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GitCompareArrows className="h-4 w-4" />Change Impact Analysis</CardTitle></CardHeader>
            <CardContent>
              {toolStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available for impact analysis yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Last 7d Uses</TableHead>
                      <TableHead className="text-right">Prior 7d Uses</TableHead>
                      <TableHead className="text-right">Usage Δ</TableHead>
                      <TableHead className="text-right">Last 7d Fail%</TableHead>
                      <TableHead className="text-right">Prior 7d Fail%</TableHead>
                      <TableHead className="text-right">Fail Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolStats.map(s => {
                      const now = new Date();
                      const last7 = events.filter(e => e.tool_id === s.toolId && new Date(e.created_at) >= subDays(now, 7));
                      const prior7 = events.filter(e => e.tool_id === s.toolId && new Date(e.created_at) >= subDays(now, 14) && new Date(e.created_at) < subDays(now, 7));
                      const last7Fail = last7.length ? (last7.filter(e => e.status === "failure").length / last7.length * 100) : 0;
                      const prior7Fail = prior7.length ? (prior7.filter(e => e.status === "failure").length / prior7.length * 100) : 0;
                      const usageDelta = last7.length - prior7.length;
                      const failDelta = last7Fail - prior7Fail;
                      return (
                        <TableRow key={s.toolId}>
                          <TableCell className="font-medium text-foreground">{s.toolName}</TableCell>
                          <TableCell className="text-right">{last7.length}</TableCell>
                          <TableCell className="text-right">{prior7.length}</TableCell>
                          <TableCell className="text-right">
                            <span className={usageDelta > 0 ? "text-green-600" : usageDelta < 0 ? "text-red-500" : "text-muted-foreground"}>
                              {usageDelta > 0 ? "+" : ""}{usageDelta}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{last7Fail.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{prior7Fail.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <span className={failDelta < 0 ? "text-green-600" : failDelta > 0 ? "text-red-500" : "text-muted-foreground"}>
                              {failDelta > 0 ? "+" : ""}{failDelta.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
