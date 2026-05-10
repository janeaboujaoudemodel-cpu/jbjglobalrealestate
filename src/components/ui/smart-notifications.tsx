import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  UserPlus,
  Calendar,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

/**
 * Smart Notifications - AI-Prioritized Notification System
 * Groups and prioritizes notifications intelligently
 */

interface Notification {
  id: string;
  type: 'lead' | 'task' | 'message' | 'alert' | 'achievement' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  avatar?: string;
}

interface SmartNotificationsProps {
  notifications?: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead?: () => void;
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New hot lead assigned',
    description: 'Ahmed Khan - Interested in Palm Jumeirah villa, budget AED 15M',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    priority: 'high',
    read: false,
    action: { label: 'View Lead', onClick: () => {} },
  },
  {
    id: '2',
    type: 'message',
    title: 'New message from Sarah',
    description: 'Regarding the Downtown property viewing tomorrow',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    priority: 'high',
    read: false,
    action: { label: 'Reply', onClick: () => {} },
  },
  {
    id: '3',
    type: 'task',
    title: 'Follow-up due in 30 minutes',
    description: 'Call back John regarding Marina apartment',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    priority: 'medium',
    read: false,
    action: { label: 'Complete', onClick: () => {} },
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Weekly target achieved!',
    description: 'You\'ve closed 5 deals this week, exceeding your target by 25%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'low',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'New AI feature available',
    description: 'Try the new predictive lead scoring in your CRM',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    priority: 'low',
    read: true,
    action: { label: 'Learn More', onClick: () => {} },
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'lead':
      return <UserPlus className="w-4 h-4" />;
    case 'task':
      return <Calendar className="w-4 h-4" />;
    case 'message':
      return <MessageSquare className="w-4 h-4" />;
    case 'alert':
      return <AlertCircle className="w-4 h-4" />;
    case 'achievement':
      return <TrendingUp className="w-4 h-4" />;
    case 'system':
      return <Sparkles className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
  if (priority === 'high') return 'text-red-600 bg-red-50';
  
  switch (type) {
    case 'lead':
      return 'text-emerald-600 bg-emerald-50';
    case 'task':
      return 'text-amber-600 bg-amber-50';
    case 'message':
      return 'text-blue-600 bg-blue-50';
    case 'alert':
      return 'text-red-600 bg-red-50';
    case 'achievement':
      return 'text-purple-600 bg-purple-50';
    case 'system':
      return 'text-[#1A1A1A] bg-[#EFE6D6]/10';
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  notifications = defaultNotifications,
  isOpen,
  onClose,
  onMarkAllRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  // Group by priority
  const highPriority = filteredNotifications.filter(n => n.priority === 'high' && !n.read);
  const others = filteredNotifications.filter(n => n.priority !== 'high' || n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A1A]/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed right-4 top-20 w-96 max-h-[calc(100vh-8rem)] bg-[#FDFBF7] border border-[#B89555]/20 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#B89555]/10 bg-gradient-to-r from-white to-[#FDFBF7]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#1A1A1A]" />
                  <h3 className="font-semibold text-[#1A1A1A]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F2EA] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                {[
                  { value: 'all' as const, label: 'All' },
                  { value: 'unread' as const, label: 'Unread' },
                  { value: 'high' as const, label: 'Priority' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      filter === f.value
                        ? 'bg-[#EFE6D6] text-white'
                        : 'bg-[#F7F2EA] text-[#1A1A1A]/70 hover:bg-[#EFE6D6]'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {/* High Priority Section */}
                {highPriority.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs uppercase tracking-wider text-red-500 font-semibold">
                        Requires Attention
                      </span>
                    </div>
                    {highPriority.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                  </div>
                )}

                {/* Other Notifications */}
                {others.length > 0 && (
                  <div>
                    {highPriority.length > 0 && (
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold">
                          Updates
                        </span>
                      </div>
                    )}
                    {others.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))}
                  </div>
                )}

                {filteredNotifications.length === 0 && (
                  <div className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                    <p className="text-[#1A1A1A]/70">No notifications</p>
                    <p className="text-sm text-[#1A1A1A]/70 mt-1">You're all caught up!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-[#B89555]/10 bg-gradient-to-r from-[#FDFBF7] to-white flex items-center justify-between">
              <button
                onClick={onMarkAllRead}
                className="text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
              <button className="text-sm text-[#1A1A1A] font-medium hover:underline flex items-center gap-1">
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3 rounded-xl mb-2 transition-all cursor-pointer',
        notification.read 
          ? 'bg-[#F7F2EA] hover:bg-[#F7F2EA]' 
          : 'bg-[#FDFBF7] border border-[#B89555]/20 hover:border-[#B89555]/40 shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          getNotificationColor(notification.type, notification.priority)
        )}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              'text-sm truncate',
              notification.read ? 'text-[#1A1A1A]/70' : 'font-medium text-[#1A1A1A]'
            )}>
              {notification.title}
            </h4>
            <span className="text-xs text-[#1A1A1A]/70 flex-shrink-0">
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A]/70 mt-0.5 line-clamp-2">
            {notification.description}
          </p>
          {notification.action && (
            <button
              onClick={(e) => { e.stopPropagation(); notification.action?.onClick?.(); }}
              className="mt-2 text-xs font-medium text-[#1A1A1A] hover:underline flex items-center gap-1"
            >
              {notification.action.label}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-[#EFE6D6] flex-shrink-0 mt-2" />
        )}
      </div>
    </motion.div>
  );
};

// Notification Bell Button Component
export const NotificationBell: React.FC<{
  count?: number;
  onClick: () => void;
  className?: string;
}> = ({ count = 0, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-xl bg-[#FDFBF7] border border-[#B89555]/20 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:border-[#B89555]/40 transition-all',
        className
      )}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </button>
  );
};

export default SmartNotifications;
