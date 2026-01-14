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
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
};

const categoryColors: Record<string, string> = {
  important: 'bg-red-500',
  routine: 'bg-green-500',
  recruitment: 'bg-blue-500',
  flagged: 'bg-yellow-500',
  spam: 'bg-gray-500',
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998]"
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
            <div className="p-4 border-b border-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold/10">
                  <Bell className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  <p className="text-xs text-gray-400">{unreadCount} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllAsRead}
                    className="border-gold/20 text-gold hover:bg-gold/10"
                  >
                    <Check className="w-4 h-4 mr-1" />
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
            <div className="p-2 border-b border-gold/20 flex gap-1">
              {(['all', 'mentions', 'alerts', 'tasks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? 'bg-gold text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gold/10'
                  }`}
                >
                  {tab === 'all' && 'All'}
                  {tab === 'mentions' && (
                    <span className="flex items-center justify-center gap-1">
                      <AtSign className="w-3 h-3" />
                      Mentions
                    </span>
                  )}
                  {tab === 'alerts' && 'Alerts'}
                  {tab === 'tasks' && 'Tasks'}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gold/20 mx-auto mb-4" />
                    <p className="text-gray-400">No notifications</p>
                    <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        notification.is_read 
                          ? 'bg-[#0E0E0E] border-gold/10' 
                          : 'bg-gold/5 border-gold/30'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category indicator */}
                        <div className={`w-2 h-2 rounded-full mt-2 ${categoryColors[notification.category]}`} />
                        
                        {/* Channel icon */}
                        <div className="p-2 rounded-lg bg-gold/10 text-gold">
                          {channelIcons[notification.channel] || <Bell className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-white truncate">
                              {notification.sender_name || notification.sender_identifier}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                            )}
                          </div>
                          {notification.subject && (
                            <p className="text-sm text-gray-300 truncate mt-1">{notification.subject}</p>
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notification.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {format(new Date(notification.received_at), 'MMM d, h:mm a')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
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
