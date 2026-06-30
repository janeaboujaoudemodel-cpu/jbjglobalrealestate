import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, Edit2, Crown, Building2, Upload, Search, Download, File,
  Shield, ShieldBan, Activity, Settings, Brain, Home, Ticket, UserCog,
  Monitor, Heart, ExternalLink, AlertCircle, MapPin, Calendar,
} from "lucide-react";
import { ClipboardList, Users, Briefcase, Megaphone, Smartphone, LayoutDashboard, Bot, Mic, Send, Handshake, BookOpen, Headphones } from "lucide-react";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { SmartDocumentUploader } from "@/components/SmartDocumentUploader";
import { useAdmin } from "@/pages/useAdmin";

// Lazy-load ALL tab content components
const AdminOverviewDashboard = lazy(() => import("@/components/admin/AdminOverviewDashboard").then(m => ({ default: m.AdminOverviewDashboard })));
const AdminAIAssistant = lazy(() => import("@/components/admin/AdminAIAssistant").then(m => ({ default: m.AdminAIAssistant })));
const AIBrokersDashboard = lazy(() => import("@/components/admin/ai-brokers/AIBrokersDashboard").then(m => ({ default: m.AIBrokersDashboard })));
const SecurityDashboardSummary = lazy(() => import("@/components/admin/SecurityDashboardSummary").then(m => ({ default: m.SecurityDashboardSummary })));
const AuditLogDashboard = lazy(() => import("@/components/admin/AuditLogDashboard"));
const BrokerSubscriptionsDashboard = lazy(() => import("@/components/admin/BrokerSubscriptionsDashboard"));
const AIAnalyticsDashboard = lazy(() => import("@/components/admin/AIAnalyticsDashboard"));
const MarketingSettingsDashboard = lazy(() => import("@/components/admin/MarketingSettingsDashboard"));
const PWAAnalyticsDashboard = lazy(() => import("@/components/admin/PWAAnalyticsDashboard"));
const VisitorInsightsDashboard = lazy(() => import("@/components/admin/VisitorInsightsDashboard"));
const RateLimitDashboard = lazy(() => import("@/components/admin/RateLimitDashboard").then(m => ({ default: m.RateLimitDashboard })));
const IPBlocklistDashboard = lazy(() => import("@/components/admin/IPBlocklistDashboard").then(m => ({ default: m.IPBlocklistDashboard })));
const VoiceRecorder = lazy(() => import("@/components/admin/VoiceRecorder"));
const FounderVisibilityToggle = lazy(() => import("@/components/admin/FounderVisibilityToggle").then(m => ({ default: m.FounderVisibilityToggle })));
const PodcastVisibilityToggle = lazy(() => import("@/components/admin/PodcastVisibilityToggle").then(m => ({ default: m.PodcastVisibilityToggle })));
const CompanyProfileDownload = lazy(() => import("@/components/admin/CompanyProfileDownload").then(m => ({ default: m.CompanyProfileDownload })));
const EmbeddedHRDashboard = lazy(() => import("@/components/admin/EmbeddedHRDashboard").then(m => ({ default: m.EmbeddedHRDashboard })));
const EmbeddedITDepartment = lazy(() => import("@/components/admin/EmbeddedITDepartment").then(m => ({ default: m.EmbeddedITDepartment })));
const EmbeddedEmployeeHub = lazy(() => import("@/components/admin/EmbeddedEmployeeHub").then(m => ({ default: m.EmbeddedEmployeeHub })));
const EmbeddedSupportTickets = lazy(() => import("@/components/admin/EmbeddedSupportTickets").then(m => ({ default: m.EmbeddedSupportTickets })));
const EmbeddedInquiryManagementHub = lazy(() => import("@/pages/admin/InquiryManagementHub"));
const EmbeddedCustomerHappinessHub = lazy(() => import("@/components/admin/EmbeddedCustomerHappinessHub").then(m => ({ default: m.EmbeddedCustomerHappinessHub })));
const AdminIntelligence = lazy(() => import("@/pages/admin/AdminIntelligence"));
const PartnershipsDashboardLazy = lazy(() => import("@/components/admin/PartnershipsDashboard").then(m => ({ default: m.PartnershipsDashboard })));
const BookHubDashboardLazy = lazy(() => import("@/components/admin/BookHubDashboard"));

const TabLoadingFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-20 w-full" />
    <div className="grid grid-cols-4 gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

