# Goal

Bring the site to Hermès / Versace level multilingual quality: when the user picks a language, **every visible word changes** — navigation, headings, body copy, project names, descriptions, area guides, news, services, alt text, page titles, role labels, even Jane's name (transliterated). Only emails and numbers stay Latin. The brand wordmark "JBJ GLOBAL REAL ESTATE" stays Latin (registered mark); taglines and titles around it transliterate.

The current system covers ~3% of the app (55 of 1,657 files use `t()`). The 1,253-key dictionaries cover nav and CTAs only. The rest is hardcoded English JSX, plus thousands of rows of database content (projects, areas, news, services) that have no translation columns.

We solve this with an **automatic AI translation engine** plus a thin client wrapper, so every English string — present and future — is translated on first view, cached forever, and instant for everyone after that. No per-string manual entry required.

---

# Architecture

```text
                ┌──────────────────────────────────┐
   English ──►  │ <T> / useT() React primitive     │
   string       │ — sees current language          │
                │ — checks local cache             │
                └────────┬─────────────────────────┘
                         │ miss
                         ▼
                ┌──────────────────────────────────┐
                │ translate-batch edge function    │
                │ — batches 50 strings / 200ms     │
                │ — checks translations_cache (DB) │
                │ — calls Lovable AI for misses    │
                │ — writes back to cache           │
                └────────┬─────────────────────────┘
                         │
                         ▼
                ┌──────────────────────────────────┐
                │ translations_cache               │
                │ (source_hash, lang) → translated │
                │ shared across all users          │
                └──────────────────────────────────┘
```

First user to view "Discover Dubai's most exceptional residences" in Arabic triggers one AI call. Every user after that gets the cached Arabic instantly. Same model handles project descriptions, news bodies, area guides — anything pulled from the database.

---

# Plan

### 1. Database — translation cache and content table extensions
- New table `translations_cache(source_hash text, source_text text, target_lang text, translated_text text, domain text, created_at)` — primary key `(source_hash, target_lang)`. Public read, service-role write. Domain tags ("ui", "project.description", "news.body", "area.guide", etc.) for cache hygiene.
- New table `content_translations(table_name, row_id, field, lang, translated_text)` for long-form DB content (project descriptions, news articles, area guides, services). Lets us pre-warm and override AI output where curation matters.
- Optional override columns aren't added to source tables; we keep all locale data in `content_translations` to avoid touching 50+ existing tables.

### 2. Edge function `translate-batch`
- POST `{ strings: string[], targetLang, domain }` → `{ translations: string[] }`.
- Steps: hash each input, look up `translations_cache`, send misses to Lovable AI (`google/gemini-3-flash-preview`) with a luxury-brand system prompt ("You are translating for a Hermès-level real-estate maison. Preserve proper nouns 'JBJ GLOBAL REAL ESTATE'. Transliterate personal names. Keep numbers/emails verbatim. Match register: refined, concise, never marketing-y."), insert results back, return ordered array.
- Built-in batching, dedupe inside the request, 30s timeout, 429/402 surfacing.

### 3. Frontend i18n primitive
- New `useT()` hook in `src/contexts/LanguageContext.tsx` that:
  - returns English unchanged when `language === 'en'`
  - checks an in-memory + IndexedDB cache
  - on miss, queues the string for the next debounced batch call (50 strings / 200 ms window) and returns English while loading; updates on resolve via React state.
- New `<T>` component: `<T>Welcome to JBJ Global Real Estate</T>` — sugar over `useT()`. Children must be a static string literal; we'll wire a Babel/SWC ergonomic later if needed.
- New `<TR field="description" row={project} />` for DB content — looks up `content_translations` first, falls back to AI translation of the source field.
- All existing `t('key')` calls keep working (existing static dictionaries still take priority over AI).

