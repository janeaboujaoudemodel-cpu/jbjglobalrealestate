import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/backend";
type MusicType = "intro" | "outro" | "background";

const musicCache = new Map<MusicType, AudioBuffer>();

async function fetchPodcastMusic(type: MusicType, ctx: AudioContext, signal?: AbortSignal): Promise<AudioBuffer> {
  const cached = musicCache.get(type);
  if (cached) return cached;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-podcast-music`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ type }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to load ${type} music: ${errText}`);
  }

  const buffer = await res.arrayBuffer();
  const decoded = await ctx.decodeAudioData(buffer.slice(0));
  musicCache.set(type, decoded);
  return decoded;
}

export type PodcastMusicController = {
  playIntro: () => Promise<void>;
  playOutro: () => Promise<void>;
  startBackground: () => Promise<void>;
  stopBackground: () => void;
  setBackgroundVolume: (vol: number) => void;
  dispose: () => void;
};

/**
 * Creates a controller to manage podcast intro/outro jingles and background music.
 * Background music loops at low volume while content plays.
 */
export function createPodcastMusicController(ctx: AudioContext, masterGain: GainNode): PodcastMusicController {
  let bgSource: AudioBufferSourceNode | null = null;
  let bgGain: GainNode | null = null;
  let disposed = false;

  const playOnce = async (type: MusicType, volume = 1) => {
    if (disposed) return;
    const buf = await fetchPodcastMusic(type, ctx).catch(() => null);
    if (!buf || disposed) return;
    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(masterGain);
    source.start();
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  };

  const playIntro = () => playOnce("intro", 0.85);
  const playOutro = () => playOnce("outro", 0.85);

  const startBackground = async () => {
    if (disposed || bgSource) return;
    const buf = await fetchPodcastMusic("background", ctx).catch(() => null);
    if (!buf || disposed) return;
    bgGain = ctx.createGain();
    bgGain.gain.value = 0.08; // very low volume
    bgSource = ctx.createBufferSource();
    bgSource.buffer = buf;
    bgSource.loop = true;
    bgSource.connect(bgGain).connect(masterGain);
    bgSource.start();
  };

  const stopBackground = () => {
    if (bgSource) {
      try {
        bgSource.stop();
        bgSource.disconnect();
      } catch {
        // ignore
      }
      bgSource = null;
    }
    if (bgGain) {
      try {
        bgGain.disconnect();
      } catch {
        // ignore
      }
      bgGain = null;
    }
  };

  const setBackgroundVolume = (vol: number) => {
    if (bgGain) bgGain.gain.value = Math.max(0, Math.min(1, vol));
  };

  const dispose = () => {
    disposed = true;
    stopBackground();
  };

  return { playIntro, playOutro, startBackground, stopBackground, setBackgroundVolume, dispose };
}
