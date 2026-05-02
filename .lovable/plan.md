## Homepage cleanup, merge & podcast gating

The homepage today scrolls long with overlapping value propositions. We will tighten it by removing four sections, merging the Dubai stats into the international-investor banner, slimming Areas We Cover to a curated Top 4, and making the JBJ Podcast (The JBJ Perspective) hidden from the owner's homepage too — controlled by the existing admin toggle.

### What changes on the homepage

```text
BEFORE                                AFTER
-----------------------------------   -----------------------------------
Hero / Categories / Partners          Hero / Categories / Partners
Trust Bar                             Trust Bar
Featured Listings                     Featured Listings
Resale Properties                     Resale Properties
Find Your Starting Point      ✗ remove
Overseas Investors Banner             Overseas Investors Banner
                                      └ + 4 Dubai stats merged in
Guides & Reports marquee              Guides & Reports marquee
Explore Our Services                  Explore Our Services
Toolkit Showcase                      Toolkit Showcase
AI Home Finder (purple card)  ✗ remove
AI Comparison Widget                  AI Comparison Widget
Mortgage Calculator                   Mortgage Calculator
Why Dubai Capital section     ✗ merged into Overseas Investors
JBJ Podcast (owner-only today)✗ hidden everywhere unless toggle ON
Why Choose Us                 ✗ remove
Areas We Cover (8 areas)              Top Areas (Top 4, trending first)
Testimonials                  ✗ remove
```

### Section-by-section detail

1. **Remove Find Your Starting Point** — drop the `<StartingPointSection />` block and its surrounding divider in `src/pages/Index.tsx`. Remove the unused `lazy`/`chunkImports` entries (and the preload reference) so the chunk is no longer fetched.

2. **Remove AI Home Finder purple card** — delete the inline `<section>` (lines ~409–462 in `Index.tsx`) along with one neighbouring `<SectionDivider />` to keep the rhythm. Remove the now-unused `Sparkles, ArrowUpRight` imports only if no other usage remains.

3. **Merge Why Dubai → Overseas Investors**
   - In `src/components/home/OverseasInvestorsBanner.tsx`, add a 4-stat strip above the existing 6-tile highlights grid with: `0% Income Tax`, `10Y Golden Visa`, `#1 Safety Rank`, `200+ Nationalities` (same data the standalone section uses). Style: champagne `#F7F2EA` cards with `#1A1A1A` icon tile and gold accent — matches the current section.
   - Tighten the heading copy to keep it as one cohesive section ("Invest in Dubai From Anywhere in the World" remains the H2; sub-line incorporates the global-hub framing).
   - Delete the `<WhyDubaiCapitalSection />` mount and its divider from `Index.tsx`. Remove the lazy import and the `WhyDubaiCapitalSection.tsx` file.

4. **Hide JBJ Podcast on the owner homepage too**
   - Update `src/components/home/PodcastVisibilityGate.tsx`: remove the unconditional `if (isOwner) return children` early return so the gate honours `isPodcastVisible` for everyone. The owner can flip it on whenever they want via the existing admin toggle.
   - The toggle already exists in two places — `src/pages/Admin.tsx` and `src/pages/owner/OwnerFounderSettings.tsx` — both call `<PodcastVisibilityToggle />`. We will refresh its copy to make clear it now controls the section for *all* viewers (including the owner), removing the "Testing Mode — you always see it" notice that no longer applies.
   - Default state remains `enabled: false` in `site_settings.podcast_visibility`, so post-deploy the podcast is hidden everywhere until the owner enables it.

5. **Remove Why Choose Us** — drop the `<WhyChooseUs />` mount and the surrounding divider from `Index.tsx`. Remove its lazy import.

6. **Top Areas (Top 4)**
   - Rename the section in `src/components/home/AreasWeCover.tsx`: badge label and H2 become `Top Areas` (with translation keys `areas.topLabel` / `areas.topTitle`, falling back to "Top Areas").
   - Reduce the limit from 8 to 4 and reorder so trending + high-demand surface first. The hook query orders by `property_count desc`; we'll change the call to fetch up to 12 and pick the first 4 after sorting client-side: `is_trending` first, then `is_high_demand`, then highest `property_count`. This guarantees the curated 4 are the most demanded.
   - Grid stays `grid-cols-2 md:grid-cols-4`, so 4 cards fit one row on desktop and 2×2 on mobile.
   - CTA button label switches to `Read Area Guides` linking to `/areas` (existing route). Keep the existing styling.

7. **Remove Testimonials** — drop the `<TestimonialsSection />` mount from `Index.tsx`. Remove its lazy import.

### Technical details

Files touched:

- `src/pages/Index.tsx` — remove four section mounts (StartingPoint, AI Home Finder inline section, WhyDubaiCapital, WhyChooseUs, Testimonials), prune lazy imports + `chunkImports` entries + preload list, clean unused `lucide-react` imports.
- `src/components/home/OverseasInvestorsBanner.tsx` — add 4-stat strip merged from WhyDubaiCapitalSection.
- `src/components/home/WhyDubaiCapitalSection.tsx` — delete file.
- `src/components/home/AreasWeCover.tsx` — limit 4, sort by trending/high-demand, rename to "Top Areas", CTA label "Read Area Guides".
- `src/components/home/PodcastVisibilityGate.tsx` — remove owner bypass.
- `src/components/admin/PodcastVisibilityToggle.tsx` — update copy (remove testing-mode bullet that says owners always see it).

No DB changes. No new routes. No new components. The existing `site_settings.podcast_visibility` row + `set_podcast_visibility` RPC continue to drive visibility.

### Out of scope

- No changes to translations beyond the two new "Top Areas" keys (others already exist).
- No layout or styling changes to surviving sections.
- The standalone `/areas` page, podcast studio, and admin podcast toggle behaviour are unchanged aside from the copy refresh.
