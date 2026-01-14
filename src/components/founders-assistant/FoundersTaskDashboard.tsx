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
  TrendingUp
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

interface FoundersTaskDashboardProps {
  onStatsChange?: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { 
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20'
  },
  in_progress: { 
    icon: <Target className="w-4 h-4" />, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  completed: { 
    icon: <CheckCircle2 className="w-4 h-4" />, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  awaiting_approval: { 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20'
  },
};

const FoundersTaskDashboard: React.FC<FoundersTaskDashboardProps> = ({ onStatsChange }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('assistant_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('assistant_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(`Task ${newStatus === 'completed' ? 'completed ✅' : 'updated'}`);
      fetchTasks();
      onStatsChange?.();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    awaiting: tasks.filter(t => t.status === 'awaiting_approval').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Calculate task progress for individual tasks (simulated based on status)
  const getTaskProgress = (task: Task): number => {
    switch (task.status) {
      case 'completed': return 100;
      case 'in_progress': return 60;
      case 'awaiting_approval': return 80;
      case 'pending': return 0;
      default: return 0;
    }
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
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-[#0E0E0E] to-[#1A1A1A] border-gold/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                Task Progress Overview
              </h3>
              <p className="text-sm text-gray-400">Your productivity dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gold">{completionRate}%</p>
              <p className="text-xs text-gray-400">{stats.completed} of {stats.total} tasks completed</p>
            </div>
          </div>
          <Progress value={completionRate} className="h-3 bg-gold/20" />
          
          {/* Mini Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-gold/5 border border-gold/10">
              <p className="text-2xl font-bold text-gold">{stats.total}</p>
              <p className="text-xs text-gray-400">🧭 Active</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-xs text-gray-400">✅ Finished</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-gray-400">⏳ Pending</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <p className="text-2xl font-bold text-orange-400">{stats.awaiting}</p>
              <p className="text-xs text-gray-400">⚠️ Approval</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'in_progress', 'completed'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f as typeof filter)}
            className={filter === f 
              ? 'bg-gold text-black hover:bg-gold/90' 
              : 'border-gold/20 text-gray-400 hover:text-white'
            }
          >
            {f === 'all' && `📋 All Tasks (${stats.total})`}
            {f === 'pending' && `⏳ Pending (${stats.pending})`}
            {f === 'in_progress' && `🎯 In Progress (${stats.inProgress})`}
            {f === 'completed' && `✅ Completed (${stats.completed})`}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <ScrollArea className="h-[450px]">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">No Tasks Found</h4>
                <p className="text-gray-400">No tasks found in this category</p>
                <p className="text-sm text-gray-500 mt-1">Ask Olivia to create tasks for you</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task, index) => {
              const config = statusConfig[task.status] || statusConfig.pending;
              const taskProgress = getTaskProgress(task);
              const isExpanded = expandedTask === task.id;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-[#0E0E0E] border transition-all ${config.bgColor} ${
                    isExpanded ? 'ring-2 ring-gold/30' : 'hover:border-gold/40'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 ${config.color}`}>{config.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-medium truncate">{task.title}</h4>
                              <Badge className={priorityColors[task.priority]}>
                                {task.priority}
                              </Badge>
                              {task.ai_created && (
                                <Badge className="bg-gold/10 text-gold border-gold/30">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-2 mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className={config.color}>{taskProgress}%</span>
                              </div>
                              <Progress value={taskProgress} className="h-1.5 bg-gray-700" />
                            </div>

                            {task.description && (
                              <p className={`text-sm text-gray-400 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                              {task.due_date && (
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
                            className="text-gray-400 hover:text-gold"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                            >
                              <Target className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          {task.status === 'awaiting_approval' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
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
                              <p className="text-gray-500">Status</p>
                              <p className={`font-medium ${config.color}`}>{task.status.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Priority</p>
                              <p className="text-white font-medium capitalize">{task.priority}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Created</p>
                              <p className="text-white">{format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            {task.completed_at && (
                              <div>
                                <p className="text-gray-500">Completed</p>
                                <p className="text-green-400">{format(new Date(task.completed_at), 'MMM d, yyyy h:mm a')}</p>
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
