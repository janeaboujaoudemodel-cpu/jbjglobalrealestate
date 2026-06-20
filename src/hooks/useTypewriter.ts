import { useEffect, useState } from "react";

/**
 * useTypewriter — true letter-by-letter type/erase loop.
 *
 * Cycles through `phrases`, typing one character at a time then
 * deleting one character at a time. Pauses at the end of each
 * full phrase and at the empty state between phrases.
 *
 * Pass `paused: true` to freeze the animation (e.g. while the user is
 * typing into the input). When paused, the current text is held
 * unchanged. When paused → unpaused, the animation resumes.
 *
 * Used for the hero search placeholder and the "Stay in the Loop"
 * email field so the animation feels like a real person typing.
 */
export function useTypewriter(
  phrases: string[],
  opts: {
    typeMs?: number;
    eraseMs?: number;
    pauseEndMs?: number;
    pauseStartMs?: number;
    paused?: boolean;
  } = {},
): string {
  const {
    typeMs = 55,
    eraseMs = 32,
    pauseEndMs = 1500,
    pauseStartMs = 350,
    paused = false,
  } = opts;
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (!phrases || phrases.length === 0) return;
    const phrase = phrases[idx % phrases.length];

    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), pauseEndMs);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      const t = setTimeout(() => {
        setDeleting(false);
        setIdx((i) => (i + 1) % phrases.length);
      }, pauseStartMs);
      return () => clearTimeout(t);
    }

    const next = deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1);
    const delay = deleting ? eraseMs : typeMs;
    const t = setTimeout(() => setText(next), delay);
    return () => clearTimeout(t);
  }, [text, deleting, idx, phrases, typeMs, eraseMs, pauseEndMs, pauseStartMs, paused]);

  return text;
}

export default useTypewriter;
