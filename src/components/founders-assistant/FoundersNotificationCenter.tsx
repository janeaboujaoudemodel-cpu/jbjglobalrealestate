import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Bell,
  Mail,
  MessageSquare,
  AtSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Check,
  Filter,
  Zap,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  channel: string;
  category: string;
  sender_name: string | null;
  sender_identifier: string;
  subject: string | null;
  content: string;
  received_at: string;
  is_read: boolean | null;
  ai_status: string;
}

interface FoundersNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  system: <Bell className="w-4 h-4" />,
  alert: <Zap className="w-4 h-4" />,
  task: <FileText className="w-4 h-4" />,
};

const categoryConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  important: { color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  routine: { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  recruitment: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  flagged: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  spam: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' },
};

const FoundersNotificationCenter: React.FC<FoundersNotificationCenterProps> = ({ 
  isOpen, 
  onClose,
  onUnreadCountChange 
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'alerts' | 'tasks'>('all');

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('assistant_communications')
        .select('*')
        .eq('user_id', user?.id)
        .order('received_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      
      const unreadCount = data?.filter(n => !n.is_read).length || 0;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('assistant_communications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      
      const unreadCount = notifications.filter(n => !n.is_read && n.id !== id).length;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('assistant_communications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onUnreadCountChange?.(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('assistant_communications')
        .delete()
        .eq('id', id);

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mentions') return n.content.includes('@');
    if (activeTab === 'alerts') return n.category === 'important' || n.category === 'flagged';
    if (activeTab === 'tasks') return n.ai_status === 'flagged_for_review';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const tabCounts = {
    all: notifications.length,
    mentions: notifications.filter(n => n.content.includes('@')).length,
    alerts: notifications.filter(n => n.category === 'important' || n.category === 'flagged').length,
    tasks: notifications.filter(n => n.ai_status === 'flagged_for_review').length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-gold/20 z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gold/20 flex items-center justify-between bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold/10">
                  <Bell className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Notification Inbox</h2>
                  <p className="text-xs text-gray-400">
                    {unreadCount > 0 ? (
                      <span className="text-gold">{unreadCount} unread</span>
                    ) : (
                      'All caught up!'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllAsRead}
                    className="border-gold/20 text-gold hover:bg-gold/10 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gold/10 hover:bg-gold/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gold" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="p-2 border-b border-gold/20 flex gap-1 bg-[#0E0E0E]">
              {(['all', 'mentions', 'alerts', 'tasks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-gold text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gold/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {tab === 'all' && <Bell className="w-3.5 h-3.5" />}
                    {tab === 'mentions' && <AtSign className="w-3.5 h-3.5" />}
                    {tab === 'alerts' && <Zap className="w-3.5 h-3.5" />}
                    {tab === 'tasks' && <FileText className="w-3.5 h-3.5" />}
                    <span className="capitalize">{tab}</span>
                    {tabCounts[tab] > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab ? 'bg-black/20' : 'bg-gold/20 text-gold'
                      }`}>
                        {tabCounts[tab]}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                    <p className="text-white font-medium">No notifications</p>
                    <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification, index) => {
                    const config = categoryConfig[notification.category] || categoryConfig.routine;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                          notification.is_read 
                            ? 'bg-[#0E0E0E] border-gold/10 hover:border-gold/20' 
                            : `${config.bgColor} ${config.borderColor}`
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Channel icon */}
                          <div className={`p-2 rounded-lg ${notification.is_read ? 'bg-gold/10' : 'bg-gold/20'} ${config.color}`}>
                            {channelIcons[notification.channel] || <Bell className="w-4 h-4" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-medium truncate ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>
                                {notification.sender_name || notification.sender_identifier}
                              </p>
                              <div className="flex items-center gap-2">
                                {!notification.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0 animate-pulse" />
                                )}
                                <Badge variant="outline" className={`text-[10px] ${config.borderColor} ${config.color}`}>
                                  {notification.category}
                                </Badge>
                              </div>
                            </div>
                            {notification.subject && (
                              <p className={`text-sm truncate mt-1 ${notification.is_read ? 'text-gray-400' : 'text-gray-200'}`}>
                                {notification.subject}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notification.content}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.received_at), { addSuffix: true })}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FoundersNotificationCenter;
