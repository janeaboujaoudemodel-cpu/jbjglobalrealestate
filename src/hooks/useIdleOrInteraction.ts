import { useEffect, useState } from "react";

/**
 * Returns false on first paint and flips to true on whichever comes first:
 *  - the browser going idle (requestIdleCallback, hard cap `timeout`)
 *  - the first real user interaction (pointer, key, scroll, touch)
 *
 * Used to keep non-critical global widgets (chat, marketing scripts, command
 * palette, page-nav arrows, tour, prompts) out of the startup script budget
 * without ever making them feel absent: any interaction mounts them
 * immediately, and an idle tick mounts them for users who just read.
 */
export function useIdleOrInteraction(timeout = 2500): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "wheel",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, fire, { passive: true, once: true }));

    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    });
    let idleId: number | undefined;
    let timerId: number | undefined;
    if (ric.requestIdleCallback) {
      idleId = ric.requestIdleCallback(fire, { timeout });
    } else {
      timerId = window.setTimeout(fire, timeout);
    }

    return () => {
      events.forEach((e) => window.removeEventListener(e, fire));
      if (idleId !== undefined) ric.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [ready, timeout]);

  return ready;
}

export default useIdleOrInteraction;
