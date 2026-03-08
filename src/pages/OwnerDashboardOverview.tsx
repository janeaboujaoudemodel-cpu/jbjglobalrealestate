import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  AlertCircle,
  UserPlus,
  Activity,
  ExternalLink,
  Flag,
  Crown,
  Briefcase,
  LayoutDashboard,
  Shield,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import LeadStatusBadge from "@/components/crm/LeadStatusBadge";

// Lazy-load heavy tab components
const CRMLeadsTableV2 = lazy(() => import("@/components/crm/CRMLeadsTableV2"));
const FlaggedLeadsView = lazy(() => import("@/components/crm/FlaggedLeadsView"));
const EmployeesHub = lazy(() => import("@/components/crm/EmployeesHub"));
const CRMDashboardCards = lazy(() => import("@/components/crm/CRMDashboardCards"));
const QuickActionsGrid = lazy(() => import("@/components/owner-dashboard/QuickActionsGrid"));
const DepartmentShortcuts = lazy(() => import("@/components/owner-dashboard/DepartmentShortcuts"));
const IntegrationWidgets = lazy(() => import("@/components/owner-dashboard/IntegrationWidgets"));
const RecentlyDeletedLeads = lazy(() => import("@/components/crm/RecentlyDeletedLeads"));

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  loading?: boolean;
  onClick?: () => void;
}

