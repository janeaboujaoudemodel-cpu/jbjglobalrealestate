import { useRef, useCallback } from 'react';

// Singleton AudioContext shared across all sounds
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

// WeakMap prevents Chrome's "already connected" error by tracking
// which HTMLAudioElement instances have already been wrapped
const sourceNodeMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export interface AudioAnalyserResult {
  connectAnalyser: (audioEl: HTMLAudioElement) => AnalyserNode;
  resumeCtx: () => Promise<void>;
}

export function useAudioAnalyser(): AudioAnalyserResult {
  const analyserMap = useRef<Map<HTMLAudioElement, AnalyserNode>>(new Map());

  const resumeCtx = useCallback(async () => {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, []);

  const connectAnalyser = useCallback((audioEl: HTMLAudioElement): AnalyserNode => {
    const ctx = getAudioCtx();

    // Reuse existing analyser for this element if already set up
    const existing = analyserMap.current.get(audioEl);
    if (existing) return existing;

    // Create MediaElementAudioSourceNode only once per element
    let sourceNode = sourceNodeMap.get(audioEl);
    if (!sourceNode) {
      sourceNode = ctx.createMediaElementSource(audioEl);
      sourceNodeMap.set(audioEl, sourceNode);
    }

    // Create analyser with CapCut-style settings
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;                  // 128 frequency bins
    analyser.smoothingTimeConstant = 0.75;   // smooth bar transitions

    // Chain: source → analyser → speakers
    sourceNode.connect(analyser);
    analyser.connect(ctx.destination);

    analyserMap.current.set(audioEl, analyser);
    return analyser;
  }, []);

  return { connectAnalyser, resumeCtx };
}
