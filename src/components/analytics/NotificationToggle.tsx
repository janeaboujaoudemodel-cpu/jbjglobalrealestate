/**
 * NOTIFICATION TOGGLE
 * Toggle for enabling/disabling notification sounds and desktop notifications
 */

import { useNotificationSound } from '@/hooks/useNotificationSound';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, BellOff, Volume2, VolumeX, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToggleProps {
  className?: string;
}

export function NotificationToggle({ className }: NotificationToggleProps) {
  const {
    isEnabled,
    enableNotifications,
    disableNotifications,
    playNotificationSound,
    notificationPermission,
    config,
    updateConfig,
  } = useNotificationSound();

  const handleToggle = async () => {
    if (isEnabled) {
      disableNotifications();
    } else {
      await enableNotifications();
    }
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
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </>
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Lead Notifications</span>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {isEnabled && (
            <>
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
                    Desktop notifications are blocked. Please enable them in browser settings.
                  </p>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={playNotificationSound}
                >
                  <Volume2 className="h-3 w-3 mr-2" />
                  Test Sound
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Get notified instantly when new leads or orders come in.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationToggle;
