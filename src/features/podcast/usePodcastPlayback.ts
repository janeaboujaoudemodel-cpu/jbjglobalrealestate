import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PodcastSegment, PodcastSpeaker } from "@/content/podcast/types";
import { buildCaptionCues, findCaptionCueAtTime, type CaptionCue } from "@/features/podcast/podcastCaptions";
import { translatePodcastSegments } from "@/features/podcast/podcastTranslate";
import { createPodcastMusicController, type PodcastMusicController } from "@/features/podcast/podcastMusic";

type BillingInfo = {
  /** Total characters billed by the TTS provider during this prepare cycle. */
  billedCharacters: number;
  /** How many segment responses were served from cache (0 credits). */
  cachedSegments: number;
  totalSegments: number;
};

type PreparedAudio = {
  segmentStartTimes: number[]; // seconds
  duration: number; // seconds
  buffers: AudioBuffer[];
  billing: BillingInfo;
  captionCues: CaptionCue[];
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

// Captions are computed as short timed cues (approximate) based on audio segment durations.

class TtsHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TtsHttpError";
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
      // Default to allowing generation when not explicitly in cache-only mode.
      require_cache: params.requireCache ?? false,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({} as any));
    // 409 = cache miss - this is expected and handled by the caller
    throw new TtsHttpError(res.status || 500, (data as any)?.error || "Failed to generate audio");
  }

  if (!res.ok) {
    throw new TtsHttpError(res.status || 500, `Audio request failed (${res.status})`);
  }

  // Check if this was served from cache (no credits used)
  const wasCached = res.headers.get("x-jbj-cached") === "true";
  const charactersBilled = Number(res.headers.get("x-jbj-characters") || 0) || 0;
  const buffer = await res.arrayBuffer();
  
  return { buffer, wasCached, charactersBilled };
}

