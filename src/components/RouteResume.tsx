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
 * Persists and restores the last visited route using localStorage.
 * Also tracks recently viewed pages for the account dropdown.
 */
export default function RouteResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);

  // Persist last visited route + track recent pages
  useEffect(() => {
    try {
      const route = `${location.pathname}${location.search}${location.hash}`;
      const existing = localStorage.getItem("last-route");

      if (!hasCheckedRef.current && route === "/" && existing && existing !== "/") {
        return;
      }

      if (route.startsWith("/auth") || route === "/403") {
        return;
      }

      localStorage.setItem("last-route", route);

      // Track recently viewed pages
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

  // Run only once per page load
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // If browser already loaded on the correct deep route, do nothing
    if (location.pathname !== "/") return;

    try {
      // 1) Interior Design AI resume
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
        return;
      }

      // 2) Generic last-route resume from localStorage
      const lastRoute = localStorage.getItem("last-route") || "";
      if (lastRoute && lastRoute !== "/") {
        navigate(lastRoute, { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.pathname, navigate]);

  return null;
}

