/**
 * NOTIFICATION TOGGLE
 * Toggle for enabling/disabling notification sounds and desktop notifications
 * Enhanced with priority-based notifications and event type configuration
 */

import { useNotificationSound, EVENT_CONFIG, NotificationEventType, NotificationPriority } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellOff, Volume2, VolumeX, Monitor, Settings2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationToggleProps {
  className?: string;
  showNotificationCenter?: boolean;
}

const priorityColors: Record<NotificationPriority, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-muted text-muted-foreground border-muted',
};

export function NotificationToggle({ className, showNotificationCenter = true }: NotificationToggleProps) {
  const {
    isEnabled,
    enableNotifications,
    disableNotifications,
    playNotificationSound,
    notificationPermission,
    config,
    updateConfig,
    recentNotifications,
    clearNotifications,
    unreadCount,
  } = useNotificationSound();

  const handleToggle = async () => {
    if (isEnabled) {
      disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  const handleTestSound = () => {
    playNotificationSound('high');
  };

  const toggleEventType = (eventType: NotificationEventType) => {
    const newEnabledTypes = config.enabledTypes.includes(eventType)
      ? config.enabledTypes.filter((t) => t !== eventType)
      : [...config.enabledTypes, eventType];
    updateConfig({ enabledTypes: newEnabledTypes });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={cn(
            'relative',
            isEnabled && 'border-primary text-primary',
            className
          )}
        >
          {isEnabled ? (
            <>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] text-primary-foreground items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </>
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Real-time Notifications</span>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {isEnabled && (
            <>
              {/* Notification Settings */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {config.enableSound ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    <Label htmlFor="sound-toggle" className="text-sm">Sound alerts</Label>
                  </div>
                  <Switch
                    id="sound-toggle"
                    checked={config.enableSound}
                    onCheckedChange={(checked) => updateConfig({ enableSound: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <Label htmlFor="desktop-toggle" className="text-sm">Desktop notifications</Label>
                  </div>
                  <Switch
                    id="desktop-toggle"
                    checked={config.enableDesktop}
                    onCheckedChange={(checked) => updateConfig({ enableDesktop: checked })}
                  />
                </div>

                {notificationPermission === 'denied' && config.enableDesktop && (
                  <p className="text-xs text-destructive">
                    Desktop notifications are blocked. Enable in browser settings.
                  </p>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleTestSound}
                >
                  <Volume2 className="h-3 w-3 mr-2" />
                  Test Sound
                </Button>
              </div>

              {/* Event Type Configuration */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Notification Types</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(EVENT_CONFIG) as NotificationEventType[]).map((eventType) => {
                    const eventConfig = EVENT_CONFIG[eventType];
                    const isActive = config.enabledTypes.includes(eventType);
                    return (
                      <Button
                        key={eventType}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-7 text-xs justify-start px-2',
                          !isActive && 'opacity-50'
                        )}
                        onClick={() => toggleEventType(eventType)}
                      >
                        <span className="mr-1">{eventConfig.icon}</span>
                        {eventConfig.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Notifications */}
              {showNotificationCenter && recentNotifications.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recent ({recentNotifications.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={clearNotifications}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {recentNotifications.slice(0, 10).map((notification, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-2 rounded-lg border text-xs',
                            priorityColors[notification.priority]
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{notification.title}</span>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 truncate">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Real-time alerts for leads, CVs, tickets, ideas & registrations.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationToggle;
