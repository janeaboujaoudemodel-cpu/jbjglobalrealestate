import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PodcastSegment } from "@/content/podcast/types";

type PreparedEpisode = {
  language: string;
  segments: PodcastSegment[];
  segmentStartTimes: number[]; // seconds
  duration: number; // seconds
  buffers: AudioBuffer[];
};

type Status = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

// In-memory cache to prevent re-spending TTS credits in the same session.
const episodeCache = new Map<string, PreparedEpisode>();

const buildCacheKey = (episodeId: number, language: string, segments: PodcastSegment[]) => {
  // If the script changes, the key changes.
  const textSig = segments.map((s) => `${s.speaker}:${s.text}`).join("\n");
  return `${episodeId}:${language}:${hashString(textSig)}`;
};

function hashString(input: string) {
  // Small non-crypto hash for cache keys.
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const message = contentType.includes("application/json")
      ? (await res.json().catch(() => ({} as any)))?.error || `Request failed (${res.status})`
      : await res.text().catch(() => `Request failed (${res.status})`);
    throw new Error(typeof message === "string" ? message : `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
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
  language: string;
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
      language: params.language,
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
  const buffer = await res.arrayBuffer();
  
  return { buffer, wasCached };
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
  const [segmentIndex, setSegmentIndex] = useState(0);

  // Playback clock mapping
  const playbackRef = useRef<{
    // Context time at which episode playback started
    startContextTime: number;
    // Episode offset (seconds) at that moment
    startOffset: number;
  } | null>(null);

  const preparedRef = useRef<PreparedEpisode | null>(null);
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

    const cacheKey = buildCacheKey(params.episodeId, params.language, params.segments);
    const cached = episodeCache.get(cacheKey);
    if (cached) {
      preparedRef.current = cached;
      setDuration(cached.duration);
      setStatus("ready");
      return cached;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStatus("loading");
    setError(null);
    setLoadingStep({ current: 0, total: params.segments.length });

    try {
      const ctx = ensureAudioContext();
      // Safari requires resume after user gesture, but we call prepare only on click.
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }

      const translatedSegments = await translateSegments(params.segments, params.language, abort.signal);

      const buffers: AudioBuffer[] = [];
      for (let i = 0; i < translatedSegments.length; i++) {
        setLoadingStep({ current: i + 1, total: translatedSegments.length });
        const { buffer: ab } = await fetchTtsSegmentAudio({
          speaker: translatedSegments[i].speaker,
          text: translatedSegments[i].text,
          episodeId: params.episodeId,
          segmentIndex: i,
          language: params.language,
          signal: abort.signal,
        });
        // decodeAudioData may detach the buffer; pass a copy.
        const decoded = await ctx.decodeAudioData(ab.slice(0));
        buffers.push(decoded);
      }

      const segmentStartTimes: number[] = [];
      let t = 0;
      for (const b of buffers) {
        segmentStartTimes.push(t);
        t += b.duration;
      }

      const prepared: PreparedEpisode = {
        language: params.language,
        segments: translatedSegments,
        segmentStartTimes,
        duration: t,
        buffers,
      };

      episodeCache.set(cacheKey, prepared);
      preparedRef.current = prepared;

      setDuration(prepared.duration);
      setCaption(translatedSegments[0]?.text || "");
      setSegmentIndex(0);
      setStatus("ready");
      return prepared;
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
      setCaption(prepared.segments[idx]?.text || "");
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
    setCurrentTime(0);
    setDuration(0);
    setCaption("");
    setSegmentIndex(0);
    setError(null);
    setStatus("idle");
    stopInternal();
    abortRef.current?.abort();
  }, [params.episodeId, params.language, stopInternal]);

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
    duration,
    currentTime,
    progress,
    caption,
    segmentIndex,
    canPlay,
    prepare,
    play,
    pause,
    toggle,
    seek,
  };
}
