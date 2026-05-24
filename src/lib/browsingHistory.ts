/**
 * Browsing history — single source of truth for project view tracking.
 *
 * - Writes the existing `JBJ_BROWSING_HISTORY` localStorage key (also read by
 *   `useHandpickedProjects` and `ContinueSearching`).
 * - When the user is signed in, mirrors the entry to `user_project_views`
 *   (RLS: each user can only read/write their own rows) so history follows
 *   them across devices.
 *
 * Dedupe + cap rules match mem://features/home/browsing-history-deduplication-standard.
 */
import { supabase } from "@/integrations/supabase/client";

export const HISTORY_KEY = "JBJ_BROWSING_HISTORY";
const MAX_ENTRIES = 20;

export interface BrowsingHistoryEntry {
  id?: string;
  slug?: string;
  name?: string;
  developer_name?: string;
  area_name?: string | null;
  cover_image_url?: string | null;
  viewed_at?: number;
}

function readLocal(): BrowsingHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: BrowsingHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota / private mode — silently ignore */
  }
}

export function recordProjectView(entry: BrowsingHistoryEntry) {
  if (!entry?.id && !entry?.slug) return;

  // 1) localStorage — dedupe by slug (fallback id), newest first
  const key = (entry.slug || entry.id || "").toLowerCase();
  const now = Date.now();
  const existing = readLocal().filter((e) => {
    const k = (e.slug || e.id || "").toLowerCase();
    return k && k !== key;
  });
  writeLocal([{ ...entry, viewed_at: now }, ...existing]);

  // 2) Best-effort upsert to user_project_views when signed in
  if (!entry.id || !entry.slug) return;
  void (async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      await supabase
        .from("user_project_views" as any)
        .upsert(
          {
            user_id: uid,
            project_id: entry.id,
            project_slug: entry.slug,
            viewed_at: new Date(now).toISOString(),
          },
          { onConflict: "user_id,project_id" },
        );
    } catch {
      /* offline / RLS — ignore, localStorage is still authoritative */
    }
  })();
}

/* ─────────────────────────── Back-stack for "Return to previous project" ─────────────────────────── */

const STACK_KEY = "JBJ_PROJECT_BACK_STACK";

export interface BackStackEntry {
  slug: string;
  name: string;
}

function readStack(): BackStackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStack(entries: BackStackEntry[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(entries.slice(0, 10)));
  } catch {
    /* ignore */
  }
}

export function pushBackStack(entry: BackStackEntry) {
  if (!entry?.slug) return;
  const stack = readStack();
  // Avoid pushing the same slug twice in a row
  if (stack[0]?.slug === entry.slug) return;
  writeStack([entry, ...stack]);
}

export function peekBackStack(currentSlug?: string | null): BackStackEntry | null {
  const top = readStack()[0];
  if (!top) return null;
  if (currentSlug && top.slug === currentSlug) return null;
  return top;
}

export function popBackStack(): BackStackEntry | null {
  const stack = readStack();
  const [top, ...rest] = stack;
  writeStack(rest);
  return top || null;
}
