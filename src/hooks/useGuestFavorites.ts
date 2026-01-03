import { useState, useEffect, useCallback } from "react";

const GUEST_FAVORITES_KEY = "jj_guest_favorites";
const GUEST_SHORTLIST_KEY = "jj_guest_shortlist";

export interface GuestFavorite {
  project_id: string;
  created_at: string;
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
  const [shortlist, setShortlist] = useState<GuestFavorite[]>([]);

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
      let newShortlist: GuestFavorite[];
      
      if (exists) {
        newShortlist = prev.filter((s) => s.project_id !== projectId);
      } else {
        if (prev.length >= 3) {
          success = false;
          return prev;
        }
        newShortlist = [...prev, { project_id: projectId, created_at: new Date().toISOString() }];
      }
      
      localStorage.setItem(GUEST_SHORTLIST_KEY, JSON.stringify(newShortlist));
      return newShortlist;
    });
    
    return success;
  }, []);

  const isShortlisted = useCallback((projectId: string) => {
    return shortlist.some((s) => s.project_id === projectId);
  }, [shortlist]);

  return { shortlist, toggleShortlist, isShortlisted, count: shortlist.length };
}
