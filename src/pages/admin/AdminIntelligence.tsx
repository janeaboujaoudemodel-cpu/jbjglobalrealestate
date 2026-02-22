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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Users, TrendingUp, Brain, Crown, Download, Search,
  Activity, Eye, Target, Zap, BarChart3, Shield, Loader2, RefreshCw,
  ChevronRight, Smartphone, Monitor, Tablet
} from "lucide-react";
import { format } from "date-fns";

const VIP_COLORS: Record<string, string> = {
  'Royal VIP': 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 border-amber-500/40',
  'Platinum': 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  'Gold': 'bg-gold/15 text-gold border-gold/40',
  'Silver': 'bg-stone-400/15 text-stone-600 border-stone-400/30',
  'Bronze': 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  'Visitor': 'bg-stone-200/30 text-stone-500 border-stone-300/30',
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

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["admin-intelligence-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interest_profile")
        .select("*")
        .order("revenue_potential", { ascending: false })
        .limit(500);
      if (error) throw error;

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

  const totalRevenue = filteredProfiles.reduce((s, p) => s + (p.revenue_potential || 0), 0);
  const avgIntent = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.intent_score, 0) / filteredProfiles.length) : 0;
  const avgEngagement = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.engagement_score, 0) / filteredProfiles.length) : 0;
  const tierCounts: Record<string, number> = {};
  filteredProfiles.forEach(p => { tierCounts[p.vip_tier] = (tierCounts[p.vip_tier] || 0) + 1; });

  const formatAED = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString();
  const formatDuration = (s: number) => s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EBD7] via-[#EDE4D3] to-[#E0D5C0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Intelligence Panel | JBJ Admin" description="AI-driven user intelligence and scoring" />
      <div className="min-h-screen bg-gradient-to-b from-[#F5EBD7] via-[#EDE4D3] to-[#E0D5C0]">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-gold hover:text-gold/80 hover:bg-gold/10">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="text-3xl font-bold text-black" style={{ fontFamily: 'Poppins, sans-serif' }}>
                User Intelligence Panel
              </h1>
              <p className="text-stone-500 mt-1">{filteredProfiles.length} users profiled</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending}
                className="border-2 border-gold/40 text-gold hover:bg-gold/10 hover:text-gold bg-white/80 font-semibold">
                <RefreshCw className={`w-4 h-4 mr-2 ${scoreMutation.isPending ? "animate-spin" : ""}`} />
                Recalculate Scores
              </Button>
              <Button onClick={exportCSV} className="bg-gold text-black hover:bg-gold/90 font-semibold border-2 border-gold/60">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">{filteredProfiles.length}</p>
                <p className="text-xs text-stone-500">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">AED {formatAED(totalRevenue)}</p>
                <p className="text-xs text-stone-500">Revenue Potential</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <Brain className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">{avgIntent}%</p>
                <p className="text-xs text-stone-500">Avg Intent Score</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">{avgEngagement}%</p>
                <p className="text-xs text-stone-500">Avg Engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* VIP Tier Distribution */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button size="sm" variant={tierFilter === "all" ? "default" : "outline"}
              className={tierFilter === "all" ? "bg-gold text-black font-semibold border-2 border-gold" : "text-stone-600 border-2 border-gold/30 bg-white/70 hover:bg-gold/10 hover:text-black font-medium"}
              onClick={() => setTierFilter("all")}>All</Button>
            {["Royal VIP", "Platinum", "Gold", "Silver", "Bronze", "Visitor"].map(tier => (
              <Button key={tier} size="sm" variant={tierFilter === tier ? "default" : "outline"}
                className={tierFilter === tier ? "bg-gold text-black font-semibold border-2 border-gold" : "text-stone-600 border-2 border-gold/30 bg-white/70 hover:bg-gold/10 hover:text-black font-medium"}
                onClick={() => setTierFilter(tier)}>
                {tier} ({tierCounts[tier] || 0})
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-2 border-gold/30 text-black placeholder:text-stone-400 focus:border-gold"
            />
          </div>

          {/* Users Table */}
          <Card className="bg-white/80 border-2 border-gold/30 shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gradient-to-r from-[#F5EBD7] to-[#EDE4D3] backdrop-blur z-10">
                    <tr className="border-b-2 border-gold/20">
                      <th className="text-left p-3 text-gold font-bold">User</th>
                      <th className="text-center p-3 text-gold font-bold">VIP Tier</th>
                      <th className="text-center p-3 text-gold font-bold">Intent</th>
                      <th className="text-center p-3 text-gold font-bold">Engage</th>
                      <th className="text-center p-3 text-gold font-bold">Convert %</th>
                      <th className="text-center p-3 text-gold font-bold">Revenue</th>
                      <th className="text-center p-3 text-gold font-bold">Points</th>
                      <th className="text-center p-3 text-gold font-bold">Sessions</th>
                      <th className="text-center p-3 text-gold font-bold hidden md:table-cell">Last Active</th>
                      <th className="text-center p-3 text-gold font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map(p => (
                      <tr key={p.user_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-black truncate max-w-[150px]">{p.full_name}</div>
                          <div className="text-xs text-stone-500 truncate max-w-[150px]">{p.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={`text-xs font-semibold ${VIP_COLORS[p.vip_tier] || VIP_COLORS['Visitor']}`}>
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
                          <span className={`font-bold ${p.conversion_probability >= 60 ? 'text-emerald-600' : p.conversion_probability >= 30 ? 'text-gold' : 'text-stone-500'}`}>
                            {p.conversion_probability}%
                          </span>
                        </td>
                        <td className="p-3 text-center text-emerald-700 font-bold">
                          {formatAED(p.revenue_potential)}
                        </td>
                        <td className="p-3 text-center text-black font-medium">{p.total_points?.toLocaleString()}</td>
                        <td className="p-3 text-center text-stone-600">{p.total_sessions}</td>
                        <td className="p-3 text-center text-stone-500 hidden md:table-cell text-xs">
                          {p.last_active_at ? format(new Date(p.last_active_at), "dd MMM") : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(p)} className="text-gold border-gold/30 hover:bg-gold/10 h-7 font-semibold">
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
          <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/40 text-black max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-gold flex items-center gap-3">
                    <Crown className="w-5 h-5" />
                    {selectedUser.full_name}
                    <Badge variant="outline" className={`font-semibold ${VIP_COLORS[selectedUser.vip_tier] || ""}`}>
                      {selectedUser.vip_tier}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Contact */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-stone-500">Email:</span> <span className="text-black font-medium">{selectedUser.email}</span></div>
                    <div><span className="text-stone-500">Phone:</span> <span className="text-black font-medium">{selectedUser.phone || "—"}</span></div>
                    <div><span className="text-stone-500">Role:</span> <span className="text-black font-medium capitalize">{selectedUser.role}</span></div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Intent", value: selectedUser.intent_score, color: "text-purple-700" },
                      { label: "Engagement", value: selectedUser.engagement_score, color: "text-blue-700" },
                      { label: "Conversion", value: selectedUser.conversion_probability, color: "text-emerald-700", suffix: "%" },
                      { label: "Confidence", value: selectedUser.confidence_score, color: "text-gold" },
                    ].map(s => (
                      <div key={s.label} className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}{s.suffix || ""}</p>
                        <p className="text-xs text-stone-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Revenue */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
                      <p className="text-lg font-bold text-emerald-700">AED {formatAED(selectedUser.revenue_potential)}</p>
                      <p className="text-xs text-stone-500">Revenue Potential</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-lg font-bold text-black">AED {formatAED(selectedUser.estimated_ticket_aed)}</p>
                      <p className="text-xs text-stone-500">Est. Ticket Size</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-lg font-bold text-black">{selectedUser.time_to_conversion_days}d</p>
                      <p className="text-xs text-stone-500">Time to Convert</p>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="grid grid-cols-4 gap-3 text-center text-sm">
                    <div className="bg-white/60 rounded p-2 border border-gold/20">
                      <p className="font-bold text-black">{selectedUser.total_sessions}</p>
                      <p className="text-xs text-stone-500">Sessions</p>
                    </div>
                    <div className="bg-white/60 rounded p-2 border border-gold/20">
                      <p className="font-bold text-black">{formatDuration(selectedUser.total_time_seconds || 0)}</p>
                      <p className="text-xs text-stone-500">Total Time</p>
                    </div>
                    <div className="bg-white/60 rounded p-2 border border-gold/20">
                      <p className="font-bold text-black">{selectedUser.current_streak}</p>
                      <p className="text-xs text-stone-500">Streak</p>
                    </div>
                    <div className="bg-white/60 rounded p-2 border border-gold/20">
                      <p className="font-bold text-gold">{selectedUser.total_points?.toLocaleString()}</p>
                      <p className="text-xs text-stone-500">Points</p>
                    </div>
                  </div>

                  {/* Behavioral Signals */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/60 rounded-lg p-3 border border-gold/20">
                      <p className="text-gold font-bold mb-2">30-Day Signals</p>
                      <div className="space-y-1 text-stone-700">
                        <div className="flex justify-between"><span>Leads</span><span className="text-black font-semibold">{selectedUser.lead_count_30d}</span></div>
                        <div className="flex justify-between"><span>Saves</span><span className="text-black font-semibold">{selectedUser.saves_count_30d}</span></div>
                        <div className="flex justify-between"><span>Sessions (7d)</span><span className="text-black font-semibold">{selectedUser.sessions_last_7d}</span></div>
                        <div className="flex justify-between"><span>Searches</span><span className="text-black font-semibold">{selectedUser.searches_30d}</span></div>
                        <div className="flex justify-between"><span>Feature Diversity</span><span className="text-black font-semibold">{selectedUser.feature_diversity}</span></div>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-gold/20">
                      <p className="text-gold font-bold mb-2">Device Mix</p>
                      {selectedUser.device_mix && Object.entries(selectedUser.device_mix).map(([d, c]) => (
                        <div key={d} className="flex items-center gap-2 text-stone-700 mb-1">
                          <DeviceIcon device={d} />
                          <span className="capitalize">{d}</span>
                          <span className="ml-auto text-black font-semibold">{c as number}</span>
                        </div>
                      ))}
                      {selectedUser.tools_used?.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gold/20">
                          <p className="text-xs text-stone-500 mb-1">Tools Used</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.tools_used.slice(0, 5).map(t => (
                              <Badge key={t} variant="outline" className="text-xs text-stone-600 border-gold/30 bg-gold/5">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tier Reason */}
                  <div className="bg-gold/10 rounded-lg p-3 border-2 border-gold/30">
                    <p className="text-xs text-gold font-bold mb-1">VIP Tier Assignment Reason</p>
                    <p className="text-sm text-stone-700">{selectedUser.vip_tier_reason}</p>
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
      <div className="w-12 h-1.5 bg-gold/10 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-stone-700 w-6 font-semibold">{value}</span>
    </div>
  );
}