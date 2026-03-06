import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, FileText, Plus, Upload, Download, LogOut, Shuffle, LayoutGrid, List, Zap, Briefcase, PanelLeftOpen, PanelLeftClose, Crown, Flag, CheckSquare, Calendar, Search, Bell, Settings, Brain
} from "lucide-react";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useForcePasswordChange } from "@/hooks/useForcePasswordChange";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";

// Lazy-load heavy sub-components for performance
const CRMLeadsTableV2 = lazy(() => import("@/components/crm/CRMLeadsTableV2"));
const CRMEnhancedDashboard = lazy(() => import("@/components/crm/CRMEnhancedDashboard"));
const CRMImportModalV3 = lazy(() => import("@/components/crm/CRMImportModalV3"));
const DeleteImportButton = lazy(() => import("@/components/crm/DeleteImportButton"));
const CRMLeadModal = lazy(() => import("@/components/crm/CRMLeadModal"));
const LeadQuickFilters = lazy(() => import("@/components/crm/LeadQuickFilters"));
const LeadSourceFilter = lazy(() => import("@/components/crm/LeadSourceFilter"));
const BulkAssignModal = lazy(() => import("@/components/crm/BulkAssignModal"));
const SmartReminders = lazy(() => import("@/components/crm/SmartReminders"));
const KanbanPipeline = lazy(() => import("@/components/crm/KanbanPipeline"));
const ActivityTimeline = lazy(() => import("@/components/crm/ActivityTimeline"));
const DealValueTracker = lazy(() => import("@/components/crm/DealValueTracker"));
const AutomationRules = lazy(() => import("@/components/crm/AutomationRules"));
const EmployeeCenter = lazy(() => import("@/components/crm/EmployeeCenter"));
const EmployeesHub = lazy(() => import("@/components/crm/EmployeesHub"));
const CRMToolsSidebar = lazy(() => import("@/components/crm/CRMToolsSidebar"));
const FlaggedLeadsView = lazy(() => import("@/components/crm/FlaggedLeadsView"));
const RecentlyDeletedLeads = lazy(() => import("@/components/crm/RecentlyDeletedLeads"));
const VIPExportButton = lazy(() => import("@/components/crm/VIPExportButton"));
const CRMAssistantPanel = lazy(() => import("@/components/crm/CRMAssistantPanel"));
const CRMCommunicationPanel = lazy(() => import("@/components/crm/CRMCommunicationPanel"));
const AIInsightsPanel = lazy(() => import("@/components/ui/ai-insights-panel"));
const SmartNotificationsLazy = lazy(() => import("@/components/ui/smart-notifications").then(m => ({ default: m.SmartNotifications })));
const NotificationBellLazy = lazy(() => import("@/components/ui/smart-notifications").then(m => ({ default: m.NotificationBell })));

const CRMTabFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

interface CRMProfile {
  id: string;
  user_id: string;
  crm_role: 'owner_admin' | 'broker_member' | 'admin' | 'founder' | 'sales_director';
  is_active: boolean;
  display_name: string | null;
}

