/**
 * Print Blocker Engine
 *
 * Detects @media print rules that hide content (display:none, visibility:hidden,
 * opacity:0, height:0, width:0) and automatically applies counter-overrides so
 * the print/baseline rendering stays clean across regressions.
 *
 * Persists the discovered selector list to localStorage for fast boot, and
 * best-effort logs new selectors to the `print_blocker_log` Supabase table.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PrintBlocker {
  selector: string;
  properties: Record<string, string>;
  source: string; // stylesheet href or "inline"
}

const CACHE_KEY = "jbj_print_blockers_v1";
const SESSION_LOG_KEY = "jbj_print_blockers_logged_v1";
const STYLE_ID = "print-blocker-overrides";

const SUPPRESSING_PROPS: Record<string, (v: string) => boolean> = {
  display: (v) => v.trim().toLowerCase() === "none",
  visibility: (v) => v.trim().toLowerCase() === "hidden",
  opacity: (v) => parseFloat(v) === 0,
  height: (v) => /^0(\.0+)?(px|%|em|rem|vh)?$/i.test(v.trim()),
  width: (v) => /^0(\.0+)?(px|%|em|rem|vw)?$/i.test(v.trim()),
};

/** Cheap stable hash for selector dedup. */
export function hashSelector(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/** Walk all stylesheets and collect content-suppressing @media print rules. */
export function scanPrintBlockers(): PrintBlocker[] {
  const found: PrintBlocker[] = [];
  if (typeof document === "undefined") return found;

  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // CORS-protected stylesheet — skip silently
      continue;
    }
    if (!rules) continue;

    const source =
      (sheet as CSSStyleSheet).href ||
      ((sheet.ownerNode as HTMLElement | null)?.id
        ? `inline#${(sheet.ownerNode as HTMLElement).id}`
        : "inline");

    walkRules(rules, source, false, found);
  }
  return found;
}

function walkRules(
  rules: CSSRuleList,
  source: string,
  insidePrint: boolean,
  out: PrintBlocker[],
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSMediaRule) {
      const mediaText = rule.media.mediaText.toLowerCase();
      const isPrint =
        insidePrint ||
        mediaText === "print" ||
        mediaText.includes("print") ||
        mediaText.includes("only print");
      walkRules(rule.cssRules, source, isPrint, out);
      continue;
    }

    if (rule instanceof CSSSupportsRule) {
      walkRules(rule.cssRules, source, insidePrint, out);
      continue;
    }

    if (!insidePrint) continue;
    if (!(rule instanceof CSSStyleRule)) continue;

    const props: Record<string, string> = {};
    const style = rule.style;
    for (const propName of Object.keys(SUPPRESSING_PROPS)) {
      const v = style.getPropertyValue(propName);
      if (v && SUPPRESSING_PROPS[propName](v)) {
        props[propName] = v.trim();
      }
    }
    if (Object.keys(props).length === 0) continue;

    // Skip our own override sheet
    if (rule.selectorText && rule.selectorText.includes("print-blocker-overrides")) continue;

    out.push({
      selector: rule.selectorText,
      properties: props,
      source,
    });
  }
}

/** Inject (or replace) a single <style> with @media print counter-overrides. */
export function applyPrintOverrides(blockers: PrintBlocker[]): void {
  if (typeof document === "undefined") return;
  if (blockers.length === 0) return;

  const seen = new Set<string>();
  const lines: string[] = [];
  for (const b of blockers) {
    const sel = b.selector?.trim();
    if (!sel) continue;
    if (seen.has(sel)) continue;
    seen.add(sel);
    lines.push(
      `${sel} { display: revert !important; visibility: visible !important; opacity: 1 !important; height: auto !important; width: auto !important; }`,
    );
  }
  if (lines.length === 0) return;

  const css = `@media print {\n${lines.join("\n")}\n}\n` +
    // Also apply when our print-mode flag is on (browser preview baseline)
    `html[data-print-mode="1"] {\n${lines.join("\n")}\n}\n`;

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    el.setAttribute("data-managed-by", "print-blocker-engine");
    document.head.appendChild(el);
  }
  if (el.textContent !== css) {
    el.textContent = css;
  }
}

export function loadCachedBlockers(): PrintBlocker[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PrintBlocker =>
        x && typeof x.selector === "string" && typeof x.properties === "object",
    );
  } catch {
    return [];
  }
}

export function saveCachedBlockers(blockers: PrintBlocker[]): void {
  try {
    // Cap cache size to avoid runaway growth
    const capped = blockers.slice(0, 500);
    localStorage.setItem(CACHE_KEY, JSON.stringify(capped));
  } catch {
    // ignore quota errors
  }
}

/** Merge two blocker arrays keyed by selector+source. */
export function mergeBlockers(
  a: PrintBlocker[],
  b: PrintBlocker[],
): { merged: PrintBlocker[]; added: PrintBlocker[] } {
  const map = new Map<string, PrintBlocker>();
  for (const x of a) map.set(`${x.selector}::${x.source}`, x);
  const added: PrintBlocker[] = [];
  for (const x of b) {
    const k = `${x.selector}::${x.source}`;
    if (!map.has(k)) {
      map.set(k, x);
      added.push(x);
    }
  }
  return { merged: Array.from(map.values()), added };
}

/** Best-effort log to Supabase, deduped per session by selector_hash. */
export async function logBlockersToServer(
  blockers: PrintBlocker[],
  route: string,
): Promise<void> {
  if (blockers.length === 0) return;

  let logged: Set<string>;
  try {
    const raw = sessionStorage.getItem(SESSION_LOG_KEY);
    logged = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    logged = new Set();
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

  const rows = blockers
    .map((b) => {
      const hash = hashSelector(b.selector);
      const sessionKey = `${hash}::${route}`;
      if (logged.has(sessionKey)) return null;
      logged.add(sessionKey);
      return {
        selector: b.selector,
        selector_hash: hash,
        properties: b.properties,
        source: b.source,
        route,
        user_agent: ua,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return;

  try {
    sessionStorage.setItem(SESSION_LOG_KEY, JSON.stringify(Array.from(logged)));
  } catch {
    // ignore
  }

  try {
    // Cast to any — table not yet in generated types
    await (supabase as any).from("print_blocker_log").insert(rows);
  } catch (err) {
    // Best-effort only; never throw
    if (typeof console !== "undefined") {
      console.debug("[print-blocker] log skipped:", err);
    }
  }
}
