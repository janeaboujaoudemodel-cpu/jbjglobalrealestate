## Goal

Fix card layout per your exact spec across all three card components (`FeaturedListings`, `ProjectCard`, `ReellyProjectCard`):

1. **Price pill** → back to bottom-RIGHT of the card image (where it originally lived).
2. **Handover badge on the image** → REMOVED entirely.
3. **Handover date** → moves into the card content area, sitting at the very bottom of the card, right-aligned, styled as a premium pill (champagne bg, gold 1px hairline, ink text, tabular-nums).
4. **Gold premium divider** → sits directly above the handover date row, separating it from the developer name / content above.
5. Developer name stays as the single `<DeveloperLink />` already in place (no duplication).

## Resulting vertical order inside content area

```
location
title
description
by Developer            ← single DeveloperLink (gold)
─── gold gradient divider ───
[flex spacer pushes handover to bottom]
─── gold gradient divider ───        (separator above handover)
                       Handover: 2027-12-31   ← right-aligned premium pill
```

Note: only ONE divider is needed if the handover row sits immediately under developer (no other content between). I'll use a single gold divider directly above the handover row, with `mt-auto` on the handover wrapper to push it to the card bottom. This matches "above the handover you put a divider to separate from above content".

## Files to edit

- `src/components/home/FeaturedListings.tsx`
  - Image overlay: remove handover badge, restore price pill to `bottom-3 right-3`.
  - Content: keep single DeveloperLink, remove the existing divider directly under it, then at the very end of the content flex column add: `<div className="mt-auto"><hr gold gradient /><div className="flex justify-end pt-2"><span premium pill>{deriveHandover(...) || HANDOVER_FALLBACK}</span></div></div>`.

- `src/components/ProjectCard.tsx`
  - Image overlay: remove the top/bottom-right handover badge, restore price pill to `bottom-3 right-3`, move sale-status badge back to `bottom-3 left-3`.
  - Content: remove the existing "between developer/meta and description" divider duplication if it conflicts; append at the bottom of the content column the same `mt-auto` block with gold divider + right-aligned handover pill.

- `src/components/ReellyProjectCard.tsx`
  - Image overlay: remove handover badge, restore price pill to `bottom-3 right-3`.
  - Content: append the same `mt-auto` block with gold divider + right-aligned handover pill at the bottom.

## Handover pill styling (consistent across all three)

```tsx
<span
  data-no-contrast-guard
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
             bg-[#FDFBF7] border border-[#B89555]/40 shadow-sm
             text-[#1A1A1A] text-xs font-semibold tabular-nums handover-orange"
>
  <CalendarDays className="w-3 h-3 text-[#B89555]" aria-hidden />
  {deriveHandover(project) || HANDOVER_FALLBACK}
</span>
```

(Calendar icon already used elsewhere; falls back to "Coming soon" via `HANDOVER_FALLBACK`.)

## What I will NOT touch

- DeveloperLink component, deriveHandover util, price formatting logic, data fetching.
- No removal of any other feature, badge, or content per the No-Removal policy.
- No changes outside these three card components.
