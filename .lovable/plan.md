Large multi-area pass, sequenced so each phase is shippable on its own.

## Phase 1 — Header icons in gold

File: `src/components/GlobalHeader.tsx`

- Force `text-[#B89555]` (gold) on: search icon, filter icon, heart icon, AED currency chevron, Mode chevron.
- Keep the gold-on-champagne contrast lock; opt-out the contrast guard with `data-no-contrast-guard` only where needed.
- No layout changes.

## Phase 2 — Property Measurement UI cleanup (contrast + card palette)

File: `src/pages/PropertyMeasurement.tsx` (1017 lines)

Problems visible in the screenshots:
- "Property" word in hero almost invisible (dark green on dark bg).
- Subtitle paragraph unreadable.
- "Step 1: Property Information" heading + "Property Type" label invisible.
- 5 type cards (Apartment / Villa / Townhouse / Office / Land / Retail) are solid navy blue — must become green→black ombre with off-white ("ombre white") text + icons, matching the active "Both" pill style.
- "Square Feet" / "Square Meters" inactive pills are same navy — same treatment.
- "Property Name (Optional)" label + input placeholder unreadable.

Changes:
- Replace all `bg-[#0A1628]`/navy card classes with a reusable `.pm-ombre-card` (gradient `from-emerald-950 via-black to-emerald-900`, 1px emerald-500/30 border, neon glow on hover, off-white text `#F5F7F4`).
- Active state = brighter emerald glow ring + slightly lighter ombre.
- Hero `Property` text → off-white with subtle emerald glow so both words read.
- Subtitle / labels / placeholders → `#E8ECE6` (ombre white), not pure white.
- Step indicators stay green; inactive ring lightened so numbers 2–5 are readable.
- Footer band of the page already champagne — leave alone.

## Phase 3 — Property Measurement backend rebuild + wiring

Files: `supabase/functions/property-measurement/index.ts`, `PropertyMeasurement.tsx`, new helper `src/lib/measurementReport.ts`.

Rebuild end-to-end so the tool actually works:

1. Frontend flow (5 steps):
   1. Property info (type, name, unit pref: sqft / sqm / both).
   2. Upload photos OR a short video (room-by-room). 20-image / 60-second cap, drag-drop + camera capture.
   3. Per-room labelling (auto-suggest from EXIF + filename; user can rename rooms).
   4. AI analysis — call `property-measurement` edge function with images (base64 or signed-storage URLs) + unit pref.
   5. Report screen: per-room area, total area, both sqft + sqm regardless of pref (just hide the column the user did not pick, but include both in the PDF), download PDF button.

2. Edge function (`property-measurement`):
   - Accept `{ rooms: [{label, images[]}], unitPreference, propertyType, propertyName }`.
   - Call Lovable AI Gateway with `google/gemini-3-flash-preview` (vision) using a structured prompt that returns JSON: `rooms: [{label, area_sqm, area_sqft, confidence, method, notes}], total_sqm, total_sqft, assumptions[], disclaimer`.
   - Validate JSON; reject empty / non-room images (return `is_property: false`).
   - Use `requireOwnerAuth` is overkill — keep public but rate-limited via existing `email_quota_try_claim` pattern? No — use anon-friendly per-IP throttle already in repo.
   - Return strict shape; never fabricate.

3. Report PDF:
   - Use existing jsPDF institutional letterhead helper.
   - Sections: cover (property name, date, JBJ branding) → summary totals → per-room table with thumbnail, area in both units, confidence → assumptions → disclaimer.
   - Download from results screen.

4. Validation utility prevents "Save / Continue" when 0 valid rooms detected.

## Phase 4 — Mortgage Calculator neon restyle

File: `src/pages/MortgageCalculator.tsx`

- Wrap page in a dark neon shell: deep navy `#05060F` base + animated radial blobs (cyan `#00E5FF` + magenta `#FF3DCB`) using CSS `@keyframes` (no JS).
- Card surfaces: glass black with 1px gradient border (cyan→pink), drop shadow `0 0 40px rgba(0,229,255,.25)`.
- Inputs / sliders: ombre-white labels, neon focus rings.
- Floating bubble particles (pure CSS, 8–12 circles, slow drift), reduced-motion respected.
- Validate every text element passes contrast: labels `#E8ECE6`, helper text `#B7BFC2`, primary numbers neon cyan.

## Phase 5 — News + Market Intelligence neon editorial

Files: `src/pages/News.tsx`, `src/pages/NewsDetail.tsx`, `src/pages/MarketIntelligence.tsx`, `src/pages/market-intelligence/MarketOverview.tsx`, `AreaIntelligence.tsx`, `AreaDetail.tsx`.

- Shared `.jj-neon-band` class: dark base, cyan/magenta hairline, soft glow.
- News hero: large editorial headline, animated underline gradient, category chips with neon border.
- Article cards: dark glass with neon hover lift + ombre-white body.
- Market Intelligence: KPI tiles get neon ring + animated number glow on mount; charts get cyan/magenta accent series; section headers get a thin animated gradient bar.
- Keep all existing data, links, sections (no-removal rule).
- Contrast pass: all body text `#E8ECE6`, captions `#B7BFC2`, never pure white on neon.

## Phase 6 — E2E user-flow tests (manual via browser tool)

For each tool, log in as a broker-mode user in preview, walk the flow, capture screenshots, list defects, then fix only blocking issues found:

1. `/property-measurement` — full happy path: pick villa, upload 3 photos, run AI, download PDF.
2. `/rental-index` — search area, view yields, export.
3. `/property-evaluation` — submit a property, view valuation report.
4. `/compare` (units mode) — add 2 units, compare table renders, payment-plan engine fires.
5. `/list-your-property` — submit a draft, verify draft saved + appears in owner dashboard.

Deliverable per tool: short pass/fail note + any patches required.

## Out of scope this pass

- New routes or features beyond what is listed.
- Touching unrelated marketing pages.
- Removing any existing functionality (no-removal rule).

## Technical notes

- Reuse `--price-orange`, `<IconTile />`, `<PricePill />`, `<DeveloperLink />` where applicable.
- Header gold change must respect `Universal White-on-Light Lock (PASS 6)` — use `data-no-contrast-guard` on the gold icons explicitly.
- Neon styling must be scoped (`data-neon-page` root attribute) so global champagne-band rules don't fight it.
- Edge function: use `google/gemini-3-flash-preview` by default; allow override via env.
- All new CSS lives in `src/index.css` under clearly commented blocks (`/* === Property Measurement ombre cards === */`, `/* === Neon page shell === */`).

## Suggested execution order

1. Phase 1 (header) — 1 file, fast win.
2. Phase 2 (PM contrast + cards) — visible fix you can verify immediately.
3. Phase 3 (PM backend + report) — bigger rebuild.
4. Phase 4 (mortgage neon).
5. Phase 5 (news + market intel neon).
6. Phase 6 (E2E tests + targeted fixes).

I'll stop after each phase and screenshot-verify before moving to the next, so you can course-correct.