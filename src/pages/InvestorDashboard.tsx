import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InvestorDocumentVault from "@/components/investor/InvestorDocumentVault";
import ApprovalTimeline, { JBJ_APPROVAL_STEPS } from "@/components/shared/ApprovalTimeline";
import { useMyEventInvitations } from "@/hooks/useEventManagement";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, TrendingUp, Bell, User, Heart, Search, ListChecks,
  Calendar, Shield, MessageCircle, BarChart3, Briefcase, Clock, MapPin, Eye, CheckCircle2,
  Mail, Phone, Globe, Languages, Stamp, ImageIcon, CreditCard, Star, History, StickyNote,
  FileEdit, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

const TAB_STYLE = "text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[hsl(36,40%,70%)]/40 rounded-lg";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({ watchlist: 0, savedSearches: 0, reports: 0, requests: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const { invitations, respondToInvitation } = useMyEventInvitations();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "", nationality: "", phone_number: "", email: "",
    languages: "", gender: "", experience_years: "", bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/investor-dashboard");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setProfileForm({
          full_name: p.full_name || "", nationality: (p as any).nationality || "",
          phone_number: p.phone_number || "", email: user.email || "",
          languages: "", gender: "", experience_years: "", bio: "",
        });
      }

      const { data: favs } = await supabase.from("favorites").select("id, project_id, created_at").eq("user_id", user.id).limit(50);
      if (favs) {
        setFavorites(favs);
        setStats(prev => ({ ...prev, watchlist: favs.length }));
      }

      const { data: tickets } = await supabase
        .from("chat_conversations").select("id, status, created_at, service_type")
        .eq("user_email", user.email).order("created_at", { ascending: false }).limit(10);
      if (tickets) {
        setActivities(tickets.map((t: any) => ({
          id: t.id, message: `${t.service_type || "General"} — ${t.status}`, created_at: t.created_at,
        })));
        setStats(prev => ({ ...prev, requests: tickets.filter((t: any) => t.status !== "closed").length }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      nationality: profileForm.nationality,
      phone_number: profileForm.phone_number,
    } as any).eq("id", user.id);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated");
    setSavingProfile(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[hsl(36,40%,70%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Investor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,28%,94%)] to-[hsl(36,22%,88%)]">
      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1.5 bg-transparent p-0 mb-6 h-auto">
            <TabsTrigger value="dashboard" className={TAB_STYLE}>
              <LayoutDashboard className="w-3.5 h-3.5 mr-1 hidden md:block" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="properties" className={TAB_STYLE}>
              <Building2 className="w-3.5 h-3.5 mr-1 hidden md:block" /> My Properties
            </TabsTrigger>
            <TabsTrigger value="documents" className={TAB_STYLE}>
              <FileText className="w-3.5 h-3.5 mr-1 hidden md:block" /> Documents
            </TabsTrigger>
            <TabsTrigger value="profile" className={TAB_STYLE}>
              <User className="w-3.5 h-3.5 mr-1 hidden md:block" /> Update Profile
            </TabsTrigger>
            <TabsTrigger value="inbox" className={TAB_STYLE}>
              <Mail className="w-3.5 h-3.5 mr-1 hidden md:block" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="alerts" className={TAB_STYLE}>
              <Bell className="w-3.5 h-3.5 mr-1 hidden md:block" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="calendar" className={TAB_STYLE}>
              <Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" /> Calendar
            </TabsTrigger>
          </TabsList>

          {/* ── DASHBOARD ── */}
          <TabsContent value="dashboard">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Watchlist", value: stats.watchlist, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
                  { label: "Saved Searches", value: stats.savedSearches, icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Reports", value: stats.reports, icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
                  { label: "Active Requests", value: stats.requests, icon: ListChecks, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map((kpi) => (
                  <Card key={kpi.label} className="border-[hsl(36,40%,70%)]/20 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,28%,93%)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                          <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                          <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Get Curated Shortlist", href: "/contact?type=shortlist", icon: ListChecks },
                    { label: "Compare Projects", href: "/compare", icon: BarChart3 },
                    { label: "Request ROI Snapshot", href: "/contact?type=roi", icon: TrendingUp },
                    { label: "Speak to Advisor", href: "/contact?type=advisor", icon: MessageCircle },
                  ].map((a) => (
                    <Link key={a.label} to={a.href}>
                      <Card className="border-[hsl(36,40%,70%)]/20 hover:border-[hsl(36,40%,70%)]/50 transition-all cursor-pointer group h-full">
                        <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                          <div className="w-10 h-10 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center group-hover:bg-[hsl(36,40%,70%)]/20 transition-colors">
                            <a.icon className="w-5 h-5 text-[hsl(36,40%,70%)]" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{a.label}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <span className="text-sm text-foreground">{a.message}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── MY PROPERTIES ── */}
          <TabsContent value="properties">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Favorited & Shortlisted Properties
              </h3>
              {favorites.length === 0 ? (
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-muted-foreground">No saved properties yet</p>
                    <Link to="/properties"><Button variant="outline" className="mt-4 border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Browse Properties</Button></Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {favorites.map((f: any) => (
                    <Card key={f.id} className="border-[hsl(36,40%,70%)]/20">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">Project #{f.project_id?.slice(0, 8)}</p>
                          <p className="text-[10px] text-muted-foreground">Added {format(new Date(f.created_at), "dd MMM yyyy")}</p>
                        </div>
                        <Link to={`/projects/${f.project_id}`}>
                          <Button size="sm" variant="ghost" className="text-[hsl(36,40%,70%)]"><Eye className="w-4 h-4" /></Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Browsing History */}
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 pt-4">
                <History className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Browsing History
              </h3>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardContent className="p-6 text-center">
                  <History className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Property viewing history will appear here</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── DOCUMENTS ── */}
          <TabsContent value="documents">
            <InvestorDocumentVault userId={user?.id || ""} />
          </TabsContent>

          {/* ── UPDATE PROFILE ── */}
          <TabsContent value="profile">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
              <Card className="border-2 border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <Input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input value={profileForm.email} disabled className="border-[hsl(36,40%,70%)]/30 opacity-60" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone Number</Label>
                      <Input value={profileForm.phone_number} onChange={(e) => setProfileForm(p => ({ ...p, phone_number: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Nationality</Label>
                      <Input value={profileForm.nationality} onChange={(e) => setProfileForm(p => ({ ...p, nationality: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gender</Label>
                      <Select value={profileForm.gender} onValueChange={(v) => setProfileForm(p => ({ ...p, gender: v }))}>
                        <SelectTrigger className="border-[hsl(36,40%,70%)]/30"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Languages</Label>
                      <Input value={profileForm.languages} onChange={(e) => setProfileForm(p => ({ ...p, languages: e.target.value }))} placeholder="English, Arabic..." className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Years of Investment Experience</Label>
                      <Input value={profileForm.experience_years} onChange={(e) => setProfileForm(p => ({ ...p, experience_years: e.target.value }))} type="number" className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bio / Notes</Label>
                    <Textarea value={profileForm.bio} onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" rows={3} />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)] hover:opacity-90">
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>

              {/* Brand Assets */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Brand Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Stamp", icon: Stamp },
                      { label: "Logo", icon: ImageIcon },
                      { label: "Business Card", icon: CreditCard },
                    ].map((asset) => (
                      <div key={asset.label} className="text-center p-4 rounded-lg border border-border/30 bg-background/50">
                        <asset.icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" aria-hidden="true" data-decorative="true" />
                        <p className="text-xs text-muted-foreground">{asset.label}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Not uploaded</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "Draft Applications", icon: FileEdit, count: 0 },
                  { label: "AI Tools Used", icon: Star, count: 0 },
                  { label: "Notes", icon: StickyNote, count: 0 },
                ].map((item) => (
                  <Card key={item.label} className="border-[hsl(36,40%,70%)]/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-[hsl(36,40%,70%)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.count} items</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Role Switch */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Switch Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Want to become a developer or broker? Switch your role below.</p>
                  <div className="flex gap-3">
                    <Link to="/broker/portal">
                      <Button variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Switch to Broker</Button>
                    </Link>
                    <Link to="/developer-portal?tab=register">
                      <Button variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Apply as Developer</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── INBOX ── */}
          <TabsContent value="inbox">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Messages & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[hsl(36,40%,70%)]" />
                            <span className="text-sm text-foreground">{a.message}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── ALERTS ── */}
          <TabsContent value="alerts">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Event Invitations & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No alerts or invitations</p>
                  ) : (
                    <div className="space-y-3">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm text-foreground">{(inv.event as any)?.title || "Event"}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(inv.event as any)?.event_date ? format(new Date((inv.event as any).event_date), "dd MMM yyyy, HH:mm") : ""}
                              </p>
                            </div>
                            <Badge className={inv.status === "accepted" ? "jj-surface-emerald-soft text-emerald-500 border-[color:var(--emerald-1)]/30/30" : inv.status === "declined" ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"}>
                              {inv.status}
                            </Badge>
                          </div>
                          {inv.status === "invited" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => respondToInvitation(inv.id, "accepted")} className="jj-surface-emerald text-white hover:jj-surface-emerald text-xs">Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => respondToInvitation(inv.id, "declined")} className="text-xs">Decline</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sample Approval Timeline */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Submission Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Your submissions go through our 3-step approval process:</p>
                  <ApprovalTimeline steps={JBJ_APPROVAL_STEPS} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── CALENDAR ── */}
          <TabsContent value="calendar">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Events & Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Events from JBJ Global Real Estate will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.filter((inv) => (inv.event as any)?.event_date).map((inv) => (
                        <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                          <div className="w-14 h-14 rounded-xl bg-[hsl(36,40%,70%)]/10 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-[hsl(36,40%,70%)]">{format(new Date((inv.event as any).event_date), "dd")}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date((inv.event as any).event_date), "MMM")}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-foreground">{(inv.event as any)?.title}</p>
                            <p className="text-[10px] text-muted-foreground">{(inv.event as any)?.location || "Location TBA"}</p>
                          </div>
                          <Badge className={inv.status === "accepted" ? "jj-surface-emerald-soft text-emerald-500" : "bg-amber-500/10 text-amber-500"}>
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
