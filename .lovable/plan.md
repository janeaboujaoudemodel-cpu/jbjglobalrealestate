## Goal

Every section on every page uses the SAME side gutter (the one currently seen on "Explore Our Services"). Only four sections stay full-bleed, and only on the homepage.

## Standard gutter (the "Explore Our Services" frame)

Update `PremiumSectionCard` so the default `contained` mode renders a real, visible premium gutter — not the current near-flush `px-2 md:px-3`:

```
inner = "w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12"
```

This becomes the single source of truth for the site-wide section width. Every section wrapped in `<PremiumSectionCard>` will sit inside this frame, identical to Explore Our Services.

## Full-bleed exceptions (homepage only)

These four sections keep `width="full"` on `/` and ONLY on `/`:

1. Verification banner — "Join us in building a safer community"
2. Overseas Investors — "Invest in Dubai from anywhere"
3. Homepage Book Marquee — "Explore Our Guides & Reports"
4. Developer Partners Marquee (the developer logos strip under hero)

Everything else on the homepage uses the contained gutter, including:
- Continue Searching (currently `width="full"` → revert to contained)
- Featured Listings, Resale, Mortgage Calculator, Toolkit, AI Comparison, Podcast, Areas We Cover, Developer Portal CTA, Explore Our Services (already contained)

## Other pages

`PremiumSectionCard` is only used in `src/pages/Index.tsx` today, so no other page edits are required. The new default gutter automatically applies anywhere the component gets adopted later, with no `width="full"` allowed outside the four homepage exceptions above.

## Files to change

1. `src/components/ui/premium-section-card.tsx`
   - Change `contained` inner to `w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12`.
   - Keep `width="full"` behavior unchanged (`w-full`, edge-to-edge).
   - Keep `contained` as the default.

2. `src/pages/Index.tsx`
   - Line 319 (Continue Searching): remove `width="full"` → falls back to contained.
   - Line 291 (Verification banner): keep `width="full"`.
   - Line 337 (Overseas Investors): keep `width="full"`.
   - Line 346 (Guides & Reports marquee): keep `width="full"`.
   - Developer Partners Marquee (line 278) already renders outside `PremiumSectionCard` and stays as-is (visually full-bleed).

## What this fixes

- All "card" sections (Featured Listings, Explore Our Services, Toolkit, AI Comparison, Mortgage, Resale, Podcast, Areas, Developer Portal CTA, Continue Searching) align to the exact same left/right gap.
- The four marketing strips that need to breathe edge-to-edge remain full-bleed on the homepage only.
- Future sections automatically inherit the standard gutter — no per-section width decisions.
