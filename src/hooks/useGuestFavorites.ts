import { useState, useEffect, useCallback } from "react";

const GUEST_FAVORITES_KEY = "jj_guest_favorites";
const GUEST_SHORTLIST_KEY = "jj_guest_shortlist";

export interface GuestFavorite {
  project_id: string;
  created_at: string;
}

export interface GuestShortlistItem {
  project_id: string;
  created_at: string;
  badge?: 'top1' | 'top2' | 'top3' | null;
}

export function useGuestFavorites() {
  const [favorites, setFavorites] = useState<GuestFavorite[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = useCallback((projectId: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.project_id === projectId);
      let newFavorites: GuestFavorite[];
      
      if (exists) {
        newFavorites = prev.filter((f) => f.project_id !== projectId);
      } else {
        newFavorites = [...prev, { project_id: projectId, created_at: new Date().toISOString() }];
      }
      
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((projectId: string) => {
    return favorites.some((f) => f.project_id === projectId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

export function useGuestShortlist() {
  const [shortlist, setShortlist] = useState<GuestShortlistItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_SHORTLIST_KEY);
    if (stored) {
      try {
        setShortlist(JSON.parse(stored));
      } catch {
        setShortlist([]);
      }
    }
  }, []);

  const toggleShortlist = useCallback((projectId: string): boolean => {
    let success = true;
    
    setShortlist((prev) => {
      const exists = prev.some((s) => s.project_id === projectId);
      let newShortlist: GuestShortlistItem[];
      
      if (exists) {
        newShortlist = prev.filter((s) => s.project_id !== projectId);
      } else {
        // No limit - users can shortlist as many as they want
        newShortlist = [...prev, { project_id: projectId, created_at: new Date().toISOString(), badge: null }];
      }
      
      localStorage.setItem(GUEST_SHORTLIST_KEY, JSON.stringify(newShortlist));
      return newShortlist;
    });
    
    return success;
  }, []);

  const isShortlisted = useCallback((projectId: string) => {
    return shortlist.some((s) => s.project_id === projectId);
  }, [shortlist]);

  const setBadge = useCallback((projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setShortlist((prev) => {
      // First, remove this badge from any other project
      let newShortlist = prev.map((item) => {
        if (item.badge === badge && item.project_id !== projectId) {
          return { ...item, badge: null };
        }
        return item;
      });
      
      // Then, set the badge on the target project
      newShortlist = newShortlist.map((item) => {
        if (item.project_id === projectId) {
          return { ...item, badge };
        }
        return item;
      });
      
      localStorage.setItem(GUEST_SHORTLIST_KEY, JSON.stringify(newShortlist));
      return newShortlist;
    });
  }, []);

  const getBadge = useCallback((projectId: string): 'top1' | 'top2' | 'top3' | null => {
    const item = shortlist.find((s) => s.project_id === projectId);
    return item?.badge || null;
  }, [shortlist]);

  const getTopProjects = useCallback(() => {
    return {
      top1: shortlist.find((s) => s.badge === 'top1')?.project_id || null,
      top2: shortlist.find((s) => s.badge === 'top2')?.project_id || null,
      top3: shortlist.find((s) => s.badge === 'top3')?.project_id || null,
    };
  }, [shortlist]);

  return { 
    shortlist, 
    toggleShortlist, 
    isShortlisted, 
    count: shortlist.length,
    setBadge,
    getBadge,
    getTopProjects,
  };
}
