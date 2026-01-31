import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PodcastSegment } from "@/content/podcast/types";

type BillingInfo = {
  /** Total characters billed by the TTS provider during this prepare cycle. */
  billedCharacters: number;
  /** How many segment responses were served from cache (0 credits). */
  cachedSegments: number;
  totalSegments: number;
};

type PreparedAudio = {
  segments: PodcastSegment[]; // source script (English)
  segmentStartTimes: number[]; // seconds
  duration: number; // seconds
  buffers: AudioBuffer[];
  billing: BillingInfo;
};

type Status = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

// In-memory caches (session-scoped):
// - Audio cache prevents re-decoding/re-downloading in the same session.
// - Captions cache prevents re-translating in the same session.
const audioCache = new Map<string, PreparedAudio>();
const captionsCache = new Map<string, PodcastSegment[]>();

const buildAudioCacheKey = (episodeId: number, segments: PodcastSegment[]) => {
  const textSig = segments.map((s) => `${s.speaker}:${s.text}`).join("\n");
  return `${episodeId}:${hashString(textSig)}`;
};

const buildCaptionsCacheKey = (episodeId: number, captionsLanguage: string, segments: PodcastSegment[]) => {
  const textSig = segments.map((s) => `${s.speaker}:${s.text}`).join("\n");
  return `${episodeId}:${captionsLanguage}:${hashString(textSig)}`;
};

function hashString(input: string) {
  // Small non-crypto hash for cache keys.
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

async function translateSegments(segments: PodcastSegment[], targetLang: string, signal?: AbortSignal) {
  if (!targetLang || targetLang === "en") return segments;

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-translate`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      texts: segments.map((s) => s.text),
      targetLang,
    }),
  });

  const data = (await res.json().catch(() => null)) as null | { translations?: string[]; error?: string };
  if (!res.ok) {
    // Fallback to English text if translation fails.
    return segments;
  }

  const translations = Array.isArray(data?.translations) ? data!.translations! : null;
  if (!translations || translations.length !== segments.length) return segments;

  return segments.map((s, i) => ({ ...s, text: translations[i] || s.text }));
}

async function fetchTtsSegmentAudio(params: {
  speaker: PodcastSegment["speaker"];
  text: string;
  episodeId: number;
  segmentIndex: number;
  /** Audio language for caching on the backend. Keep this stable to avoid generating new audio per UI language. */
  audioLanguage: string;
  /** If true, backend will ONLY serve cached audio and will never generate new audio (protects credits). */
  requireCache?: boolean;
  signal?: AbortSignal;
}) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-podcast-segment-tts`, {
    method: "POST",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      speaker: params.speaker,
      text: params.text,
      episode_id: params.episodeId,
      segment_index: params.segmentIndex,
      language: params.audioLanguage,
      require_cache: params.requireCache ?? true,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({} as any));
    throw new Error((data as any)?.error || "Failed to generate audio");
  }

  if (!res.ok) {
    throw new Error(`Audio request failed (${res.status})`);
  }

  // Check if this was served from cache (no credits used)
  const wasCached = res.headers.get("x-jbj-cached") === "true";
  const charactersBilled = Number(res.headers.get("x-jbj-characters") || 0) || 0;
  const buffer = await res.arrayBuffer();
  
  return { buffer, wasCached, charactersBilled };
}

