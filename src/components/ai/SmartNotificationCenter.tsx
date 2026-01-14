/**
 * Smart Notification Center Component
 * Central hub for all AI-powered notifications with emotion context
 */

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, MessageSquare, ListTodo, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  type NotificationItem,
  type UrgencyLevel,
} from '@/services/smart-escalation-service';
import { getUrgencyLabel } from '@/config/emotion-detection-engine';
import { formatDistanceToNow } from 'date-fns';

interface SmartNotificationCenterProps {
  notifications: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

export function SmartNotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
}: SmartNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => !n.isRead && n.urgency === 'critical').length;
  
  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'task':
        return <ListTodo className="h-4 w-4" />;
      case 'emotion':
        return <Heart className="h-4 w-4" />;
      case 'escalation':
        return <Zap className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  const getUrgencyStyle = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50/50';
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50/50';
      case 'normal':
        return 'border-l-4 border-l-green-500';
      case 'low':
        return 'border-l-4 border-l-gray-300';
      default:
        return '';
    }
  };
  
  const handleNotificationClick = (notification: NotificationItem) => {
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };
  
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const key = notification.urgency;
    if (!acc[key]) acc[key] = [];
    acc[key].push(notification);
    return acc;
  }, {} as Record<UrgencyLevel, NotificationItem[]>);
  
  // Sort by urgency priority
  const sortedGroups: UrgencyLevel[] = ['critical', 'high', 'normal', 'low'];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-primary'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs h-7"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {/* Notification List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedGroups.map(urgency => {
                const group = groupedNotifications[urgency];
                if (!group || group.length === 0) return null;
                
                return (
                  <div key={urgency}>
                    {/* Urgency Group Header */}
                    <div className="px-4 py-2 bg-muted/50 sticky top-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getUrgencyLabel(urgency)}
                      </span>
                    </div>
                    
                    {/* Notifications in Group */}
                    {group.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          getUrgencyStyle(notification.urgency)
                        } ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 mt-1 ${
                            notification.urgency === 'critical' ? 'text-red-500' :
                            notification.urgency === 'high' ? 'text-orange-500' :
                            'text-muted-foreground'
                          }`}>
                            {notification.emotionIcon ? (
                              <span className="text-lg">{notification.emotionIcon}</span>
                            ) : (
                              getTypeIcon(notification.type)
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                              
                              {notification.responseDeadline && (
                                <>
                                  <span>•</span>
                                  <span className={`flex items-center gap-1 ${
                                    notification.responseDeadline < new Date() ? 'text-red-500' : ''
                                  }`}>
                                    Due {formatDistanceToNow(notification.responseDeadline, { addSuffix: true })}
                                  </span>
                                </>
                              )}
                              
                              {notification.senderName && (
                                <>
                                  <span>•</span>
                                  <span>{notification.senderName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setIsOpen(false);
              // Navigate to full notifications page
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SmartNotificationCenter;
