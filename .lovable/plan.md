
# Document Studio — Enterprise Rebuild Plan

Per your answers: **Shell first → Full legal copy for 35+ templates → Full-screen `/owner/documents/new` wizard**. Shipped in three sequential phases so each one is verifiable on its own and nothing regresses behind the next.

---

## Phase 1 — Shell, Toolbar, Buttons, Chrome, Contrast (items 1–4, 7–12)

Rebuild the Documents & Forms workspace and the editor chrome as real primitives, not CSS patches.

### 1.1 Workspace layout (`/owner/documents/forms`)
- New file `src/components/document-studio/DocumentWorkspace.tsx` replacing the current page body.
- 12-column CSS grid with three rows: page header strip (64px), filters/search bar (56px), document grid (auto). `min-width:0` everywhere, `container-type: inline-size` on every card so nothing rotates or overflows.
- Card grid uses `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` — never collapses to a single vertical column above 480px.
- Empty state, loading skeleton, and "Recently Deleted" tab share the same shell.

### 1.2 Toolbar primitive
- New `src/components/document-studio/StudioToolbar.tsx` exporting `<StudioToolbar>` and `<StudioToolbarGroup>`.
- Every control passes through one `<StudioButton size="md">` primitive: 40px height, 14px horizontal padding, 13px/600 Inter, 10px radius, identical hover lift, identical focus ring.
- Sign / Stamp / Theme / Language / Save / Send / Download / Print / AI all rebuilt on this primitive. No `<button>` inside the studio bypasses it.
- Toolbar splits into 3 zones: left (file ops), center (formatting), right (theme/lang/AI). Wraps onto a second row at <960px instead of compressing.

### 1.3 New Envelope button
- Replaced with `<StudioButton variant="primary" size="md">` — same height/padding/radius as every other primary CTA on the page. Centered icon + label with `inline-flex items-center justify-center gap-2`.

### 1.4 Header / Footer / Monogram (locked chrome)
- `LockedLetterhead`: monogram 220×72 → **280×96**, gutter between monogram and wordmark reduced from 14px → 8px, vertical divider 52 → 64. Header padding 8px → 6px top/bottom. "L.L.C S.O.C" rendered as inseparable `<span style="white-space:nowrap">` so it never disappears.
- The literal word "Document" is removed from every chrome surface (audit `jbjLockedChrome.ts`, `LockedLetterhead.tsx`, `DocumentStudio.tsx`).
- Generated date moved to a single right-aligned 9px stamp under the divider line on page 1 only, never repeating across pages.
- Footer: single hairline divider, charcoal `#1A1A1A` body (was opacity white), height capped at 28px, no legal-name duplication.

### 1.5 Contrast audit & lock
- New `[data-studio-surface]` scope in `index.css` that forces:
  - champagne surface → ink `#1A1A1A` text/icons (no white-on-cream anywhere)
  - emerald surface → pure white text/icons
  - dropdown menus, popovers, theme picker, language picker inherit the scope's tokens
- "Live Document Editor" title, helper text, and English/AR toggle re-rendered with explicit tokens; no opacity-based fades.
- AiEditChatPanel header re-themed to ink-on-champagne.

### 1.6 Responsive contract
- All studio surfaces wrapped in a single `.studio-shell` with `container-type: inline-size`.
- Breakpoints handled with `@container` queries (not `@media`) so the editor behaves correctly inside the owner sidebar's variable width.

---

## Phase 2 — Full Template Library (item 5)

Build the complete UAE/Dubai real estate document catalog with full legal copy. Each template ships as **Ready** (pre-filled boilerplate clauses) + **Blank** (empty editable shell).

### 2.1 Catalog structure
```
src/templates/library/
├── sales/        offer-letter, reservation-form, spa, buyer-agreement, seller-agreement
├── leasing/      ejari, lease-agreement, renewal, addendum, notice-to-vacate
├── legal/        form-a, form-b, form-f, form-i, warning-letter, legal-notice, noc, authority-letter
├── hr/           employment-contract, hr-offer-letter, nda, hr-warning, salary-certificate, experience-letter, termination-letter
├── brokerage/    agent-to-agent, referral, commission, co-brokerage
└── company/      letterhead, blank-letterhead, internal-memo, proposal, client-letter
```
Each file exports `{ id, category, title, ready: { html, fields }, blank: { html, fields }, mergeFields: [...] }`.

### 2.2 Registry
- `src/templates/library/index.ts` aggregates all 35 templates into one `TEMPLATE_LIBRARY` array.
- `documentCatalog.ts` updated to consume the registry — the existing PAA template stays, everything else is added alongside it.

### 2.3 Content depth
Every template gets real clauses written to UAE/RERA convention: parties block, recitals, term, consideration, obligations, default, governing law (Dubai/DIFC where applicable), signatures, official stamps placeholders. Form A/B/F/I follow the actual RERA cell layout already used by PAA.

---

## Phase 3 — Generate Document Wizard (item 6)

### 3.1 Route
- New full-screen route `/owner/documents/new` registered in `OwnerRoutes`.
- File: `src/pages/owner/DocumentGenerateWizard.tsx`.
- Replaces the current "Generate" entry point — old buttons redirect here.

### 3.2 Step sequence
```
1 Category    → 6 horizontal category tiles (Sales/Leasing/Legal/HR/Brokerage/Company)
2 Template    → grid of templates in that category, each card shows Ready/Blank toggle
3 Theme       → Champagne | Emerald preview side-by-side
4 AI Autofill → optional: pulls from selected lead/property, shows diff before applying
5 Preview     → renders inside ReportEngine using the locked chrome
6 Edit        → opens DocumentStudio in-place with the populated draft
7 Sign        → existing signature flow
8 Export      → PDF / email / WhatsApp / link (existing pipeline)
```
- Persistent left rail shows the 8 steps; right rail shows live mini-preview from step 2 onward.
- Each step is its own component under `src/components/document-studio/wizard/`.

---

## Technical Notes

- All work is presentational + new template content. No DB schema changes — templates live in code, not in `crm_documents`.
- `crm_documents.template_id` already accepts arbitrary string ids, so new templates plug in via `useSaveDocument({ template_id })`.
- The locked emerald/champagne tokens already exist in `index.css` — Phase 1 consumes them via a new scoped data-attribute, no new color tokens introduced.
- Contrast verified via Playwright after each phase (screenshots at 1440px / 1180px / 768px / 390px), attached to the closing message of each phase.

---

## Delivery

I'll ship Phase 1 in the next response (single batch of file writes + edits + Playwright screenshot proof), then pause for your sign-off before starting Phase 2. Phase 2 is the largest by file count (35 template files with full legal copy) and Phase 3 is the most architectural (new route + 8-step wizard) — they each deserve their own review cycle.
