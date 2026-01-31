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

// In-memory cache (session-scoped): prevents re-decoding/re-downloading in the same session.
const audioCache = new Map<string, PreparedAudio>();

const buildAudioCacheKey = (episodeId: number, audioLanguage: string, segments: PodcastSegment[]) => {
  const textSig = segments.map((s) => `${s.speaker}:${s.text}`).join("\n");
  return `${episodeId}:${audioLanguage}:${hashString(textSig)}`;
};

function hashString(input: string) {
  // Small non-crypto hash for cache keys.
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function findSegmentIndexAtTime(prepared: PreparedAudio, tSeconds: number) {
  // Binary search for the last segmentStartTime <= tSeconds.
  const starts = prepared.segmentStartTimes;
  if (!starts.length) return 0;
  if (tSeconds <= 0) return 0;

  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const start = starts[mid];
    const nextStart = mid + 1 < starts.length ? starts[mid + 1] : Number.POSITIVE_INFINITY;
    if (tSeconds >= start && tSeconds < nextStart) return mid;
    if (tSeconds < start) hi = mid - 1;
    else lo = mid + 1;
  }
  return Math.max(0, Math.min(starts.length - 1, lo - 1));
}

// translateSegments is no longer used because captions are delivered via the per-language audio.

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

  const segmentIndexRef = useRef(0);

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

  const updateCaptionForTime = useCallback((tSeconds: number) => {
    const prepared = preparedRef.current;
    if (!prepared) return;

    const idx = findSegmentIndexAtTime(prepared, tSeconds);
    if (idx !== segmentIndexRef.current) {
      segmentIndexRef.current = idx;
      setSegmentIndex(idx);
    }

    const captionSegments = captionsRef.current ?? prepared.segments;
    setCaption(captionSegments[idx]?.text || "");
    setCaptionSpeaker(prepared.segments[idx]?.speaker ?? null);
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

    // Decide audio language – for now, per-language audio is generated once and cached,
    // so we key on the UI language. English is the default fallback.
    const audioLang = params.language || "en";
    const audioKey = buildAudioCacheKey(params.episodeId, audioLang, params.segments);
    const cachedAudio = audioCache.get(audioKey);

    if (cachedAudio) {
      preparedRef.current = cachedAudio;
      captionsRef.current = params.segments;

      setDuration(cachedAudio.duration);
      setCaption((captionsRef.current?.[0]?.text ?? "") || "");
      setCaptionSpeaker(cachedAudio.segments[0]?.speaker ?? null);
      setBilling(cachedAudio.billing);
      setSegmentIndex(0);
      segmentIndexRef.current = 0;
      setCurrentTime(0);
      pausedAtRef.current = 0;
      setError(null);
      setStatus("ready");

      // Captions: use the same language as the audio (already translated when TTS generated).
      // If captions are separate from audio language in future, add translateSegments here.

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

      // 1) Fetch audio – try the requested language first (cache-only). If it's not
      //    cached yet, fall back to English (also cache-only). Generating new audio
      //    is NOT allowed from the client to protect credits.
      let preparedAudio: PreparedAudio;

      const fetchSegmentsForLanguage = async (lang: string) => {
        let completed = 0;
        const results = await Promise.all(
          params.segments.map(async (seg, i) => {
            const res = await fetchTtsSegmentAudio({
              speaker: seg.speaker,
              text: seg.text,
              episodeId: params.episodeId,
              segmentIndex: i,
              audioLanguage: lang,
              requireCache: true,
              signal: abort.signal,
            });

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
        return results;
      };

      let results: Awaited<ReturnType<typeof fetchSegmentsForLanguage>>;
      try {
        results = await fetchSegmentsForLanguage(audioLang);
      } catch (err) {
        // If the requested language audio isn't cached, fall back to English.
        if (audioLang !== "en") {
          console.info(`Audio not cached for ${audioLang}, falling back to English`);
          results = await fetchSegmentsForLanguage("en");
        } else {
          throw err;
        }
      }

      const ordered = results.slice().sort((a, b) => a.index - b.index);

      const buffers: AudioBuffer[] = ordered.map((r) => r.decoded);
      const billedCharacters = ordered.reduce((sum, r) => sum + (r.charactersBilled || 0), 0);
      const cachedSegmentsCount = ordered.filter((r) => r.wasCached).length;

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
          cachedSegments: cachedSegmentsCount,
          totalSegments: params.segments.length,
        },
      };

      audioCache.set(audioKey, preparedAudio);

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
      segmentIndexRef.current = 0;
      setStatus("ready");

      // Captions are now implicitly in the audio's language, so we skip extra translation.
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

    updateCaptionForTime(clamped);

    rafRef.current = requestAnimationFrame(computeCurrentTime);
  }, [params.playbackRate, updateCaptionForTime]);

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

      // Keep scheduling delay tiny to improve caption/progress sync.
      const baseStartTime = ctx.currentTime + 0.02;
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
      pausedAtRef.current = offsetSeconds;
      setCurrentTime(offsetSeconds);
      updateCaptionForTime(offsetSeconds);
      setStatus("playing");
      rafRef.current = requestAnimationFrame(computeCurrentTime);
    },
    [applyVolume, computeCurrentTime, ensureAudioContext, params.playbackRate, prepare, stopInternal, updateCaptionForTime],
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

    // Avoid starting multiple prepares/plays on double-taps.
    if (status === "loading") return;

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

    const prepared = preparedRef.current ?? (await prepare());
    if (!prepared) return;
    await startAt(pausedAtRef.current);
  }, [canPlay, ensureAudioContext, pause, prepare, startAt, status]);

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

      // Ensure captions update even while paused/scrubbing.
      updateCaptionForTime(clamped);

      if (status === "playing") {
        await startAt(clamped);
      }
    },
    [startAt, status, updateCaptionForTime],
  );

  // Reset when episode OR language changes (so we re-fetch the correct cached audio).
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
    segmentIndexRef.current = 0;
    setBilling(null);
    setError(null);
    setStatus("idle");
    stopInternal();
    abortRef.current?.abort();
  }, [params.episodeId, params.language, stopInternal]);

  // Captions are now tied to audio language – no separate translation effect needed.

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
