## Audit

I reproduced the issues and traced every one to a single CSS rule. Here is what I found, with the actual code references.

### Reported issues

| # | Issue | Verified? |
|---|------|-----------|
| 1 | Investor Opportunities cards: black box + black title + black icons | Yes — root cause identified |
| 2 | "Tell us who you are": white icon on white box, icon touching text, Continue misaligned | Yes — root cause identified |
| 3 | 8 trust cards on home (RERA, Instant Response, Verified Listings, Award Winning, …): black-on-black | Yes — root cause identified |
| 4 | "Get Verified" button after developer names: black-on-black | Yes — root cause identified |
| 5 | Sidebar Contact + Support icons should be red, text should be black (last turn made them white) | Code already says red icons + ink text — must verify in screenshot after fix; will harden the colours so no guard can override |
| 6 | "Same thing across all pages, backend, forms, task popups" | Same root cause covers any champagne card with a nested dark icon tile or black CTA |

### Root cause

In `src/index.css` lines 3635–3640 there is a "PASS 5" contrast guard:

```css
.bg-[#FDFBF7] :is(.text-white, .text-[#FDFBF7], .text-[#F7F2EA]),
.bg-[#F7F2EA] :is(.text-white, .text-[#FDFBF7], .text-[#F7F2EA]),
.bg-[#EFE6D6] :is(.text-white, ...):not(.allow-white) {
  color: #1A1A1A !important;
}
```

This rule says: "any white text inside a champagne card gets forced to ink." It is correct in spirit, but the descendant combinator (` `) recurses into ALL descendants — including nested **dark** wrappers. So:

- TrustBar card: `bg-[#FDFBF7]` card → `bg-[#1A1A1A]` icon tile → `text-white` icon → forced to `#1A1A1A` → **black icon on black tile**.
- DeveloperPortalCTA Investor Opportunities cards (`src/components/home/DeveloperPortalCTA.tsx:117-129`): same exact pattern.
- VerificationBanner "Get Verified" button (`src/components/verification/VerificationBanner.tsx:57-63`): `bg-[#F7F2EA]` parent → `bg-[#1A1A1A]` button → `text-white` label → forced to ink → **black-on-black button**.
- CategorySelectorSection (`src/components/home/CategorySelectorSection.tsx:101-103`): hover state turns the icon tile dark, the icon is `text-white` → inverted to ink → **invisible icon, looks like a white-on-white box because the tile only goes dark on hover**.

The runtime guard `src/utils/contrastGuard.ts` only walks interactive elements (`button, a[href], …`) so it doesn't double up on cards, but it doesn't fix this either.

### Sidebar Contact + Support audit

`src/components/navigation/GlobalVerticalNav.tsx:1246-1259` already has:
- Text: `text-[#1A1A1A]/80` (near-black ink, correct)
- Icons: `<Headphones text-red-600>` and `<Ticket text-red-600>` (red, correct)

So the user's "all white" claim doesn't match current code. I will harden it to make absolutely sure no guard or inheritance can turn it white: set the text to solid `#1A1A1A` (no /80 fade) and add inline `style={{ color: '#DC2626' }}` to the icons so any future cascade can't override them.

## Fix plan

### 1. `src/index.css` — fix the over-aggressive PASS 5 rule

Replace the white→ink override with a version that:
1. Keeps the existing inversion for white text directly inside champagne surfaces.
2. **Re-asserts** `color: #FDFBF7` on white text/icons that sit inside any nested dark surface (`bg-[#1A1A1A]`, `bg-foreground`, `bg-black`) inside the champagne card. The re-assertion comes later in source order at equal specificity, so it wins.
3. Adds `:not([data-no-contrast-guard])` so any developer can opt out an element if needed.

This single change fixes issues #1, #2 (icon part), #3, #4, and any other location with the same composition pattern (CRM popups, task forms, dashboards). Zero JSX changes for those four.

### 2. `src/components/home/CategorySelectorSection.tsx` — fix layout polish

Independent of the colour bug, the card has these tweaks needed:
- Add gap between the icon tile and tagline (`mb-5` is fine; the issue is the icon tile + tagline live in the same `flex justify-between` row; on narrow widths they touch). Add `gap-3` to the parent flex.
- "Continue" + arrow row: keep current alignment but ensure the button's bottom row uses `justify-between` properly with `pt-4 border-t` — already correct in code. Re-check after rendering.
- Replace the reported "Continue button is not aligned" by adding `w-full` to the bottom row and keeping `justify-between`.

### 3. `src/components/navigation/GlobalVerticalNav.tsx` — harden Contact/Support pills

In the bottom-of-sidebar Contact + Support block (lines 1246-1259):
- Change text from `text-[#1A1A1A]/80` to solid `text-[#1A1A1A]` (no fade).
- Add `style={{ color: '#DC2626' }}` inline to the `<Headphones />` and `<Ticket />` icons so the red survives any future cascade.
- Add `data-no-contrast-guard` on each `<Link>` so the runtime contrast guard never inverts them.

### 4. Verification — full audit with screenshots

After the fixes I will:
1. Reload `/` in the browser.
2. Take a fresh screenshot of the hero + CTA pills row.
3. Scroll to and screenshot:
   - The 8 trust cards (TrustBar) — confirm white icons on dark tiles inside champagne cards.
   - The "Tell us who you are" section — confirm the icon stays visible on hover.
   - The "Investor Opportunities" 4-card grid — confirm icons + labels readable.
   - The "Get Verified" yellow banner — confirm button is dark with white text.
   - The sidebar bottom — confirm Contact/Support text is black and icons are red.
4. Post all screenshots back in chat as a written audit confirming each fix.

If any of those still fail visually after step 1's CSS change, I will iterate **in the same turn** rather than ending the response.

## Files to edit

- `src/index.css` — replace the PASS 5 white→ink rule with a nested-dark-aware version (~25 lines around line 3635).
- `src/components/home/CategorySelectorSection.tsx` — minor flex spacing polish (1 prop change).
- `src/components/navigation/GlobalVerticalNav.tsx` — harden Contact/Support pill colours (lines 1246-1259).

No new files, no dependency changes, no DB changes.