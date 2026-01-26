import { useEffect, useState, useCallback } from 'react';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface SecurityViolation {
  type: string;
  timestamp: Date;
  fingerprint: string;
}

/**
 * SecurityShield - Enterprise-grade frontend protection
 * Detects and responds to potential scraping/inspection attempts
 */
export function SecurityShield({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [violation, setViolation] = useState<SecurityViolation | null>(null);

  // Check if we're in development/preview mode (Lovable editor, localhost, or preview URLs)
  const isDevMode = useCallback(() => {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('lovable.app') ||
      hostname.includes('lovable.dev') ||
      hostname.includes('preview') ||
      import.meta.env.DEV
    );
  }, []);

  const getFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('JBJ Security', 2, 2);
    }
    return btoa(navigator.userAgent + screen.width + screen.height + new Date().getTimezoneOffset());
  }, []);

  const logViolation = useCallback(async (type: string) => {
    // Skip blocking in development/preview mode
    if (isDevMode()) {
      console.log('[JBJ Security] Skipping block in dev mode:', type);
      return;
    }

    const fingerprint = getFingerprint();
    const newViolation: SecurityViolation = {
      type,
      timestamp: new Date(),
      fingerprint,
    };
    setViolation(newViolation);
    setIsBlocked(true);

    console.warn('[JBJ Security] Violation detected:', type);
  }, [getFingerprint, isDevMode]);

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Detect keyboard shortcuts for DevTools and copy
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        logViolation('devtools_f12');
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        logViolation('devtools_shortcut');
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        logViolation('console_shortcut');
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        logViolation('view_source');
        return false;
      }
      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools opening via console timing
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          logViolation('devtools_resize');
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Check for headless browser indicators
    const detectHeadless = () => {
      const isHeadless = 
        /HeadlessChrome/.test(navigator.userAgent) ||
        navigator.webdriver === true ||
        !navigator.languages ||
        navigator.languages.length === 0;
      
      if (isHeadless) {
        logViolation('headless_browser');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    const devToolsInterval = setInterval(detectDevTools, 1000);
    detectHeadless();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, [logViolation]);

  // Add CSS protection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .jbj-protected {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      .jbj-protected img {
        pointer-events: none;
        -webkit-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-zinc-900 border-2 border-red-600 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-500 mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            SECURITY NOTICE
          </h1>
          
          <div className="text-zinc-300 text-sm space-y-4 text-left mb-6">
            <p>
              <strong>Unauthorized access, inspection, extraction, duplication, mirroring, or synchronization</strong> of this website's content, listings, data, design, UI, or code is <strong>strictly prohibited</strong>.
            </p>
            
            <p>
              <strong>JBJ Global Real Estate</strong> is a licensed and registered entity in Dubai, UAE.
            </p>
            
            <p>
              All content, data, listings, and digital assets are legally protected, tracked, and registered under applicable UAE commercial, cybercrime, and intellectual property laws.
            </p>
            
            <p className="text-red-400">
              Any attempt to scrape, copy, reuse, or extract content is logged and may result in <strong>civil and criminal legal action</strong> under UAE law.
            </p>
            
            <div className="bg-zinc-800 rounded-lg p-4 mt-4 border border-zinc-700">
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Your IP address, device fingerprint, and activity have been recorded.
              </p>
              {violation && (
                <p className="text-xs text-zinc-500 mt-2">
                  Incident ID: {violation.fingerprint.slice(0, 16)}...
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          >
            I Understand - Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jbj-protected">
      {children}
    </div>
  );
}

export default SecurityShield;
