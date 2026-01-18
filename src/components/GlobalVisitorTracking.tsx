import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClickData {
  element: string;
  elementId?: string;
  elementClass?: string;
  href?: string;
  text?: string;
  buttonType?: string;
}

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

const getScreenResolution = (): string => {
  return `${window.screen.width}x${window.screen.height}`;
};

const getViewportSize = (): string => {
  return `${window.innerWidth}x${window.innerHeight}`;
};

const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const getLanguages = (): string[] => {
  return navigator.languages ? [...navigator.languages] : [navigator.language];
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

export const GlobalVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const clickCount = useRef(0);
  const scrollDepth = useRef(0);
  const pageEntryTime = useRef(Date.now());

  // Initialize or update session
  const initSession = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const sessionId = getSessionId();
    
    try {
      const sessionData = {
        session_id: sessionId,
        device_type: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        screen_resolution: getScreenResolution(),
        viewport_size: getViewportSize(),
        timezone: getTimezone(),
        languages: getLanguages(),
        referrer: document.referrer || null,
        landing_page: location.pathname,
        pages_visited: 1,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
      };

      await supabase
        .from('visitor_sessions')
        .upsert(sessionData as any, { onConflict: 'session_id' });

      console.log('[Tracking] Session initialized:', sessionId);
    } catch (error) {
      console.error('[Tracking] Session init error:', error);
    }
  }, [location.pathname, user]);

  // Track every click on the page
  const handleGlobalClick = useCallback(async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    clickCount.current += 1;
    const sessionId = getSessionId();

    // Get element details
    const clickData: ClickData = {
      element: target.tagName.toLowerCase(),
      elementId: target.id || undefined,
      elementClass: target.className || undefined,
      text: target.textContent?.slice(0, 100) || undefined,
    };

    // Check for links
    const linkElement = target.closest('a');
    if (linkElement) {
      clickData.href = linkElement.href;
      clickData.element = 'link';
    }

    // Check for buttons
    const buttonElement = target.closest('button');
    if (buttonElement) {
      clickData.element = 'button';
      clickData.buttonType = buttonElement.type || 'button';
      clickData.text = buttonElement.textContent?.slice(0, 100) || undefined;
    }

    // Check for downloads
    if (linkElement?.hasAttribute('download') || linkElement?.href?.includes('/download')) {
      clickData.element = 'download_link';
    }

    try {
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: 'click',
        event_name: `Clicked ${clickData.element}`,
        page_path: location.pathname,
        element_id: clickData.elementId || null,
        element_class: clickData.elementClass || null,
        element_text: clickData.text || null,
        event_data: clickData as any,
      } as any);
    } catch (error) {
      // Silently fail for non-critical tracking
    }
  }, [location.pathname]);

  // Track scroll depth
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentDepth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    
    if (currentDepth > scrollDepth.current) {
      scrollDepth.current = currentDepth;
    }
  }, []);

  // Track page view with time spent on previous page
  const trackPageView = useCallback(async () => {
    const sessionId = getSessionId();
    const path = location.pathname;
    const timeOnPreviousPage = Math.floor((Date.now() - pageEntryTime.current) / 1000);
    
    // Reset for new page
    pageEntryTime.current = Date.now();
    const previousScrollDepth = scrollDepth.current;
    scrollDepth.current = 0;

    try {
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: 'page_view',
        event_name: `Viewed ${path}`,
        page_path: path,
        event_data: {
          page_url: window.location.href,
          title: document.title,
          time_on_previous_page_seconds: timeOnPreviousPage,
          scroll_depth_on_previous_page: previousScrollDepth,
          referrer: document.referrer,
        },
      } as any);

      // Update session
      const pagesVisited = parseInt(sessionStorage.getItem('pages_visited') || '0') + 1;
      sessionStorage.setItem('pages_visited', pagesVisited.toString());

      await supabase
        .from('visitor_sessions')
        .update({
          pages_visited: pagesVisited,
          last_activity_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('[Tracking] Page view error:', error);
    }
  }, [location.pathname]);

  // Update session on exit
  const handleBeforeUnload = useCallback(() => {
    const sessionId = getSessionId();
    const sessionStartTime = parseInt(sessionStorage.getItem('session_start_time') || Date.now().toString());
    const totalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Use sendBeacon for reliable exit tracking
    const data = JSON.stringify({
      total_time_spent: totalTimeSpent,
      last_activity_at: new Date().toISOString(),
    });

    navigator.sendBeacon(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/visitor_sessions?session_id=eq.${sessionId}`,
      new Blob([data], { type: 'application/json' })
    );
  }, []);

  // Initialize on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Track page views
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Add global event listeners
  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleGlobalClick, handleScroll, handleBeforeUnload]);

  return null; // This component doesn't render anything
};

export default GlobalVisitorTracking;
