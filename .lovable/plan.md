
## Problem

The site already has a large contrast-guard layer in `src/index.css` (lines ~4200–4720) plus runtime `contrastGuard.ts`, but it still fails on real buttons because:

1. **Cookie "Manage Preferences"** — relies on the parent carrying `.cookie-banner` or `[data-chrome="cookie-banner"]` (line 4552). The banner wrapper does not actually set this, so the white-text lock never fires and other guards strip it to black.
2. **"Get Verified" pill** — champagne pill sits inside a navy banner; the "children of dark surface inherit white" rule (line 4205-4221) and the "re-assert white inside nested dark" rule (line 4251) both push white onto the champagne pill, overriding the inline `text-[#1A1A1A]`.
3. **Hover-only readability** — happens when a button's idle text inherits from a guard while only the `:hover` selector has `!important` color. Many ad-hoc buttons skip the locked primitives.
4. Each regression is patched with a new narrow selector, so the system grows without ever stabilizing.

## Solution: one primitive system, then replace broken styles

### 1. Add five locked CTA primitives in `src/index.css`

All five lock **every** state (`:link, :visited, :hover, :focus, :focus-visible, :active, :disabled, [aria-disabled="true"], [data-state="open"], [aria-pressed="true"], [aria-current]`) and force the same color on the element AND descendant `span / p / small / strong / em / svg / [class*="lucide"]` so guards never strip them:

- `.jj-cta-dark` — navy `#102540` bg, hover `#1a3d63`, white text + icons, 1px gold hairline. Replaces every `bg-[#1A1A1A] text-white` / `bg-black text-white` button.
- `.jj-cta-champagne` — champagne `#EFE6D6` bg, hover `#E5D9C2`, ink `#1A1A1A` text + icons, 1px gold hairline. Replaces every `bg-[#EFE6D6] text-…` button and the Get Verified pill.
- `.jj-cta-outline` — transparent bg, ink text + icons, 1px ink/gold border; hover fills cream.
- `.jj-pill-active` — for `[aria-current]/[aria-pressed]/[data-active]/[data-state="active"]` tab pills: cream fill + ink text + 1px gold hairline. Idle siblings stay ink-on-transparent.
- `.jj-cta-disabled` — applied automatically via `:disabled, [aria-disabled="true"]` selectors on the four primitives above: 60% opacity, locked colors, `cursor-not-allowed`. No state collapses text to transparent.

Each primitive uses a `:where(...)` wrapper to keep specificity low for the base shape, plus a high-specificity `:is(:hover, :focus, :active, :disabled, [data-state], [aria-current], [aria-pressed])` block with `!important` on `color`, `-webkit-text-fill-color`, `stroke`, `opacity`. The text/icon color rule targets both the element and its descendants so nested spans/icons never inherit from an outer guard.

### 2. Strengthen the existing guards (no removal, just cover the gaps)

In `src/index.css`:

- Generalise the cookie-banner navy-text lock (lines 4551–4560) so it triggers on any button matching `bg-[#1A1A1A] text-white` regardless of wrapper. (Effectively merges with the Black-CTA→Navy rule already at lines 4682–4715 and removes the need for the `[data-chrome="cookie-banner"]` selector.)
- Add a "champagne pill inside dark banner" exception: when an element has `.jj-cta-champagne` (or `[data-cta="champagne"]`) it must NOT inherit white from the parent-dark-surface rule at lines 4205–4221 and the re-assert rule at lines 4246–4258. Add `:not(.jj-cta-champagne):not([data-cta="champagne"])` to those selectors.
- Add a final-word block: any element matching `[data-cta]` wins over every prior guard and over runtime `contrastGuard.ts` (which already respects `[data-no-contrast-guard]`; we'll extend it to also skip `[data-cta]`).

### 3. Replace broken styling at the known offender sites

- `src/components/CookiesConsentBanner.tsx` — Accept All → `jj-cta-champagne`, Reject All → `jj-cta-outline`, Manage Preferences → `jj-cta-dark`.
- `src/components/verification/VerificationBanner.tsx` — Get Verified pill → `jj-cta-champagne` (keep gold shimmer overlay decorative).
- `src/components/home/PartnerVerifyHeroCTA.tsx` — same pill family → `jj-cta-champagne` (verified state) or `jj-cta-dark` (Open Portal on dark band).
- Sweep `bg-[#1A1A1A] text-white` / `bg-black text-white` buttons that are NOT already locked (`requireOwnerAuth` admin tools excluded) and migrate to `jj-cta-dark`. Use ripgrep to enumerate and migrate in one pass.
- Sweep `bg-[#EFE6D6]`/`bg-[#FDFBF7]` + `text-white` accidental combos and migrate to `jj-cta-champagne`.
- Portal tab pills (`role="tab"`, `aria-current`, `data-state="active"`) — adopt `jj-pill-active` so idle + active are both readable.

### 4. Add a CI lint to prevent regressions

`scripts/contrast/check-cta-primitives.mjs`:

- Fails build on raw `className="bg-[#1A1A1A] text-white …"` or `bg-black text-white` in `<a>`, `<button>`, `[role="button"]` elements (allowlist for already-migrated files).
- Fails build on `bg-[#EFE6D6]`/`bg-[#FDFBF7]` paired with `text-white` / `text-[#FDFBF7]` / `text-white/*` in interactive elements.

### 5. Verification

After implementation, navigate the preview to `/` and confirm idle + hover for:

- Cookie consent: Accept All / Reject All / Manage Preferences.
- Verification banner: Get Verified.
- Hero PartnerVerifyHeroCTA.
- Portal mode chip + sidebar tabs.
- Featured listings cards' Save / Share / View buttons.
- Footer CTAs.

For each, capture a viewport screenshot in idle state, hover the button via `browser--act`, and screenshot again. Reject the fix if any text is invisible or low-contrast in either state.

## Memory updates

- Add `mem://ui-ux/visual-standards/cta-primitive-system` describing the five primitives, the `[data-cta]` opt-out for runtime guard, and the CI lint.
- Update Core line about Black-CTA → Navy to reference the new primitives.

## Files touched

- `src/index.css` — add primitives + tighten guards (cookie + champagne-on-dark exceptions).
- `src/lib/contrastGuard.ts` (or wherever runtime guard lives) — skip `[data-cta]`.
- `src/components/CookiesConsentBanner.tsx`
- `src/components/verification/VerificationBanner.tsx`
- `src/components/home/PartnerVerifyHeroCTA.tsx`
- Migrated buttons surfaced by the ripgrep sweep (kept to interactive elements only; no behavior changes).
- `scripts/contrast/check-cta-primitives.mjs` (new) + wire into existing contrast CI script.
- `mem://index.md` + new memory file.
