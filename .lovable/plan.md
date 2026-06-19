## 1. Rebuild the property brochure (champagne / gold / ink, elegant)

File: `src/pages/QuizResults.tsx → handleDownloadPropertyBrochure` (and shared helper extracted to `src/lib/pdf/propertyBrochurePdf.ts`).

Problems today:
- Header colors hard-coded to dark navy + an unused `cyan`/teal swatch carried over from the old palette.
- Fact tiles fill RGB `(5, 38, 44)` (dark teal) on a champagne page — clashes, no logo, no footer hairline, no developer logo, no broker block.
- "by JBJ GLOBAL REAL ESTATE" rendered on a black header in gold = unreadable; champagne body text on white-cream tiles fails contrast.

Redesign (one source of truth, used everywhere we export a brochure):
- Page bg `#FDFBF7`, ink `#1A1A1A`, gold `#B89555` (1px hairline only — never as a fill).
- Top chrome: 92px clean white letterhead, 56×56 JBJ monogram (PNG from `/brand/jbj-monogram.png`), wordmark "JBJ GLOBAL REAL ESTATE" right-aligned in ink, 1px gold hairline beneath.
- Hero: project name (Inter Bold 22pt, ink), developer line ("by {dev}" — "by" ink/70, name gold), cover image with 1px gold hairline, no rounded teal stroke.
- Fact tiles: champagne `#F7F2EA` fill, ink text, gold hairline border. Replace teal fills.
- Presentation overview: ink body, justified, proper paragraph spacing.
- Footer: 1px gold hairline + 3 ink lines (View listing URL + contact block — see §2).
- Multi-page safe: if content overflows, push to page 2 with same letterhead.

Same refactor applied to `src/pages/toolkit/BrochureGeneratorPage.tsx` and any "Compare" / "AI Home Finder" PDF export that currently uses the navy/teal block.

## 2. Broker-personalised brochures & presentations

Goal: when `userMode === 'broker'` and broker is signed in, every PDF the platform generates (property brochure, compare, AI Home Finder presentation, company profile) is auto-branded with that broker's identity.

Data model — extend `crm_brokers` (already canonical broker table) with whatever is missing:
- `company_name`, `agent_display_name`, `agent_title`, `phone_e164`, `email`, `whatsapp`, `logo_url`, `headshot_url`, `tagline`, `brand_primary_hex` (optional accent).

UI:
- New route `src/pages/broker/BrokerBrandProfile.tsx` ("My Brand") under broker portal: form to upload company logo + headshot (Supabase Storage bucket `broker-brand`, RLS = owner can read/write), text fields above, live PDF preview.
- Link from broker sidebar + "Edit my brand" CTA shown in any "Download brochure" toast for brokers.

PDF integration:
- New helper `src/lib/pdf/brokerBrand.ts → loadActiveBrokerBrand(userId)` returns `{ companyName, agentName, phone, email, logoDataUrl, headshotDataUrl, ... }` or `null`.
- `propertyBrochurePdf` and every other generator accept an optional `brokerBrand` param.
- When provided, the brochure renders a **co-branded footer**: left = broker logo (32px high) + company name; right = agent name, phone, email, WhatsApp. JBJ monogram stays in the top letterhead — never replaced.
- Investor / developer / signed-out modes: render plain JBJ-only footer (current behaviour).

## 3. Restore "3 perfect matches" on `/quiz-results`

File: `src/pages/QuizResults.tsx`.

Root causes when only 1 card shows:
- After applying `applyPurchaseOnly` (leasing filter), some saved slugs drop out and we render only the survivors with no top-up.
- Slug list saved in URL/session is whatever the quiz returned, so if 2 of 3 were leasing → only 1 left.

Fix:
1. After the slug-hydration query, if `projects.length < 3`, run a second `applyPurchaseOnly` query that pulls top candidates matching the saved quiz preferences (budget, bedrooms, area, type) ordered by the existing match-score logic, excluding slugs already shown, and pad up to exactly 3.
2. Update copy: header always reads "3 perfect matches" only when we actually have 3; otherwise "Top {n} matches" — but the padding above should make 3 the normal case.
3. Persist the padded slug list back to the session so refresh stays consistent.

## 4. Back-fill missing bedroom data ("To be decided" / "TBC")

Today `fmtBedsLocal` falls back to "Type TBC" when `bedrooms_min`/`bedrooms_max` are null. The user wants this never to appear publicly.

Two-pronged fix:

(a) **Display guard** — `src/components/ui/BedroomLabel.tsx`: if min/max null, render nothing in card chips and substitute "Bedroom mix on request" in brochures (never "TBC"/"To be decided"). Replace all current "TBC"/"To be decided" string literals across listings, brochures, compare, AI Home Finder.

(b) **Data backfill pipeline** — new edge function `enrich-project-bedrooms`:
- Input: `project_id`.
- Source order: Provident (`provident-estate.com`), then Property Finder, Bayut, Driven, Reelly cache — using existing `Universal Link Extractor` standard + Firecrawl (already wired) for HTML scrape + GPT-5 JSON extraction (`openai/gpt-5` via Lovable AI gateway).
- Writes `bedrooms_min`, `bedrooms_max`, `bedroom_types` (jsonb array like `["Studio","1BR","2BR"]`), `source_url`, and an `admin_edit_log` row (per Owner-Provenance standard) — never overwrites a non-null value already in DB.
- Owner-only invoke (`requireOwnerAuth`).
- Cron: nightly worker iterates `projects` where `bedrooms_min IS NULL AND is_published = true`, batches 25/run, respects competitor-source-exclusion rules (strip competitor names from any user-visible copy; raw data only used internally to fill numeric fields).

Owner Admin UI: add "Enrich bedroom data" button on `OwnerProvenanceCard` to run on-demand for the current project, with Before/After preview before commit (matches existing `ai-enrich-project` UX).

## 5. Verification

- Reload `/quiz-results?...` → exactly 3 cards.
- Click "Download Brochure" on each → champagne/gold/ink PDF, JBJ monogram top, broker footer when in broker mode.
- Open `/broker/brand` → upload logo + fill fields → re-download brochure → broker footer reflects new data.
- Open any project page that previously said "To be decided" → either real bedroom range or "Bedroom mix on request"; admin can click Enrich to fetch real data.
- Run `scripts/contrast/check-white-on-light.mjs` + `check-faded-gold.mjs` → pass.

## Out of scope
- No changes to quiz scoring algorithm itself.
- No DB schema changes beyond `crm_brokers` additive columns and `projects.bedroom_types` jsonb.
- No styling changes outside the brochure PDF + new BrokerBrand page.
