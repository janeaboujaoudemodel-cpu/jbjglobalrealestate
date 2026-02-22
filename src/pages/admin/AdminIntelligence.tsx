import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Users, TrendingUp, Brain, Crown, Download, Search,
  Eye, Zap, Loader2, RefreshCw, Smartphone, Monitor, Tablet,
  FileText, CreditCard, Clock, MapPin, MousePointerClick
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

export default function AdminIntelligencePage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [userActivities, setUserActivities] = useState<any[] | null>(null);
  const [userDocuments, setUserDocuments] = useState<any[] | null>(null);
  const [userScannedCards, setUserScannedCards] = useState<any[] | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["admin-intelligence-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interest_profile")
        .select("*")
        .order("engagement_score", { ascending: false })
        .limit(500);
      if (error) throw error;

      const userIds = (data || []).map((p: any) => p.user_id);
      
      // Fetch from profiles, crm_users_profile, and user_role_selections in parallel
      const [profilesRes, crmRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, first_name, last_name, email, phone_number, user_role, user_type").in("id", userIds),
        supabase.from("crm_users_profile").select("user_id, display_name, phone, crm_role, email").in("user_id", userIds),
        supabase.from("user_role_selections").select("user_id, selected_role, full_name, phone_e164, email").in("user_id", userIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      const crmMap = new Map((crmRes.data || []).map((p: any) => [p.user_id, p]));
      const roleMap = new Map((rolesRes.data || []).map((p: any) => [p.user_id, p]));

      return (data || []).map((p: any) => {
        const prof = profileMap.get(p.user_id);
        const crm = crmMap.get(p.user_id);
        const roleSelection = roleMap.get(p.user_id);
        
        // Name: profiles.full_name > role_selections.full_name > crm.display_name > first+last > email prefix
        const fullName = prof?.full_name || roleSelection?.full_name || crm?.display_name || 
          (prof?.first_name && prof?.last_name ? `${prof.first_name} ${prof.last_name}` : null) ||
          prof?.email?.split("@")[0] || crm?.email?.split("@")[0] || "—";
        
        // Phone: profiles.phone_number > role_selections.phone_e164 > crm.phone
        const phone = prof?.phone_number || roleSelection?.phone_e164 || crm?.phone || "";
        
        // Role: role_selections.selected_role > crm.crm_role > profiles.user_role > profiles.user_type
        const role = roleSelection?.selected_role || crm?.crm_role || prof?.user_role || prof?.user_type || "";
        
        // Email: profiles.email > role_selections.email > crm.email
        const email = prof?.email || roleSelection?.email || crm?.email || "";

        return {
          ...p,
          full_name: fullName,
          email,
          phone,
          role,
        };
      }) as UserProfile[];
    },
    staleTime: 30_000,
  });

  const loadUserDetails = async (userId: string) => {
    setActivitiesLoading(true);
    try {
      // Get session IDs for user
      const { data: sessions } = await supabase
        .from("visitor_sessions")
        .select("session_id")
        .eq("user_id", userId)
        .limit(100);
      const sessionIds = (sessions || []).map((s: any) => s.session_id);

      // Fetch visitor events, user events, documents, scanned cards in parallel
      const [vEventsRes, uEventsRes, docsRes, cardsRes] = await Promise.all([
        sessionIds.length > 0
          ? supabase.from("visitor_events")
              .select("event_type, event_name, page_path, created_at, event_data")
              .in("session_id", sessionIds)
              .order("created_at", { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] }),
        supabase.from("user_events")
          .select("event_name, page_path, created_at, metadata")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
        sessionIds.length > 0
          ? supabase.from("visitor_documents")
              .select("document_type, document_name, document_url, action, storage_path, created_at")
              .in("session_id", sessionIds)
              .order("created_at", { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),
        supabase.from("admin_scanned_cards")
          .select("card_data, scan_source, scanned_at")
          .eq("user_id", userId)
          .order("scanned_at", { ascending: false })
          .limit(20),
      ]);

      const vEvents = (vEventsRes.data || []).map((e: any) => ({
        event_type: e.event_type, event_name: e.event_name, page_path: e.page_path, created_at: e.created_at,
      }));
      const uEvents = (uEventsRes.data || []).map((e: any) => ({
        event_type: "user_event", event_name: e.event_name, page_path: e.page_path, created_at: e.created_at,
      }));

      const merged = [...vEvents, ...uEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 150);
      setUserActivities(merged);
      setUserDocuments(docsRes.data || []);
      setUserScannedCards(cardsRes.data || []);
    } catch (err) {
      console.error("Error loading details:", err);
      setUserActivities([]);
      setUserDocuments([]);
      setUserScannedCards([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

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
    const headers = ["Name", "Email", "Phone", "Role", "VIP Tier", "Intent", "Engagement", "Conversion %", "Sessions", "Total Time (s)", "Points", "Streak", "Last Active"];
    const rows = filteredProfiles.map(p => [
      p.full_name, p.email, p.phone, p.role, p.vip_tier,
      p.intent_score, p.engagement_score, p.conversion_probability,
      p.total_sessions, p.total_time_seconds, p.total_points, p.current_streak,
      p.last_active_at ? format(new Date(p.last_active_at), "dd MMM yyyy") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jbj-users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const filteredProfiles = (profiles || []).filter(p => {
    const matchesSearch = searchQuery === "" ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);
    const matchesTier = tierFilter === "all" || p.vip_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const avgIntent = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.intent_score, 0) / filteredProfiles.length) : 0;
  const avgEngagement = filteredProfiles.length > 0 ? Math.round(filteredProfiles.reduce((s, p) => s + p.engagement_score, 0) / filteredProfiles.length) : 0;
  const totalSessions = filteredProfiles.reduce((s, p) => s + (p.total_sessions || 0), 0);
  const tierCounts: Record<string, number> = {};
  filteredProfiles.forEach(p => { tierCounts[p.vip_tier] = (tierCounts[p.vip_tier] || 0) + 1; });

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getRoleLabel = (role: string) => {
    if (!role) return "—";
    const labels: Record<string, string> = {
      broker: "Broker", investor: "Investor", visitor: "Visitor", owner: "Owner",
      broker_partner: "Partner Broker", broker_jbj: "JBJ Broker", client: "Client",
      owner_admin: "Owner Admin", admin: "Admin", super_admin: "Super Admin",
    };
    return labels[role] || role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className={`${embedded ? '' : 'min-h-screen bg-gradient-to-b from-[#F5EBD7] via-[#EDE4D3] to-[#E0D5C0]'} flex items-center justify-center p-12`}>
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      {!embedded && <SEOHead title="Intelligence Panel | JBJ Admin" description="AI-driven user intelligence and scoring" />}
      <div className={embedded ? '' : 'min-h-screen bg-gradient-to-b from-[#F5EBD7] via-[#EDE4D3] to-[#E0D5C0]'}>
        <div className={embedded ? '' : 'container mx-auto px-4 py-8 max-w-7xl'}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              {!embedded && (
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-gold hover:text-gold/80 hover:bg-gold/10">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              <h1 className={`${embedded ? 'text-2xl' : 'text-3xl'} font-bold text-black`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                User Intelligence Panel
              </h1>
              <p className="text-stone-500 mt-1">{filteredProfiles.length} users tracked</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending}
                className="border-2 border-gold/40 text-gold hover:bg-gold/10 hover:text-gold bg-white/80 font-semibold">
                <RefreshCw className={`w-4 h-4 mr-2 ${scoreMutation.isPending ? "animate-spin" : ""}`} />
                Recalculate
              </Button>
              <Button onClick={exportCSV} className="bg-gold text-black hover:bg-gold/90 font-semibold border-2 border-gold/60">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Summary */}
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
                <p className="text-2xl font-bold text-black">{totalSessions.toLocaleString()}</p>
                <p className="text-xs text-stone-500">Total Sessions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <Brain className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">{avgIntent}/100</p>
                <p className="text-xs text-stone-500">Avg Intent</p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 border-2 border-gold/30 shadow-sm">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-black">{avgEngagement}/100</p>
                <p className="text-xs text-stone-500">Avg Engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* VIP Tier Filters */}
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
              placeholder="Search by name, email, or phone..."
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
                      <th className="text-center p-3 text-gold font-bold">Role</th>
                      <th className="text-center p-3 text-gold font-bold">VIP</th>
                      <th className="text-center p-3 text-gold font-bold">Intent</th>
                      <th className="text-center p-3 text-gold font-bold">Engagement</th>
                      <th className="text-center p-3 text-gold font-bold">Sessions</th>
                      <th className="text-center p-3 text-gold font-bold">Time</th>
                      <th className="text-center p-3 text-gold font-bold hidden md:table-cell">Last Active</th>
                      <th className="text-center p-3 text-gold font-bold">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map(p => (
                      <tr key={p.user_id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors cursor-pointer" onClick={() => { setSelectedUser(p); setUserActivities(null); setUserDocuments(null); setUserScannedCards(null); }}>
                        <td className="p-3">
                          <div className="font-semibold text-black truncate max-w-[180px]">{p.full_name}</div>
                          <div className="text-xs text-stone-500 truncate max-w-[180px]">{p.email}</div>
                          {p.phone && <div className="text-xs text-stone-400">{p.phone}</div>}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs font-medium text-stone-700">{getRoleLabel(p.role || "")}</span>
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
                        <td className="p-3 text-center text-stone-600 font-medium">{p.total_sessions}</td>
                        <td className="p-3 text-center text-stone-600 text-xs">{formatDuration(p.total_time_seconds || 0)}</td>
                        <td className="p-3 text-center text-stone-500 hidden md:table-cell text-xs">
                          {p.last_active_at ? format(new Date(p.last_active_at), "dd MMM HH:mm") : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedUser(p); setUserActivities(null); setUserDocuments(null); setUserScannedCards(null); }} className="text-gold border-gold/30 hover:bg-gold/10 h-7 font-semibold">
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

        {/* User Detail Dialog - WIDER */}
        <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setUserActivities(null); setUserDocuments(null); setUserScannedCards(null); }}>
          <DialogContent className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/40 text-black max-w-5xl max-h-[90vh] overflow-y-auto">
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
                  <DialogDescription className="sr-only">User intelligence details</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Contact Info - single row */}
                  <div className="flex flex-wrap gap-6 text-sm bg-white/60 rounded-lg p-4 border border-gold/20">
                    <div><span className="text-stone-500">Email:</span> <span className="text-black font-medium">{selectedUser.email || "—"}</span></div>
                    <div><span className="text-stone-500">Phone:</span> <span className="text-black font-medium">{selectedUser.phone || "—"}</span></div>
                    <div><span className="text-stone-500">Role:</span> <span className="text-black font-medium">{getRoleLabel(selectedUser.role || "")}</span></div>
                    <div><span className="text-stone-500">Last Active:</span> <span className="text-black font-medium">{selectedUser.last_active_at ? format(new Date(selectedUser.last_active_at), "dd MMM yyyy HH:mm") : "—"}</span></div>
                  </div>

                  {/* Scores - clear labels */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-xl font-bold text-purple-700">{selectedUser.intent_score}/100</p>
                      <p className="text-xs font-semibold text-stone-600">Purchase Intent</p>
                      <p className="text-[10px] text-stone-400 mt-1">Leads, saves, contact clicks, searches</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-xl font-bold text-blue-700">{selectedUser.engagement_score}/100</p>
                      <p className="text-xs font-semibold text-stone-600">Site Engagement</p>
                      <p className="text-[10px] text-stone-400 mt-1">Sessions, time, pages, features used</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-xl font-bold text-emerald-700">{selectedUser.conversion_probability}%</p>
                      <p className="text-xs font-semibold text-stone-600">Conversion Likelihood</p>
                      <p className="text-[10px] text-stone-400 mt-1">Intent × Engagement × Recency</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-gold/20">
                      <p className="text-xl font-bold text-gold">{selectedUser.confidence_score}/100</p>
                      <p className="text-xs font-semibold text-stone-600">Data Quality</p>
                      <p className="text-[10px] text-stone-400 mt-1">More data = more accurate scores</p>
                    </div>
                  </div>

                  {/* Real Activity Stats - 2 columns */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Left: Session & Time Stats */}
                    <div className="bg-white/60 rounded-lg p-4 border border-gold/20">
                      <p className="text-gold font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Activity Stats</p>
                      <div className="space-y-2 text-sm text-stone-700">
                        <div className="flex justify-between"><span>Total Sessions</span><span className="text-black font-bold">{selectedUser.total_sessions}</span></div>
                        <div className="flex justify-between"><span>Total Time on Site</span><span className="text-black font-bold">{formatDuration(selectedUser.total_time_seconds || 0)}</span></div>
                        <div className="flex justify-between"><span>Sessions (last 7 days)</span><span className="text-black font-bold">{selectedUser.sessions_last_7d}</span></div>
                        <div className="flex justify-between"><span>Day Streak</span><span className="text-black font-bold">{selectedUser.current_streak} days</span></div>
                        <div className="flex justify-between"><span>Total Points Earned</span><span className="text-gold font-bold">{selectedUser.total_points?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Unique Feature Types</span><span className="text-black font-bold">{selectedUser.feature_diversity}</span></div>
                      </div>
                    </div>

                    {/* Right: Behavioral Signals */}
                    <div className="bg-white/60 rounded-lg p-4 border border-gold/20">
                      <p className="text-gold font-bold mb-3 flex items-center gap-2"><MousePointerClick className="w-4 h-4" /> 30-Day Actions</p>
                      <div className="space-y-2 text-sm text-stone-700">
                        <div className="flex justify-between"><span>Leads Submitted</span><span className="text-black font-bold">{selectedUser.lead_count_30d}</span></div>
                        <div className="flex justify-between"><span>Properties Saved</span><span className="text-black font-bold">{selectedUser.saves_count_30d}</span></div>
                        <div className="flex justify-between"><span>Contact Clicks</span><span className="text-black font-bold">{(selectedUser as any).contact_clicks_30d || 0}</span></div>
                        <div className="flex justify-between"><span>Searches</span><span className="text-black font-bold">{selectedUser.searches_30d}</span></div>
                      </div>
                      
                      {/* Device Mix */}
                      <p className="text-gold font-bold mt-4 mb-2 flex items-center gap-2"><Monitor className="w-4 h-4" /> Devices Used</p>
                      {selectedUser.device_mix && Object.entries(selectedUser.device_mix).length > 0 ? (
                        Object.entries(selectedUser.device_mix).map(([d, c]) => (
                          <div key={d} className="flex items-center gap-2 text-stone-700 text-sm mb-1">
                            <DeviceIcon device={d} />
                            <span className="capitalize">{d}</span>
                            <span className="ml-auto text-black font-bold">{c as number} sessions</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-400">No device data yet</p>
                      )}
                    </div>
                  </div>

                  {/* Top Pages */}
                  {selectedUser.top_pages?.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-4 border border-gold/20">
                      <p className="text-gold font-bold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top Pages Visited</p>
                      <div className="grid grid-cols-2 gap-1">
                        {selectedUser.top_pages.slice(0, 10).map((page, i) => (
                          <div key={i} className="text-xs text-stone-600 truncate flex items-center gap-2">
                            <span className="text-gold font-bold w-4">{i + 1}.</span>
                            <span className="truncate">{page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools Used */}
                  {selectedUser.tools_used?.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3 border border-gold/20">
                      <p className="text-gold font-bold mb-2">Tools Used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.tools_used.map(t => (
                          <Badge key={t} variant="outline" className="text-xs text-stone-600 border-gold/30 bg-gold/5">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Load Activities + Documents */}
                  <div className="bg-white/60 rounded-lg p-4 border border-gold/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gold font-bold">Activity Timeline, Documents & Scanned Cards</p>
                      {!userActivities && (
                        <Button size="sm" variant="outline" onClick={() => loadUserDetails(selectedUser.user_id)}
                          disabled={activitiesLoading}
                          className="text-gold border-gold/30 hover:bg-gold/10 h-7 text-xs font-semibold">
                          {activitiesLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Load Details
                        </Button>
                      )}
                    </div>

                    {activitiesLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>}

                    {/* Scanned Cards */}
                    {userScannedCards && userScannedCards.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gold" /> Scanned Business Cards ({userScannedCards.length})</p>
                        <div className="space-y-2">
                          {userScannedCards.map((card: any, i: number) => {
                            const cd = card.card_data || {};
                            return (
                              <div key={i} className="bg-gold/5 rounded p-2 border border-gold/20 text-xs">
                                <div className="flex flex-wrap gap-4">
                                  {cd.name && <span><strong>Name:</strong> {cd.name}</span>}
                                  {cd.company && <span><strong>Company:</strong> {cd.company}</span>}
                                  {cd.email && <span><strong>Email:</strong> {cd.email}</span>}
                                  {cd.phone && <span><strong>Phone:</strong> {cd.phone}</span>}
                                  {cd.title && <span><strong>Title:</strong> {cd.title}</span>}
                                </div>
                                <div className="text-stone-400 mt-1">Scanned: {format(new Date(card.scanned_at), "dd MMM yyyy HH:mm")} • Source: {card.scan_source || "manual"}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {userDocuments && userDocuments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-gold" /> Documents ({userDocuments.length})</p>
                        <div className="space-y-1.5">
                          {userDocuments.map((doc: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-xs bg-gold/5 rounded p-2 border border-gold/10">
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-gold/30 bg-gold/5 shrink-0 uppercase">{doc.action}</Badge>
                              <span className="font-medium text-stone-800 truncate">{doc.document_name}</span>
                              <span className="text-stone-400">{doc.document_type}</span>
                              <span className="text-stone-400 ml-auto whitespace-nowrap">{format(new Date(doc.created_at), "dd MMM HH:mm")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline */}
                    {userActivities && userActivities.length === 0 && !userScannedCards?.length && !userDocuments?.length && (
                      <p className="text-xs text-stone-400 text-center py-2">No activities found</p>
                    )}
                    {userActivities && userActivities.length > 0 && (
                      <>
                        <p className="text-sm font-bold text-stone-700 mb-2">Activity Timeline ({userActivities.length} events)</p>
                        <ScrollArea className="h-[250px]">
                          <div className="space-y-1">
                            {userActivities.map((act, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs border-b border-gold/10 pb-1 py-0.5">
                                <span className="text-stone-400 whitespace-nowrap w-32 shrink-0">
                                  {format(new Date(act.created_at), "dd MMM yyyy HH:mm")}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-gold/30 bg-gold/5 shrink-0">{act.event_type}</Badge>
                                <span className="text-stone-700 truncate flex-1">{act.event_name}</span>
                                {act.page_path && <span className="text-stone-400 truncate max-w-[150px]">{act.page_path}</span>}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </div>

                  {/* VIP Tier Reason */}
                  <div className="bg-gold/10 rounded-lg p-3 border-2 border-gold/30">
                    <p className="text-xs text-gold font-bold mb-1">VIP Tier Summary</p>
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
