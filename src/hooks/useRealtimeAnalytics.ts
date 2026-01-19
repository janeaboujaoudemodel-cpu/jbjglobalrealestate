/**
 * REALTIME ANALYTICS HOOK
 * Provides real-time updates for analytics dashboard using Supabase realtime subscriptions
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeEvent {
  id: string;
  event_type: string;
  page_path?: string;
  created_at: string;
  session_id?: string;
}

interface UseRealtimeAnalyticsReturn {
  liveVisitors: number;
  recentEvents: RealtimeEvent[];
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function useRealtimeAnalytics(): UseRealtimeAnalyticsReturn {
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeSessions, setActiveSessions] = useState(new Set<string>());

  const handleNewEvent = useCallback((payload: { new: RealtimeEvent }) => {
    const event = payload.new;
    
    // Add to recent events (keep last 20)
    setRecentEvents(prev => [event, ...prev].slice(0, 20));
    setLastUpdate(new Date());

    // Track active sessions for live visitor count
    if (event.session_id) {
      setActiveSessions(prev => {
        const newSet = new Set(prev);
        newSet.add(event.session_id!);
        // Clean up old sessions after 5 minutes
        setTimeout(() => {
          setActiveSessions(current => {
            const updated = new Set(current);
            updated.delete(event.session_id!);
            setLiveVisitors(updated.size);
            return updated;
          });
        }, 5 * 60 * 1000);
        return newSet;
      });
      setLiveVisitors(prev => Math.max(prev, activeSessions.size + 1));
    }
  }, [activeSessions]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Subscribe to visitor_events table changes
      channel = supabase
        .channel('analytics-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'visitor_events',
          },
          handleNewEvent
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      // Fetch initial recent events
      const { data } = await supabase
        .from('visitor_events')
        .select('id, event_type, page_path, created_at, session_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setRecentEvents(data);
        
        // Calculate initial live visitors (sessions active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeSessions = new Set(
          data
            .filter(e => new Date(e.created_at) > fiveMinutesAgo && e.session_id)
            .map(e => e.session_id!)
        );
        setActiveSessions(activeSessions);
        setLiveVisitors(activeSessions.size);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [handleNewEvent]);

  return {
    liveVisitors,
    recentEvents,
    isConnected,
    lastUpdate,
  };
}

export default useRealtimeAnalytics;
