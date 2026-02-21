import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Device / Browser helpers ──
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
};

const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  return 'Unknown';
};

const getTimezone = (): string => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch { return 'Unknown'; }
};

export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
    sessionStorage.setItem('session_start_time', Date.now().toString());
  }
  return sessionId;
};

// ── Batched event queue for user_events (high-perf) ──
interface QueuedUserEvent {
  user_id: string | null;
  session_id: string;
  event_name: string;
  event_time: string;
  page_path: string;
  element_id: string | null;
  metadata: Record<string, unknown>;
}

const USER_EVENT_QUEUE: QueuedUserEvent[] = [];
let userEventFlushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 4000;
const MAX_BATCH = 25;

async function flushUserEvents() {
  if (USER_EVENT_QUEUE.length === 0) return;
  const batch = USER_EVENT_QUEUE.splice(0, MAX_BATCH);
  try {
    await supabase.from('user_events').insert(
      batch.map(e => ({ ...e, metadata: e.metadata as any })) as any[]
    );
  } catch (err) {
    console.warn('[Activity] Batch flush error:', err);
  }
}

function scheduleUserEventFlush() {
  if (userEventFlushTimer) return;
  userEventFlushTimer = setTimeout(() => {
    userEventFlushTimer = null;
    flushUserEvents();
  }, FLUSH_INTERVAL);
}

// ── Throttle helper ──
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  }) as T;
}

/**
 * GlobalVisitorTracking — unified tracking component.
 * Writes to BOTH legacy visitor_* tables AND new user_events + user_sessions tables.
 * Points are auto-awarded via DB trigger (award_points_on_event).
 */
