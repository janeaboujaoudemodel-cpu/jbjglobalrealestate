// Client-side translation engine: in-memory + IndexedDB cache, debounced batch
// network calls to the translate-batch edge function. Exposes a single
// `translateClient(text, targetLang, domain)` returning either the cached
// translation synchronously, or a Promise that resolves once the batch lands.

import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/translations';
import { getProperNounOverride, LATIN_LOCKED_STRINGS } from '@/translations/proper-nouns';

const memoryCache = new Map<string, string>(); // key = `${lang}|${text}`
const inFlight = new Map<string, Promise<string>>(); // dedupe concurrent reqs

const IDB_NAME = 'jbj-i18n-cache-v1';
const IDB_STORE = 'translations';

function k(lang: Language, text: string) {
  return `${lang}|${text}`;
}

// ---------- IndexedDB (best-effort, non-blocking) ----------
let idbPromise: Promise<IDBDatabase | null> | null = null;
function openIdb(): Promise<IDBDatabase | null> {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const r = tx.objectStore(IDB_STORE).get(key);
      r.onsuccess = () => resolve((r.result as string) ?? null);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSetMany(entries: [string, string][]): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    for (const [k2, v] of entries) store.put(v, k2);
  } catch {
    /* ignore */
  }
}

// ---------- Heuristics: skip strings that shouldn't be translated ----------
const NUMERIC_ONLY = /^[\s\d.,:;()\-+/%$€£¥]+$/;
const URL_OR_EMAIL = /^(https?:\/\/|www\.|mailto:|[^\s@]+@[^\s@]+\.[^\s@]+)$/i;

export function shouldTranslate(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length === 0) return false;
  if (NUMERIC_ONLY.test(t)) return false;
  if (URL_OR_EMAIL.test(t)) return false;
  if (LATIN_LOCKED_STRINGS.has(t)) return false;
  // Pure single emoji / symbols
  if (/^[\p{Emoji}\s\p{P}\p{S}]+$/u.test(t)) return false;
  return true;
}

// ---------- Batched network calls ----------
type PendingItem = {
  text: string;
  lang: Language;
  domain: string;
  resolve: (s: string) => void;
};
let pending: PendingItem[] = [];
let flushTimer: number | null = null;
const FLUSH_DELAY_MS = 180;
const MAX_BATCH = 80;

const subscribers = new Set<() => void>();
export function subscribeTranslations(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
function notifyAll() {
  for (const cb of subscribers) cb();
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = (setTimeout as unknown as (fn: () => void, ms: number) => number)(
    () => {
      flushTimer = null;
      void flushPending();
    },
    FLUSH_DELAY_MS,
  );
}

async function flushPending() {
  if (pending.length === 0) return;
  // Group by (lang, domain)
  const groups = new Map<string, PendingItem[]>();
  for (const item of pending) {
    const key = `${item.lang}|${item.domain}`;
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  pending = [];

  for (const [groupKey, items] of groups) {
    const [lang, domain] = groupKey.split('|') as [Language, string];
    // Dedupe within group
    const uniqTexts = Array.from(new Set(items.map((i) => i.text)));
    // Chunk
    for (let i = 0; i < uniqTexts.length; i += MAX_BATCH) {
      const chunk = uniqTexts.slice(i, i + MAX_BATCH);
      try {
        const { data, error } = await supabase.functions.invoke('translate-batch', {
          body: { strings: chunk, targetLang: lang, domain },
        });
        if (error) throw error;
        const translations: string[] = data?.translations ?? [];
        const idbEntries: [string, string][] = [];
        for (let j = 0; j < chunk.length; j++) {
          const src = chunk[j];
          const out = translations[j] ?? src;
          memoryCache.set(k(lang, src), out);
          idbEntries.push([k(lang, src), out]);
        }
        void idbSetMany(idbEntries);
        // Resolve all matching pending
        for (const it of items) {
          if (chunk.includes(it.text)) {
            it.resolve(memoryCache.get(k(lang, it.text)) ?? it.text);
          }
        }
      } catch (err) {
        console.error('translate-batch failed', err);
        for (const it of items) it.resolve(it.text); // fallback to source
      }
    }
  }
  notifyAll();
}

// ---------- Public API ----------
/**
 * Returns translation if known synchronously, otherwise fires off an async
 * fetch and returns the source. Subscribe via `subscribeTranslations` to
 * re-render when new translations land.
 */
export function getTranslationSync(
  text: string,
  lang: Language,
  domain: string = 'ui',
): string {
  if (lang === 'en' || !shouldTranslate(text)) return text;

  // Proper-noun override
  const override = getProperNounOverride(text, lang);
  if (override) {
    memoryCache.set(k(lang, text), override);
    return override;
  }

  const cached = memoryCache.get(k(lang, text));
  if (cached) return cached;

  // Try IDB asynchronously; if found, fill cache and notify
  void idbGet(k(lang, text)).then((val) => {
    if (val) {
      memoryCache.set(k(lang, text), val);
      notifyAll();
    } else {
      // Queue network fetch
      queueTranslation(text, lang, domain);
    }
  });

  return text;
}

function queueTranslation(text: string, lang: Language, domain: string) {
  const key = k(lang, text);
  if (memoryCache.has(key)) return;
  if (inFlight.has(key)) return;
  const promise = new Promise<string>((resolve) => {
    pending.push({ text, lang, domain, resolve });
    scheduleFlush();
  });
  inFlight.set(key, promise);
  promise.finally(() => inFlight.delete(key));
}

/** Pre-load translations for a known list of strings (e.g. SSR-style). */
export async function preloadTranslations(
  texts: string[],
  lang: Language,
  domain: string = 'ui',
): Promise<void> {
  if (lang === 'en') return;
  const promises: Promise<unknown>[] = [];
  for (const t of texts) {
    if (!shouldTranslate(t)) continue;
    if (memoryCache.has(k(lang, t))) continue;
    const override = getProperNounOverride(t, lang);
    if (override) {
      memoryCache.set(k(lang, t), override);
      continue;
    }
    promises.push(
      new Promise<void>((resolve) => {
        pending.push({ text: t, lang, domain, resolve: () => resolve() });
        scheduleFlush();
      }),
    );
  }
  await Promise.all(promises);
}

/**
 * Pre-warm the curated chrome dictionary (nav, CTAs, headings) for a language.
 * Single batch round-trip — after this resolves, switching to that language is
 * effectively instant for the static UI surface. Body copy still streams in
 * via the auto-translator as it appears.
 */
let prewarmed = new Set<Language>();
export async function prewarmChromeDictionary(lang: Language): Promise<void> {
  if (lang === 'en') return;
  if (prewarmed.has(lang)) return;
  prewarmed.add(lang);
  try {
    const { en } = await import('@/translations/en');
    const flatten = (obj: any, out: string[] = []): string[] => {
      for (const v of Object.values(obj ?? {})) {
        if (typeof v === 'string') out.push(v);
        else if (v && typeof v === 'object') flatten(v, out);
      }
      return out;
    };
    const strings = Array.from(new Set(flatten(en))).filter(shouldTranslate);
    await preloadTranslations(strings, lang, 'ui');
    notifyAll();
  } catch (e) {
    console.warn('prewarmChromeDictionary failed', e);
    prewarmed.delete(lang); // allow retry
  }
}
