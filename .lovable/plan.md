I will implement this in strict batches and validate each batch before moving to the next. I will not claim completion without screenshot proof.

Batch 1 — Global emerald ombre rule lock
- Add one canonical emerald system in `src/index.css`:
  - approved fill = the current Free Consultation/search-filter dark emerald-to-black ombre
  - no gold on emerald surfaces at rest, hover, focus, active, disabled
  - white text/icons/SVG strokes on emerald fill
  - emerald-only glow/border, with stronger glow only on hover where requested
- Extend the lock to approved primitives used by buttons, pills, filter bars, sidebar rows, sliders, and newsletter fields.
- Remove/override lingering gold hover/border rules that affect emerald UI.
- Validation: inspect the computed CSS in preview for affected buttons and capture screenshot of hero/top-area button states.

Batch 2 — Hero search/filter bar
- Update `HomeHeroSearch.tsx` and CSS so the Search segment exactly matches the Free Consultation segment color/fill.
- Remove the brighter Search button fill and all gold borders/dividers.
- Add an animated emerald/black border/glow around the full filter bar.
- Replace current sentence-swap placeholder with real letter-by-letter type/delete animation cycling through the requested phrases, only while the input is empty.
- Keep user typing fully functional.
- Reduce any remaining heavy hero overlay/shadow only enough to reveal the video while preserving headline contrast.
- Validation screenshot: desktop hero showing unified Search / Free Consultation styling and visible video.

Batch 3 — Newsletter / Stay in the Loop
- Update `NewsletterBrevo.tsx` compact variant and CSS:
  - Enter Your Email placeholder types/deletes letter-by-letter, not word-by-word
  - input fill matches approved emerald ombre
  - submit button fill matches the input, not lighter green
  - no gold border at rest or hover
  - glow appears on hover only for the submit button/input as requested
  - all text/icons remain white
- Validation screenshot: Ready to Get Started / Stay in the Loop section.

Batch 4 — Vertical sidebar categories and subcategories
- Update `GlobalVerticalNav.tsx` and sidebar CSS:
  - top highlight rows from AI Home Finder through Resale Properties use the same emerald main-category style as Tools & Workspace/My Account
  - all main categories remain white text/icons on emerald at rest and hover, never gold
  - hover adds 3D emerald glow only
  - My Account subcategory rows lose the white filled highlight boxes
  - subcategory labels become white, icons emerald, icon borders white/emerald animated as requested
  - active/hover subcategory states use emerald reversal/glow, never gold
- Validation screenshot: expanded sidebar with AI Home Finder through My Account and Billing & Subscriptions visible.

Batch 5 — Explore Our Services and JBJ Royal Tools Hub
- Update `ExploreServicesExpander.tsx` and `ToolkitShowcaseCard.tsx`:
  - remove thick white/champagne divider between section header and tab bar
  - replace it with a thin emerald glow divider
  - service/tool tab header uses static emerald ombre for inactive tabs
  - active tab uses metallic animated emerald treatment
  - tab labels/icons and active panel title/subtitle stay white
  - no gold hover/borders in these headers/tabs
- Validation screenshot: Explore Our Services and JBJ Royal Tools Hub headers/tabs.

Batch 6 — Home CTAs, top areas, project contact buttons, continue-searching cards
- Update `AreasWeCover.tsx`, `ProjectCard.tsx`, `ContinueSearching.tsx`, `OverseasInvestorsStrip.tsx`, and related CTA CSS:
  - Top Areas Explore button text forced white on emerald; Read Area Guides and Explore All Areas use emerald CTA styles, not black/gold
  - Handpicked project card Email/Call/Chat titles/icons white on emerald
  - Continue Searching bottom overlay becomes reduced emerald style so more photo remains visible; developer/project text remains readable without black block dominance
  - Invest in Dubai strip becomes animated/premium emerald instead of static black
  - View Library / Explore Guides and Reports buttons use emerald styling where present
  - 2026 rights reserved and page up/down arrow adopt emerald, with a premium arrow style and hover 3D glow
- Validation screenshots: Top Areas, Handpicked cards, Continue Searching, overseas strip, footer/up-arrow.

Batch 7 — Verification / portal straps
- Update `VerificationBanner.tsx` and `ModePortalBanner.tsx`:
  - Get Verified button matches Open Investor Portal button shape, border treatment, emerald fill, and 3D hover glow
  - Get Verified strap and portal strap use opposite emerald gradient directions so they do not visually merge
  - remove gold hairlines from this emerald pair
- Validation screenshot: Get Verified + portal banners.

Batch 8 — Mortgage calculator layout and controls
- Update `MortgageCalculator.tsx`, `MortgageParityPanel.tsx`, and the mortgage page styling:
  - title/icon accents use emerald ombre
  - slider fills use emerald, including Compare Two Bank Rates where the track currently has only a thumb
  - fix Compare rate slider responsiveness by matching the working range control styling and filled progress behavior
  - secondary buttons like Try Our AI Mortgage Calculator / Enter Manually use emerald 3D border while keeping secondary fill behavior
  - split the long calculator into a cleaner two-stage/easier layout consistent with the app’s UI/UX
  - remove gold from mortgage card borders/icons where it conflicts with emerald instructions
- Validation screenshot: mortgage calculator controls and Compare Two Bank Rates slider.

Batch 9 — Final user-path validation
- Navigate as a user through:
  - homepage hero
  - sidebar expanded/collapsed
  - Explore Services
  - JBJ Tools Hub
  - Top Areas
  - Handpicked cards
  - Continue Searching
  - Ready/Get in Touch/Stay in the Loop
  - Mortgage Calculator
  - footer/up-arrow
- Capture screenshots after each batch and one final set.
- Check browser console for runtime errors and inspect the specific CSS rules if any text still flips black/gold.

Technical files likely touched
- `src/index.css`
- `src/components/home/HomeHeroSearch.tsx`
- `src/components/marketing/NewsletterBrevo.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/home/ExploreServicesExpander.tsx`
- `src/components/home/ToolkitShowcaseCard.tsx`
- `src/components/home/AreasWeCover.tsx`
- `src/components/ProjectCard.tsx`
- `src/components/ContinueSearching.tsx`
- `src/components/home/OverseasInvestorsStrip.tsx`
- `src/components/verification/VerificationBanner.tsx`
- `src/components/home/ModePortalBanner.tsx`
- `src/components/MortgageCalculator.tsx`
- `src/components/mortgage/MortgageParityPanel.tsx`
- plus footer/back-to-top component once identified during implementation.