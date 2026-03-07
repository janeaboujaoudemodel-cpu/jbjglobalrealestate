import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus,
  Calendar,
  User,
  MoreHorizontal,
  ChevronRight,
  Target,
  Loader2,
  Eye,
  Sparkles,
  Timer,
  TrendingUp,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to_contact_id: string | null;
  ai_created: boolean | null;
  created_at: string;
  completed_at: string | null;
  updated_at?: string;
}

interface CRMTask {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  category: string | null;
  created_at: string;
  completed_at: string | null;
}

interface FoundersTaskDashboardProps {
  onStatsChange?: () => void;
  initialFilter?: string | null;
}

const priorityColors: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-orange-50 text-orange-600 border-orange-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  todo: { 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  in_progress: { 
    icon: <Target className="w-4 h-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  completed: { 
    icon: <CheckCircle2 className="w-4 h-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  done: { 
    icon: <CheckCircle2 className="w-4 h-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  awaiting_approval: { 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
};

const FoundersTaskDashboard: React.FC<FoundersTaskDashboardProps> = ({ onStatsChange, initialFilter }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>(
    (initialFilter === 'completed' || initialFilter === 'pending' || initialFilter === 'in_progress') ? initialFilter : 'all'
  );
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      const mapped = initialFilter === 'awaiting_approval' ? 'all' : initialFilter;
      if (mapped === 'completed' || mapped === 'pending' || mapped === 'in_progress' || mapped === 'all') {
        setFilter(mapped);
      }
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user) {
      fetchAllTasks();
    }
  }, [user]);

  const fetchAllTasks = async () => {
    try {
      // Fetch assistant tasks
      const { data: assistantTasks, error: assistantError } = await supabase
        .from('assistant_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (assistantError) throw assistantError;
      setTasks(assistantTasks || []);

      // Fetch CRM admin tasks (synced with CRM)
      const { data: adminTasks, error: adminError } = await supabase
        .from('admin_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!adminError && adminTasks) {
        setCrmTasks(adminTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string, isCrmTask: boolean = false) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed' || newStatus === 'done') {
        updates.completed_at = new Date().toISOString();
      }

      const tableName = isCrmTask ? 'admin_tasks' : 'assistant_tasks';
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(`Task ${newStatus === 'completed' || newStatus === 'done' ? 'completed ✅' : 'updated'}`);
      fetchAllTasks();
      onStatsChange?.();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Combine all tasks for unified view
  const allTasks = [
    ...tasks.map(t => ({ ...t, source: 'assistant' as const })),
    ...crmTasks.map(t => ({ 
      ...t, 
      source: 'crm' as const,
      priority: t.priority || 'medium',
      status: t.status || 'pending'
    }))
  ];

  const filteredTasks = allTasks.filter(task => {
    if (filter === 'all') return true;
    const normalizedStatus = task.status === 'todo' ? 'pending' : 
                             task.status === 'done' ? 'completed' : task.status;
    return normalizedStatus === filter;
  });

  const stats = {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'completed' || t.status === 'done').length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    pending: allTasks.filter(t => t.status === 'pending' || t.status === 'todo').length,
    awaiting: allTasks.filter(t => t.status === 'awaiting_approval').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const getTaskProgress = (task: typeof allTasks[0]): number => {
    switch (task.status) {
      case 'completed':
      case 'done': return 100;
      case 'in_progress': return 60;
      case 'awaiting_approval': return 80;
      case 'pending':
      case 'todo': return 0;
      default: return 0;
    }
  };

  const handleCardClick = (cardType: string) => {
    switch(cardType) {
      case 'active':
        setFilter('all');
        break;
      case 'completed':
        setFilter('completed');
        break;
      case 'pending':
        setFilter('pending');
        break;
      case 'approval':
        setFilter('all');
        // Filter for awaiting approval
        break;
    }
    toast.info(`Filtering ${cardType} tasks`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview - White Card */}
      <Card className="bg-white border-2 border-gold/30 shadow-[0_0_20px_rgba(200,167,102,0.15)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Task Progress Overview
              </h3>
              <p className="text-sm text-zinc-500">Synced with CRM • Your productivity dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gold">{completionRate}%</p>
              <p className="text-xs text-zinc-500">{stats.completed} of {stats.total} tasks completed</p>
            </div>
          </div>
          <Progress value={completionRate} className="h-3 bg-gold/20" />
          
          {/* Clickable Mini Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <button 
              onClick={() => handleCardClick('active')}
              className="text-center p-3 rounded-lg bg-gold/5 border-2 border-gold/20 hover:border-gold/40 hover:shadow-[0_0_15px_rgba(200,167,102,0.2)] transition-all cursor-pointer"
            >
              <p className="text-2xl font-bold text-gold">{stats.total}</p>
              <p className="text-xs text-zinc-500">🧭 Active</p>
            </button>
            <button 
              onClick={() => handleCardClick('completed')}
              className="text-center p-3 rounded-lg bg-green-50 border-2 border-green-200 hover:border-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all cursor-pointer"
            >
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-zinc-500">✅ Finished</p>
            </button>
            <button 
              onClick={() => handleCardClick('pending')}
              className="text-center p-3 rounded-lg bg-amber-50 border-2 border-amber-200 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
            >
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-zinc-500">⏳ Pending</p>
            </button>
            <button 
              onClick={() => handleCardClick('approval')}
              className="text-center p-3 rounded-lg bg-orange-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all cursor-pointer"
            >
              <p className="text-2xl font-bold text-orange-600">{stats.awaiting}</p>
              <p className="text-xs text-zinc-500">⚠️ Approval</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'in_progress', 'completed'].map((f) => (
          <Button
            key={f}
            size="sm"
            onClick={() => setFilter(f as typeof filter)}
            className={filter === f 
              ? 'bg-black text-white border-2 border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)] hover:bg-zinc-900' 
              : 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold/50'
            }
          >
            {f === 'all' && `📋 All Tasks (${stats.total})`}
            {f === 'pending' && `⏳ Pending (${stats.pending})`}
            {f === 'in_progress' && `🎯 In Progress (${stats.inProgress})`}
            {f === 'completed' && `✅ Completed (${stats.completed})`}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => navigate('/crm-tasks')}
          className="bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold/50 ml-auto"
        >
          <Filter className="w-4 h-4 mr-2" />
          Open CRM Tasks
        </Button>
      </div>

      {/* Task List */}
      <ScrollArea className="h-[450px]">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="bg-white border-2 border-gold/20">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                <h4 className="text-black font-semibold mb-2">No Tasks Found</h4>
                <p className="text-zinc-500">No tasks found in this category</p>
                <p className="text-sm text-zinc-400 mt-1">Ask Amanda to create tasks for you</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task, index) => {
              const config = statusConfig[task.status] || statusConfig.pending;
              const taskProgress = getTaskProgress(task);
              const isExpanded = expandedTask === task.id;
              const isCrmTask = task.source === 'crm';

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-white border-2 transition-all ${config.bgColor} ${
                    isExpanded ? 'ring-2 ring-gold/30 shadow-[0_0_20px_rgba(200,167,102,0.2)]' : 'hover:border-gold/40'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 ${config.color}`}>{config.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-black font-medium truncate">{task.title}</h4>
                              <Badge className={priorityColors[task.priority] + ' border'}>
                                {task.priority}
                              </Badge>
                              {isCrmTask && (
                                <Badge className="bg-blue-50 text-blue-600 border-blue-200 border">
                                  CRM
                                </Badge>
                              )}
                              {'ai_created' in task && task.ai_created && (
                                <Badge className="bg-gold/10 text-gold border-gold/30 border">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-2 mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-zinc-400">Progress</span>
                                <span className={config.color}>{taskProgress}%</span>
                              </div>
                              <Progress value={taskProgress} className="h-1.5 bg-zinc-100" />
                            </div>

                            {task.description && (
                              <p className={`text-sm text-zinc-500 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 flex-wrap">
                              {'due_date' in task && task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="text-zinc-500 hover:text-gold"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {(task.status === 'pending' || task.status === 'todo') && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'in_progress', isCrmTask)}
                              className="bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                            >
                              <Target className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, isCrmTask ? 'done' : 'completed', isCrmTask)}
                              className="bg-white text-green-600 border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {task.status === 'awaiting_approval' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, isCrmTask ? 'done' : 'completed', isCrmTask)}
                              className="bg-white text-gold border-2 border-gold/30 hover:border-gold hover:bg-gold/5"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-gold/10"
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-zinc-400">Status</p>
                              <p className={`font-medium ${config.color}`}>{task.status.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-zinc-400">Priority</p>
                              <p className="text-black font-medium capitalize">{task.priority}</p>
                            </div>
                            <div>
                              <p className="text-zinc-400">Created</p>
                              <p className="text-black">{format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            {task.completed_at && (
                              <div>
                                <p className="text-zinc-400">Completed</p>
                                <p className="text-green-600">{format(new Date(task.completed_at), 'MMM d, yyyy h:mm a')}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FoundersTaskDashboard;
