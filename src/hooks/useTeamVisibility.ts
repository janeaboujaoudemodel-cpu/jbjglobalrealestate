import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const PAGE_KEY = '__page__';
export const HIDE_AI_KEY = '__hide_ai__';
export const brokerKey = (id: string) => `broker:${id}`;

const LS_KEY = 'jbj.team_visibility.v1';

export interface TeamVisibilityMap {
  [k: string]: boolean;
}

function readLocal(): TeamVisibilityMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(map: TeamVisibilityMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function useTeamVisibility() {
  // Seed from localStorage so hidden members stay hidden on first paint after refresh.
  const [map, setMap] = useState<TeamVisibilityMap>(() => readLocal());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_visibility')
      .select('member_id, is_visible');
    if (!error && data) {
      const next: TeamVisibilityMap = {};
      for (const row of data) next[row.member_id] = row.is_visible;
      // DB is the source of truth — overwrite local mirror to stay in sync across sessions/devices.
      setMap(next);
      writeLocal(next);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Cross-tab sync: react to localStorage changes from other tabs.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue);
        if (next && typeof next === 'object') setMap(next);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setVisibility = useCallback(async (memberId: string, isVisible: boolean) => {
    // Optimistic local update + localStorage write so refresh keeps the change immediately.
    setMap((prev) => {
      const next = { ...prev, [memberId]: isVisible };
      writeLocal(next);
      return next;
    });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('team_visibility')
      .upsert(
        { member_id: memberId, is_visible: isVisible, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'member_id' }
      );
    if (error) {
      // Revert in-memory + storage and reload from DB.
      await load();
      throw error;
    }
  }, [load]);

  // Per-member: visible unless explicit false
  const isMemberVisible = (memberId: string) => map[memberId] !== false;
  // Page master: HIDDEN by default — owner must explicitly opt in to publish /team
  const isPageVisible = map[PAGE_KEY] === true;
  const isAiHidden = map[HIDE_AI_KEY] === false;

  return {
    map,
    loaded,
    isMemberVisible,
    isPageVisible,
    /**
     * AI hidden when team_visibility[__hide_ai__].is_visible === false
     */
    isAiHidden,
    setVisibility,
    refresh: load,
  };
}
