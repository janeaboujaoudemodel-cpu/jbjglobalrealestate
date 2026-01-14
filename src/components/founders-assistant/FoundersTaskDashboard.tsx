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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  in_progress: <Target className="w-4 h-4 text-blue-400" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  awaiting_approval: <AlertCircle className="w-4 h-4 text-orange-400" />,
};

const FoundersTaskDashboard: React.FC<FoundersTaskDashboardProps> = ({ onStatsChange }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

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
      
      toast.success('Task updated');
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
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

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
      <Card className="bg-[#0E0E0E] border-gold/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Task Progress</h3>
              <p className="text-sm text-gray-400">Overall completion rate</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gold">{completionRate}%</p>
              <p className="text-xs text-gray-400">{stats.completed} of {stats.total} tasks</p>
            </div>
          </div>
          <Progress value={completionRate} className="h-2 bg-gold/20" />
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
            {f === 'all' && 'All Tasks'}
            {f === 'pending' && `⏳ Pending (${stats.pending})`}
            {f === 'in_progress' && `🎯 In Progress (${stats.inProgress})`}
            {f === 'completed' && `✅ Completed (${stats.completed})`}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-gray-400">No tasks found</p>
                <p className="text-sm text-gray-500 mt-1">Ask Olivia to create tasks for you</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-[#0E0E0E] border-gold/20 hover:border-gold/40 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{statusIcons[task.status]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-medium truncate">{task.title}</h4>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            {task.ai_created && (
                              <Badge className="bg-gold/10 text-gold border-gold/30">
                                AI Created
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.due_date), 'MMM d, yyyy')}
                              </span>
                            )}
                            <span>
                              Created {format(new Date(task.created_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FoundersTaskDashboard;
