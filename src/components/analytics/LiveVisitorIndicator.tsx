/**
 * LIVE VISITOR INDICATOR
 * Shows real-time visitor count with pulse animation
 */

import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LiveVisitorIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function LiveVisitorIndicator({ className, showDetails = false }: LiveVisitorIndicatorProps) {
  const { liveVisitors, isConnected, lastUpdate, recentEvents } = useRealtimeAnalytics();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Users className="w-5 h-5 text-primary" />
          {isConnected && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{liveVisitors}</span>
            <Badge variant="outline" className={cn(
              'text-xs',
              isConnected ? 'border-green-500 text-green-500' : 'border-muted text-muted-foreground'
            )}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  LIVE
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          {showDetails && lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Last activity: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {showDetails && recentEvents.length > 0 && (
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-muted-foreground/50">|</span>
          <span>Recent: </span>
          {recentEvents.slice(0, 3).map((event, idx) => (
            <Badge key={event.id} variant="secondary" className="text-xs">
              {event.page_path?.slice(0, 15) || event.event_type}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveVisitorIndicator;
