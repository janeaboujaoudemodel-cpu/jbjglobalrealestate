import { useState } from "react";
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
  FileText,
  Settings,
  BookOpen,
  Flag,
  Crown,
  Briefcase,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import LeadStatusBadge from "@/components/crm/LeadStatusBadge";
import QuickActionsGrid from "@/components/owner-dashboard/QuickActionsGrid";
import DepartmentShortcuts from "@/components/owner-dashboard/DepartmentShortcuts";
import IntegrationWidgets from "@/components/owner-dashboard/IntegrationWidgets";
import CRMLeadsTableV2 from "@/components/crm/CRMLeadsTableV2";
import FlaggedLeadsView from "@/components/crm/FlaggedLeadsView";
import EmployeesHub from "@/components/crm/EmployeesHub";
import CRMDashboardCards from "@/components/crm/CRMDashboardCards";

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
      className={`bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 border-zinc-800/80 hover:border-gold/50 transition-all duration-300 shadow-lg shadow-black/30 hover:shadow-gold/10 ${onClick ? 'cursor-pointer' : ''}`}
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
              <Skeleton className="h-8 w-16 bg-zinc-700/50 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{value}</p>
            )}
            <p className="text-sm text-zinc-400 mt-1 font-medium">{title}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20 shadow-lg shadow-gold/5">
            {icon}
          </div>
        </div>
        {trend && (
          <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1 font-medium">
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
      className="p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer group border border-zinc-700/50 hover:border-gold/30"
      onClick={() => onOpen(lead.id)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold font-semibold text-sm">
            {lead.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white truncate text-sm">{lead.full_name}</p>
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {lead.source && (
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
            {lead.source}
          </Badge>
        )}
        {lead.email_lower && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 truncate">
            <Mail className="h-3 w-3" /> {lead.email_lower}
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-gold hover:text-gold hover:bg-gold/10 text-xs h-7"
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
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white text-sm truncate">
            {conversation.user_name || conversation.user_email}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {conversation.page_source || 'Website chat'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className={`text-xs ${
            conversation.status === 'active' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-zinc-700 text-zinc-400'
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
    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {item.type === 'task' && onComplete ? (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item.id); }}
            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              item.status === 'completed' 
                ? 'bg-gold border-gold' 
                : 'border-zinc-600 hover:border-gold'
            }`}
          >
            {item.status === 'completed' && <CheckSquare className="h-3 w-3 text-black" />}
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="h-3 w-3 text-amber-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className={`font-medium text-sm truncate ${item.status === 'completed' ? 'text-zinc-500 line-through' : 'text-white'}`}>
            {displayName}
          </p>
          {(item as any).lead_context && (
            <p className="text-xs text-gold/70 truncate">
              Lead: {(item as any).lead_context}
            </p>
          )}
          {item.due_at && (
            <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
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
          className="text-gold hover:text-gold hover:bg-gold/10"
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
        .select('*', { count: 'exact', head: true });
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
        // Table missing or permission denied - graceful fallback
        return 0;
      }
    },
    enabled: !!user,
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
          // Fetch lead names for tasks that have lead_id
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
      } catch {
        // Tasks table missing
      }
      
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
      toast.success('Task completed');
    } catch {
      toast.error('Failed to complete task');
    }
  };

  return (
    <div className="space-y-8">
      {/* Command Center Header - Enhanced with gradient accent */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-gold to-gold/40 rounded-full" />
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Owner Command Center
          </h1>
        </div>
        <p className="text-zinc-400 mt-1 ml-4 text-sm md:text-base">
          Welcome back, Jane bou Jaoude — Your integrated CRM dashboard
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={totalLeads ?? '—'}
          icon={<Users className="h-6 w-6 text-gold" />}
          loading={loadingLeads}
          onClick={() => setActiveTab('leads')}
        />
        <KPICard
          title="New This Week"
          value={newLeadsThisWeek ?? '—'}
          icon={<UserPlus className="h-6 w-6 text-emerald-400" />}
          loading={loadingNewLeads}
          onClick={() => setActiveTab('leads')}
        />
        <KPICard
          title="Pending Tasks"
          value={pendingTasks ?? '—'}
          icon={<CheckSquare className="h-6 w-6 text-amber-400" />}
          loading={loadingTasks}
          onClick={() => navigate('/owner/crm/tasks')}
        />
        <KPICard
          title="Active Chats"
          value={activeConversations ?? '—'}
          icon={<MessageSquare className="h-6 w-6 text-purple-400" />}
          loading={loadingConversations}
          onClick={() => navigate('/owner/inbox')}
        />
      </div>

      {/* Quick Actions Grid */}
      <QuickActionsGrid />

      {/* Main Tabbed Content - Enhanced styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900/80 border border-zinc-800/80 p-1.5 mb-6 flex-wrap gap-1 rounded-xl shadow-lg shadow-black/20">
          <TabsTrigger 
            value="overview" 
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="leads"
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <Users className="h-4 w-4 mr-2" />
            All Leads
          </TabsTrigger>
          <TabsTrigger 
            value="flagged"
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <Flag className="h-4 w-4 mr-2" />
            Flagged
          </TabsTrigger>
          <TabsTrigger 
            value="vip"
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <Crown className="h-4 w-4 mr-2" />
            VIP Leads
          </TabsTrigger>
          <TabsTrigger 
            value="employees"
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Employees Hub
          </TabsTrigger>
          <TabsTrigger 
            value="audit"
            className="tab-trigger-champagne text-zinc-300 data-[state=active]:text-black"
          >
            <Shield className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Content */}
        <TabsContent value="overview" className="space-y-6">
          {/* CRM Dashboard Cards */}
          <CRMDashboardCards userId={user?.id || ""} hasOwnerAccess={true} />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Newest Leads */}
            <Card className="bg-zinc-900/80 border-zinc-800 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">Newest Leads</CardTitle>
                  <CardDescription className="text-zinc-400">Most recent contacts</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('leads')}
                  className="text-gold hover:text-gold hover:bg-gold/10"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingNewestLeads ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 bg-zinc-800 rounded-lg" />
                    ))}
                  </div>
                ) : newestLeads && newestLeads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
                    <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
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
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                    Needs Follow-up
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Pending items</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/owner/crm/tasks')}
                  className="text-gold hover:text-gold hover:bg-gold/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingFollowUp ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 bg-zinc-800" />
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
                    <CheckSquare className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">All caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Conversations */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Recent Conversations
              </CardTitle>
              <CardDescription className="text-zinc-400">Website chat sessions (last 10)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentConvos ? (
                <div className="grid md:grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 bg-zinc-800" />
                  ))}
                </div>
              ) : recentConversations && recentConversations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-2">
                  {recentConversations.map((convo) => (
                    <ConversationRow key={convo.id} conversation={convo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No conversations yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Widgets */}
          <IntegrationWidgets />

          {/* Department Shortcuts */}
          <DepartmentShortcuts />
        </TabsContent>

        {/* All Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">All Leads</CardTitle>
              <CardDescription className="text-zinc-400">Complete lead management</CardDescription>
            </CardHeader>
            <CardContent>
              <CRMLeadsTableV2 
                key={`leads-${refreshKey}`}
                userId={user?.id || ""} 
                filterType="all"
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flagged Leads Tab */}
        <TabsContent value="flagged" className="space-y-4">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-400" />
                Flagged Leads
              </CardTitle>
              <CardDescription className="text-zinc-400">Leads requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <FlaggedLeadsView 
                key={`flagged-${refreshKey}`}
                userId={user?.id || ""} 
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIP Leads Tab */}
        <TabsContent value="vip" className="space-y-4">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-gold" />
                VIP Leads
              </CardTitle>
              <CardDescription className="text-zinc-400">High-value contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <CRMLeadsTableV2 
                key={`vip-${refreshKey}`}
                userId={user?.id || ""} 
                filterType="vip"
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Hub Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-400" />
                Employees Hub
              </CardTitle>
              <CardDescription className="text-zinc-400">Team management</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeesHub userId={user?.id || ""} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Audit Logs
              </CardTitle>
              <CardDescription className="text-zinc-400">System activity tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 mb-4">View audit logs for all CRM activity</p>
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
