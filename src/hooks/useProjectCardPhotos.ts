import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listing grids fetch projects WITHOUT their photo rows (payload guard), so
 * cards used to have a single image and therefore no hover arrows.
 *
 * This hook lazily pulls a small slice of the project's real photos the first
 * time the user shows intent (hover / focus / touch) on the card, so the gold
 * hover arrows become available on every listing surface without loading
 * hundreds of images up-front. Photos are never written back to the database —
 * this is a read-only display concern.
 */
const cache = new Map<string, string[]>();
const inflight = new Map<string, Promise<string[]>>();

const MAX_CARD_PHOTOS = 10;

async function fetchPhotos(projectId: string): Promise<string[]> {
  if (cache.has(projectId)) return cache.get(projectId)!;
  if (inflight.has(projectId)) return inflight.get(projectId)!;

  const p = (async () => {
    const { data, error } = await supabase
      .from("project_images")
      .select("image_url, display_order")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true })
      .limit(MAX_CARD_PHOTOS);
    if (error) return [];
    const urls = (data ?? [])
      .map((row: { image_url: string | null }) => row.image_url)
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    cache.set(projectId, urls);
    return urls;
  })();

  inflight.set(projectId, p);
  try {
    return await p;
  } finally {
    inflight.delete(projectId);
  }
}

export function useProjectCardPhotos(projectId: string | undefined, enabled: boolean) {
  const [photos, setPhotos] = useState<string[]>(() =>
    projectId ? cache.get(projectId) ?? [] : [],
  );
  const requested = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    requested.current = false;
    setPhotos(projectId ? cache.get(projectId) ?? [] : []);
  }, [projectId]);

  const prefetch = useCallback(() => {
    if (!enabled || !projectId || requested.current) return;
    requested.current = true;
    void fetchPhotos(projectId).then((urls) => {
      if (alive.current) setPhotos(urls);
    });
  }, [enabled, projectId]);

  return { photos, prefetch };
}
