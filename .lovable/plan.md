# Contact page contrast audit + sitewide hero-on-media fix

## Root cause (audited live in browser)

The Contact page hero shows the title, eyebrow, and intro paragraph as **near-invisible "black on dark"**, even though the source code sets them to solid white. The contact-info card row also looks washed out: gold values on champagne is too low-contrast and the same-tone runtime guard keeps re-bleaching it.

Tracing it:

- `src/utils/contrastGuard.ts` walks every text node, computes the effective background by climbing parents until it finds a non-transparent `backgroundColor`. **Gradient and `<video>` backgrounds return transparent** to `getComputedStyle().backgroundColor`, so the climb walks past them.
- It eventually falls back to the hard-coded page color `rgb(253, 251, 247)` (champagne).
- White text vs champagne fails contrast, so the guard **forces the color to `#1A1A1A`** — turning the hero into invisible black-on-dark.

This same flaw affects every page with a video/image/gradient hero (Contact, Services, Areas, Resale, About, Founder, Awards, etc.). Per the user, the fix must be sitewide.

## Plan

### 1. Harden the runtime contrast guard (single sitewide fix)

`src/utils/contrastGuard.ts` — teach `effectiveBgColor` to:

1. Honor any ancestor's `data-surface` attribute when the element itself has no opaque background:
   - `dark` / `ink` → treat as dark surface (white text passes, black gets flipped).
   - `gold` → treat as gold surface.
   - `page` / `champagne` / `light` → treat as champagne.
2. When climbing finds a gradient or image background but no `data-surface` hint, return a sentinel `"__unknown__"` and **skip guarding that node** (`fixIfLowContrast` early-returns) instead of guessing champagne. Better to leave authored colors alone than to invert hero text into oblivion.

This single change unblocks every hero section that already declares `data-surface="dark"` (Contact does) and stops false positives across photo/video heroes that don't.

### 2. Contact page (`src/pages/Contact.tsx`)

Defensive `data-no-contrast-guard` on hero text + small text-color fixes the user actually sees as broken:

- Hero `<section data-surface="dark">` already correct; add `data-no-contrast-guard` on the `<h1>`, eyebrow `<p>`, and the two intro `<p>` tags as belt-and-braces. Strengthen the scrim from `from-black/80 via-black/70 to-black` to `from-black/90 via-black/75 to-black/95` so the title reads cleanly even on bright dawn footage.
- Contact info cards (Location / Phone / Email / Business Hours): swap the value text from `text-gold` → `text-[#1A1A1A]/80` (gold-on-champagne is the weak link the user is pointing at). Title stays ink semibold; only the value changes. Hover treatment unchanged.
- "Prefer to Reach Us Directly" WhatsApp/Call cards: same swap — `text-gold text-sm` → `text-[#1A1A1A]/80 text-sm` for phone numbers under the channel name.
- Form labels currently on `text-[#1A1A1A]/70` — bump to `text-[#1A1A1A]` for primary required fields (Full Name, Email, Phone). Optional/secondary labels stay at /70. Helper text and `text-muted-foreground` underneath the referral input → `text-[#1A1A1A]/60`.

### 3. Sitewide hero hardening

Add `data-no-contrast-guard` to the hero text (eyebrow, h1, lead paragraph) on the other pages most affected by this same pattern, so even authors who forget `data-surface="dark"` don't get bleached out:

- `src/pages/Services.tsx`
- `src/pages/About.tsx`
- `src/pages/Founder.tsx`
- `src/pages/Awards.tsx`
- `src/pages/Reviews.tsx`
- `src/pages/Resale.tsx`
- `src/pages/Areas.tsx`
- `src/pages/Communities.tsx`

For each: locate the first `<section>` containing the page hero, ensure it has `data-surface="dark"`, and add `data-no-contrast-guard` to the eyebrow, `<h1>`, and lead `<p>` so guard #1 above never touches them.

### 4. Memory update

Refresh `mem://ui-ux/visual-standards/universal-same-tone-contrast-guard`:
- Document the gradient/video-hero failure mode and the new `data-surface` ancestor lookup.
- State that hero text with media backgrounds must EITHER set `data-surface="dark"` on the section OR opt out per-element with `data-no-contrast-guard`.

## Files changed

- `src/utils/contrastGuard.ts` — `effectiveBgColor` honors ancestor `data-surface` and bails on unknown gradient/image surfaces.
- `src/pages/Contact.tsx` — hero opt-out + scrim strength + ink values on contact cards / direct-contact CTAs.
- `src/pages/Services.tsx`, `About.tsx`, `Founder.tsx`, `Awards.tsx`, `Reviews.tsx`, `Resale.tsx`, `Areas.tsx`, `Communities.tsx` — add `data-surface="dark"` + `data-no-contrast-guard` on hero text where missing.
- `mem://ui-ux/visual-standards/universal-same-tone-contrast-guard` — updated standard.

## Out of scope

- Form layout, validation, copy, or feature behavior — the structure stays exactly as it is. Only colors and the guard logic move.
- The "No Removal" policy is respected throughout.
