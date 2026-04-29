## Translation Audit — findings

The auto-translator architecture is sound. New pages, components, and DB fields added in the future are picked up automatically by the `MutationObserver` on `<body>` and `<head>` — that requirement is already met. However, a deep pass uncovered six concrete gaps that need to be closed for true 15-language parity.

### What already works
- DOM walker translates every visible text node + `placeholder/title/alt/aria-label`.
- `<head>` observer localizes `<title>`, `<meta description>`, OG and Twitter cards.
- 16 locales registered, RTL handled for `ar/fa/he`.
- IndexedDB + `translations_cache` (Postgres) + in-memory caches dedupe every unique string globally.
- Brand wordmark "JBJ GLOBAL REAL ESTATE" stays Latin; "Jane Bou Jaoude" + "Founder & CEO" have curated transliterations that the AI cannot overwrite.
- Pre-warm fires when user picks a non-English language.

### Gaps found

| # | Gap | Impact |
|---|-----|--------|
| A | `dangerouslySetInnerHTML` blocks bypass the text-node walker on re-render | News articles, area descriptions, developer bios stay in English |
| B | `translations_cache` has 3–5 rows per language → first-visit latency | Slow first paint on cold cache for non-English |
| C | `useTranslatedField` exists but is unused → no curated DB row translations | DB titles/descriptions retranslated string-by-string instead of row-by-row |
| D | `index.html` only declares `hreflang` for `en` + `ar` | Google can't surface the 13 other languages |
| E | No QA/coverage dashboard | Impossible to verify "all languages fully translated" |
| F | Proper-noun list missing UAE landmarks, RERA, AED, common developers | AI translates inconsistently across sessions |

---

## Plan

### 1. Fix HTML-block translation (Gap A)
Add `src/i18n/HtmlT.tsx` — a `<HtmlT html={...} />` component used wherever `dangerouslySetInnerHTML` renders DB-sourced content. Internally it:
- sanitizes via existing `contentSanitizer.ts`
- mounts the HTML inside a `<div>` ref
- runs a one-shot scoped sweep on that subtree after every prop change
- adds `data-jbj-html-block` so the global observer also re-sweeps on language switch

Refactor these call-sites to use it (preserving their existing sanitization):
`NewsDetail.tsx`, `pages/market-intelligence/AreaDetail.tsx`, `DeveloperDetail.tsx`, `components/area-detail/AreaAboutSection.tsx`, `AcademyGraduates.tsx`, `Favorites.tsx`. UI-only callers (charts, SVG generators, signatures) stay untouched.

### 2. Cold-cache seeding (Gap B)
Create edge function `i18n-warm` (admin-triggered + nightly cron) that:
- Pulls the flattened `en.ts` chrome dictionary
- Pulls top 200 strings most frequently inserted into `translations_cache` (proxy for hot UI)
- For each of the 14 non-English locales, calls `translateWithAI` and upserts to `translations_cache`

Result: by the time a visitor switches language, the chrome is already in the public-readable cache — sub-second perceived switch.

### 3. Wire `useTranslatedField` for DB rows (Gap C)
Use it in the highest-traffic DB-driven titles:
- `NewsDetail` — `title`, `excerpt`
- `DeveloperDetail` — `name`, `tagline`, `description`
- `AreaDetail` — `name`, `description`
- Property card — `title`, `community`

Falls through to AI engine if no curated row exists. Curated rows can be added later via admin UI; not needed now.

### 4. SEO: full hreflang set (Gap D)
Update `index.html` to emit `<link rel="alternate" hreflang="…" href="https://jbj.ae/?lang=…" />` for all 15 languages + `x-default`.

Also: when `LanguageContext` loads a manual language, mirror it into the URL query string (`?lang=ar`) so deep links and crawlers respect the selection.

### 5. Coverage dashboard (Gap E)
Add `/admin/translation-coverage` (owner-only, behind `requireOwnerAuth`):
- Per language: total cached strings, last update, sample of recent translations
- "Re-translate string" button (busts cache for one row)
- "Warm now" button (invokes `i18n-warm`)
- Read-only table backed by `translations_cache` aggregations

### 6. Expand brand & locale glossary (Gap F)
Append to `src/translations/proper-nouns.ts` and the edge function's `PROPER_NOUN_OVERRIDES`:
- UAE landmarks: Palm Jumeirah, Downtown Dubai, Dubai Marina, Business Bay, Sharjah, Ras Al Khaimah, JBR, DIFC, Jumeirah
- Currency: AED, USD, EUR (locked Latin in numeric contexts)
- Compliance: RERA, DLD, ESCROW (locked Latin)
- Top developers: Emaar, DAMAC, Sobha, Nakheel, Aldar, Meraas (locked Latin — these are global brands)
- Tagline / role variants: "Executive Assistant", "Real Estate Brokerage", "Property Consultant"

### 7. Smoke verification (no UI work)
After deploy, run `i18n-warm` once. Then for each of 15 languages, visit `/`, `/properties`, `/about`, `/contact`, `/news` and confirm `translations_cache` row count > 300 per language. Spot-check Arabic + Chinese + Japanese rendering for layout/RTL regressions.

---

## Technical details

```text
NEW FILES
  src/i18n/HtmlT.tsx                       — sanitized + scoped-sweep HTML block
  supabase/functions/i18n-warm/index.ts    — admin/cron warmup
  src/pages/admin/TranslationCoverage.tsx  — owner-only dashboard

EDITED
  src/translations/proper-nouns.ts         — +20 glossary entries
  supabase/functions/translate-batch/      — mirror glossary, lock currencies/RERA
  index.html                               — full hreflang set
  src/contexts/LanguageContext.tsx         — sync language to URL ?lang=
  src/pages/NewsDetail.tsx                 — HtmlT + useTranslatedField
  src/pages/DeveloperDetail.tsx            — HtmlT + useTranslatedField
  src/pages/market-intelligence/AreaDetail.tsx
  src/components/area-detail/AreaAboutSection.tsx
  src/pages/AcademyGraduates.tsx
  src/pages/Favorites.tsx
  src/App.tsx                              — register /admin/translation-coverage

DB (migration)
  -- no schema changes; existing translations_cache + content_translations suffice
```

Future automation: any new component, page, DB column, or string is automatically translated the moment it appears in the DOM, with the new HTML-block fix closing the last loophole. The `i18n-warm` cron keeps the cache hot so users never see English flicker on language switch.