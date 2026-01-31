import type { PodcastSegment } from "@/content/podcast/types";

type TranslateResponse = { translations: string[]; error?: string };

/**
 * Translates podcast segment text to the target language using the backend translation function.
 * Falls back to the original text on any error.
 */
export async function translatePodcastSegments(params: {
  segments: PodcastSegment[];
  targetLang: string;
  signal?: AbortSignal;
}): Promise<PodcastSegment[]> {
  if (!params.segments.length) return [];
  if (!params.targetLang || params.targetLang === "en") return params.segments;

  const texts = params.segments.map((s) => s.text);

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-translate`, {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ texts, targetLang: params.targetLang }),
  });

  if (!res.ok) {
    return params.segments;
  }

  const data = (await res.json().catch(() => null)) as TranslateResponse | null;
  const translations = data?.translations;

  if (!Array.isArray(translations) || translations.length !== texts.length) {
    return params.segments;
  }

  return params.segments.map((s, i) => ({ ...s, text: translations[i] || s.text }));
}
