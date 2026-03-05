import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * SecurityShield - Enterprise-grade anti-inspection and content protection
 * Provides multiple layers of protection against:
 * - Code inspection (DevTools)
 * - Content scraping (bots, crawlers)
 * - Data extraction (copy, select, drag)
 * - Automated attacks (headless browsers)
 * 
 * IMPORTANT: This is client-side protection. True security comes from
 * proper backend authentication, RLS policies, and encrypted data transmission.
 */
const SecurityShield = () => {
  const violationCountRef = useRef(0);
  const fingerprintRef = useRef<string>('');

  // In Lovable preview/dev environments, the iframe + resize behavior can trigger false positives.
  // We still keep local protections (right-click / selection, etc.), but we avoid calling the backend
  // security logger to prevent noisy 403s and blank-screen errors.
  const isLovablePreviewOrDev = useCallback(() => {
    try {
      const host = window.location.hostname;
      return (
        import.meta.env.DEV ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('lovableproject.com')
      );
    } catch {
      return false;
    }
  }, []);

  const isLikelyCrawler = useCallback(() => {
    try {
      const ua = navigator.userAgent || '';
      // Comprehensive list of search engine bots, social media crawlers, and Google's rendering engine
      // This ensures content is visible to crawlers for proper SEO indexing
      return /Googlebot|Googlebot-Image|AdsBot-Google|Mediapartners-Google|Google-InspectionTool|Chrome-Lighthouse|bingbot|BingPreview|msnbot|DuckDuckBot|Slurp|Baiduspider|YandexBot|Applebot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Pinterest|Pinterestbot|WhatsApp|Slackbot|TelegramBot|Discordbot|Embedly|Quora Link Preview|Showyoubot|Outbrain|rogerbot|SemrushBot|AhrefsBot|MJ12bot|DotBot|Archive\.org_bot|SEMrushBot|DataForSeoBot|serpstatbot/i.test(
        ua
      );
    } catch {
      return false;
    }
  }, []);

  // Generate device fingerprint
  const getFingerprint = useCallback(() => {
    if (fingerprintRef.current) return fingerprintRef.current;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('JBJ-Security-Check', 2, 2);
    }
    
    const components = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.language,
      navigator.hardwareConcurrency || 0,
      navigator.platform,
      canvas.toDataURL().slice(-50)
    ];
    
    fingerprintRef.current = btoa(components.join('|')).slice(0, 32);
    return fingerprintRef.current;
  }, []);

  // Log security violation to database
  const logViolation = useCallback(async (type: string) => {
    violationCountRef.current += 1;
    const fingerprint = getFingerprint();
    
    console.warn(`[JBJ Security] Violation #${violationCountRef.current}: ${type}`);
    
    // Log to backend via function (best-effort). Skip in Lovable preview/dev.
    if (!isLovablePreviewOrDev()) {
      try {
        await supabase.functions
          .invoke('log-security-event', {
            body: {
              event_type: 'security_violation',
              violation_type: type,
              fingerprint,
              user_agent: navigator.userAgent,
              violation_count: violationCountRef.current,
            },
          })
          .catch(() => {}); // Silent fail - don't block UI
      } catch {
        // Silent fail
      }
    }
    
    // IMPORTANT: Never block/overlay the public site.
    // We only log violations (best-effort) so visitors and crawlers can still access pages.
  }, [getFingerprint, isLovablePreviewOrDev]);

  useEffect(() => {
    // Never run protection logic for search/social crawlers.
    if (isLikelyCrawler()) return;

    // ========== 1. DISABLE RIGHT-CLICK ==========
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow right-click on form inputs for paste functionality
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return true;
      }
      e.preventDefault();
      logViolation('context_menu');
      return false;
    };

    // ========== 2. BLOCK DEVTOOLS SHORTCUTS ==========
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        logViolation('devtools_f12');
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('devtools_ctrl_shift_i');
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('devtools_console');
        return false;
      }
      // Ctrl+Shift+C (Element picker)
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('devtools_element_picker');
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('view_source');
        return false;
      }
      // Ctrl+S (Save)
      if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
      // Mac equivalents
      if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('devtools_mac');
        return false;
      }
      if (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('console_mac');
        return false;
      }
      if (e.metaKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('view_source_mac');
        return false;
      }
    };

    // ========== 3. DISABLE TEXT SELECTION ==========
    const handleSelectStart = (e: Event) => {
      const target = e.target;
      const element = target instanceof Element ? target : null;

      // Allow selection in form inputs
      if (
        element && (
          element.tagName === 'INPUT' ||
          element.tagName === 'TEXTAREA' ||
          (element as HTMLElement).isContentEditable ||
          element.closest('[data-allow-select]')
        )
      ) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // ========== 4. DISABLE IMAGE DRAG ==========
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // ========== 5. DETECT DEVTOOLS OPENING ==========
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          logViolation('devtools_opened');
          // NOTE: console.clear() removed to preserve error messages for debugging
          console.log('%c⚠️ JBJ SECURITY', 'color: #dc2626; font-size: 24px; font-weight: bold;');
          console.log('%cThis is a protected website. All access is logged.', 'color: #f87171; font-size: 14px;');
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // ========== 6. DETECT HEADLESS BROWSERS ==========
    const detectHeadless = () => {
      // Log only; do not block.
      const isHeadless =
        /HeadlessChrome/.test(navigator.userAgent) ||
        navigator.webdriver === true ||
        !navigator.languages ||
        navigator.languages.length === 0;

      if (isHeadless) {
        logViolation('headless_browser');
      }
    };

    // ========== 7. DETECT AUTOMATION TOOLS ==========
    const detectAutomation = () => {
      const win = window as any;
      const doc = document as any;
      
      const automationIndicators = [
        win.__webdriver_script_fn,
        win.__driver_evaluate,
        win.__webdriver_evaluate,
        win.__selenium_evaluate,
        win.__fxdriver_evaluate,
        win.__driver_unwrapped,
        win.__webdriver_unwrapped,
        win.__selenium_unwrapped,
        win.__fxdriver_unwrapped,
        win._Selenium_IDE_Recorder,
        win._selenium,
        win.callSelenium,
        win._WEBDRIVER_ELEM_CACHE,
        doc.__webdriver_script_function,
        doc.$cdc_asdjflasutopfhvcZLmcfl_,
        doc.$chrome_asyncScriptInfo
      ];

      if (automationIndicators.some(indicator => indicator !== undefined)) {
        logViolation('automation_detected');
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('resize', detectDevTools);

    // Initial checks
    const devToolsInterval = setInterval(detectDevTools, 1000);
    detectHeadless();
    detectAutomation();

    // ========== 8. CSS PROTECTION ==========
    const style = document.createElement('style');
    style.id = 'jbj-security-shield-styles';
    style.textContent = `
      /* Disable text selection globally */
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Re-enable for form inputs */
      input, textarea, [contenteditable="true"], [data-allow-select], [data-allow-select] * {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      /* Disable image dragging */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
      
      /* Disable print (basic) */
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
     return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('resize', detectDevTools);
      clearInterval(devToolsInterval);
      
      const styleElement = document.getElementById('jbj-security-shield-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
   }, [isLikelyCrawler, logViolation]);

  return null;
};

export default SecurityShield;
