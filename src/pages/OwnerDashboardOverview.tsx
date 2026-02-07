import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import LeadStatusBadge from "@/components/crm/LeadStatusBadge";

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
      className={`bg-zinc-900/80 border-zinc-800 hover:border-gold/40 transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-zinc-700 mb-1" />
            ) : (
              <p className="text-3xl font-bold text-white">{value}</p>
            )}
            <p className="text-sm text-zinc-400 mt-1">{title}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        {trend && (
          <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
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
      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
      onClick={() => onOpen(lead.id)}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold font-semibold text-sm">
            {lead.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{lead.full_name}</p>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {lead.email_lower && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" /> {lead.email_lower}
              </span>
            )}
            {lead.phone_e164 && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {lead.phone_e164}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lead.source && (
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
            {lead.source}
          </Badge>
        )}
        <span className="text-xs text-zinc-500">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gold hover:text-gold hover:bg-gold/10"
          onClick={(e) => { e.stopPropagation(); onOpen(lead.id); }}
        >
          Open
          <ExternalLink className="h-3 w-3 ml-1" />
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
  });

  // Fetch newest leads (last 10)
  const { data: newestLeads, isLoading: loadingNewestLeads } = useQuery({
    queryKey: ['owner-newest-leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_leads')
        .select('id, full_name, email_lower, phone_e164, source, created_at, pipeline_stage')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch items needing follow-up (tasks first, then leads as fallback)
  const { data: followUpItems, isLoading: loadingFollowUp } = useQuery({
    queryKey: ['owner-followup-items'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Try fetching tasks first
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('crm_tasks')
          .select('id, title, due_at, status, lead_id')
          .eq('status', 'pending')
          .or(`due_at.lte.${now},due_at.is.null`)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(10);
        
        if (!tasksError && tasks && tasks.length > 0) {
          return tasks.map(t => ({ ...t, type: 'task' as const }));
        }
      } catch {
        // Tasks table missing or inaccessible
      }
      
      // Fallback: Get leads needing follow-up by pipeline_stage
      try {
        const { data: leads } = await supabase
          .from('crm_leads')
          .select('id, full_name, pipeline_stage, created_at')
          .in('pipeline_stage', ['new', 'contacted', 'needs_follow_up', 'open'])
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (leads && leads.length > 0) {
          return leads.map(l => ({ ...l, type: 'lead' as const }));
        }
      } catch {
        // Leads query failed
      }
      
      return [];
    },
    enabled: !!user,
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Owner Dashboard</h1>
          <p className="text-zinc-400">
            Your command center for leads, tasks, and conversations
          </p>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Leads"
            value={totalLeads ?? '—'}
            icon={<Users className="h-6 w-6 text-gold" />}
            loading={loadingLeads}
            onClick={() => navigate('/crm/leads')}
          />
          <KPICard
            title="New This Week"
            value={newLeadsThisWeek ?? '—'}
            icon={<UserPlus className="h-6 w-6 text-emerald-400" />}
            loading={loadingNewLeads}
            onClick={() => navigate('/crm/leads?filter=new')}
          />
          <KPICard
            title="Pending Tasks"
            value={pendingTasks ?? '—'}
            icon={<CheckSquare className="h-6 w-6 text-amber-400" />}
            loading={loadingTasks}
            onClick={() => navigate('/crm/tasks')}
          />
          <KPICard
            title="Active Chats"
            value={activeConversations ?? '—'}
            icon={<MessageSquare className="h-6 w-6 text-purple-400" />}
            loading={loadingConversations}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Newest Leads */}
          <Card className="bg-zinc-900/80 border-zinc-800 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">Newest Leads</CardTitle>
                <CardDescription className="text-zinc-400">Most recent 10 contacts</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/crm/leads')}
                className="text-gold hover:text-gold hover:bg-gold/10"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingNewestLeads ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 bg-zinc-800" />
                ))
              ) : newestLeads && newestLeads.length > 0 ? (
                newestLeads.map((lead) => (
                  <LeadRow 
                    key={lead.id} 
                    lead={lead} 
                    onOpen={(id) => navigate(`/crm/leads/${id}`)} 
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No leads yet</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate('/crm?action=new-lead')}
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
                onClick={() => navigate('/crm/tasks')}
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
                    onOpen={item.type === 'lead' ? (id) => navigate(`/crm/leads/${id}`) : undefined}
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
        <Card className="bg-zinc-900/80 border-zinc-800 mt-6">
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

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button 
            variant="primary"
            onClick={() => navigate('/crm/leads')} 
          >
            <Users className="h-4 w-4 mr-2" />
            Open Leads Inbox
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/crm?action=new-lead')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Lead
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/crm/tasks')}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            View Tasks
          </Button>
        </div>
      </div>
    </div>
  );
}
