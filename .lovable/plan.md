## Goal

Bring four spots into the canonical emerald‑ombre pill standard that the header AED chip already uses, and refresh the newsletter copy in the same block.

Reference pill (locked, do not change): the AED button in `HorizontalUtilityBar.tsx` — rounded pill, `backgroundImage: var(--jj-emerald-ombre)`, `1px solid rgba(255,255,255,0.18)`, soft emerald shadow, white text and white icon.

---

### 1. ProjectCard — Email / Call / Chat pills

File: `src/components/ProjectCard.tsx` (lines ~448–490, the 3‑column CTA grid).

Change the three anchors from the flat `jj-surface-emerald` solid into the AED‑style emerald‑ombre pill:

- Drop `jj-surface-emerald`; keep `data-surface="emerald"` and `data-no-contrast-guard`.
- Replace classes with: `h-9 rounded-full inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold transition-all duration-200 hover:brightness-110`.
- Inline style: `{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 8px 18px -12px rgba(6,78,59,0.85)", color: "#FFFFFF" }`.
- Icon: `w-3.5 h-3.5` with `style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}`.

Result: three rounded emerald‑ombre pills identical in finish to AED, just sized for a 3‑col grid.

---

### 2. Mortgage sliders — long pill + circle

File: `src/components/MortgageCalculator.tsx`, the `MortgageRange` component (lines 70–131).

Track currently uses a flat emerald fill and an oversized white thumb with a heavy green glow. Re‑align to AED:

- `fill` becomes the canonical ombre: `linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)`.
- Track background tone unchanged (`#EFE6D6` / navy translucent).
- Add a 1px hairline “rail” via the wrapper or `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18)` on the input so the filled portion reads as a bordered pill, just like the AED chip.
- Thumb (`--mortgage-range-thumb` + `--mortgage-range-thumb-shadow`): switch from white-on-emerald to **emerald‑ombre circle** so it matches the pill:
  - `--mortgage-range-thumb`: `linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)`
  - `--mortgage-range-thumb-shadow`: `0 0 0 1px rgba(255,255,255,0.55), 0 4px 10px rgba(4,44,28,0.45)` (thin white hairline + soft shadow, no neon halo).
  - Keep size ~16px so it still reads as a knob.

This makes the “long pill” (fill) and the “circle” (thumb) read as one continuous emerald‑ombre object, mirroring the AED pill family.

---

### 3. Ready to Get Started — WhatsApp / Call Us / Email tiles

File: `src/components/CombinedContactNewsletter.tsx` (lines 79–97).

Currently `jj-surface-emerald` rounded‑xl tiles. Replace with **premium rectangular emerald‑ombre tiles** (smaller corner radius, sharper architectural feel, as requested):

- Drop `jj-surface-emerald`; keep `data-surface="emerald"`.
- Classes: `group flex flex-row items-center justify-center gap-2.5 px-4 py-3 rounded-md transition-all duration-200 hover:brightness-110`.
- Inline style: `{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 10px 24px -14px rgba(6,78,59,0.85), inset 0 1px 0 rgba(255,255,255,0.10)", color: "#FFFFFF" }`.
- Icon + text stay white. No structural copy change.

Result: three premium emerald‑ombre rectangles (slightly rounded corners) replacing the puffy pill look.

---

### 4. “Stay in the Loop” newsletter — premium catchy copy + visible white prompt

Files: `src/components/CombinedContactNewsletter.tsx` (the heading block, lines 108–125) and `src/components/marketing/NewsletterBrevo.tsx` (the typewriter list at lines 11–16).

Goal: catchier premium titles + the typewriter prompt clearly visible in white inside the emerald pill (it already animates, but the phrases are flat; we'll refresh the wording and keep the existing white styling that's already in place).

- Eyebrow chip: keep `Stay in the Loop`.
- New `h3`: `“Get the Inside Track — Listings Before the Market.”`
- New paragraph: `“Off‑market launches, price moves, and concierge intel — curated weekly, never spammy.”`
- Update `NEWSLETTER_TYPEWRITER_PHRASES` to four premium prompts that act as the placeholder:
  1. `"Enter your email — get the edge"`
  2. `"Be first to off‑market launches"`
  3. `"Weekly intel from JBJ concierge"`
  4. `"No spam. Unsubscribe anytime."`

White text + caret styling on the typewriter already renders inside the emerald pill, so the user will see the prompts being typed in white as requested.

---

## Out of scope

- No changes to header AED pill (locked reference).
- No layout/grid changes elsewhere on the home page.
- No changes to ProjectCard structure beyond the 3 CTA pills.
- No backend, no copy in unrelated sections, no slider math.

## Validation

After build, Playwright screenshots at 1440×1800:
1. Home → Featured Properties card: confirm 3 emerald‑ombre rounded pills with white icon/text.
2. Mortgage Calculator section: confirm slider fill + circle both read as one emerald‑ombre object with a thin white hairline.
3. Ready to Get Started: confirm 3 emerald‑ombre rectangular tiles (sharper corners) and that the newsletter input shows white typewriter copy with new phrases.
