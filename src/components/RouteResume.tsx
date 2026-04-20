import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/my-dashboard': 'My Dashboard',
  '/profile': 'My Profile',
  '/favorites': 'Favorites',
  '/compare': 'Shortlist',
  '/toolkit': 'AI Tools',
  '/crm': 'CRM Dashboard',
  '/owner': 'Owner Dashboard',
  '/admin': 'Admin Panel',
  '/ai-calendar': 'AI Calendar & Notes',
  '/support-tickets': 'Support Tickets',
  '/market-intelligence': 'Market Intelligence',
  '/area-guides': 'Area Guides',
};

/**
 * Tracks recently viewed pages for the account dropdown.
 * Also resumes the Interior Design AI in-progress flow (sessionStorage).
 *
 * NOTE: The generic "last-route" auto-redirect has been removed — visiting `/`
 * must always land on the homepage. Resume UX belongs behind explicit user action.
 */
export default function RouteResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);

  // One-time cleanup: remove stale last-route value so returning users aren't bounced
  useEffect(() => {
    try {
      localStorage.removeItem("last-route");
    } catch {
      // ignore
    }
  }, []);

  // Track recently viewed pages (used by the account dropdown)
  useEffect(() => {
    try {
      if (location.pathname.startsWith("/auth") || location.pathname === "/403") {
        return;
      }

      const path = location.pathname;
      if (path.length > 1) {
        const stored = localStorage.getItem('jj_recent_pages');
        const pages: Array<{ path: string; title: string; timestamp: number }> = stored ? JSON.parse(stored) : [];
        const filtered = pages.filter(p => p.path !== path);
        const title = ROUTE_NAMES[path] || path.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ');
        filtered.unshift({ path, title, timestamp: Date.now() });
        localStorage.setItem('jj_recent_pages', JSON.stringify(filtered.slice(0, 12)));
      }
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  // Interior Design AI in-progress resume — runs only once per page load
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (location.pathname !== "/") return;

    try {
      const step = JSON.parse(sessionStorage.getItem("interior-design-step") ?? "1");
      const showComparison = JSON.parse(
        sessionStorage.getItem("interior-design-showComparison") ?? "true"
      );
      const designResult = JSON.parse(
        sessionStorage.getItem("interior-design-designResult") ?? "null"
      );
      const selectedPackage = JSON.parse(
        sessionStorage.getItem("interior-design-selectedPackage") ?? '""'
      );

      const hasInteriorProgress =
        (typeof step === "number" && step > 1) ||
        showComparison === false ||
        !!designResult ||
        (typeof selectedPackage === "string" && selectedPackage.length > 0);

      if (hasInteriorProgress) {
        navigate("/interior-design-ai", { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.pathname, navigate]);

  return null;
}