### 4. Codemod sweep — wrap hardcoded strings
- Script (`scripts/i18n-wrap.ts`) walks `src/pages` and `src/components`, finds JSX text nodes and string-literal `title`/`alt`/`placeholder`/`aria-label` props, and wraps them in `<T>…</T>` / `useT()`. Skips: code-fence content, regex literals, route paths, env vars, file under `src/integrations`, `src/config`, brand-locked strings (`JBJ GLOBAL REAL ESTATE`, email addresses, phone numbers, currency codes).
- Run in passes by directory so diffs stay reviewable. Target ~1,200 files; expect 8–15k wraps.

### 5. Database content rendering
- `useTranslatedField(row, fieldName, domain)` hook used by project cards, project detail, news, area guides, services pages, brokers' descriptions, agency about-text, awards, footer copy.
- One-time backfill edge function `backfill-translations` to pre-warm Arabic first (largest target audience), then French, then the remaining 13 in background. Runs in chunks, idempotent.

### 6. Founder identity & brand handling
- Add curated overrides in a new `src/translations/proper-nouns.ts` for: `Jane Bou Jaoude`, `Founder & CEO`, role titles, city names that have official native forms (Dubai → دبي / 迪拜, Abu Dhabi → أبوظبي, etc.). These take priority over AI output.
- "JBJ GLOBAL REAL ESTATE" wordmark is hard-locked in the AI system prompt and override list — never translated, only its surrounding tagline is.
- Emails, phone numbers, prices, "AED", ISO dates — passed through verbatim.

### 7. RTL polish
- The `dir="rtl"` switch already happens. Audit Tailwind logical properties (`ms-*`/`me-*` over `ml-*`/`mr-*`) on top-level layout files: `Header`, `HorizontalUtilityBar`, `GlobalVerticalNav`, `Footer`, hero sections, property cards. Fix the worst offenders this pass; rest in subsequent.

### 8. Language switcher upgrade
- Existing switcher stays; add a small "Translating…" indicator while the batch endpoint is in flight on first language switch (subsequent visits are instant from cache).

---

# Rollout

1. **Migration + edge function + `useT`/`<T>` primitives + cache**. Site still 97% English but the engine is live.
2. **Wrap pass A**: top-of-funnel pages — Home, Properties listing, Property detail, Services landing, About, Contact, Footer, Header, navigation menus. Highest visibility.
3. **DB content wiring**: project cards/details, news, area guides, services. Triggers AI backfill for Arabic + French in the background.
4. **Wrap pass B**: remaining public pages, dashboards, owner panels, CRM, forms.
5. **Pre-warm script** kicked off for the remaining 13 languages.
6. **RTL audit + polish** on key layouts.

Step 1 ships behind the same language picker the user already uses — switching to Arabic immediately starts translating the wrapped pages. Each subsequent step extends coverage; nothing regresses.

---

# Files added / changed (high level)

- **New**: `supabase/functions/translate-batch/index.ts`, `supabase/functions/backfill-translations/index.ts`
- **New**: `src/translations/proper-nouns.ts`, `src/i18n/translateClient.ts`, `src/i18n/T.tsx`, `src/i18n/useTranslatedField.ts`
- **New**: `scripts/i18n-wrap.ts` (one-off codemod)
- **Edited**: `src/contexts/LanguageContext.tsx` (adds `useT`, batching, IDB cache)
- **Edited (wrap pass A)**: ~80 files in `src/pages` + `src/components/layout` + `src/components/navigation` + `src/components/home` + `src/components/properties`
- **Migration**: `translations_cache`, `content_translations` tables + RLS

# Notes

- This is a multi-step build. After step 1 the engine works end-to-end on whichever pages we've wrapped; coverage grows with each subsequent pass. I'll keep going until everything visible is translated — you don't have to ask again between passes.
- Cost: AI translation runs once per (string × language) and is cached forever. A few thousand strings × 15 languages is a few dollars total, then near-zero.
- "Don't remove anything" rule respected — this is purely additive.
