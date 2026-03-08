import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Target,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  Filter,
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'task' | 'lead' | 'message' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'completed' | 'pending' | 'in_progress' | 'failed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actor?: string;
  metadata?: Record<string, any>;
}

const activityIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  task: <CheckCircle className="w-4 h-4" />,
  lead: <Target className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  system: <Zap className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  call: 'bg-green-500/10 text-green-400 border-green-500/20',
  meeting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  task: 'bg-gold/10 text-gold border-gold/20',
  lead: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  message: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  system: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const FoundersActivityCenter: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'call' | 'task' | 'lead'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      // Fetch multiple activity sources in parallel
      const [
        { data: communications },
        { data: tasks },
        { data: calls },
        { data: auditLogs }
      ] = await Promise.all([
        supabase
          .from('assistant_communications')
          .select('*')
          .eq('user_id', user?.id)
          .order('received_at', { ascending: false })
          .limit(15),
        supabase
          .from('assistant_tasks')
          .select('*')
          .eq('user_id', user?.id)
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase
          .from('broker_call_logs')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('crm_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const activityItems: ActivityItem[] = [];

      // Process communications
      communications?.forEach(comm => {
        activityItems.push({
          id: `comm-${comm.id}`,
          type: comm.channel === 'email' ? 'email' : 'message',
          title: comm.subject || `New ${comm.channel} message`,
          description: comm.content.substring(0, 100) + '...',
          timestamp: new Date(comm.received_at),
          status: comm.is_read ? 'completed' : 'pending',
          actor: comm.sender_name || comm.sender_identifier,
        });
      });

      // Process tasks
      tasks?.forEach(task => {
        activityItems.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          description: task.description || 'No description',
          timestamp: new Date(task.updated_at),
          status: task.status as any,
          priority: task.priority as any,
        });
      });

      // Process calls
      calls?.forEach(call => {
        activityItems.push({
          id: `call-${call.id}`,
          type: 'call',
          title: `Call to ${call.phone_number}`,
          description: call.notes || `Duration: ${call.duration_seconds || 0}s`,
          timestamp: new Date(call.created_at),
          status: call.call_status as any,
        });
      });

      // Process audit logs (system activities)
      auditLogs?.forEach(log => {
        activityItems.push({
          id: `audit-${log.id}`,
          type: 'system',
          title: `${log.action} on ${log.entity_type}`,
          description: log.details ? JSON.stringify(log.details).substring(0, 80) : 'System activity',
          timestamp: new Date(log.created_at),
        });
      });

      // Sort by timestamp
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(activityItems.slice(0, 30));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  // Stats
  const stats = {
    total: activities.length,
    completed: activities.filter(a => a.status === 'completed').length,
    pending: activities.filter(a => a.status === 'pending').length,
    today: activities.filter(a => {
      const today = new Date();
      return a.timestamp.toDateString() === today.toDateString();
    }).length,
  };

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - White Pearl/Gold Champagne */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-gold">{stats.total}</p>
            <p className="text-xs text-zinc-500">Total Activities</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-zinc-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-zinc-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            <p className="text-xs text-zinc-500">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold/10 border border-gold/30">
            <Activity className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black">Activity Center</h3>
            <p className="text-sm text-zinc-500">All recent activities across your workspace</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'email', 'call', 'task', 'lead'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f 
              ? 'bg-black text-white border-2 border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)] whitespace-nowrap hover:bg-zinc-900' 
              : 'bg-white text-gold border-2 border-gold/30 hover:bg-transparent hover:border-gold/50 whitespace-nowrap'
            }
          >
            {f === 'all' && 'All Activities'}
            {f === 'email' && 'Emails'}
            {f === 'call' && 'Calls'}
            {f === 'task' && 'Tasks'}
            {f === 'lead' && 'Leads'}
          </Button>
        ))}
      </div>

      {/* Activity Timeline */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-6">
          {Object.keys(groupedActivities).length === 0 ? (
            <Card className="bg-white border-2 border-gold/20 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardContent className="p-8 text-center">
                <Activity className="w-16 h-16 text-gold/30 mx-auto mb-4" />
                <h4 className="text-black font-semibold mb-2">Activity Center</h4>
                <p className="text-zinc-500">No activities found</p>
                <p className="text-sm text-zinc-400 mt-1">Activities will appear here as you work</p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Activities
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px bg-gold/30 flex-1" />
                  <span className="text-xs text-gold font-medium px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
                    {format(new Date(dateKey), 'EEEE, MMMM d')}
                  </span>
                  <div className="h-px bg-gold/30 flex-1" />
                </div>

                {/* Activities for this date */}
                <div className="space-y-2 pl-4 border-l-2 border-gold/30">
                  {dayActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[13px] top-4 w-2.5 h-2.5 rounded-full bg-gold border-2 border-white" />
                      
                      <Card className="bg-white border-2 border-gold/20 hover:border-gold/40 hover:shadow-[0_4px_20px_rgba(200,167,102,0.15)] transition-all ml-4 group">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg ${activityColors[activity.type]}`}>
                              {activityIcons[activity.type]}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-medium text-black truncate group-hover:text-gold transition-colors">
                                  {activity.title}
                                </h4>
                                <span className="text-xs text-zinc-400 flex-shrink-0">
                                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {activity.actor && (
                                  <Badge variant="outline" className="text-xs border-gold/30 text-zinc-600">
                                    <User className="w-3 h-3 mr-1" />
                                    {activity.actor}
                                  </Badge>
                                )}
                                {activity.status && (
                                  <Badge className={`text-xs border ${
                                    activity.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                                    activity.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    activity.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    'bg-red-50 text-red-600 border-red-200'
                                  }`}>
                                    {activity.status === 'completed' && 'Done'}
                                    {activity.status === 'pending' && 'Pending'}
                                    {activity.status === 'in_progress' && 'In Progress'}
                                    {activity.status === 'failed' && 'Failed'}
                                    {activity.status}
                                  </Badge>
                                )}
                                {activity.priority && activity.priority !== 'low' && (
                                  <Badge className={`text-xs border ${
                                    activity.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                                    activity.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}>
                                    {activity.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FoundersActivityCenter;
