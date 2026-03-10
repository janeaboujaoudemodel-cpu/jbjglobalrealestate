import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrackEventData {
  element_id?: string;
  element_class?: string;
  element_text?: string;
  action?: string;
  property_id?: string;
  document_name?: string;
  document_type?: string;
  form_name?: string;
  tool_name?: string;
  search_query?: string;
  [key: string]: any;
}

const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionStartTime = useRef(Date.now());
  const pageStartTime = useRef(Date.now());
  const lastPath = useRef(location.pathname);
  const pagesVisitedCount = useRef(0);
  const hasInitialized = useRef(false);

  // Initialize session
  const initSession = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const sessionId = getSessionId();
    const connectionInfo = (navigator as any).connection;
    
    try {
      const { error } = await supabase
        .from('visitor_sessions')
        .upsert({
          session_id: sessionId,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          os: getOS(),
          referrer: document.referrer || null,
          landing_page: location.pathname,
          pages_visited: 1,
          user_id: user?.id || null,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language || null,
          network_type: connectionInfo?.effectiveType || null,
        } as any, {
          onConflict: 'session_id',
        });

      if (error) {
        console.error('Error creating session:', error);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }, [location.pathname, user]);

  // Track page view
  const trackPageView = useCallback(async () => {
    const sessionId = getSessionId();
    const path = location.pathname;

    // Increment pages visited count
    pagesVisitedCount.current += 1;

    try {
      // Log page view event
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: 'page_view',
        event_name: `Viewed ${path}`,
        page_path: path,
        event_data: { title: document.title },
      });

      // Update session with pages visited count
      await supabase
        .from('visitor_sessions')
        .update({
          pages_visited: pagesVisitedCount.current,
          last_activity_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, [location.pathname]);

  // Track general event
  const trackEvent = useCallback(async (eventType: string, eventName: string, eventData: TrackEventData = {}) => {
    const sessionId = getSessionId();

    try {
      await supabase.from('visitor_events').insert({
        session_id: sessionId,
        event_type: eventType,
        event_name: eventName,
        page_path: location.pathname,
        element_id: eventData.element_id || null,
        element_class: eventData.element_class || null,
        element_text: eventData.element_text || null,
        event_data: eventData,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [location.pathname]);

  // Track click
  const trackClick = useCallback((element: string, additionalData?: TrackEventData) => {
    trackEvent('click', `Clicked ${element}`, { element_text: element, ...additionalData });
  }, [trackEvent]);

  // Track download
  const trackDownload = useCallback(async (documentName: string, documentType: string, documentUrl?: string) => {
    const sessionId = getSessionId();

    try {
      // Log download event
      await trackEvent('download', `Downloaded ${documentName}`, { document_name: documentName, document_type: documentType });

      // Save document record with user_id
      await supabase.from('visitor_documents').insert({
        session_id: sessionId,
        document_type: documentType,
        document_name: documentName,
        document_url: documentUrl || null,
        action: 'download',
        user_id: user?.id || null,
      } as any);
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }, [trackEvent, user]);

  // Track upload
  const trackUpload = useCallback(async (documentName: string, documentType: string, documentUrl?: string, storagePath?: string) => {
    const sessionId = getSessionId();

    try {
      // Log upload event
      await trackEvent('upload', `Uploaded ${documentName}`, { document_name: documentName, document_type: documentType });

      // Save document record with user_id
      await supabase.from('visitor_documents').insert({
        session_id: sessionId,
        document_type: documentType,
        document_name: documentName,
        document_url: documentUrl || null,
        storage_path: storagePath || null,
        action: 'upload',
        user_id: user?.id || null,
      } as any);
    } catch (error) {
      console.error('Error tracking upload:', error);
    }
  }, [trackEvent, user]);

  // Track form submission
  const trackFormSubmission = useCallback((formName: string, formData?: Record<string, any>) => {
    trackEvent('form_submit', `Submitted ${formName}`, { form_name: formName, ...formData });
  }, [trackEvent]);

  // Track tool usage
  const trackToolUsage = useCallback((toolName: string, toolCategory?: string) => {
    trackEvent('tool_usage', `Used ${toolName}`, { tool_name: toolName, tool_category: toolCategory });
  }, [trackEvent]);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    trackEvent('search', `Searched: ${query}`, { search_query: query, results_count: resultsCount });
  }, [trackEvent]);

  // Update time spent on exit
  const updateTimeSpent = useCallback(async () => {
    const sessionId = getSessionId();
    const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    try {
      await supabase
        .from('visitor_sessions')
        .update({
          total_time_spent: timeSpent,
          last_activity_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error updating time spent:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Track page views on route change
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Update time spent on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateTimeSpent();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [updateTimeSpent]);

  return {
    trackEvent,
    trackClick,
    trackDownload,
    trackUpload,
    trackFormSubmission,
    trackToolUsage,
    trackSearch,
    getSessionId,
  };
};

export default useVisitorTracking;
