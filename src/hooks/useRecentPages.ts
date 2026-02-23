import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MAX_RECENT = 12;
const STORAGE_KEY = 'jj_recent_pages';

// Map routes to friendly names
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
  '/auth': 'Sign In',
  '/market-intelligence': 'Market Intelligence',
};

export interface RecentPage {
  path: string;
  title: string;
  timestamp: number;
}

export function useTrackRecentPages() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Skip auth and very short paths
    if (path === '/auth' || path.length < 2) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const pages: RecentPage[] = stored ? JSON.parse(stored) : [];

      // Remove duplicate
      const filtered = pages.filter(p => p.path !== path);

      // Determine title
      const title = ROUTE_NAMES[path] || path.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ');

      filtered.unshift({ path, title, timestamp: Date.now() });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
    } catch {
      // Silent fail
    }
  }, [location.pathname]);
}

export function getRecentPages(limit = 6): RecentPage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as RecentPage[]).slice(0, limit) : [];
  } catch {
    return [];
  }
}
