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
  Filter
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
  system: <AlertCircle className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  call: 'bg-green-500/10 text-green-400 border-green-500/20',
  meeting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  task: 'bg-gold/10 text-gold border-gold/20',
  lead: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  message: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  system: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gold/10">
            <Activity className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Activity Center</h3>
            <p className="text-sm text-gray-400">All recent activities across your workspace</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-gold/20 text-gold hover:bg-gold/10"
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
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={filter === f 
              ? 'bg-gold text-black hover:bg-gold/90 whitespace-nowrap' 
              : 'border-gold/20 text-gray-400 hover:text-white whitespace-nowrap'
            }
          >
            {f === 'all' && 'All Activities'}
            {f === 'email' && '📧 Emails'}
            {f === 'call' && '📞 Calls'}
            {f === 'task' && '✅ Tasks'}
            {f === 'lead' && '🎯 Leads'}
          </Button>
        ))}
      </div>

      {/* Activity Timeline */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-6">
          {Object.keys(groupedActivities).length === 0 ? (
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-gray-400">No activities found</p>
                <p className="text-sm text-gray-500 mt-1">Activities will appear here as you work</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px bg-gold/20 flex-1" />
                  <span className="text-xs text-gray-400 font-medium">
                    {format(new Date(dateKey), 'EEEE, MMMM d')}
                  </span>
                  <div className="h-px bg-gold/20 flex-1" />
                </div>

                {/* Activities for this date */}
                <div className="space-y-2 pl-4 border-l-2 border-gold/20">
                  {dayActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[13px] top-4 w-2 h-2 rounded-full bg-gold" />
                      
                      <Card className="bg-[#0E0E0E] border-gold/10 hover:border-gold/30 transition-all ml-4">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg ${activityColors[activity.type]}`}>
                              {activityIcons[activity.type]}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-medium text-white truncate">
                                  {activity.title}
                                </h4>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {activity.actor && (
                                  <Badge variant="outline" className="text-xs border-gold/20 text-gray-400">
                                    <User className="w-3 h-3 mr-1" />
                                    {activity.actor}
                                  </Badge>
                                )}
                                {activity.status && (
                                  <Badge className={`text-xs ${
                                    activity.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    activity.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {activity.status}
                                  </Badge>
                                )}
                                {activity.priority && activity.priority !== 'low' && (
                                  <Badge className={`text-xs ${
                                    activity.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    activity.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
