import { useEffect, useState } from "react";

/**
 * Returns the density bucket that CSS is actually rendering, without reading
 * window.innerWidth during render and without rerendering on every resize
 * pixel. Only a breakpoint crossing (639/899/1199) produces a state change, so
 * the 48 memoized developer cards stay put while the window is dragged.
 *
 * Buckets mirror `.jj-dev-grid` in index.css exactly:
 *   <640px  -> 1 column
 *   <900px  -> min(requested, 2)
 *   <1200px -> min(requested, 4)
 *   >=1200  -> requested (capped at 8)
 */
const QUERIES = ["(max-width: 639px)", "(max-width: 899px)", "(max-width: 1199px)"] as const;

function readBucket(): 0 | 1 | 2 | 3 {
  if (typeof window === "undefined" || !window.matchMedia) return 3;
  if (window.matchMedia(QUERIES[0]).matches) return 0;
  if (window.matchMedia(QUERIES[1]).matches) return 1;
  if (window.matchMedia(QUERIES[2]).matches) return 2;
  return 3;
}

export function useEffectiveColumns(requested: number): number {
  const [bucket, setBucket] = useState<0 | 1 | 2 | 3>(readBucket);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mqls = QUERIES.map((q) => window.matchMedia(q));
    const onChange = () => setBucket(readBucket());
    mqls.forEach((m) => m.addEventListener("change", onChange));
    onChange();
    return () => mqls.forEach((m) => m.removeEventListener("change", onChange));
  }, []);

  const capped = Math.min(Math.max(1, requested), 8);
  if (bucket === 0) return 1;
  if (bucket === 1) return Math.min(2, capped);
  if (bucket === 2) return Math.min(4, capped);
  return capped;
}

export default useEffectiveColumns;
