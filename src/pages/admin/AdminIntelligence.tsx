import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Users, TrendingUp, Brain, Crown, Download, Search,
  Activity, Eye, Target, Zap, BarChart3, Shield, Loader2, RefreshCw,
  ChevronRight, Smartphone, Monitor, Tablet, Filter
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const VIP_COLORS: Record<string, string> = {
  'Royal VIP': 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-yellow-300 border-yellow-500/50',
  'Platinum': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Gold': 'bg-gold/20 text-gold border-gold/40',
  'Silver': 'bg-zinc-400/20 text-zinc-300 border-zinc-400/40',
  'Bronze': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Visitor': 'bg-zinc-700/20 text-zinc-400 border-zinc-600/40',
};

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === 'mobile') return <Smartphone className="w-3 h-3" />;
  if (device === 'tablet') return <Tablet className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
};

interface UserProfile {
  user_id: string;
  intent_score: number;
  engagement_score: number;
  conversion_probability: number;
  avg_budget_estimate: number;
  revenue_potential: number;
  estimated_ticket_aed: number;
  time_to_conversion_days: number;
  confidence_score: number;
  vip_tier: string;
  vip_tier_reason: string;
  total_sessions: number;
  total_time_seconds: number;
  total_points: number;
  current_streak: number;
  device_mix: Record<string, number>;
  top_pages: string[];
  tools_used: string[];
  lead_count_30d: number;
  saves_count_30d: number;
  sessions_last_7d: number;
  feature_diversity: number;
  searches_30d: number;
  last_active_at: string;
  last_updated_at: string;
  // joined from profiles
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function AdminIntelligencePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Fetch all user profiles with scores
  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["admin-intelligence-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interest_profile")
        .select("*")
        .order("revenue_potential", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Fetch profile info for each user
      const userIds = (data || []).map((p: any) => p.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role")
        .in("id", userIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      return (data || []).map((p: any) => ({
        ...p,
        full_name: profileMap.get(p.user_id)?.full_name || "Unknown",
        email: profileMap.get(p.user_id)?.email || "",
        phone: profileMap.get(p.user_id)?.phone || "",
        role: profileMap.get(p.user_id)?.role || "visitor",
      })) as UserProfile[];
    },
    staleTime: 30_000,
  });

