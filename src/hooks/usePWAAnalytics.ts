import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type PWAEventType = 
  | 'button_click' 
  | 'prompt_shown' 
  | 'install_accepted' 
  | 'install_dismissed' 
  | 'app_opened' 
  | 'app_uninstalled';

interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other';
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent.toLowerCase();
  
  // Device type
  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|android(?!.*mobile)|kindle|playbook/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Platform
  let platform: DeviceInfo['platform'] = 'unknown';
  if (/iphone|ipad|ipod/.test(ua)) {
    platform = 'ios';
  } else if (/android/.test(ua)) {
    platform = 'android';
  } else if (/windows/.test(ua)) {
    platform = 'windows';
  } else if (/macintosh|mac os x/.test(ua)) {
    platform = 'macos';
  } else if (/linux/.test(ua)) {
    platform = 'linux';
  }
  
  // Browser
  let browser: DeviceInfo['browser'] = 'other';
  if (/edg/.test(ua)) {
    browser = 'edge';
  } else if (/chrome/.test(ua) && !/edg/.test(ua)) {
    browser = 'chrome';
  } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
    browser = 'safari';
  } else if (/firefox/.test(ua)) {
    browser = 'firefox';
  } else if (/samsungbrowser/.test(ua)) {
    browser = 'samsung';
  }
  
  return { deviceType, platform, browser };
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('pwa_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('pwa_session_id', sessionId);
  }
  return sessionId;
}

export async function trackPWAEvent(
  eventType: PWAEventType,
  metadata?: Json
): Promise<void> {
  try {
    const deviceInfo = getDeviceInfo();
    const sessionId = getSessionId();
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
      event_type: eventType,
      device_type: deviceInfo.deviceType,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      page_url: window.location.href,
      session_id: sessionId,
      user_id: user?.id || null,
      metadata: metadata || {},
    };
    
    await supabase.from('pwa_analytics').insert([insertData]);
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.debug('PWA analytics tracking failed:', error);
  }
}

// Track app opened when running as standalone PWA
export function trackPWAOpened(): void {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  
  if (isStandalone) {
    const hasTrackedThisSession = sessionStorage.getItem('pwa_opened_tracked');
    if (!hasTrackedThisSession) {
      trackPWAEvent('app_opened');
      sessionStorage.setItem('pwa_opened_tracked', 'true');
    }
  }
}
