import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useActivityTracker — Tracks user session activity (login time, pages visited, actions).
 * Automatically starts a session on mount and updates it periodically.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const actionsRef = useRef(0);
  const pagesRef = useRef(0);

  // Start session
  useEffect(() => {
    if (!user?.id) return;

    const startSession = async () => {
      try {
        const { data } = await supabase
          .from('user_activity_sessions')
          .insert({
            user_id: user.id,
            session_start: new Date().toISOString(),
            pages_visited: 1,
            actions_performed: 0,
            user_agent: navigator.userAgent?.substring(0, 200),
          })
          .select('id')
          .single();

        if (data) {
          sessionIdRef.current = data.id;
        }
      } catch (e) {
        console.error('Activity tracker: failed to start session', e);
      }
    };

    startSession();

    // Update session every 60 seconds
    const interval = setInterval(async () => {
      if (!sessionIdRef.current) return;
      try {
        await supabase
          .from('user_activity_sessions')
          .update({
            session_end: new Date().toISOString(),
            pages_visited: pagesRef.current,
            actions_performed: actionsRef.current,
            duration_minutes: Math.floor((Date.now() - Date.parse(new Date().toISOString())) / 60000) || 1,
          })
          .eq('id', sessionIdRef.current);
      } catch {}
    }, 60000);

    // End session on unmount / tab close
    const endSession = () => {
      if (sessionIdRef.current && user?.id) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity_sessions?id=eq.${sessionIdRef.current}`,
          JSON.stringify({ session_end: new Date().toISOString(), pages_visited: pagesRef.current, actions_performed: actionsRef.current })
        );
      }
    };

    window.addEventListener('beforeunload', endSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', endSession);
      endSession();
    };
  }, [user?.id]);

  // Track page visits
  const trackPageVisit = useCallback(() => {
    pagesRef.current += 1;
  }, []);

  // Track actions (clicks, form submissions, etc.)
  const trackAction = useCallback(() => {
    actionsRef.current += 1;
  }, []);

  return { trackPageVisit, trackAction };
}
