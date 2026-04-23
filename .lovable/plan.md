

## Goal

Establish a single, consistent vertical rhythm between all homepage sections (and globally across pages that use the same pattern) so the spacing never looks broken or inconsistent.

## Root cause

Today every section sets its own `py-*` (ranging from `py-10` → `py-28`), and `<SectionDivider>` adds another `py-4 md:py-6` on top. Stacked together, the gaps between sections vary wildly:

| Stack | Today's gap (md+) |
|---|---|
| `py-16` + divider(`py-6`) + `py-24` | ~160px |
| `py-10` + divider(`py-6`) + `py-12` | ~88px |
| `py-28` + divider(`py-6`) + no padding | ~136px |
| Some sections with NO `py-*` next to others with `py-20` | Visually broken |

That inconsistency is what the user is seeing.

## Fix — one rhythm token, applied globally

### 1. Standardize `SectionDivider` to be the sole spacer

Update `src/components/ui/section-divider.tsx`:
- Padding becomes `py-10 md:py-14` (was `py-4 md:py-6`).
- The hairline rule stays (still a faint divider line in the middle).
- This makes the divider itself the "breathing room" between sections.

### 2. Neutralize section-level vertical padding on the homepage

In `src/pages/Index.tsx`, where a section is **already preceded and followed by `<SectionDivider />`**, the section becomes `py-0` (or `py-2 md:py-4` for sections that need a tiny inner buffer above/below their internal content). This eliminates the double-padding stacking.

Sections updated this way:
- Trust Bar (`py-12 md:py-16` → `py-0`)
- Explore Services (`py-12 md:py-20` → `py-0`)
- AI Home Finder (`py-16 md:py-24` → `py-8 md:py-10`, kept small because it has its own gradient background that needs internal buffer)
- Mortgage section (`py-12 md:py-16` → `py-0`)
- Podcast (`py-20 md:py-28` → `py-10 md:py-14`, has dark background)
- Any other section with a colored/gradient background keeps minimal internal padding (`py-8 md:py-10`) so the colored block doesn't hug the divider line.

Rule of thumb codified in a code comment at the top of `Index.tsx`:
> Sections wrapped between `<SectionDivider />` should use `py-0`. Sections with a distinct background (colored / gradient / dark) use `py-8 md:py-10` so the background block has internal breathing room.

### 3. Same treatment on other pages using `SectionDivider`

Apply the same audit to:
- `src/pages/AIHub.tsx` (5 dividers)
- `src/pages/BuyerGuide.tsx`
- `src/pages/BrokerHub.tsx`
- Any other page surfaced by the search (15 files total)

For each: if a section already has a divider above and below, drop its `py-*` to `py-0` (or keep small internal padding if it has a background). No content removed — only padding values normalized.

### 4. Fix the bottom-of-page gap

The last section on `Index.tsx` (`SupportTicketBox`) currently has no divider after it and runs straight into the footer. Add a final `<SectionDivider fullWidth />` after it so the rhythm closes cleanly before the footer starts.

### 5. Fix the missing dividers at the top

Between Hero → DeveloperPartnersMarquee → VerificationBanner → DeveloperPortalCTA there are **no dividers at all**, then suddenly a divider appears before TrustBar. Add `<SectionDivider fullWidth />` between DeveloperPortalCTA and the marquee/banner to make the top rhythm match the rest of the page.

## Files touched

- `src/components/ui/section-divider.tsx` — bump default padding to `py-10 md:py-14`.
- `src/pages/Index.tsx` — normalize all section `py-*` per the rule; add missing top + bottom dividers.
- `src/pages/AIHub.tsx`, `src/pages/BuyerGuide.tsx`, `src/pages/BrokerHub.tsx`, and the other 12 pages using `SectionDivider` — same normalization pass (only padding values change).

## Out of scope

- No content, copy, layout, component, or color changes.
- No removal of any sections (No-Removal policy).
- Section internal layouts (cards, grids, headers inside each section) are untouched — only the **outer** vertical padding.
- Mobile header / sidebar / row 2 filter bar untouched.