function KPICard({ title, value, icon, trend, loading, onClick }: KPICardProps) {
  return (
    <Card 
      className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-gold/10 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? `View ${title}` : undefined}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-[#C9A84C]/10 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-black">{value}</p>
            )}
            <p className="text-sm text-zinc-600 mt-1 font-medium">{title}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/10 flex items-center justify-center border border-[#C9A84C]/20 shadow-sm">
            {icon}
          </div>
        </div>
        {trend && (
          <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" /> {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface LeadRowProps {
  lead: {
    id: string;
    full_name: string;
    email_lower: string | null;
    phone_e164: string | null;
    source: string | null;
    created_at: string;
    pipeline_stage?: string;
  };
  onOpen: (id: string) => void;
}

function LeadRow({ lead, onOpen }: LeadRowProps) {
  return (
    <div 
      className="p-4 rounded-lg bg-[#FDFBF7] hover:bg-[#C9A84C]/5 transition-colors cursor-pointer group border border-[#C9A84C]/20 hover:border-[#C9A84C]/40"
      onClick={() => onOpen(lead.id)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[#C9A84C] font-semibold text-sm">
            {lead.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-black truncate text-sm">{lead.full_name}</p>
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {lead.source && (
          <Badge variant="secondary" className="bg-[#C9A84C]/10 text-zinc-700 text-xs border border-[#C9A84C]/20">
            {lead.source}
          </Badge>
        )}
        {lead.phone_e164 && (
          <span className="flex items-center gap-1 text-xs text-zinc-500 truncate">
            <Phone className="h-3 w-3" /> {lead.phone_e164}
          </span>
        )}
        {lead.email_lower && (
          <span className="flex items-center gap-1 text-xs text-zinc-500 truncate">
            <Mail className="h-3 w-3" /> {lead.email_lower}
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10 text-xs h-7"
          onClick={(e) => { e.stopPropagation(); onOpen(lead.id); }}
        >
          Open <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface ConversationRowProps {
  conversation: {
    id: string;
    user_name: string | null;
    user_email: string;
    status: string;
    created_at: string;
    page_source: string | null;
  };
}

function ConversationRow({ conversation }: ConversationRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[#FDFBF7] border border-[#C9A84C]/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-purple-600" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-black text-sm truncate">
            {conversation.user_name || conversation.user_email}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {conversation.page_source || 'Website chat'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className={`text-xs ${
            conversation.status === 'active' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {conversation.status}
        </Badge>
        <span className="text-xs text-zinc-500">
          {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

interface FollowUpItemProps {
  item: {
    id: string;
    title?: string;
    full_name?: string;
    due_at?: string | null;
    status?: string;
    pipeline_stage?: string;
    type: 'task' | 'lead';
  };
  onComplete?: (id: string) => void;
  onOpen?: (id: string) => void;
}

function FollowUpItem({ item, onComplete, onOpen }: FollowUpItemProps) {
  const isOverdue = item.due_at && new Date(item.due_at) < new Date() && item.status !== 'completed';
  const displayName = item.type === 'task' ? item.title : item.full_name;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[#FDFBF7] border border-[#C9A84C]/10">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {item.type === 'task' && onComplete ? (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item.id); }}
            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              item.status === 'completed' 
                ? 'bg-[#C9A84C] border-[#C9A84C]' 
                : 'border-[#C9A84C]/40 hover:border-[#C9A84C]'
            }`}
          >
            {item.status === 'completed' && <CheckSquare className="h-3 w-3 text-white" />}
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-3 w-3 text-amber-600" />
          </div>
        )}
        <div className="min-w-0">
          <p className={`font-medium text-sm truncate ${item.status === 'completed' ? 'text-zinc-400 line-through' : 'text-black'}`}>
            {displayName}
          </p>
          {(item as any).lead_context && (
            <p className="text-xs text-[#C9A84C]/70 truncate">
              Lead: {(item as any).lead_context}
            </p>
          )}
          {item.due_at && (
            <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-zinc-500'}`}>
              <Calendar className="h-3 w-3" />
              {format(new Date(item.due_at), 'MMM d, h:mm a')}
              {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
            </p>
          )}
          {item.pipeline_stage && (
            <LeadStatusBadge status={item.pipeline_stage} size="sm" />
          )}
        </div>
      </div>
      {item.type === 'lead' && onOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10"
          onClick={() => onOpen(item.id)}
        >
          Open
        </Button>
      )}
    </div>
  );
}

export default function OwnerDashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch total leads count
  const { data: totalLeads, isLoading: loadingLeads } = useQuery({
    queryKey: ['owner-kpi-total-leads'],
    queryFn: async () => {
      const { count } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch new leads this week
  const { data: newLeadsThisWeek, isLoading: loadingNewLeads } = useQuery({
    queryKey: ['owner-kpi-new-leads-week'],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', weekAgo.toISOString());
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch pending tasks count (graceful failure)
  const { data: pendingTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['owner-kpi-pending-tasks'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('crm_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (error) throw error;
        return count || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch active conversations count
  const { data: activeConversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['owner-kpi-active-conversations'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        if (error) throw error;
        return count || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch newest leads (last 10)
  const { data: newestLeads, isLoading: loadingNewestLeads } = useQuery({
    queryKey: ['owner-newest-leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_leads')
        .select('id, full_name, email_lower, phone_e164, source, created_at, pipeline_stage')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch items needing follow-up (tasks first, then leads as fallback)
  const { data: followUpItems, isLoading: loadingFollowUp } = useQuery({
    queryKey: ['owner-followup-items'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('crm_tasks')
          .select('id, title, due_at, status, lead_id')
          .eq('status', 'pending')
          .or(`due_at.lte.${now},due_at.is.null`)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(10);
        
        if (!tasksError && tasks && tasks.length > 0) {
          const leadIds = tasks.filter(t => t.lead_id).map(t => t.lead_id);
          let leadMap: Record<string, string> = {};
          if (leadIds.length > 0) {
            const { data: leads } = await supabase
              .from('crm_leads')
              .select('id, full_name, source')
              .in('id', leadIds);
            if (leads) {
              leadMap = Object.fromEntries(leads.map(l => [l.id, `${l.full_name}${l.source ? ` · ${l.source}` : ''}`]));
            }
          }
          return tasks.map(t => ({ 
            ...t, 
            type: 'task' as const,
            lead_context: t.lead_id ? leadMap[t.lead_id] || null : null 
          }));
        }
      } catch {}
      
      try {
        const { data: leads } = await supabase
          .from('crm_leads')
          .select('id, full_name, pipeline_stage, created_at, source')
          .in('pipeline_stage', ['new', 'contacted', 'needs_follow_up', 'open'])
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (leads && leads.length > 0) {
          return leads.map(l => ({ ...l, type: 'lead' as const, lead_context: l.source || null }));
        }
      } catch {}
      
      return [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch recent conversations (last 10)
  const { data: recentConversations, isLoading: loadingRecentConvos } = useQuery({
    queryKey: ['owner-recent-conversations'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('id, user_name, user_email, status, created_at, page_source')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleCompleteTask = async (taskId: string) => {
    try {
      await supabase
        .from('crm_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      queryClient.invalidateQueries({ queryKey: ['owner-followup-items'] });
      queryClient.invalidateQueries({ queryKey: ['owner-kpi-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
      toast.success('Task completed');
    } catch {
      toast.error('Failed to complete task');
    }
  };

  return (
    <div className="space-y-8 min-w-0 overflow-hidden">
      {/* Command Center Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-[#C9A84C] to-[#C9A84C]/40 rounded-full" />
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Owner Command Center
          </h1>
        </div>
        <p className="text-zinc-600 mt-1 ml-4 text-sm md:text-base">
          Welcome back, Jane Bou Jaoude — Your integrated CRM dashboard
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={totalLeads ?? '—'}
          icon={<Users className="h-6 w-6 text-[#C9A84C]" />}
          loading={loadingLeads}
          onClick={() => setActiveTab('leads')}
        />
        <KPICard
          title="New This Week"
          value={newLeadsThisWeek ?? '—'}
          icon={<UserPlus className="h-6 w-6 text-emerald-600" />}
          loading={loadingNewLeads}
          onClick={() => setActiveTab('leads')}
        />
        <KPICard
          title="Pending Tasks"
          value={pendingTasks ?? '—'}
          icon={<CheckSquare className="h-6 w-6 text-amber-600" />}
          loading={loadingTasks}
          onClick={() => navigate('/owner/crm/tasks')}
        />
        <KPICard
          title="Active Chats"
          value={activeConversations ?? '—'}
          icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
          loading={loadingConversations}
          onClick={() => navigate('/owner/inbox')}
        />
      </div>

      {/* Quick Actions Grid */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <QuickActionsGrid />
      </Suspense>

      {/* Main Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#C9A84C]/30 p-2 mb-6 flex flex-wrap justify-center gap-1.5 rounded-xl shadow-sm h-auto">
          <TabsTrigger 
            value="overview" 
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="leads"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Users className="h-4 w-4 mr-2" />
            All Leads
          </TabsTrigger>
          <TabsTrigger 
            value="flagged"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Flag className="h-4 w-4 mr-2" />
            Flagged
          </TabsTrigger>
          <TabsTrigger 
            value="vip"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Crown className="h-4 w-4 mr-2" />
            VIP Leads
          </TabsTrigger>
          <TabsTrigger 
            value="leads-management"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Leads Management
          </TabsTrigger>
          <TabsTrigger 
            value="employees"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Employees Hub
          </TabsTrigger>
          <TabsTrigger 
            value="audit"
            className="tab-trigger-champagne text-zinc-600 data-[state=active]:text-black data-[state=active]:shadow-sm px-4 py-2"
          >
            <Shield className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <CRMDashboardCards userId={user?.id || ""} hasOwnerAccess={true} />
          </Suspense>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Newest Leads */}
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 lg:col-span-2 shadow-sm overflow-hidden min-w-0">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg text-black">Newest Leads</CardTitle>
                  <CardDescription className="text-zinc-500">Most recent contacts</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('leads')}
                  className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {loadingNewestLeads ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 bg-[#C9A84C]/10 rounded-lg" />
                    ))}
                  </div>
                ) : newestLeads && newestLeads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newestLeads.map((lead) => (
                      <LeadRow 
                        key={lead.id} 
                        lead={lead} 
                        onOpen={(id) => navigate(`/owner/crm/leads/${id}`)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-[#C9A84C]/40 mx-auto mb-3" />
                    <p className="text-zinc-500">No leads yet</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setActiveTab('leads')}
                    >
                      Add First Lead
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Needs Follow-up */}
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm overflow-hidden min-w-0">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base text-black flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Needs Follow-up
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Pending items</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/owner/crm/tasks')}
                  className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                {loadingFollowUp ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 bg-[#C9A84C]/10" />
                  ))
                ) : followUpItems && followUpItems.length > 0 ? (
                  followUpItems.map((item: any) => (
                    <FollowUpItem 
                      key={item.id} 
                      item={item}
                      onComplete={item.type === 'task' ? handleCompleteTask : undefined}
                      onOpen={item.type === 'lead' ? (id) => navigate(`/owner/crm/leads/${id}`) : undefined}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckSquare className="h-10 w-10 text-[#C9A84C]/40 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">All caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Conversations */}
          <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-black flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Conversations
              </CardTitle>
              <CardDescription className="text-zinc-500">Website chat sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingRecentConvos ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 bg-[#C9A84C]/10" />
                  ))}
                </div>
              ) : recentConversations && recentConversations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {recentConversations.map((convo) => (
                    <ConversationRow key={convo.id} conversation={convo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-[#C9A84C]/40 mx-auto mb-3" />
                  <p className="text-zinc-500">No conversations yet</p>
                  <p className="text-zinc-400 text-xs mt-1">Conversations from website visitors will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Suspense fallback={null}>
            <IntegrationWidgets />
          </Suspense>
          <Suspense fallback={null}>
            <DepartmentShortcuts />
          </Suspense>
        </TabsContent>

        {/* All Leads Tab — lazy rendered */}
        <TabsContent value="leads" className="space-y-4">
          {activeTab === "leads" && (
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-black">All Leads</CardTitle>
                <CardDescription className="text-zinc-500">Complete lead management</CardDescription>
              </CardHeader>
               <CardContent>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <CRMLeadsTableV2 
                    key={`leads-${refreshKey}`}
                    userId={user?.id || ""} 
                    filterType="all"
                    onRefresh={handleRefresh}
                  />
                </Suspense>
               </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Flagged Leads Tab — lazy rendered */}
        <TabsContent value="flagged" className="space-y-4">
          {activeTab === "flagged" && (
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-500" />
                  Flagged Leads
                </CardTitle>
                <CardDescription className="text-zinc-500">Leads requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <FlaggedLeadsView 
                    key={`flagged-${refreshKey}`}
                    userId={user?.id || ""} 
                    onRefresh={handleRefresh}
                  />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* VIP Leads Tab — lazy rendered */}
        <TabsContent value="vip" className="space-y-4">
          {activeTab === "vip" && (
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[#C9A84C]" />
                  VIP Leads
                </CardTitle>
                <CardDescription className="text-zinc-500">High-value contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <CRMLeadsTableV2 
                    key={`vip-${refreshKey}`}
                    userId={user?.id || ""} 
                    filterType="vip"
                    onRefresh={handleRefresh}
                  />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leads Management Tab — Recently Deleted */}
        <TabsContent value="leads-management" className="space-y-4">
          {activeTab === "leads-management" && (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RecentlyDeletedLeads userId={user?.id || ""} onRefresh={handleRefresh} />
            </Suspense>
          )}
        </TabsContent>

        {/* Employees Hub Tab — lazy rendered */}
        <TabsContent value="employees" className="space-y-4">
          {activeTab === "employees" && (
            <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-black flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Employees Hub
                </CardTitle>
                <CardDescription className="text-zinc-500">Team management</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <EmployeesHub userId={user?.id || ""} />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-white/70 border-2 border-[#C9A84C]/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-black flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Audit Logs
              </CardTitle>
              <CardDescription className="text-zinc-500">System activity tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-[#C9A84C]/40 mx-auto mb-3" />
                <p className="text-zinc-500 mb-4">View audit logs for all CRM activity</p>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/owner/admin')}
                >
                  Open Admin CRM
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
