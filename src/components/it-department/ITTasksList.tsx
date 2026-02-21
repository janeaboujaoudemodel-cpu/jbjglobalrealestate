import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Clock, CheckCircle, AlertCircle, 
  User, Calendar, MoreVertical, Loader2,
  Play, Pause, Check, X, Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ITTask {
  id: string;
  task_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  completed_at: string;
}

interface ITTasksListProps {
  searchQuery: string;
  onRefresh: () => void;
}

const TASK_TYPE_CONFIG = {
  new_joiner_account: { label: 'New Joiner Account', color: 'bg-blue-500' },
  password_reset: { label: 'Password Reset', color: 'bg-orange-500' },
  access_request: { label: 'Access Request', color: 'bg-purple-500' },
  equipment_setup: { label: 'Equipment Setup', color: 'bg-green-500' },
  system_update: { label: 'System Update', color: 'bg-cyan-500' },
  security_audit: { label: 'Security Audit', color: 'bg-red-500' },
  other: { label: 'Other', color: 'bg-zinc-500' }
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-orange-500', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', icon: Play },
  pending_review: { label: 'Pending Review', color: 'bg-purple-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-zinc-500', icon: X }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-zinc-500' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-500' },
  critical: { label: 'Critical', color: 'text-red-500' }
};

const ITTasksList: React.FC<ITTasksListProps> = ({ searchQuery, onRefresh }) => {
  const [tasks, setTasks] = useState<ITTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterType]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('it_department_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterType !== 'all') {
        query = query.eq('task_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(search) ||
      task.description?.toLowerCase().includes(search)
    );
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('it_department_tasks')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success(`Task status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
      fetchTasks();
      onRefresh();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-black/60" />
          <span className="text-black/60 text-sm">Filters:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gold mx-auto mb-4" />
            <p className="text-black/60">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.map((task, index) => {
              const typeConfig = TASK_TYPE_CONFIG[task.task_type as keyof typeof TASK_TYPE_CONFIG];
              const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
              const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
              const StatusIcon = statusConfig?.icon || AlertCircle;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="bg-white border-2 border-gold/30 hover:border-gold/50 transition-all">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig?.color || 'bg-zinc-400'} flex items-center justify-center`}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-black">{task.title}</h3>
                              <Badge variant="outline" className={`${priorityConfig?.color} border-current text-xs`}>
                                {priorityConfig?.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-black/60 line-clamp-1">{task.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-black/40">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.created_at), 'MMM d, yyyy')}
                              </span>
                              <Badge className={`${typeConfig?.color} text-white text-xs`}>
                                {typeConfig?.label}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={`${statusConfig?.color} text-white`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig?.label}
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-black/60 hover:text-black">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-2 border-gold/30">
                              {task.status === 'open' && (
                                <DropdownMenuItem 
                                  className="text-blue-600 hover:bg-gold/10"
                                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                                >
                                  <Play className="w-4 h-4 mr-2" /> Start Task
                                </DropdownMenuItem>
                              )}
                              {task.status === 'in_progress' && (
                                <>
                                  <DropdownMenuItem 
                                    className="text-purple-600 hover:bg-gold/10"
                                    onClick={() => handleStatusChange(task.id, 'pending_review')}
                                  >
                                    <Clock className="w-4 h-4 mr-2" /> Send for Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-green-600 hover:bg-gold/10"
                                    onClick={() => handleStatusChange(task.id, 'completed')}
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Mark Complete
                                  </DropdownMenuItem>
                                </>
                              )}
                              {task.status === 'pending_review' && (
                                <DropdownMenuItem 
                                  className="text-green-600 hover:bg-gold/10"
                                  onClick={() => handleStatusChange(task.id, 'completed')}
                                >
                                  <Check className="w-4 h-4 mr-2" /> Approve & Complete
                                </DropdownMenuItem>
                              )}
                              {task.status !== 'completed' && task.status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  className="text-red-500 hover:bg-gold/10"
                                  onClick={() => handleStatusChange(task.id, 'cancelled')}
                                >
                                  <X className="w-4 h-4 mr-2" /> Cancel Task
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ITTasksList;
