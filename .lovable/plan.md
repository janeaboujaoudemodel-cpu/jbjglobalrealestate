## Goal
Eliminate every remaining "light green" usage site-wide and replace with the single approved Emerald token (the exact tone used on the homepage "View All Projects" / "Start Exploring" CTA). Remove white borders around emerald circles/pills. Fix page padding so cards never touch the sidebar/edge. Fix label color rules. Validate visually with screenshots.

## Reference (locked) — single source of truth
- Emerald CTA tone: same as homepage `View All Projects` and `Start Exploring` buttons (emerald ombre, white text, white icon, no border).
- Emerald icon circle: same as header search / filter / heart circles (solid emerald fill, white glyph, NO white ring, NO border).
- Label chips ("AI Powered", section eyebrows, CRM labels): emerald text/background per token, never raw green.

## Scope of fixes (global, not per-page)

### 1. Color token purge — remove every non-approved green
Audit and replace across `src/index.css`, all `*.tsx`, tailwind config, inline styles:
- Tailwind classes: `bg-green-*`, `text-green-*`, `border-green-*`, `from/to/via-green-*`, `ring-green-*`, `fill-green-*`, `stroke-green-*`
- Hex/HSL greens that are NOT the approved emerald token (e.g. `#10B981`, `#22C55E`, `#16A34A`, `#34D399`, light-emerald shades, lime, mint)
- Replace with the approved emerald token (`--jj-emerald-ombre` / `jj-cta-emerald` / `.jj-chip-emerald`) — the SAME tone as `View All Projects`.

Specifically confirmed offenders to fix:
- Heart / Shortlist icon circle (`FavoriteButton`)
- "AD" / sponsored badge
- "Payment plan to be decided" pill
- "Compare to bank rates" chip (Mortgage)
- "Try our Mortgage Calculator" CTA
- Mortgage page tool icon + card accents
- "Generate Presentation" card + progress styling
- Live Market Data → "Download Report" button (currently black text → must be white on emerald)
- Project detail document tick circles (Brochure / Floor Plan / Specs / Payment Plan)
- Auto + Amenities selector ticks
- Any remaining `text-emerald-300/400/500` light variants → force the locked dark emerald

### 2. Emerald circle / pill border lock
Global CSS rule (in `src/index.css`) to strip white/light borders from any emerald-filled circular or pill container:
- Targets: `.jj-chip-emerald`, `.jj-cta-emerald`, `[data-emerald-ok]`, `rounded-full` + emerald bg.
- Removes: `border`, `ring`, `box-shadow` white halos.
- Keeps: clean solid emerald fill + white content.

### 3. Pill-stripping on three specific CTAs
Render as flat premium white style (no emerald pill background) — text + icon only, premium underline-on-hover treatment:
- "Download Brochure"  → KEEP emerald per user's later instruction (filled emerald, white icon+text, idle+hover).
- "Register Interest"  → premium white style (no pill).
- "Download Branded Presentation" → premium white style (no pill).

(Will confirm in Q1 below — user gave conflicting direction mid-message.)

### 4. Page padding / sidebar overflow
Global container rule for content shell (everything inside the L-frame, right of the 88px sidebar):
- Add consistent horizontal page padding (e.g. `px-6 md:px-8 xl:px-10`) on the main content wrapper used by Projects, Project Detail, Market Intelligence, Mortgage, etc.
- Cards/grids never reach `0px` from the sidebar edge or viewport edge — only the full-bleed `.jj-band` background may.
- Fix horizontal filter strap on Projects + Project Detail (price/payment/handover row, location/brochure/payment row) so it sits inside the padded container and does not visually merge into the sidebar.

### 5. Label color rule (global)
All "label" eyebrows (e.g. "AI Powered", section kickers, CRM field labels): emerald token text (or emerald chip when on light surface). Never raw gray, never green-400, never black on emerald.

### 6. Hover/idle inversion for Mortgage advisor CTAs
- "Prefer Mortgage Advisor" / "Request Mortgage Introduction": title must be WHITE at idle; idle = the DARKER emerald (currently shown on hover); hover = the lighter approved emerald. Swap states.

### 7. Validation
Playwright pass with screenshots at desktop (1280), iPad (1024), iPhone (390) on:
Home, Projects list, Project detail, AI Home Finder, Mortgage Calculator, Market Intelligence, Generate Presentation, Owner CRM.
Automated audit script that scans rendered DOM for any computed color in the banned-green set and reports zero offenders. Save contact sheet to `/mnt/documents/`.

## Out of scope
- No business-logic changes, no new features, no data model changes.

---

## Clarifying question before I implement
Q1. "Download Brochure" button style — your message says two different things in the same paragraph:
  a) "The button of Download Brochure also should be in the emerald style, filled with white icon and text on normal load and hover" (= emerald pill)
  b) "for the download brochure, register interest, download branded presentation… keep them without pills" (= flat white premium)

Which one is correct for "Download Brochure"? I'll plan as: Download Brochure = EMERALD PILL (white text+icon, idle+hover), Register Interest + Download Branded Presentation = FLAT WHITE PREMIUM (no pill). Confirm or correct before I build.