const Admin = () => {
  const h = useAdmin();

  if (h.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#B89555]" />
      </div>
    );
  }

  if (!h.isOwner) return null;

  return (
    <div data-backend-portal="owner-admin" className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      <CommandPalette isOpen={h.showCommandPalette} onClose={() => h.setShowCommandPalette(false)} />

      {/* Premium Header */}
      <header data-admin-owner-header className="border border-[#B89555]/35 bg-[#F7F2EA] rounded-2xl shadow-[0_14px_36px_-24px_rgba(26,26,26,0.28)]">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div data-backend-icon-tile="emerald" data-surface="emerald" className="w-10 h-10 rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/20 flex items-center justify-center shadow-[0_10px_22px_-14px_rgba(6,78,59,0.85),inset_0_1px_0_rgba(255,255,255,0.18)]">
              <Shield className="w-4 h-4 allow-white" strokeWidth={2.35} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </div>
            <div className="hidden sm:block min-w-0 max-w-[460px]">
              <h1 className="text-[#1A1A1A] text-lg font-bold leading-tight">Owner Panel</h1>
              <p className="text-[#1A1A1A] text-xs font-semibold whitespace-normal break-words leading-tight">{h.user?.email}</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
            <button onClick={() => h.setShowCommandPalette(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-[#FDFBF7]/80 border border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/50 transition-all">
              <Search className="h-4 w-4 text-[#1A1A1A] flex-shrink-0" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-[#EFE6D6]/10 text-[#1A1A1A] text-[10px] rounded font-mono flex-shrink-0">⌘K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <AdminNotificationBell />
            <Link to="/owner/marketing-hub">
              <Button size="sm" data-emerald-action="true" data-surface="emerald" className="jj-cta-emerald font-semibold shadow-[0_12px_24px_-18px_rgba(6,78,59,0.85)]">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden xl:inline">Marketing Hub</span>
                <span className="xl:hidden">Marketing</span>
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => h.navigate("/")}>
              <Home className="w-3.5 h-3.5 mr-1.5" /><span className="hidden md:inline">View Site</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={h.handleSignOut}>
              <LogOut className="w-3.5 h-3.5 mr-1.5" /><span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        <Tabs value={h.activeTab} onValueChange={h.setActiveTab} className="space-y-6">
          <div className="w-full jj-scrollbar-gold-x">
            <TabsList className="w-max min-w-full justify-start bg-[#FDFBF7]/80 border-2 border-[#B89555]/30 p-1">
              {[
                { value: "overview", icon: LayoutDashboard, label: "Overview" },
                { value: "ai-assistant", icon: Bot, label: "Admin Assistant" },
                { value: "security", icon: Activity, label: "Security" },
                { value: "properties", icon: Building2, label: "Properties" },
                { value: "rate-limits", icon: Shield, label: "Rate Limits" },
                { value: "ip-blocklist", icon: ShieldBan, label: "IP Blocklist" },
                { value: "audit-logs", icon: ClipboardList, label: "Audit Logs" },
                { value: "brokers", icon: Briefcase, label: "Brokers" },
                { value: "ai-analytics", icon: Brain, label: "AI Analytics" },
                { value: "marketing", icon: Megaphone, label: "Marketing" },
                { value: "pwa-analytics", icon: Smartphone, label: "PWA Analytics" },
                { value: "visitor-insights", icon: Activity, label: "Visitors" },
                { value: "hr-hub", icon: UserCog, label: "HR Hub" },
                { value: "it-department", icon: Monitor, label: "IT Department" },
                { value: "employee-hub", icon: Briefcase, label: "Employee Hub" },
                { value: "inquiries-hub", icon: Ticket, label: "Inquiries Hub" },
                { value: "auth-test", icon: Shield, label: "Authentication Test" },
                { value: "customer-happiness", icon: Heart, label: "Customer Happiness Hub" },
                { value: "podcast-studio", icon: Mic, label: "Podcast Studio" },
                { value: "intelligence", icon: Brain, label: "User Intelligence" },
                { value: "founder", icon: Crown, label: "Founder" },
                { value: "partnerships", icon: Handshake, label: "Partnerships" },
                { value: "book-hub", icon: BookOpen, label: "Book Hub" },
              ].map(tab => {
                const active = h.activeTab === tab.value;
                return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  data-admin-tab-trigger
                  data-owner-admin-tab-active={active ? "true" : undefined}
                  data-surface={active ? "emerald" : "champagne"}
                  className="text-[#1A1A1A] data-[state=active]:!text-white [&[data-state=active]_*]:!text-white"
                >
                  <tab.icon
                    className="w-4 h-4 mr-2 data-[state=active]:!text-white"
                    style={active ? { color: "#FFFFFF", stroke: "#FFFFFF" } : undefined}
                  />
                  <span style={active ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}>{tab.label}</span>
                </TabsTrigger>
              );})}
            </TabsList>
          </div>

          {/* Simple tab content mapping */}
          {[
            { value: "overview", component: <AdminOverviewDashboard /> },
            { value: "ai-assistant", component: <div className="space-y-6"><AdminAIAssistant /><AIBrokersDashboard /></div> },
            { value: "security", component: <SecurityDashboardSummary /> },
            { value: "audit-logs", component: <AuditLogDashboard /> },
            { value: "brokers", component: <BrokerSubscriptionsDashboard /> },
            { value: "ai-analytics", component: <AIAnalyticsDashboard /> },
            { value: "marketing", component: <MarketingSettingsDashboard /> },
            { value: "pwa-analytics", component: <PWAAnalyticsDashboard /> },
            { value: "visitor-insights", component: <VisitorInsightsDashboard /> },
            { value: "hr-hub", component: <EmbeddedHRDashboard /> },
            { value: "it-department", component: <EmbeddedITDepartment /> },
            { value: "employee-hub", component: <EmbeddedEmployeeHub /> },
            { value: "inquiries-hub", component: <EmbeddedInquiryManagementHub /> },
            { value: "customer-happiness", component: <EmbeddedCustomerHappinessHub /> },
            { value: "intelligence", component: <AdminIntelligence embedded /> },
            { value: "partnerships", component: <PartnershipsDashboardLazy /> },
            { value: "book-hub", component: <BookHubDashboardLazy /> },
            { value: "rate-limits", component: <RateLimitDashboard /> },
            { value: "ip-blocklist", component: <IPBlocklistDashboard /> },
          ].map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-8">
              <Suspense fallback={<TabLoadingFallback />}>{tab.component}</Suspense>
            </TabsContent>
          ))}

          <TabsContent value="auth-test" className="space-y-8">
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader><CardTitle className="text-[#1A1A1A]">Authentication Test</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#1A1A1A]/70">Open the account reactivation test flow and verify the "We Found Your Account" popup behavior.</p>
                <Button onClick={() => window.open('/auth?test_reactivation=1', '_blank')} className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">Open Reactivation Test</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="podcast-studio" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">Podcast & Voice Studio</h2>
                    <p className="text-sm text-[#1A1A1A]/60">Manage your podcast episodes and voice cloning</p>
                  </div>
                  <Button onClick={() => h.navigate("/owner/podcast-studio")} className="bg-gradient-to-r from-[#B89555] to-amber-600 hover:from-[#B89555]/90 hover:to-amber-600/90 text-[#1A1A1A] font-semibold shadow-lg shadow-[#B89555]/20">
                    <Mic className="w-4 h-4 mr-2" />Open Full Studio
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="max-w-xl"><VoiceRecorder /></div>
                  <Card className="border-2 border-[#B89555]/20 bg-gradient-to-br from-white/80 via-white/60 to-[#F7F2EA]">
                    <CardHeader><CardTitle className="text-base text-[#1A1A1A] flex items-center gap-2"><Headphones className="w-4 h-4 text-[#B89555]" /> Quick Access</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Record New Episode", desc: "Write script & generate with ElevenLabs" },
                        { label: "Voice Library", desc: "18+ premium voices with accent controls" },
                        { label: "Episode Manager", desc: "View all generated episodes" },
                      ].map((item, i) => (
                        <button key={i} onClick={() => h.navigate("/owner/podcast-studio")} className="w-full text-left p-3 rounded-lg border border-[#B89555]/20 hover:border-[#B89555]/40 hover:bg-[#B89555]/5 transition-all">
                          <p className="font-semibold text-[#1A1A1A] text-sm">{item.label}</p>
                          <p className="text-xs text-[#1A1A1A]/50">{item.desc}</p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="founder" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FounderVisibilityToggle /><PodcastVisibilityToggle /><CompanyProfileDownload />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: "all" as const, label: "Total Projects", value: h.totalProjectsCount ?? h.projects?.length ?? 0, icon: <Building2 className="w-5 h-5 text-[#1A1A1A]" /> },
                { key: "premium" as const, label: "Premium", value: h.projects?.filter((p) => p.is_premium).length || 0, icon: <Crown className="w-5 h-5 text-[#1A1A1A]" /> },
                { key: "developers" as const, label: "Developers", value: h.developers?.length || 0, icon: <Briefcase className="w-5 h-5 text-[#1A1A1A]" /> },
                { key: "communities" as const, label: "Communities", value: h.communities?.length || 0, icon: <Users className="w-5 h-5 text-[#1A1A1A]" /> },
                { key: "areas" as const, label: "Areas", value: h.areas?.length || 0, icon: <MapPin className="w-5 h-5 text-[#1A1A1A]" /> },
              ].map((stat) => (
                <Card key={stat.key} className={`bg-[#FDFBF7] border-2 shadow-lg cursor-pointer transition-all hover:shadow-xl ${h.propertiesFilter === stat.key ? "border-[#B89555] ring-2 ring-gold/20" : "border-[#B89555]/20 hover:border-[#B89555]/40"}`} onClick={() => h.setPropertiesFilter(stat.key)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center flex-shrink-0">{stat.icon}</div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold text-[#1A1A1A] leading-tight">{stat.value}</p>
                        <p className="text-xs text-[#1A1A1A]/70 truncate">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {h.propertiesFilter === "developers" ? (
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-lg">
                <CardHeader><CardTitle className="text-[#1A1A1A]">All Developers ({h.developers?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {h.developers?.map((dev) => (
                        <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-[#B89555]/20 hover:border-[#B89555]/40 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {dev.logo_url ? <img src={dev.logo_url} alt={dev.name} className="w-full h-full object-contain"  loading="lazy" decoding="async" /> : <Building2 className="w-5 h-5 text-[#1A1A1A]" />}
                            </div>
                            <div className="min-w-0 overflow-visible"><p data-developer-name className="font-semibold text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{dev.name}</p><p className="text-xs text-[#1A1A1A]/70">{dev.slug}</p></div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/developers/${dev.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : h.propertiesFilter === "communities" ? (
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-lg">
                <CardHeader><CardTitle className="text-[#1A1A1A]">All Communities ({h.communities?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {h.communities?.map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-[#B89555]/20 hover:border-[#B89555]/40 transition-all">
                          <div className="min-w-0"><p className="font-semibold text-[#1A1A1A] truncate">{comm.name}</p><p className="text-xs text-[#1A1A1A]/70">{comm.slug}</p></div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/communities/${comm.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : h.propertiesFilter === "areas" ? (
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-lg">
                <CardHeader><CardTitle className="text-[#1A1A1A]">All Areas ({h.areas?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {h.areas?.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-[#B89555]/20 hover:border-[#B89555]/40 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {area.image_url ? <img src={area.image_url} alt={area.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" /> : <MapPin className="w-5 h-5 text-[#1A1A1A]" />}
                            </div>
                            <div className="min-w-0"><p className="font-semibold text-[#1A1A1A] truncate">{area.name}</p><p className="text-xs text-[#1A1A1A]/70">{area.emirate} · {area.property_count || 0} projects</p></div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {area.is_trending && <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 text-[10px] px-1 py-0">Trending</Badge>}
                            <Button variant="ghost" size="sm" onClick={() => window.open(`/areas/${area.slug}`, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <>
                <SmartDocumentUploader
                  projects={h.projects?.map(p => ({ id: p.id, name: p.name, slug: p.slug, developer: p.developer ? { id: p.developer.id, name: p.developer.name, slug: p.developer.slug } : null }))}
                  onUploadComplete={() => h.refetchProjects()}
                />
                <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[#1A1A1A]">{h.propertiesFilter === "premium" ? "Premium Projects" : "All Projects"}</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
                        <Input placeholder="Search projects..." value={h.searchQuery} onChange={(e) => h.setSearchQuery(e.target.value)} className="pl-10 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {(h.propertiesFilter === "premium" ? h.filteredProjects?.filter(p => p.is_premium) : h.filteredProjects)?.map((project) => {
                          const coverImg = project.cover_image_url || (project.images?.[0] ? (typeof project.images[0] === 'string' ? project.images[0] : project.images[0]?.image_url) : null);
                          const isIncomplete = !coverImg || !project.description;
                          const subtitleParts = [project.developer?.name, project.location || project.area_name].filter(Boolean);
                          const priceDisplay = project.price_from ? `AED ${Math.round(project.price_from).toLocaleString()}` : null;
                          return (
                            <div key={project.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-[#B89555]/20 hover:border-[#B89555]/40 transition-all">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-14 h-14 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {coverImg ? <img src={coverImg} alt={project.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer"  decoding="async" /> : <Building2 className="w-5 h-5 text-[#1A1A1A]" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{project.name}</h3>
                                    {isIncomplete && <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1 py-0 flex-shrink-0"><AlertCircle className="w-3 h-3 mr-0.5" />Incomplete</Badge>}
                                    {project.is_premium && <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 text-[10px] px-1 py-0 flex-shrink-0"><Crown className="w-3 h-3" /></Badge>}
                                  </div>
                                  {subtitleParts.length > 0 && <p className="text-xs text-[#1A1A1A]/70 truncate">{subtitleParts.join(' — ')}</p>}
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#1A1A1A]/70">
                                    {priceDisplay && <span>{priceDisplay}</span>}
                                    {project.updated_at && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />Auto-updated {new Date(project.updated_at).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1A1A1A]/70 hover:text-[#1A1A1A]" onClick={() => window.open(`/project/${project.slug}`, '_blank')} title="Preview"><ExternalLink className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1A1A1A]/70 hover:text-[#1A1A1A]" onClick={() => h.handleEditProject(project)} title="Edit & Upload Docs"><Edit2 className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1A1A1A]/70 hover:text-[#1A1A1A]" onClick={() => h.handleToggleFeatured(project.id, project.is_premium)} title={project.is_premium ? "Remove Premium" : "Make Premium"}><Crown className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <FloatingActionBar />

      {/* Edit Project Dialog */}
      <Dialog open={h.isEditing} onOpenChange={h.setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FDFBF7] border-2 border-[#B89555]/30">
          <DialogHeader><DialogTitle className="text-[#1A1A1A]">Edit Project: {h.selectedProject?.name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2"><Label className="text-[#1A1A1A]">Name</Label><Input value={h.formData.name} onChange={(e) => h.setFormData({ ...h.formData, name: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" /></div>
            <div className="space-y-2"><Label className="text-[#1A1A1A]">Slug</Label><Input value={h.formData.slug} onChange={(e) => h.setFormData({ ...h.formData, slug: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" /></div>
            <div className="col-span-2 space-y-2"><Label className="text-[#1A1A1A]">Description</Label><Textarea value={h.formData.description} onChange={(e) => h.setFormData({ ...h.formData, description: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" rows={3} /></div>
            <div className="space-y-2"><Label className="text-[#1A1A1A]">Location</Label><Input value={h.formData.location} onChange={(e) => h.setFormData({ ...h.formData, location: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" /></div>
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Emirate</Label>
              <Select value={h.formData.emirate} onValueChange={(value) => h.setFormData({ ...h.formData, emirate: value })}>
                <SelectTrigger className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-[#1A1A1A]">Price From (AED)</Label><Input type="number" value={h.formData.price_from} onChange={(e) => h.setFormData({ ...h.formData, price_from: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" /></div>
            <div className="space-y-2"><Label className="text-[#1A1A1A]">Price To (AED)</Label><Input type="number" value={h.formData.price_to} onChange={(e) => h.setFormData({ ...h.formData, price_to: e.target.value })} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" /></div>
            <div className="col-span-2 flex items-center justify-between bg-[#EFE6D6]/5 p-4 rounded-xl border border-[#B89555]/20">
              <div><Label className="text-[#1A1A1A] font-semibold">Premium Property</Label><p className="text-sm text-[#1A1A1A]/70">Mark as featured/premium listing</p></div>
              <Switch checked={h.formData.is_premium} onCheckedChange={(checked) => h.setFormData({ ...h.formData, is_premium: checked })} />
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-6 pt-6 border-t border-[#B89555]/20">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Project Documents</h3>
            <div className="flex items-center gap-3 mb-4">
              <Select value={h.selectedDocType} onValueChange={h.setSelectedDocType}>
                <SelectTrigger className="w-40 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[{ v: "brochure", l: "Brochure" }, { v: "floor_plan", l: "Floor Plan" }, { v: "payment_plan", l: "Payment Plan" }, { v: "factsheet", l: "Factsheet" }].map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="file" ref={h.fileInputRef} onChange={h.handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" multiple />
              <Button variant="secondary" onClick={() => h.fileInputRef.current?.click()} disabled={h.isUploadingDocument}>
                <Upload className="w-4 h-4 mr-2" />{h.isUploadingDocument ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {h.projectDocuments.length > 0 ? (
              <div className="space-y-2">
                {h.projectDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FDFBF7] to-white rounded-lg border border-[#B89555]/20">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-[#1A1A1A]" />
                      <div><p className="text-sm text-[#1A1A1A] font-medium">{doc.file_name}</p><p className="text-xs text-[#1A1A1A]/70">{doc.document_type} • {h.formatFileSize(doc.file_size)}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(doc.file_url, "_blank")} className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => h.handleDeleteDocument(doc)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[#1A1A1A]/70 text-sm">No documents uploaded yet.</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => h.setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" onClick={h.handleSaveProject} disabled={h.isSaving}>{h.isSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
