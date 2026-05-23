import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Stub audio hook — forward seam for ElevenLabs narration.
 * Returns availability based on the global listen_enabled toggle and per-book voice_enabled.
 * Does NOT call any audio API today.
 */
export function useBookAudio(bookId: string | null, bookVoiceEnabled?: boolean) {
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("broker_learning_settings")
          .select("listen_enabled")
          .limit(1)
          .maybeSingle();
        if (!cancelled) setGlobalEnabled(Boolean(data?.listen_enabled));
      } catch {
        if (!cancelled) setGlobalEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const available = Boolean(globalEnabled && bookVoiceEnabled && bookId);

  return {
    available,
    loading,
    reason: available ? null : ("coming_soon" as const),
    // Future: returns audio URL when ElevenLabs integration is wired.
    play: async (_moduleId?: string) => {
      // No-op stub. ElevenLabs integration to be wired here.
      return null;
    },
    stop: () => {},
    isPlaying: false,
  };
}
