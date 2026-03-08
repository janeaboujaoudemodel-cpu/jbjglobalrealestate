/**
 * Owner Agenda Page - JBJ Global Real Estate
 * Daily agenda with follow-ups, tasks, and overdue items
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, startOfDay, addDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  User,
  Phone,
  Mail,
  ChevronRight,
  Bell,
  Inbox,
  Target,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface AgendaTask {
  id: string;
  title: string;
  description?: string | null;
  due_at: string | null;
  status?: string;
  is_completed?: boolean;
  priority?: string | null;
  lead_id?: string | null;
  lead?: {
    full_name: string;
  } | null;
}

interface AgendaLead {
  id: string;
  full_name: string;
  email_lower?: string | null;
  phone_e164?: string | null;
  pipeline_stage?: string;
  created_at: string;
  updated_at: string;
}

interface AgendaThread {
  id: string;
  contact_name?: string | null;
  contact_identifier: string;
  channel_type: string;
  status: string;
  unread_count: number;
  last_message_at?: string | null;
  last_message_preview?: string | null;
}

export default function OwnerAgenda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");

  // Fetch tasks due today and overdue
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['owner-agenda-tasks'],
    queryFn: async () => {
      try {
        const tomorrow = addDays(startOfDay(new Date()), 1).toISOString();
        const { data, error } = await supabase
          .from('owner_comm_tasks')
          .select('*, lead:crm_leads(full_name)')
          .eq('is_completed', false)
          .or(`due_at.lte.${tomorrow},due_at.is.null`)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(50);
        if (error) throw error;
        // Normalize the data to use status field
        return (data || []).map(t => ({ 
          ...t, 
          status: t.is_completed ? 'completed' : 'pending' 
        })) as AgendaTask[];
      } catch {
        // Try CRM tasks as fallback
        try {
          const tomorrow = addDays(startOfDay(new Date()), 1).toISOString();
          const { data, error } = await supabase
            .from('crm_tasks')
            .select('*')
            .neq('status', 'completed')
            .or(`due_at.lte.${tomorrow},due_at.is.null`)
            .order('due_at', { ascending: true, nullsFirst: false })
            .limit(50);
          if (error) throw error;
          return (data || []).map(t => ({ ...t, lead: null })) as AgendaTask[];
        } catch {
          return [];
        }
      }
    },
    enabled: !!user,
  });

  // Fetch leads needing follow-up
  const { data: leadsNeedingAction = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['owner-agenda-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('id, full_name, email_lower, phone_e164, pipeline_stage, created_at, updated_at')
        .in('pipeline_stage', ['new', 'contacted', 'needs_follow_up', 'open'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AgendaLead[];
    },
    enabled: !!user,
  });

  // Fetch unanswered messages
  const { data: unansweredThreads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['owner-agenda-threads'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('owner_comm_threads')
          .select('*')
          .eq('status', 'needs_reply')
          .order('last_message_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        return data as AgendaThread[];
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  // Complete task mutation
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      // Try owner_comm_tasks first
      const { error } = await supabase
        .from('owner_comm_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      
      if (error) {
        // Fallback to crm_tasks
        const { error: crmError } = await supabase
          .from('crm_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId);
        if (crmError) throw crmError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-agenda-tasks'] });
      toast.success('Task completed');
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  // Categorize tasks
  const overdueTasks = tasks.filter(t => t.due_at && isPast(new Date(t.due_at)));
  const todayTasks = tasks.filter(t => t.due_at && isToday(new Date(t.due_at)));
  const tomorrowTasks = tasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at)));
  const noDueDateTasks = tasks.filter(t => !t.due_at);

  const isLoading = loadingTasks || loadingLeads || loadingThreads;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30">
                  <Calendar className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Daily Agenda</h1>
                  <p className="text-zinc-500 text-sm">Jane Bou Jaoude — {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['owner-agenda-tasks'] });
                    queryClient.invalidateQueries({ queryKey: ['owner-agenda-leads'] });
                    queryClient.invalidateQueries({ queryKey: ['owner-agenda-threads'] });
                  }}
                  className="border-gold/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="primary" onClick={() => navigate('/owner')}>
                  <Target className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryCard
              label="Overdue"
              value={overdueTasks.length}
              icon={<AlertTriangle className="h-4 w-4" />}
              variant="danger"
            />
            <SummaryCard
              label="Due Today"
              value={todayTasks.length}
              icon={<Clock className="h-4 w-4" />}
              variant="warning"
            />
            <SummaryCard
              label="Needs Reply"
              value={unansweredThreads.length}
              icon={<MessageSquare className="h-4 w-4" />}
              variant="info"
            />
            <SummaryCard
              label="New Leads"
              value={leadsNeedingAction.filter(l => l.pipeline_stage === 'new').length}
              icon={<User className="h-4 w-4" />}
              variant="success"
            />
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6 bg-white/80 border-2 border-gold/20">
              <TabsTrigger value="today" className="relative">
                Today
                {(overdueTasks.length + todayTasks.length) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {overdueTasks.length + todayTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
            </TabsList>

            {/* Today Tab */}
            <TabsContent value="today">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Overdue Tasks */}
                <Card className="border-2 border-red-200 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Overdue ({overdueTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      {loadingTasks ? (
                        <TasksSkeleton />
                      ) : overdueTasks.length === 0 ? (
                        <EmptyState icon={<CheckCircle className="h-8 w-8 text-green-400" />} message="No overdue tasks" />
                      ) : (
                        <div className="space-y-2">
                          {overdueTasks.map(task => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              onComplete={() => completeTask.mutate(task.id)}
                              isOverdue
                            />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Today's Tasks */}
                <Card className="border-2 border-gold/20 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gold" />
                      Due Today ({todayTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      {loadingTasks ? (
                        <TasksSkeleton />
                      ) : todayTasks.length === 0 ? (
                        <EmptyState icon={<Calendar className="h-8 w-8 text-zinc-300" />} message="No tasks due today" />
                      ) : (
                        <div className="space-y-2">
                          {todayTasks.map(task => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              onComplete={() => completeTask.mutate(task.id)}
                            />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Inbox className="h-5 w-5 text-gold" />
                        Unanswered Messages ({unansweredThreads.length})
                      </CardTitle>
                      <CardDescription>Messages waiting for your reply</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/owner/inbox')} className="border-gold/30">
                      Open Inbox <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    {loadingThreads ? (
                      <ThreadsSkeleton />
                    ) : unansweredThreads.length === 0 ? (
                      <EmptyState icon={<CheckCircle className="h-8 w-8 text-green-400" />} message="All messages answered!" />
                    ) : (
                      <div className="space-y-2">
                        {unansweredThreads.map(thread => (
                          <ThreadItem key={thread.id} thread={thread} onClick={() => navigate('/owner/inbox')} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-gold" />
                        Leads Needing Action ({leadsNeedingAction.length})
                      </CardTitle>
                      <CardDescription>New and open leads requiring follow-up</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/crm/leads')} className="border-gold/30">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    {loadingLeads ? (
                      <LeadsSkeleton />
                    ) : leadsNeedingAction.length === 0 ? (
                      <EmptyState icon={<TrendingUp className="h-8 w-8 text-zinc-300" />} message="No leads need immediate action" />
                    ) : (
                      <div className="space-y-2">
                        {leadsNeedingAction.map(lead => (
                          <LeadItem key={lead.id} lead={lead} onClick={() => navigate(`/crm/leads/${lead.id}`)} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Tasks Tab */}
            <TabsContent value="all">
              <Card className="border-2 border-gold/20 bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-gold" />
                    All Pending Tasks ({tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    {loadingTasks ? (
                      <TasksSkeleton />
                    ) : tasks.length === 0 ? (
                      <EmptyState icon={<CheckCircle className="h-8 w-8 text-green-400" />} message="No pending tasks" />
                    ) : (
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            onComplete={() => completeTask.mutate(task.id)}
                            isOverdue={task.due_at ? isPast(new Date(task.due_at)) : false}
                            showDate
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

// Sub-components

function SummaryCard({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'info' | 'success';
}) {
  const variants = {
    default: "border-gold/30 bg-white",
    danger: "border-red-500/30 bg-red-50",
    warning: "border-yellow-500/30 bg-yellow-50",
    info: "border-blue-500/30 bg-blue-50",
    success: "border-green-500/30 bg-green-50",
  };

  const iconColors = {
    default: "text-gold",
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
    success: "text-green-600",
  };

  return (
    <Card className={`${variants[variant]} border-2`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-xl font-bold text-black">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/50 ${iconColors[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ 
  task, 
  onComplete, 
  isOverdue = false,
  showDate = false,
}: { 
  task: AgendaTask; 
  onComplete: () => void;
  isOverdue?: boolean;
  showDate?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gold/20'}`}>
      <button
        onClick={onComplete}
        className="w-5 h-5 rounded border-2 border-gold hover:bg-gold/20 transition-colors flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-black truncate">{task.title}</p>
        {task.lead?.full_name && (
          <p className="text-xs text-zinc-500">Lead: {task.lead.full_name}</p>
        )}
        {showDate && task.due_at && (
          <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-zinc-400'}`}>
            {format(new Date(task.due_at), 'MMM d, h:mm a')}
          </p>
        )}
      </div>
      {task.priority && (
        <Badge variant="outline" className={`text-xs ${task.priority === 'high' ? 'border-red-300 text-red-600' : 'border-zinc-300'}`}>
          {task.priority}
        </Badge>
      )}
    </div>
  );
}

function ThreadItem({ thread, onClick }: { thread: AgendaThread; onClick: () => void }) {
  const channelColors: Record<string, string> = {
    whatsapp: 'bg-green-100 text-green-600',
    email_gmail: 'bg-red-100 text-red-600',
    email_hostinger: 'bg-blue-100 text-blue-600',
    instagram: 'bg-pink-100 text-pink-600',
    facebook: 'bg-blue-100 text-blue-700',
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 bg-white hover:bg-gold/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${channelColors[thread.channel_type] || 'bg-zinc-100 text-zinc-600'}`}>
        <MessageSquare className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-black truncate">
          {thread.contact_name || thread.contact_identifier}
        </p>
        <p className="text-xs text-zinc-500 truncate">{thread.last_message_preview}</p>
      </div>
      {thread.unread_count > 0 && (
        <Badge className="bg-gold text-black text-xs">{thread.unread_count}</Badge>
      )}
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </div>
  );
}

function LeadItem({ lead, onClick }: { lead: AgendaLead; onClick: () => void }) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg border border-gold/20 bg-white hover:bg-gold/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
        <span className="text-gold font-semibold text-sm">{lead.full_name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-black truncate">{lead.full_name}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {lead.email_lower && <span className="truncate">{lead.email_lower}</span>}
          {lead.phone_e164 && <span>{lead.phone_e164}</span>}
        </div>
      </div>
      <Badge variant="outline" className="text-xs border-gold/30">
        {lead.pipeline_stage || 'new'}
      </Badge>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon}
      <p className="text-zinc-500 text-sm mt-2">{message}</p>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-14 bg-zinc-100" />
      ))}
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-16 bg-zinc-100" />
      ))}
    </div>
  );
}

function LeadsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-14 bg-zinc-100" />
      ))}
    </div>
  );
}
