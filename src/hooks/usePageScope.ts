import { useEffect } from "react";

/**
 * usePageScope — declares a page/route scope on <body> as a token in
 * `data-page-scope`.
 *
 * WHY THIS EXISTS (performance):
 * The stylesheet previously detected these scopes with document-subject
 * `:has()` rules, e.g.
 *
 *   html body:has(#root .aihf-root) #root .jj-main-shell { … }
 *
 * When `body` is the subject of `:has()`, Chromium must re-evaluate the
 * selector against the whole document on *every* DOM mutation, because any
 * added/removed node anywhere can flip the match. React mounts a marketing
 * page in hundreds of incremental mutations, so a handful of these rules
 * turned into thousands of full-document style invalidations — the dominant
 * measured cost in the style-recalculation profile.
 *
 * Declaring the scope explicitly on `body` turns those rules into a plain
 * attribute match (`body[data-page-scope~="aihf"]`), which is O(1) per
 * element and invalidates nothing outside the shell it targets.
 *
 * Tokens are reference-counted so overlapping/nested pages and React
 * StrictMode's double-invoked effects cannot clear a scope another mounted
 * component still needs.
 */

const counts = new Map<string, number>();

function sync() {
  if (typeof document === "undefined") return;
  const active = [...counts.entries()]
    .filter(([, n]) => n > 0)
    .map(([token]) => token)
    .sort();
  const body = document.body;
  if (!body) return;
  if (active.length) body.setAttribute("data-page-scope", active.join(" "));
  else body.removeAttribute("data-page-scope");
}

export function usePageScope(token: string | null | undefined): void {
  useEffect(() => {
    if (!token) return;
    counts.set(token, (counts.get(token) ?? 0) + 1);
    sync();
    return () => {
      const next = (counts.get(token) ?? 1) - 1;
      if (next <= 0) counts.delete(token);
      else counts.set(token, next);
      sync();
    };
  }, [token]);
}

export default usePageScope;