export const GlobalVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const sessionCreated = useRef(false);
  const scrollDepth = useRef(0);
  const pageEntryTime = useRef(Date.now());

  // ── Queue a user event (batched insert) ──
  const queueUserEvent = useCallback((
    eventName: string,
    metadata: Record<string, unknown> = {},
    elementId?: string
  ) => {
    USER_EVENT_QUEUE.push({
      user_id: user?.id || null,
      session_id: getSessionId(),
      event_name: eventName,
      event_time: new Date().toISOString(),
      page_path: location.pathname,
      element_id: elementId || null,
      metadata,
    });
    if (USER_EVENT_QUEUE.length >= MAX_BATCH) {
      flushUserEvents();
    } else {
      scheduleUserEventFlush();
    }
  }, [user, location.pathname]);

  // ── Create user_sessions row ──
  const initUserSession = useCallback(async () => {
    if (sessionCreated.current) return;
    sessionCreated.current = true;

    const sessionId = getSessionId();
    const urlParams = new URLSearchParams(window.location.search);

    try {
      await supabase.from('user_sessions').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        device_type: getDeviceType(),
        os: getOS(),
        browser: getBrowserInfo(),
        user_agent: navigator.userAgent.substring(0, 500),
        timezone: getTimezone(),
        referrer: document.referrer || null,
        utm_source: urlParams.get('utm_source') || null,
        utm_medium: urlParams.get('utm_medium') || null,
        utm_campaign: urlParams.get('utm_campaign') || null,
        is_authenticated: !!user,
      } as any);
    } catch {
      // Session may already exist (page reload) — update instead
      await supabase.from('user_sessions').update({
        user_id: user?.id || null,
        is_authenticated: !!user,
      } as any).eq('session_id', sessionId);
    }
  }, [user]);

  // ── Legacy visitor_sessions init ──
  const initLegacySession = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const sessionId = getSessionId();
    try {
      const { error: insertError } = await supabase
        .from('visitor_sessions')
        .insert({
          session_id: sessionId,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          os: getOS(),
          referrer: document.referrer || null,
          landing_page: location.pathname,
          pages_visited: 1,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
        } as any);

      if (insertError) {
        await supabase.from('visitor_sessions')
          .update({ last_activity_at: new Date().toISOString(), user_id: user?.id || null })
          .eq('session_id', sessionId);
      }
    } catch { /* silent */ }
  }, [location.pathname, user]);

  // ── Track page view ──
  const trackPageView = useCallback(async () => {
    const sessionId = getSessionId();
    const path = location.pathname;
    const timeOnPrevPage = Math.floor((Date.now() - pageEntryTime.current) / 1000);
    const prevScroll = scrollDepth.current;
    pageEntryTime.current = Date.now();
    scrollDepth.current = 0;

    // Queue to new user_events table (points auto-awarded by DB trigger)
    queueUserEvent('page_view', {
      title: document.title,
      referrer: document.referrer,
      time_on_previous_page: timeOnPrevPage,
      scroll_depth_previous: prevScroll,
    });

    // Legacy visitor_events
    try {
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: 'page_view',
        event_name: `Viewed ${path}`,
        page_path: path,
        event_data: {
          page_url: window.location.href,
          title: document.title,
          time_on_previous_page_seconds: timeOnPrevPage,
          scroll_depth_on_previous_page: prevScroll,
          referrer: document.referrer,
        },
      } as any);

      const pagesVisited = parseInt(sessionStorage.getItem('pages_visited') || '0') + 1;
      sessionStorage.setItem('pages_visited', pagesVisited.toString());

      await supabase.from('visitor_sessions')
        .update({ pages_visited: pagesVisited, last_activity_at: new Date().toISOString() })
        .eq('session_id', sessionId);

      // Also update new user_sessions pages count
      await supabase.from('user_sessions')
        .update({ pages_visited: pagesVisited } as any)
        .eq('session_id', sessionId);
    } catch { /* silent */ }
  }, [location.pathname, queueUserEvent]);

  // ── Track clicks (throttled to max 1/second to avoid spam) ──
  const handleGlobalClick = useCallback(throttle(async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const sessionId = getSessionId();
    const linkEl = target.closest('a');
    const btnEl = target.closest('button');
    
    let elementType = target.tagName.toLowerCase();
    let text = target.textContent?.slice(0, 100) || '';
    
    if (linkEl) { elementType = 'link'; text = linkEl.textContent?.slice(0, 100) || ''; }
    if (btnEl) { elementType = 'button'; text = btnEl.textContent?.slice(0, 100) || ''; }

    // Queue to user_events
    queueUserEvent('click', { element: elementType, text }, target.id || undefined);

    // Legacy visitor_events
    try {
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: 'click',
        event_name: `Clicked ${elementType}`,
        page_path: location.pathname,
        element_id: target.id || null,
        element_text: text || null,
        event_data: { element: elementType, text, href: linkEl?.href },
      } as any);
    } catch { /* silent */ }
  }, 1000), [location.pathname, queueUserEvent]);

  // ── Track scroll depth ──
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentDepth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    if (currentDepth > scrollDepth.current) scrollDepth.current = currentDepth;
  }, []);

  // ── Handle exit / tab close ──
  const handleBeforeUnload = useCallback(() => {
    // Flush pending events
    flushUserEvents();

    const sessionId = getSessionId();
    const sessionStartTime = parseInt(sessionStorage.getItem('session_start_time') || Date.now().toString());
    const totalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Update new user_sessions
    const data = JSON.stringify({
      ended_at: new Date().toISOString(),
      duration_seconds: totalTimeSpent,
    });

    // sendBeacon for reliability on page close
    if (navigator.sendBeacon) {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?session_id=eq.${encodeURIComponent(sessionId)}`;
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
    }

    // Legacy update
    void (async () => {
      try {
        await supabase.from('visitor_sessions')
          .update({ total_time_spent: totalTimeSpent, last_activity_at: new Date().toISOString(), scroll_depth_max: scrollDepth.current })
          .eq('session_id', sessionId);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Track visibility change (mobile background) ──
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      flushUserEvents();
      const sessionId = getSessionId();
      const sessionStartTime = parseInt(sessionStorage.getItem('session_start_time') || Date.now().toString());
      const totalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      
      void supabase.from('user_sessions')
        .update({ duration_seconds: totalTimeSpent } as any)
        .eq('session_id', sessionId);
    }
  }, []);

  // ── Initialize ──
  useEffect(() => {
    initLegacySession();
    initUserSession();
  }, [initLegacySession, initUserSession]);

  // ── When user authenticates mid-session, update session records ──
  useEffect(() => {
    if (!user?.id) return;
    const sessionId = getSessionId();
    
    // Update user_sessions with user_id
    void supabase.from('user_sessions')
      .update({ user_id: user.id, is_authenticated: true } as any)
      .eq('session_id', sessionId);

    // Update legacy visitor_sessions
    void supabase.from('visitor_sessions')
      .update({ user_id: user.id })
      .eq('session_id', sessionId);

    // Queue login event
    queueUserEvent('login', { method: 'session_restore' });
  }, [user?.id, queueUserEvent]);

  // Track page views
  useEffect(() => { trackPageView(); }, [trackPageView]);

  // Global event listeners
  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleGlobalClick, handleScroll, handleBeforeUnload, handleVisibilityChange]);

  return null;
};

export default GlobalVisitorTracking;