async function fetchTtsSegmentAudioWithRetry(params: Parameters<typeof fetchTtsSegmentAudio>[0]) {
  // ElevenLabs enforces a concurrency limit; during first-time generation we may briefly hit it.
  // Retry a couple times with a short backoff.
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetchTtsSegmentAudio(params);
    } catch (e) {
      if (params.signal?.aborted) throw e;
      const message = e instanceof Error ? e.message : String(e);
      const isConcurrencyLimit = message.includes("too_many_concurrent_requests") || message.includes("Too many concurrent requests");

      if (!isConcurrencyLimit || attempt === maxAttempts) throw e;
      await sleep(250 * attempt * attempt);
    }
  }
  // Unreachable, but TS wants a return.
  return await fetchTtsSegmentAudio(params);
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
  const musicRef = useRef<PodcastMusicController | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<{ current: number; total: number } | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [caption, setCaption] = useState<string>("");
  const [captionSpeaker, setCaptionSpeaker] = useState<PodcastSegment["speaker"] | null>(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [captionCueIndex, setCaptionCueIndex] = useState(0);

  const segmentIndexRef = useRef(0);

  // Playback clock mapping
  const playbackRef = useRef<{
    // Context time at which episode playback started
    startContextTime: number;
    // Episode offset (seconds) at that moment
    startOffset: number;
  } | null>(null);

  const preparedRef = useRef<PreparedAudio | null>(null);
  const captionCuesRef = useRef<CaptionCue[] | null>(null);
  const pausedAtRef = useRef(0);
  const playTokenRef = useRef(0);
  const captionCueIndexRef = useRef(0);

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

    const cues = captionCuesRef.current ?? prepared.captionCues;
    if (cues.length) {
      const cueIdx = findCaptionCueAtTime(cues, tSeconds);
      if (cueIdx !== captionCueIndexRef.current) {
        captionCueIndexRef.current = cueIdx;
        setCaptionCueIndex(cueIdx);
      }
      const cue = cues[cueIdx];
      setCaption(cue?.text || "");
      setCaptionSpeaker((cue?.speaker as PodcastSpeaker) ?? null);
    } else {
      setCaption("");
      setCaptionSpeaker(null);
    }
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.connect(audioCtxRef.current.destination);
      // Initialize music controller
      musicRef.current = createPodcastMusicController(audioCtxRef.current, gainRef.current);
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
      captionCuesRef.current = cachedAudio.captionCues;

      setDuration(cachedAudio.duration);
      setCaption(cachedAudio.captionCues[0]?.text ?? "");
      setCaptionSpeaker(cachedAudio.captionCues[0]?.speaker ?? null);
      setBilling(cachedAudio.billing);
      setSegmentIndex(0);
      segmentIndexRef.current = 0;
      setCaptionCueIndex(0);
      captionCueIndexRef.current = 0;
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
      //    cached yet, generate it on-demand (then it will be cached for future plays).
      let preparedAudio: PreparedAudio;

      // Translate the script to the selected audio language (server-cached).
      const ttsSegments: PodcastSegment[] = await translatePodcastSegments({
        segments: params.segments,
        targetLang: audioLang,
        signal: abort.signal,
      });

      const fetchSegmentsForLanguage = async (
        lang: string,
        allowGeneration: boolean,
        segs: PodcastSegment[],
      ) => {
        let completed = 0;

        // IMPORTANT: don't use Promise.all here — it rejects fast and leaves the rest of
        // the requests running. When we then fall back (English / generation), we end up
        // with overlapping batches that exceed ElevenLabs' max concurrency.
        const MAX_CONCURRENT_TTS_REQUESTS = 4;

        const results: Array<{
          index: number;
          decoded: AudioBuffer;
          wasCached: boolean;
          charactersBilled: number;
        }> = new Array(params.segments.length);

        let nextIndex = 0;
        let firstError: unknown = null;

        const worker = async () => {
          while (true) {
            if (abort.signal.aborted) throw new DOMException("Aborted", "AbortError");
            if (firstError) return;

            const i = nextIndex;
            nextIndex += 1;
            if (i >= params.segments.length) return;

            const seg = segs[i];

            try {
              const ttsFn = allowGeneration ? fetchTtsSegmentAudioWithRetry : fetchTtsSegmentAudio;
              const res = await ttsFn({
                speaker: seg.speaker,
                text: seg.text,
                episodeId: params.episodeId,
                segmentIndex: i,
                audioLanguage: lang,
                // Only allow generation when explicitly permitted (first-time generation)
                requireCache: !allowGeneration,
                signal: abort.signal,
              });

              const decoded = await ctx.decodeAudioData(res.buffer.slice(0));
              results[i] = {
                index: i,
                decoded,
                wasCached: res.wasCached,
                charactersBilled: res.charactersBilled,
              };

              completed += 1;
              setLoadingStep({ current: completed, total: params.segments.length });
            } catch (e) {
              firstError = e;
              return;
            }
          }
        };

        const workers = Array.from(
          { length: Math.min(MAX_CONCURRENT_TTS_REQUESTS, params.segments.length) },
          () => worker(),
        );

        await Promise.all(workers);
        if (firstError) throw firstError;
        return results;
      };

      let results: Awaited<ReturnType<typeof fetchSegmentsForLanguage>>;
      try {
        // First, try cache-only (fast replays, 0 credits)
        results = await fetchSegmentsForLanguage(audioLang, false, ttsSegments);
      } catch (err) {
        const status = (err as any)?.status;

        // Only treat 409 as a cache miss. Anything else (502, 401, decode errors, etc.) is real.
        if (status !== 409) throw err;

        // Cache miss: generate the selected language on-demand.
        results = await fetchSegmentsForLanguage(audioLang, true, ttsSegments);
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

      const captionCues = buildCaptionCues({
        segmentStartTimes,
        segmentDurations: buffers.map((b) => b.duration),
        segmentTexts: ttsSegments.map((s) => ({ speaker: s.speaker, text: s.text })),
      });

      preparedAudio = {
        segmentStartTimes,
        duration: t,
        buffers,
        billing: {
          billedCharacters,
          cachedSegments: cachedSegmentsCount,
          totalSegments: params.segments.length,
        },
        captionCues,
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

      captionCuesRef.current = preparedAudio.captionCues;
      preparedRef.current = preparedAudio;

      setDuration(preparedAudio.duration);
      setCaption(preparedAudio.captionCues[0]?.text || "");
      setCaptionSpeaker(preparedAudio.captionCues[0]?.speaker ?? null);
      setBilling(preparedAudio.billing);
      setSegmentIndex(0);
      segmentIndexRef.current = 0;
      setCaptionCueIndex(0);
      captionCueIndexRef.current = 0;
      setStatus("ready");

      // Captions are now implicitly in the audio's language, so we skip extra translation.
      return preparedAudio;
    } catch (e) {
      if ((e as any)?.name === "AbortError") return null;
      
      // Don't show 409 "not cached" as an error - it's handled internally
      const status = (e as any)?.status;
      if (status === 409) {
        // This shouldn't normally reach here since we handle 409 in the try/catch above
        // but if it does, don't show it as an error
        console.log("Cache miss occurred, audio should be generating...");
        return null;
      }
      
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

      // Increment playback token so old "ended" events can't override current state.
      const playToken = (playTokenRef.current += 1);

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

      // When the last source ends, mark as finished (only if still the active playback) and play outro.
      sources[sources.length - 1]?.addEventListener("ended", () => {
        if (playTokenRef.current !== playToken) return;
        musicRef.current?.stopBackground();
        musicRef.current?.playOutro().catch(() => undefined);
        setStatus((s) => (s === "playing" ? "paused" : s));
      });

      sourcesRef.current = sources;
      pausedAtRef.current = offsetSeconds;
      setCurrentTime(offsetSeconds);
      updateCaptionForTime(offsetSeconds);
      setStatus("playing");
      rafRef.current = requestAnimationFrame(computeCurrentTime);

      // Start background music (fire and forget, low volume)
      musicRef.current?.startBackground();
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
    musicRef.current?.stopBackground();
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

    // If starting from the beginning, play intro first
    const isFromStart = pausedAtRef.current <= 0.5;
    if (isFromStart) {
      await musicRef.current?.playIntro().catch(() => undefined);
    }

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
    captionCuesRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setCaption("");
    setCaptionSpeaker(null);
    setSegmentIndex(0);
    segmentIndexRef.current = 0;
    setCaptionCueIndex(0);
    captionCueIndexRef.current = 0;
    setBilling(null);
    setError(null);
    setStatus("idle");
    stopInternal();
    musicRef.current?.stopBackground();
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
    captionCueIndex,
    segmentIndex,
    canPlay,
    prepare,
    play,
    pause,
    toggle,
    seek,
  };
}

