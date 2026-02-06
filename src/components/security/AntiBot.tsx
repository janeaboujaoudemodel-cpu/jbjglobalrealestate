import { useEffect, useRef, useCallback } from 'react';

interface BotSignals {
  mouseMovements: number;
  scrollEvents: number;
  keystrokes: number;
  clickTimings: number[];
  lastActivityTime: number;
  suspiciousPatterns: number;
}

/**
 * AntiBot - Behavioral analysis for bot detection
 * Monitors user behavior patterns to detect automated scraping
 */
export function AntiBot() {
  const signals = useRef<BotSignals>({
    mouseMovements: 0,
    scrollEvents: 0,
    keystrokes: 0,
    clickTimings: [],
    lastActivityTime: Date.now(),
    suspiciousPatterns: 0,
  });

  const startTime = useRef(Date.now());

  // Check if we're in development mode
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

  const logSuspiciousActivity = useCallback((reason: string) => {
    if (isDevMode()) {
      console.log('[AntiBot] Dev mode - skipping:', reason);
      return;
    }

    signals.current.suspiciousPatterns++;
    console.warn('[JBJ Security] Suspicious activity detected:', reason);

    // After 3 suspicious patterns, take action
    if (signals.current.suspiciousPatterns >= 3) {
      // Clear console to hide detection logic
      console.clear();
      
      // Inject debugger to freeze automated tools
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }, [isDevMode]);

  useEffect(() => {
    if (isDevMode()) return;

    // Track mouse movements - bots often don't move naturally
    const handleMouseMove = () => {
      signals.current.mouseMovements++;
      signals.current.lastActivityTime = Date.now();
    };

    // Track scroll behavior - bots scroll uniformly
    let lastScrollY = window.scrollY;
    let uniformScrollCount = 0;
    
    const handleScroll = () => {
      const scrollDelta = Math.abs(window.scrollY - lastScrollY);
      signals.current.scrollEvents++;
      signals.current.lastActivityTime = Date.now();

      // Check for uniform scroll patterns (bot behavior)
      if (scrollDelta === 100 || scrollDelta === 200 || scrollDelta === 500) {
        uniformScrollCount++;
        if (uniformScrollCount > 5) {
          logSuspiciousActivity('uniform_scroll_pattern');
        }
      } else {
        uniformScrollCount = 0;
      }

      lastScrollY = window.scrollY;
    };

    // Track click timing - bots click too fast or too uniformly
    const handleClick = () => {
      const now = Date.now();
      signals.current.clickTimings.push(now);
      signals.current.lastActivityTime = now;

      // Keep only last 10 clicks
      if (signals.current.clickTimings.length > 10) {
        signals.current.clickTimings.shift();
      }

      // Check for rapid clicking (< 100ms between clicks)
      if (signals.current.clickTimings.length >= 2) {
        const lastTwo = signals.current.clickTimings.slice(-2);
        if (lastTwo[1] - lastTwo[0] < 100) {
          logSuspiciousActivity('rapid_clicking');
        }
      }
    };

    // Detect copy/paste of large text blocks
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 500) {
        logSuspiciousActivity('large_text_copy');
        e.preventDefault();
      }
    };

    // Check for too-fast navigation (bot crawling)
    const checkNavigationSpeed = () => {
      const sessionDuration = Date.now() - startTime.current;
      const pagesPerMinute = (performance.getEntriesByType('navigation').length / sessionDuration) * 60000;

      if (pagesPerMinute > 30) {
        logSuspiciousActivity('rapid_navigation');
      }
    };

    // Check for lack of human behavior
    const checkHumanBehavior = () => {
      const sessionDuration = Date.now() - startTime.current;
      
      // After 30 seconds, expect some mouse movement
      if (sessionDuration > 30000 && signals.current.mouseMovements < 5) {
        logSuspiciousActivity('no_mouse_movement');
      }

      // After 60 seconds, expect some scroll
      if (sessionDuration > 60000 && signals.current.scrollEvents < 2) {
        logSuspiciousActivity('no_scroll_activity');
      }
    };

    // Add invisible honeypot link
    const honeypot = document.createElement('a');
    honeypot.href = '/api/v1/internal/data-export';
    honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
    honeypot.setAttribute('data-honeypot', 'true');
    honeypot.textContent = 'Download All Data';
    document.body.appendChild(honeypot);

    honeypot.addEventListener('click', (e) => {
      e.preventDefault();
      logSuspiciousActivity('honeypot_triggered');
    });

    // Event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('copy', handleCopy);

    // Periodic checks
    const behaviorInterval = setInterval(checkHumanBehavior, 15000);
    const navigationInterval = setInterval(checkNavigationSpeed, 10000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('copy', handleCopy);
      clearInterval(behaviorInterval);
      clearInterval(navigationInterval);
      honeypot.remove();
    };
  }, [isDevMode, logSuspiciousActivity]);

  return null;
}

export default AntiBot;
