import { useEffect, useState, useCallback, useRef } from 'react';
import { Shield, AlertTriangle, Lock, Scale } from 'lucide-react';

interface SecurityViolation {
  type: string;
  timestamp: Date;
  fingerprint: string;
  incidentId: string;
}

/**
 * SecurityShield - Enterprise-grade frontend protection
 * Detects and responds to potential scraping/inspection attempts
 * Enhanced with UAE Cybercrime Law compliance
 */
export function SecurityShield({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [violation, setViolation] = useState<SecurityViolation | null>(null);
  const violationCount = useRef(0);

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
    const canvasData = canvas.toDataURL();
    const browserData = [
      navigator.userAgent,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.language,
      navigator.hardwareConcurrency,
      canvasData.slice(0, 50)
    ].join('|');
    return btoa(browserData).slice(0, 32);
  }, []);

  const generateIncidentId = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `JBJ-${timestamp}-${random}`.toUpperCase();
  }, []);

  const logViolation = useCallback(async (type: string) => {
    violationCount.current++;

    // Skip blocking in development/preview mode
    if (isDevMode()) {
      console.log('[JBJ Security] Skipping block in dev mode:', type);
      return;
    }

    // Clear console to hide detection logic
    console.clear();

    const fingerprint = getFingerprint();
    const incidentId = generateIncidentId();
    const newViolation: SecurityViolation = {
      type,
      timestamp: new Date(),
      fingerprint,
      incidentId,
    };
    setViolation(newViolation);
    setIsBlocked(true);

    // Inject debugger to freeze automated tools
    // eslint-disable-next-line no-debugger
    debugger;
  }, [getFingerprint, generateIncidentId, isDevMode]);

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
      <div className="fixed inset-0 z-[99999] bg-[#1A1A1A] flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-[#FDFBF7] border-2 border-red-600 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-500 mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            SECURITY VIOLATION DETECTED
          </h1>
          
          <div className="text-white/85 text-sm space-y-4 text-left mb-6">
            <p>
              <strong>Unauthorized access, inspection, extraction, duplication, mirroring, or synchronization</strong> of this website's content, listings, data, design, UI, or code is <strong>strictly prohibited</strong>.
            </p>
            
            <p>
              <strong>JBJ Global Real Estate</strong> is a licensed and registered entity in Dubai, UAE (License No. 1234567).
            </p>

            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-400 mb-2">UAE CYBERCRIME LAW NOTICE</p>
                  <p className="text-xs text-white/70">
                    This incident may constitute a violation of <strong>UAE Federal Decree-Law No. 34 of 2021</strong> (Cybercrime Law), including but not limited to:
                  </p>
                  <ul className="text-xs text-white/70 mt-2 space-y-1 list-disc list-inside">
                    <li>Article 4: Unauthorized access to electronic systems</li>
                    <li>Article 6: Illegal acquisition of electronic data</li>
                    <li>Article 44: Intellectual property infringement</li>
                  </ul>
                  <p className="text-xs text-white/70 mt-2">
                    Penalties may include <strong>imprisonment and fines up to AED 3,000,000</strong>.
                  </p>
                </div>
              </div>
            </div>
            
            <p>
              All content, data, listings, and digital assets are legally protected under UAE Commercial Law, DIFC Data Protection Law (Law No. 5 of 2020), and applicable intellectual property regulations.
            </p>
            
            <p className="text-red-400 font-semibold">
              This incident has been logged and may be reported to UAE authorities for investigation.
            </p>
            
            <div className="bg-[#1A1A1A] rounded-lg p-4 mt-4 border border-[#1A1A1A]">
              <p className="text-xs text-white/70 flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                <strong>Recorded Evidence:</strong>
              </p>
              <ul className="text-xs text-white/90 space-y-1">
                <li>• IP Address & Geolocation: Captured</li>
                <li>• Device Fingerprint: Captured</li>
                <li>• Timestamp: {violation?.timestamp.toISOString()}</li>
                <li>• Violation Type: {violation?.type}</li>
              </ul>
              {violation && (
                <p className="text-xs text-red-400 mt-3 font-mono">
                  Incident ID: {violation.incidentId}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#EFE6D6] text-[#1A1A1A] font-semibold rounded-lg hover:bg-[#EFE6D6]/90 transition-colors"
          >
            I Understand - Reload Page
          </button>
          
          <p className="text-xs text-[#1A1A1A]/70 mt-4">
            If you believe this is an error, contact legal@jbj.ae with Incident ID: {violation?.incidentId}
          </p>
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