export function usePodcastPlayback(params: {
  episodeId: number;
  segments: PodcastSegment[] | undefined;
  language: string;
  playbackRate: number;
  volume: number; // 0-1
  muted: boolean;
}) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<{ current: number; total: number } | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [caption, setCaption] = useState<string>("");
  const [captionSpeaker, setCaptionSpeaker] = useState<PodcastSegment["speaker"] | null>(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  // Playback clock mapping
  const playbackRef = useRef<{
    // Context time at which episode playback started
    startContextTime: number;
    // Episode offset (seconds) at that moment
    startOffset: number;
  } | null>(null);

  const preparedRef = useRef<PreparedAudio | null>(null);
  const captionsRef = useRef<PodcastSegment[] | null>(null);
  const pausedAtRef = useRef(0);

  const canPlay = Boolean(params.segments?.length);

  const stopInternal = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    sourcesRef.current = [];

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.connect(audioCtxRef.current.destination);
    }
    return audioCtxRef.current;
  }, []);

  const applyVolume = useCallback(() => {
    if (!gainRef.current) return;
    gainRef.current.gain.value = params.muted ? 0 : Math.max(0, Math.min(1, params.volume));
  }, [params.muted, params.volume]);

  useEffect(() => {
    applyVolume();
  }, [applyVolume]);

  const prepare = useCallback(async () => {
    if (!params.segments?.length) {
      setError("This episode does not have a script yet.");
      setStatus("error");
      return null;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // If we've already prepared this episode+script in this session, do NOT show any
    // "generating" state; it's already cached locally.
    const audioKey = buildAudioCacheKey(params.episodeId, params.segments);
    const cachedAudio = audioCache.get(audioKey);

    if (cachedAudio) {
      preparedRef.current = cachedAudio;
      captionsRef.current = params.segments;

      setDuration(cachedAudio.duration);
      setCaption((captionsRef.current?.[0]?.text ?? "") || "");
      setCaptionSpeaker(cachedAudio.segments[0]?.speaker ?? null);
      setBilling(cachedAudio.billing);
      setSegmentIndex(0);
      setCurrentTime(0);
      pausedAtRef.current = 0;
      setError(null);
      setStatus("ready");

      // Translate captions in background (UI-only, no credit impact).
      if (params.language && params.language !== "en") {
        const captionsKey = buildCaptionsCacheKey(params.episodeId, params.language, params.segments);
        const cachedCaptions = captionsCache.get(captionsKey);

        if (cachedCaptions) {
          captionsRef.current = cachedCaptions;
          setCaption(cachedCaptions[0]?.text || "");
        } else {
          translateSegments(params.segments, params.language, abort.signal)
            .then((translated) => {
              captionsCache.set(captionsKey, translated);
              captionsRef.current = translated;
              setCaption(translated[0]?.text || "");
            })
            .catch(() => {
              // keep English
            });
        }
      }

      return cachedAudio;
    }

    setStatus("loading");
    setError(null);
    setLoadingStep({ current: 0, total: params.segments.length });

    try {
      const ctx = ensureAudioContext();
      // Note: unlocking the AudioContext must happen immediately on user gesture.
      // We still try here as a best-effort fallback.
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }

      // 1) Prepare audio (always from the original English script)
      let preparedAudio: PreparedAudio;

      if (cachedAudio) {
        preparedAudio = cachedAudio;
      } else {
        // IMPORTANT: load/decode in parallel so Play starts quickly.
        let completed = 0;
        const results = await Promise.all(
          params.segments.map(async (seg, i) => {
            const res = await fetchTtsSegmentAudio({
              speaker: seg.speaker,
              text: seg.text,
              episodeId: params.episodeId,
              segmentIndex: i,
              // Keep audio generation language stable to avoid consuming credits when users only switch UI language.
              audioLanguage: "en",
              // IMPORTANT: we NEVER generate new audio from the client. If a segment isn't cached,
              // playback should fail rather than consuming credits.
              requireCache: true,
              signal: abort.signal,
            });

            // decodeAudioData may detach the buffer; pass a copy.
            const decoded = await ctx.decodeAudioData(res.buffer.slice(0));

            completed += 1;
            setLoadingStep({ current: completed, total: params.segments.length });

            return {
              index: i,
              decoded,
              wasCached: res.wasCached,
              charactersBilled: res.charactersBilled,
            };
          }),
        );

        const ordered = results
          .slice()
          .sort((a, b) => a.index - b.index);

        const buffers: AudioBuffer[] = ordered.map((r) => r.decoded);
        const billedCharacters = ordered.reduce((sum, r) => sum + (r.charactersBilled || 0), 0);
        const cachedSegments = ordered.filter((r) => r.wasCached).length;

        const segmentStartTimes: number[] = [];
        let t = 0;
        for (const b of buffers) {
          segmentStartTimes.push(t);
          t += b.duration;
        }

        preparedAudio = {
          segments: params.segments,
          segmentStartTimes,
          duration: t,
          buffers,
          billing: {
            billedCharacters,
            cachedSegments,
            totalSegments: params.segments.length,
          },
        };

        audioCache.set(audioKey, preparedAudio);
      }

      // Ensure billing exists even for cache hits.
      if (!preparedAudio.billing) {
        preparedAudio = {
          ...preparedAudio,
          billing: {
            billedCharacters: 0,
            cachedSegments: preparedAudio.buffers.length,
            totalSegments: preparedAudio.buffers.length,
          },
        };
        audioCache.set(audioKey, preparedAudio);
      }

      // 2) Captions: don't block audio playback. Start with English immediately.
      captionsRef.current = params.segments;
      preparedRef.current = preparedAudio;

      setDuration(preparedAudio.duration);
      setCaption(params.segments[0]?.text || "");
      setCaptionSpeaker(params.segments[0]?.speaker ?? null);
      setBilling(preparedAudio.billing);
      setSegmentIndex(0);
      setStatus("ready");

      // Translate captions in background (UI-only, no credit impact).
      if (params.language && params.language !== "en") {
        const captionsKey = buildCaptionsCacheKey(params.episodeId, params.language, params.segments);
        const cachedCaptions = captionsCache.get(captionsKey);

        if (cachedCaptions) {
          captionsRef.current = cachedCaptions;
          setCaption(cachedCaptions[0]?.text || "");
        } else {
          translateSegments(params.segments, params.language, abort.signal)
            .then((translated) => {
              captionsCache.set(captionsKey, translated);
              captionsRef.current = translated;
              setCaption(translated[0]?.text || "");
            })
            .catch(() => {
              // keep English
            });
        }
      }
      return preparedAudio;
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null;
      const msg = e instanceof Error ? e.message : "Failed to prepare audio";
      setError(msg);
      setStatus("error");
      return null;
    } finally {
      setLoadingStep(null);
    }
  }, [ensureAudioContext, params.episodeId, params.language, params.segments]);

  const computeCurrentTime = useCallback(() => {
    const ctx = audioCtxRef.current;
    const p = playbackRef.current;
    const prepared = preparedRef.current;
    if (!ctx || !p || !prepared) return;

    const t = (ctx.currentTime - p.startContextTime) * params.playbackRate + p.startOffset;
    const clamped = Math.max(0, Math.min(prepared.duration, t));
    setCurrentTime(clamped);

    // Update captions by segment.
    let idx = prepared.segmentStartTimes.length - 1;
    for (let i = 0; i < prepared.segmentStartTimes.length; i++) {
      const start = prepared.segmentStartTimes[i];
      const end = start + (prepared.buffers[i]?.duration ?? 0);
      if (clamped >= start && clamped < end) {
        idx = i;
        break;
      }
    }
    if (idx !== segmentIndex) {
      setSegmentIndex(idx);
      const captionSegments = captionsRef.current ?? prepared.segments;
      setCaption(captionSegments[idx]?.text || "");
      setCaptionSpeaker(prepared.segments[idx]?.speaker ?? null);
    }

    rafRef.current = requestAnimationFrame(computeCurrentTime);
  }, [params.playbackRate, segmentIndex]);

  const startAt = useCallback(
    async (offsetSeconds: number) => {
      const prepared = preparedRef.current ?? (await prepare());
      if (!prepared) return;

      const ctx = ensureAudioContext();
      applyVolume();

      stopInternal();

      // Find starting segment and offset into that buffer.
      let startIdx = 0;
      for (let i = 0; i < prepared.segmentStartTimes.length; i++) {
        const start = prepared.segmentStartTimes[i];
        const end = start + prepared.buffers[i].duration;
        if (offsetSeconds >= start && offsetSeconds < end) {
          startIdx = i;
          break;
        }
      }

      const baseStartTime = ctx.currentTime + 0.15;
      playbackRef.current = {
        startContextTime: baseStartTime,
        startOffset: offsetSeconds,
      };

      const sources: AudioBufferSourceNode[] = [];
      let scheduleAt = baseStartTime;
      let firstOffset = offsetSeconds - prepared.segmentStartTimes[startIdx];
      if (!Number.isFinite(firstOffset) || firstOffset < 0) firstOffset = 0;

      for (let i = startIdx; i < prepared.buffers.length; i++) {
        const source = ctx.createBufferSource();
        source.buffer = prepared.buffers[i];
        source.playbackRate.value = params.playbackRate;
        source.connect(gainRef.current!);

        const offset = i === startIdx ? firstOffset : 0;
        const remaining = source.buffer.duration - offset;
        source.start(scheduleAt, offset);
        scheduleAt += remaining / params.playbackRate;

        sources.push(source);
      }

      // When the last source ends, mark as finished.
      sources[sources.length - 1]?.addEventListener("ended", () => {
        // Only if we didn't start a new playback.
        setStatus((s) => (s === "playing" ? "paused" : s));
      });

      sourcesRef.current = sources;
      setStatus("playing");
      rafRef.current = requestAnimationFrame(computeCurrentTime);
    },
    [applyVolume, computeCurrentTime, ensureAudioContext, params.playbackRate, prepare, stopInternal],
  );

  const play = useCallback(async () => {
    pausedAtRef.current = Math.max(0, pausedAtRef.current);
    await startAt(pausedAtRef.current);
  }, [startAt]);

  const pause = useCallback(() => {
    // Snapshot current time and stop sources.
    pausedAtRef.current = currentTime;
    stopInternal();
    setStatus("paused");
  }, [currentTime, stopInternal]);

  const toggle = useCallback(async () => {
    if (!canPlay) return;

    // IMPORTANT: Unlock audio on the user gesture (Safari/iOS requirement).
    // Do not await here; awaiting can break the gesture context.
    const ctx = ensureAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    if (status === "playing") {
      pause();
      return;
    }

    // Always ensure we are prepared before playing.
    if (!preparedRef.current) {
      await prepare();
    }

    await play();
  }, [canPlay, pause, play, prepare, status]);

  const seek = useCallback(
    async (targetSeconds: number) => {
      const prepared = preparedRef.current;
      if (!prepared) {
        pausedAtRef.current = targetSeconds;
        setCurrentTime(targetSeconds);
        return;
      }
      const clamped = Math.max(0, Math.min(prepared.duration, targetSeconds));
      pausedAtRef.current = clamped;
      setCurrentTime(clamped);

      if (status === "playing") {
        await startAt(clamped);
      }
    },
    [startAt, status],
  );

  // Reset when episode/language changes.
  useEffect(() => {
    pausedAtRef.current = 0;
    playbackRef.current = null;
    preparedRef.current = null;
    captionsRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setCaption("");
    setCaptionSpeaker(null);
    setSegmentIndex(0);
    setBilling(null);
    setError(null);
    setStatus("idle");
    stopInternal();
    abortRef.current?.abort();
  }, [params.episodeId, stopInternal]);

  // Update captions when UI language changes (no audio regeneration).
  useEffect(() => {
    if (!params.segments?.length) return;
    if (!preparedRef.current) return;

    const captionsKey = buildCaptionsCacheKey(params.episodeId, params.language, params.segments);
    const cached = captionsCache.get(captionsKey);
    if (cached) {
      captionsRef.current = cached;
      setCaption(cached[segmentIndex]?.text || "");
      return;
    }

    const abort = new AbortController();
    translateSegments(params.segments, params.language, abort.signal)
      .then((translated) => {
        captionsCache.set(captionsKey, translated);
        captionsRef.current = translated;
        setCaption(translated[segmentIndex]?.text || "");
      })
      .catch(() => {
        // keep previous captions
      });

    return () => abort.abort();
  }, [params.episodeId, params.language, params.segments, segmentIndex]);

  // If playbackRate changes mid-playback, restart from current time for accurate clocking.
  useEffect(() => {
    if (status !== "playing") return;
    startAt(currentTime).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.playbackRate]);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return {
    status,
    error,
    loadingStep,
    billing,
    duration,
    currentTime,
    progress,
    caption,
    captionSpeaker,
    segmentIndex,
    canPlay,
    prepare,
    play,
    pause,
    toggle,
    seek,
  };
}
