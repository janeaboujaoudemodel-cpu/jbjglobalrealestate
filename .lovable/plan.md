## Goal
Match the Property Measurement standard across the entire Business Card Scanner: compact dark-navy shell, rose neon accents, fully readable text on every surface, and a tighter privacy gate layout.

## 1. Rebuild Privacy Gate Layout (`src/components/business-card/BusinessCardPrivacyNotice.tsx`)
Current card is too tall and visually loose. Rebuild to mirror Property Measurement's intro panel:

- **Max width** `max-w-3xl` (was 2xl, too narrow vertically), `py-6`.
- **Header**: compact rose icon tile (40×40, not 64×64), title `text-xl`, subtitle `text-sm` on one line where possible.
- **Privacy points**: switch from 6-stacked rows to a **2-column grid** (`grid-cols-1 md:grid-cols-2 gap-3`), each tile uses 32×32 icon tile + tighter padding `p-3`. Title `text-sm` semibold white, body `text-xs` at 72% white.
- **Footer row**: checkbox + both buttons collapse into a single sticky-feeling row at the bottom of the card, smaller height (`h-10`).
- Keep all 6 privacy items, copy, consent text, and `saveAgreement` call unchanged.
- Keep rose neon palette (`#fb7185` border, soft `rgba(251,113,133,0.14)` fill, navy gradient backdrop) — no color changes, only layout/size compression.

Result: privacy gate fits in one viewport on desktop without scrolling, matches Property Measurement's compact intro look.

## 2. Fix Contrast on Main Scanner Screen (`src/pages/BusinessCardScanner.tsx`)
Issue: `text-white/70`, `text-white/85` and `text-[#1A1A1A]` icons disappear on the dark rose/zinc gradient because the global contrast guard or the low opacity makes them unreadable.

Apply on the entire returned tree (post-consent):
- Wrap the outer `<div className="min-h-screen ...">` with `data-no-contrast-guard` and `data-allow-dark-cta` so the white-on-light global guard stops flipping white text to ink.
- **Hero (lines 374-403)**: bump body copy from `text-white/70` → `text-white/90`, add `allow-white` class. Badges keep rose-200 text but add `allow-white` + `data-no-contrast-guard`.
- **Privacy Alert (lines 406-412)**: change `text-white/85` → solid `text-white` with `allow-white`; icon `text-rose-300`.
- **Scan Business Cards card (416-457)**:
  - Card bg → opaque dark navy `rgba(7,16,31,0.92)` w/ rose hairline, not translucent `rose-900/30`.
  - Replace `text-[#1A1A1A]` icon (line 419) with `text-rose-300` + `allow-white`.
  - `CardDescription` → `text-white/80` + `allow-white`.
  - Tabs: `TabsList` bg from `#F7F2EA` (cream — illegal on dark shell) → dark `rgba(255,255,255,0.04)` with rose border; inactive tab text white/70 + `allow-white`; active stays rose-500.
- **Scanned Contacts card (461-…)**: same treatment — opaque dark bg, rose-300 icon, white text, `allow-white` on titles/descriptions/badges/ghost buttons.
- Every `text-white`, `text-white/##` chip/title/description inside this tree gets `allow-white` so PASS 6/7 guard cannot flip them.

## 3. Validation (screenshots)
After edits, in build mode I will:
1. Use `browser--navigate_to_sandbox` then `browser--navigate_to_url /business-card-scanner` (logged-out → consent gate visible).
2. `browser--screenshot` the privacy gate.
3. Accept consent in-browser via `browser--act`, then `browser--screenshot` the scanner page.
4. `image_tools--zoom_image` into the alert + both cards to confirm every line of text is readable.
5. Save both screenshots to `/mnt/documents/` and surface them as artifacts.

## Files touched
- `src/components/business-card/BusinessCardPrivacyNotice.tsx` (layout/size only)
- `src/pages/BusinessCardScanner.tsx` (contrast classes only)

No business logic, no route, no schema changes.
