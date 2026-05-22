import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const PAGE_KEY = '__page__';
export const HIDE_AI_KEY = '__hide_ai__';
export const brokerKey = (id: string) => `broker:${id}`;

export interface TeamVisibilityMap {
  // member_id -> is_visible
  [k: string]: boolean;
}

export function useTeamVisibility() {
  const [map, setMap] = useState<TeamVisibilityMap>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_visibility')
      .select('member_id, is_visible');
    if (!error && data) {
      const next: TeamVisibilityMap = {};
      for (const row of data) next[row.member_id] = row.is_visible;
      setMap(next);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setVisibility = useCallback(async (memberId: string, isVisible: boolean) => {
    // optimistic
    setMap((prev) => ({ ...prev, [memberId]: isVisible }));
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('team_visibility')
      .upsert(
        { member_id: memberId, is_visible: isVisible, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'member_id' }
      );
    if (error) {
      // revert on error
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
     * (visible flag for "AI personas as a group")
     */
    isAiHidden,
    setVisibility,
    refresh: load,
  };
}