  // Trigger scoring recalculation
  const scoreMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("compute-user-scores", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scores recalculated for ${data.processed} users`);
      refetch();
    },
    onError: (err: any) => toast.error("Scoring failed: " + err.message),
  });

  // Export CSV
  const exportCSV = () => {
    if (!profiles?.length) return;
    const headers = ["Name", "Email", "Phone", "Role", "VIP Tier", "Intent Score", "Engagement Score", "Conversion %", "Budget (AED)", "Revenue Potential (AED)", "Sessions", "Points", "Streak", "Last Active"];
    const rows = filteredProfiles.map(p => [
      p.full_name, p.email, p.phone, p.role, p.vip_tier,
      p.intent_score, p.engagement_score, p.conversion_probability,
      p.avg_budget_estimate, p.revenue_potential, p.total_sessions,
      p.total_points, p.current_streak, p.last_active_at ? format(new Date(p.last_active_at), "dd MMM yyyy") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jbj-research-users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const filteredProfiles = (profiles || []).filter(p => {
    const matchesSearch = searchQuery === "" ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "all" || p.vip_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Summary stats
  const totalRevenue = filteredProfiles.reduce((s, p) => s + (p.revenue_potential || 0), 0);
  const avgIntent = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.intent_score, 0) / filteredProfiles.length) : 0;
  const avgEngagement = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.engagement_score, 0) / filteredProfiles.length) : 0;
  const tierCounts: Record<string, number> = {};
  filteredProfiles.forEach(p => { tierCounts[p.vip_tier] = (tierCounts[p.vip_tier] || 0) + 1; });

  const formatAED = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString();
  const formatDuration = (s: number) => s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Intelligence Panel | JBJ Admin" description="AI-driven user intelligence and scoring" />
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-gold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #FFF 0%, #F5EBD7 40%, #C8A766 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                User Intelligence Panel
              </h1>
              <p className="text-zinc-400 mt-1">{filteredProfiles.length} users profiled</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending}
                className="border-gold/30 text-gold hover:bg-gold/10">
                <RefreshCw className={`w-4 h-4 mr-2 ${scoreMutation.isPending ? "animate-spin" : ""}`} />
                Recalculate Scores
              </Button>
              <Button onClick={exportCSV} className="bg-gold text-black hover:bg-gold/90">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 border-gold/20">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{filteredProfiles.length}</p>
                <p className="text-xs text-zinc-400">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-gold/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">AED {formatAED(totalRevenue)}</p>
                <p className="text-xs text-zinc-400">Revenue Potential</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-gold/20">
              <CardContent className="p-4 text-center">
                <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{avgIntent}%</p>
                <p className="text-xs text-zinc-400">Avg Intent Score</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-gold/20">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{avgEngagement}%</p>
                <p className="text-xs text-zinc-400">Avg Engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* VIP Tier Distribution */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button size="sm" variant={tierFilter === "all" ? "default" : "ghost"}
              className={tierFilter === "all" ? "bg-gold text-black" : "text-zinc-400"}
              onClick={() => setTierFilter("all")}>All</Button>
            {["Royal VIP", "Platinum", "Gold", "Silver", "Bronze", "Visitor"].map(tier => (
              <Button key={tier} size="sm" variant={tierFilter === tier ? "default" : "ghost"}
                className={tierFilter === tier ? "bg-gold text-black" : "text-zinc-400"}
                onClick={() => setTierFilter(tier)}>
                {tier} ({tierCounts[tier] || 0})
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-gold/20 text-white"
            />
          </div>

          {/* Users Table */}
          <Card className="bg-white/5 border-gold/20">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                    <tr className="border-b border-gold/10">
                      <th className="text-left p-3 text-gold font-semibold">User</th>
                      <th className="text-center p-3 text-gold font-semibold">VIP Tier</th>
                      <th className="text-center p-3 text-gold font-semibold">Intent</th>
                      <th className="text-center p-3 text-gold font-semibold">Engage</th>
                      <th className="text-center p-3 text-gold font-semibold">Convert %</th>
                      <th className="text-center p-3 text-gold font-semibold">Revenue</th>
                      <th className="text-center p-3 text-gold font-semibold">Points</th>
                      <th className="text-center p-3 text-gold font-semibold">Sessions</th>
                      <th className="text-center p-3 text-gold font-semibold hidden md:table-cell">Last Active</th>
                      <th className="text-center p-3 text-gold font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map(p => (
                      <tr key={p.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-white truncate max-w-[150px]">{p.full_name}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[150px]">{p.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={`text-xs ${VIP_COLORS[p.vip_tier] || VIP_COLORS['Visitor']}`}>
                            {p.vip_tier}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <ScoreBar value={p.intent_score} color="purple" />
                        </td>
                        <td className="p-3 text-center">
                          <ScoreBar value={p.engagement_score} color="blue" />
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-semibold ${p.conversion_probability >= 60 ? 'text-emerald-400' : p.conversion_probability >= 30 ? 'text-gold' : 'text-zinc-400'}`}>
                            {p.conversion_probability}%
                          </span>
                        </td>
                        <td className="p-3 text-center text-emerald-400 font-semibold">
                          {formatAED(p.revenue_potential)}
                        </td>
                        <td className="p-3 text-center text-white">{p.total_points?.toLocaleString()}</td>
                        <td className="p-3 text-center text-zinc-300">{p.total_sessions}</td>
                        <td className="p-3 text-center text-zinc-400 hidden md:table-cell text-xs">
                          {p.last_active_at ? format(new Date(p.last_active_at), "dd MMM") : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedUser(p)} className="text-gold h-7">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-zinc-900 border-gold/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-gold flex items-center gap-3">
                    <Crown className="w-5 h-5" />
                    {selectedUser.full_name}
                    <Badge variant="outline" className={VIP_COLORS[selectedUser.vip_tier] || ""}>
                      {selectedUser.vip_tier}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Contact */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-zinc-500">Email:</span> <span className="text-white">{selectedUser.email}</span></div>
                    <div><span className="text-zinc-500">Phone:</span> <span className="text-white">{selectedUser.phone || "—"}</span></div>
                    <div><span className="text-zinc-500">Role:</span> <span className="text-white capitalize">{selectedUser.role}</span></div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Intent", value: selectedUser.intent_score, color: "text-purple-400" },
                      { label: "Engagement", value: selectedUser.engagement_score, color: "text-blue-400" },
                      { label: "Conversion", value: selectedUser.conversion_probability, color: "text-emerald-400", suffix: "%" },
                      { label: "Confidence", value: selectedUser.confidence_score, color: "text-gold" },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}{s.suffix || ""}</p>
                        <p className="text-xs text-zinc-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Revenue */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
                      <p className="text-lg font-bold text-emerald-400">AED {formatAED(selectedUser.revenue_potential)}</p>
                      <p className="text-xs text-zinc-400">Revenue Potential</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">AED {formatAED(selectedUser.estimated_ticket_aed)}</p>
                      <p className="text-xs text-zinc-400">Est. Ticket Size</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedUser.time_to_conversion_days}d</p>
                      <p className="text-xs text-zinc-400">Time to Convert</p>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="grid grid-cols-4 gap-3 text-center text-sm">
                    <div className="bg-white/5 rounded p-2">
                      <p className="font-bold text-white">{selectedUser.total_sessions}</p>
                      <p className="text-xs text-zinc-500">Sessions</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <p className="font-bold text-white">{formatDuration(selectedUser.total_time_seconds || 0)}</p>
                      <p className="text-xs text-zinc-500">Total Time</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <p className="font-bold text-white">{selectedUser.current_streak}</p>
                      <p className="text-xs text-zinc-500">Streak</p>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <p className="font-bold text-gold">{selectedUser.total_points?.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">Points</p>
                    </div>
                  </div>

                  {/* Behavioral Signals */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gold font-semibold mb-2">30-Day Signals</p>
                      <div className="space-y-1 text-zinc-300">
                        <div className="flex justify-between"><span>Leads</span><span className="text-white">{selectedUser.lead_count_30d}</span></div>
                        <div className="flex justify-between"><span>Saves</span><span className="text-white">{selectedUser.saves_count_30d}</span></div>
                        <div className="flex justify-between"><span>Sessions (7d)</span><span className="text-white">{selectedUser.sessions_last_7d}</span></div>
                        <div className="flex justify-between"><span>Searches</span><span className="text-white">{selectedUser.searches_30d}</span></div>
                        <div className="flex justify-between"><span>Feature Diversity</span><span className="text-white">{selectedUser.feature_diversity}</span></div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gold font-semibold mb-2">Device Mix</p>
                      {selectedUser.device_mix && Object.entries(selectedUser.device_mix).map(([d, c]) => (
                        <div key={d} className="flex items-center gap-2 text-zinc-300 mb-1">
                          <DeviceIcon device={d} />
                          <span className="capitalize">{d}</span>
                          <span className="ml-auto text-white">{c as number}</span>
                        </div>
                      ))}
                      {selectedUser.tools_used?.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <p className="text-xs text-zinc-500 mb-1">Tools Used</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.tools_used.slice(0, 5).map(t => (
                              <Badge key={t} variant="outline" className="text-xs text-zinc-300 border-zinc-600">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier Reason */}
                  <div className="bg-gold/5 rounded-lg p-3 border border-gold/20">
                    <p className="text-xs text-gold mb-1">VIP Tier Assignment Reason</p>
                    <p className="text-sm text-zinc-300">{selectedUser.vip_tier_reason}</p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  const colorClass = color === "purple" ? "bg-purple-500" : color === "blue" ? "bg-blue-500" : "bg-gold";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-zinc-300 w-6">{value}</span>
    </div>
  );
}
