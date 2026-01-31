import type { PodcastSpeaker } from "@/content/podcast/types";

export type CaptionCue = {
  start: number; // seconds
  end: number; // seconds
  speaker: PodcastSpeaker;
  text: string;
};

const splitIntoSentences = (text: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  // Split on sentence-ish boundaries while keeping punctuation in the sentence.
  return cleaned.split(/(?<=[.!?…])\s+/g).filter(Boolean);
};

const chunkWords = (sentence: string, wordsPerChunk = 9) => {
  const words = sentence.split(/\s+/g).filter(Boolean);
  if (words.length <= wordsPerChunk) return [sentence.trim()];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
};

const countWords = (s: string) => s.split(/\s+/g).filter(Boolean).length;

/**
 * Builds short caption cues across the whole episode.
 * Timing is approximated by distributing each segment's duration by word count.
 */
export function buildCaptionCues(params: {
  segmentStartTimes: number[];
  segmentDurations: number[];
  segmentTexts: Array<{ speaker: PodcastSpeaker; text: string }>;
}): CaptionCue[] {
  const cues: CaptionCue[] = [];

  for (let i = 0; i < params.segmentTexts.length; i++) {
    const start = params.segmentStartTimes[i] ?? 0;
    const dur = params.segmentDurations[i] ?? 0;
    const { speaker, text } = params.segmentTexts[i];

    const sentences = splitIntoSentences(text);
    const chunks = sentences.length
      ? sentences.flatMap((s) => chunkWords(s, 9))
      : text
        ? chunkWords(text, 9)
        : [];

    if (!chunks.length || dur <= 0.05) {
      continue;
    }

    const weights = chunks.map((c) => Math.max(1, countWords(c)));
    const weightSum = weights.reduce((a, b) => a + b, 0);

    // Ensure each cue is visible for at least ~700ms; if segment is too short,
    // we still emit at least one cue.
    const minCue = 0.7;
    const maxCues = Math.max(1, Math.floor(dur / minCue));
    const effectiveChunks = chunks.slice(0, Math.max(1, maxCues));
    const effectiveWeights = weights.slice(0, effectiveChunks.length);
    const effSum = effectiveWeights.reduce((a, b) => a + b, 0);

    let t = start;
    for (let j = 0; j < effectiveChunks.length; j++) {
      const share = effectiveWeights[j] / effSum;
      const cueDur = j === effectiveChunks.length - 1 ? start + dur - t : dur * share;
      const end = Math.max(t + 0.15, Math.min(start + dur, t + cueDur));
      cues.push({ start: t, end, speaker, text: effectiveChunks[j] });
      t = end;
      if (t >= start + dur - 0.05) break;
    }
  }

  return cues;
}

export function findCaptionCueAtTime(cues: CaptionCue[], tSeconds: number): number {
  if (!cues.length) return 0;
  if (tSeconds <= cues[0].start) return 0;

  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cue = cues[mid];
    if (tSeconds >= cue.start && tSeconds < cue.end) return mid;
    if (tSeconds < cue.start) hi = mid - 1;
    else lo = mid + 1;
  }
  return Math.max(0, Math.min(cues.length - 1, lo - 1));
}
