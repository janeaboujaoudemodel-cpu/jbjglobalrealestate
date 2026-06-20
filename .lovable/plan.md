## Goal

Replace every dark-surface "black" (`#0A0A0A` / `#1A1A1A` / `#000`) used on **CTAs, cards, hero bands, dropdowns, dark sections** with the new brand ink gradient:

```text
linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000 100%)
border: 1px solid rgba(16,185,129,0.32)
accent icons: #6EE7B7
gold hairline #B89555 stays on top as today
```

Body text ink (`#1A1A1A`), the 88px header/sidebar L-frame, and the footer obsidian band **stay as today** (per your answer: dark surfaces + CTAs only).

---

## 1. Add canonical tokens (single source of truth)

`src/index.css` — add to `:root`:

```css
--ink-emerald-1: #064E3B;
--ink-emerald-2: #042c1c;
--ink-emerald-3: #000000;
--ink-emerald-ring: rgba(16,185,129,0.32);
--ink-emerald-accent: #6EE7B7;
--gradient-ink: linear-gradient(135deg, var(--ink-emerald-1) 0%, var(--ink-emerald-2) 55%, var(--ink-emerald-3) 100%);
--gradient-ink-hover: linear-gradient(135deg, #0a6b53 0%, #064E3B 55%, #042c1c 100%);
```

`src/lib/brand-tokens.ts` — append `BRAND.inkEmerald = { from, mid, to, ring, accent, gradient }` so JS/canvas/jsPDF can use it too.

---

## 2. Rewrite the CTA primitives in place

`src/index.css` — repaint the locked classes without renaming them, so all `data-cta="dark"` buttons site-wide flip automatically:

- `.jj-cta-dark` background → `var(--gradient-ink)`; hover → `var(--gradient-ink-hover)`; keep white text, keep 1px gold hairline (`border: 1px solid rgba(184,149,85,.55)`).
- Global black-CTA repaint guard (currently forces `#0A0A0A` / `#1F1F1F`) → forces `var(--gradient-ink)` / `var(--gradient-ink-hover)`. Same opt-outs (`data-allow-dark-cta`, `data-on-dark`, `.allow-white`, `data-no-contrast-guard`) keep working.
- Black Box Lock (`bg-[#0A0A0A]`, `bg-[#1F1F1F]`, `bg-[#1A1A1A]`, `bg-black`) → background becomes the gradient; white text/icons rule unchanged.

This single edit cascades to every page that already uses the locked primitives — no per-file sweep needed for buttons, dark cards, dropdowns, modals.

---

## 3. Fix Property Measurement hero (selected element)

`src/pages/PropertyMeasurement.tsx`:

- Hero outer wrapper currently champagne → repaint with `var(--gradient-ink)` + `1px solid var(--ink-emerald-ring)`.
- "Property Measurement" headline already white → now legible on the new emerald hero.
- Subtitle, "FREE AI Tool" pill, Fullscreen button get the same on-dark treatment (white + gold hairline).
- The 3 selected cards stay as-is — they already use the exact gradient.

---

## 4. Audit + repaint the other tool/hero pages with the same white-on-light bug

Pages flagged for the same dark-hero treatment (titles currently fight the white-on-light guard):

- `src/pages/VideoMeeting.tsx`
- `src/pages/ScanSignDocuments.tsx`
- `src/pages/JBJDesignStudio.tsx`
- `src/pages/PdfFromPhotos.tsx`
- `src/pages/BusinessCardScanner.tsx`
- `src/pages/AICalendar.tsx`, `AIFinancialAdvisor.tsx`, `AIPersonalShopper.tsx` (already touched in prior batches — re-verify)

Each hero section gets the same emerald gradient wrapper + `data-hero-dark` so the white headline is intentional and the contrast guard skips it.

---

## 5. Update CSS guards

`src/index.css` — the dominant "white-on-light" guard (PASS 6/7) currently flips any white text on light bg to ink. Add an exception: when the ancestor carries `[data-ink-emerald]` OR `[data-hero-dark]`, the guard skips — because the gradient is dark enough for white text.

The dark-CTA guard's hex allowlist gets the new tokens added so it doesn't accidentally repaint emerald back to black.

---

## 6. Save the new brand token to memory

Two memory writes:

- `mem://style/color-palette/ink-emerald-gradient-standard` — the canonical recipe (hexes, gradient string, ring, accent, where it applies, what it does NOT replace).
- `mem://index.md` — update the Core "Theme" line: dark surfaces use `--gradient-ink` (emerald) instead of solid `#0A0A0A`. Update the Black-CTA Global + Black Box Lock entries to point at the new gradient.

---

## What is explicitly NOT changing

- Body text ink (`#1A1A1A`) stays — kept per your scope answer.
- Champagne page background (`#FDFBF7`), surface (`#F7F2EA`), raised (`#EFE6D6`) — untouched.
- Gold `#B89555` hairline/accent — preserved everywhere; no replacement.
- 88px header / sidebar L-frame — untouched.
- Footer obsidian — untouched (per "dark surfaces + CTAs only" scope).
- Listing card layout, sale-status badges, price pill, developer link — untouched.
- AI purple theme — untouched (AI tools keep their vivid purple identity).
- Semantic data viz (Emerald/Red/Blue/Amber) — untouched.

---

## Technical surfaces touched

```text
src/index.css                              # tokens + repaint .jj-cta-dark + guards
src/lib/brand-tokens.ts                    # BRAND.inkEmerald
src/pages/PropertyMeasurement.tsx          # hero band
src/pages/VideoMeeting.tsx                 # hero band
src/pages/ScanSignDocuments.tsx            # hero band
src/pages/JBJDesignStudio.tsx              # hero band
src/pages/PdfFromPhotos.tsx                # hero band
src/pages/BusinessCardScanner.tsx          # hero band
mem://style/color-palette/ink-emerald-gradient-standard   # new
mem://index.md                             # Core + black-CTA + black-box-lock lines updated
```

Because the CTA primitives + black-box-lock are central, this single pass cascades to ~hundreds of components without touching them individually. Per-page work is limited to the 6 hero bands above.