const CRM = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CRMProfile | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showAssistantPanel, setShowAssistantPanel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showToolsSidebar, setShowToolsSidebar] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Force password change hook
  const { needsPasswordChange, isLoading: passwordCheckLoading, userName, setNeedsPasswordChange } = useForcePasswordChange();
  
  // Smart filters
  const [quickFilter, setQuickFilter] = useState("all");
  const [quickFilterStatuses, setQuickFilterStatuses] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // AI Insights (no placeholders)
  const aiInsights: any[] = [];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    checkCRMAccess();
  }, [authLoading, user, navigate]);

  // Handle URL action parameter for opening new lead modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-lead') {
      setShowLeadModal(true);
      // Clear the action param after handling
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user?.id) {
      fetchStatusCounts();
    }
  }, [user?.id, refreshKey]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show force password change screen if needed - AFTER all hooks
  if (needsPasswordChange && !passwordCheckLoading) {
    return (
      <ForcePasswordChange 
        userName={userName} 
        onComplete={() => setNeedsPasswordChange(false)} 
      />
    );
  }

  const checkCRMAccess = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Access denied. You are not registered in the CRM system.");
        navigate("/");
        return;
      }

      if (!data.is_active) {
        toast.error("Your CRM account has been deactivated. Contact admin.");
        navigate("/");
        return;
      }

      setProfile(data as CRMProfile);
    } catch (err) {
      console.error("CRM access check failed:", err);
      toast.error("Failed to verify CRM access");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const { data } = await supabase
        .from("crm_lead_state_per_user")
        .select("pipeline_status");
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        const status = item.pipeline_status || "new";
        counts[status] = (counts[status] || 0) + 1;
      });
      setStatusCounts(counts);
    } catch (err) {
      console.error("Failed to fetch status counts:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportCSV = async () => {
    try {
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("full_name, email_lower, phone_e164, nationality, preferred_language, current_location_country, source, tags, created_at")
        .order("created_at", { ascending: false });
      
      if (!leads || leads.length === 0) {
        toast.error("No leads to export");
        return;
      }
      
      const headers = ["Full Name", "Email", "Phone", "Nationality", "Language", "Country", "Source", "Tags", "Created At"];
      const csvRows = [
        headers.join(","),
        ...leads.map(lead => [
          `"${(lead.full_name || '').replace(/"/g, '""')}"`,
          lead.email_lower || '',
          lead.phone_e164 || '',
          lead.nationality || '',
          lead.preferred_language || '',
          lead.current_location_country || '',
          lead.source || '',
          `"${(lead.tags || []).join(', ')}"`,
          lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''
        ].join(","))
      ];
      
      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jbj_crm_leads_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${leads.length} leads to CSV`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export leads");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleQuickFilterChange = (filter: string, statuses: string[]) => {
    setQuickFilter(filter);
    setQuickFilterStatuses(statuses);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-gold/20" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 bg-gold/20 border-2 border-gold/30 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 bg-gold/20 border-2 border-gold/30 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_10px_40px_rgba(200,167,102,0.2)]">
          <CardHeader>
            <CardTitle className="text-black">CRM access unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              We couldn't load your CRM profile for this session. Please refresh the page. If it keeps happening, sign out and sign in again.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => window.location.reload()} variant="primary" className="w-full sm:w-auto">
                Refresh
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")} className="w-full sm:w-auto">
                Back to site
              </Button>
              <Button variant="secondary" onClick={handleSignOut} className="w-full sm:w-auto">
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCRMOwner = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder';
  const isFounder = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder';

  const { isFounderVisible } = useFounderVisibility();

  // Get role label with proper display name
  const getRoleLabel = () => {
    const displayName = profile.display_name || 'Team Member';
    switch (profile.crm_role) {
      case 'founder':
      case 'owner_admin':
        return isFounderVisible ? `Founder & CEO — ${displayName}` : `CEO — Team Member`;
      case 'admin':
        return `Admin — ${displayName}`;
      case 'broker_member':
        return `Broker — ${displayName}`;
      default:
        return displayName;
    }
  };

  // Get short role title
  const getRoleTitle = () => {
    switch (profile.crm_role) {
      case 'founder':
      case 'owner_admin':
        return isFounderVisible ? 'Founder & CEO' : 'CEO';
      case 'admin':
        return 'Admin';
      case 'broker_member':
        return 'Broker';
      default:
        return 'Team Member';
    }
  };

  // Get display name based on visibility
  const getFounderDisplayName = () => {
    if (isFounderVisible) {
      return isFounder ? "Jane Bou Jaoude" : (profile.display_name || "Team Member");
    }
    return profile.display_name || "Team Member";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] pt-20 lg:pt-24">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Notifications Panel */}
      <Suspense fallback={null}>
        <SmartNotificationsLazy
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={[]}
          onMarkAllRead={() => {}}
        />
      </Suspense>
      
      {/* Tools Sidebar */}
      <CRMToolsSidebar isOpen={showToolsSidebar} onClose={() => setShowToolsSidebar(false)} />

      {/* Premium Header - Champagne with Gold border */}
      <header className="border-b-2 border-gold/40 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-20 lg:top-24 z-40 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
        <div className="max-w-[1600px] w-full mx-auto px-6 py-3">
          {/* First Line - Role Only */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToolsSidebar(!showToolsSidebar)}
                className="text-black hover:text-gold hover:bg-gold/10 shrink-0"
              >
                {showToolsSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
              <p className="text-base font-bold text-black">
                {getRoleTitle()} — {getFounderDisplayName()}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isCRMOwner && (
                <Button variant="secondary" size="sm" onClick={() => navigate("/owner")} className="font-semibold">
                  Owner Command Center
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-black hover:text-gold hover:bg-gold/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Second Line - Search & Quick Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold/20">
            {/* Search Bar */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 text-zinc-600 hover:border-gold/50 transition-all max-w-xs"
            >
              <Search className="h-4 w-4 text-gold" />
              <span className="text-sm">Search leads…</span>
              <kbd className="ml-2 px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono">⌘K</kbd>
            </button>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`text-gold hover:text-black hover:bg-gold/20 ${showAIInsights ? 'bg-gold/10' : ''}`}
              >
                <Brain className="h-4 w-4" />
              </Button>
              
              <Suspense fallback={<div className="h-9 w-9" />}>
                <NotificationBellLazy
                  count={0}
                  onClick={() => setShowNotifications(true)}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30"
                />
              </Suspense>
              
              <div className="hidden md:flex items-center gap-1 ml-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/crm/tasks")} className="text-black hover:text-gold hover:bg-gold/10 text-xs">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Tasks
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/crm/calendar")} className="text-black hover:text-gold hover:bg-gold/10 text-xs">
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("employees")} className="text-black hover:text-gold hover:bg-gold/10 text-xs">
                  <Users className="h-4 w-4 mr-1" />
                  Team
                </Button>
                {isCRMOwner && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/automations")} className="text-gold hover:text-black hover:bg-gold/20 text-xs font-semibold">
                    <Zap className="h-4 w-4 mr-1" />
                    Automations
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex">
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-6 py-8 space-y-6 overflow-hidden">
          {/* Deal Value Tracker */}
          <DealValueTracker userId={user?.id || ""} />

          {/* Enhanced Dashboard with Charts */}
          <CRMEnhancedDashboard userId={user?.id || ""} hasOwnerAccess={isCRMOwner} />

            {/* Main CRM Layout - Team Communication Full Width + Leads Update */}
            <div className="space-y-6">
              {/* Top Row: AI Insights, Smart Reminders, Smart Automations - All on one line */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AI Insights Panel */}
                {showAIInsights && (
                  <Card className="overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
                    <CardContent className="p-0">
                      <div className="h-[280px]">
                        <AIInsightsPanel
                          className="h-full"
                          insights={aiInsights}
                          isLoading={false}
                          onRefresh={() => toast.info("Refreshing AI insights...")}
                          onToggleCollapse={() => setShowAIInsights(false)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Smart Reminders */}
                <SmartReminders userId={user?.id || ""} limit={3} />
                
                {/* Smart Automations */}
                <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.2)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-black font-bold text-base flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
                        <Zap className="h-4 w-4 text-black" />
                      </div>
                      Smart Automations
                      <Badge className="ml-auto text-xs bg-gold/10 text-black border-gold/30">
                        Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[220px] overflow-y-auto">
                      <AutomationRules userId={user?.id || ""} isOwner={isCRMOwner} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Team Communication - Full Width Edge-to-Edge */}
              <div className="w-full">
                <CRMCommunicationPanel />
              </div>
              
              {/* Activity Timeline - Full Width */}
              <ActivityTimeline userId={user?.id || ""} limit={8} />
              
              {/* Leads Update Section with shortcuts */}
              <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black font-bold text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
                      <Users className="h-4 w-4 text-black" />
                    </div>
                    Leads Update
                    <span className="ml-auto text-sm font-normal text-zinc-500">Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Quick Action Buttons - All on one row for easy access */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => setShowLeadModal(true)} 
                      variant="primary" 
                      className="text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Lead
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowImportModal(true)}
                      className="text-sm"
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Import
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleExportCSV}
                      className="text-sm"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Export CSV
                    </Button>
                    {isCRMOwner && (
                      <Button
                        variant="secondary"
                        onClick={() => setShowBulkAssignModal(true)}
                        className="text-sm"
                      >
                        <Shuffle className="h-4 w-4 mr-1.5" />
                        Bulk Assign
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => setShowAssistantPanel(true)}
                      className="text-sm"
                    >
                      <Users className="h-4 w-4 mr-1.5" />
                      Assistant
                    </Button>
                    {isCRMOwner && <VIPExportButton />}
                    {isCRMOwner && (
                      <DeleteImportButton userId={user?.id || ""} onSuccess={handleRefresh} hasOwnerAccess={isCRMOwner} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gold/20" />

            {/* View Mode Toggle - Compact */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded transition-all ${viewMode === "table" ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 text-black" : "text-black hover:bg-gold/10"}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-2 rounded transition-all ${viewMode === "kanban" ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 text-black" : "text-black hover:bg-gold/10"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Leads Section with Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-2 mb-4 w-full flex flex-wrap gap-1 h-auto">
                <TabsTrigger 
                  value="all" 
                  className="tab-trigger-champagne text-black px-5 py-2.5"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="flagged"
                  className="tab-trigger-champagne text-black px-5 py-2.5"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flagged
                  {statusCounts.flagged && (
                    <Badge className="ml-2 bg-red-500/20 text-red-600 border-red-500/30">{statusCounts.flagged}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="vip"
                  className="tab-trigger-champagne text-black px-5 py-2.5"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  VIP Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="management"
                  className="tab-trigger-champagne text-black px-5 py-2.5"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Leads Management
                </TabsTrigger>
                <TabsTrigger 
                  value="employees"
                  className="tab-trigger-champagne text-black px-5 py-2.5"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Employees Hub
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {activeTab === "all" && (
                  <CRMLeadsTableV2 
                    key={refreshKey}
                    userId={user?.id || ""} 
                    filterType="all"
                    onRefresh={handleRefresh}
                    isOwner={isCRMOwner}
                  />
                )}
              </TabsContent>

              <TabsContent value="flagged">
                {activeTab === "flagged" && (
                  <FlaggedLeadsView 
                    key={refreshKey}
                    userId={user?.id || ""} 
                    onRefresh={handleRefresh}
                  />
                )}
              </TabsContent>

              <TabsContent value="vip">
                {activeTab === "vip" && (
                  <CRMLeadsTableV2 
                    key={refreshKey}
                    userId={user?.id || ""} 
                    filterType="vip"
                    onRefresh={handleRefresh}
                    isOwner={isCRMOwner}
                  />
                )}
              </TabsContent>

              <TabsContent value="management">
                {activeTab === "management" && (
                  <RecentlyDeletedLeads userId={user?.id || ""} onRefresh={handleRefresh} />
                )}
              </TabsContent>

              <TabsContent value="employees">
                {activeTab === "employees" && (
                  <EmployeesHub userId={user?.id || ""} />
                )}
              </TabsContent>
            </Tabs>
        </main>

        {/* Floating Action Bar */}
        <FloatingActionBar />

        {/* Modals */}
        <CRMImportModalV3
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            handleRefresh();
          }}
          userId={user?.id || ""}
        />

        <CRMLeadModal
          open={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          onSuccess={() => {
            setShowLeadModal(false);
            handleRefresh();
          }}
          userId={user?.id || ""}
        />

        <BulkAssignModal
          open={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={() => {
            setShowBulkAssignModal(false);
            handleRefresh();
          }}
          selectedLeadIds={[]}
        />

        <CRMAssistantPanel 
          userId={user?.id || ""}
          isOpen={showAssistantPanel}
          onClose={() => setShowAssistantPanel(false)}
        />
      </div>
    </div>
  );
};

export default CRM;
