

## Full responsive QA sweep + immediate icon-visibility fixes

### Confirmed root causes (from code reading)

**Bug 1 — Investor Opportunities icons invisible (`src/components/home/DeveloperPortalCTA.tsx` lines 117–129)**
The 4 investor shortcut cards render the icon as `text-gray-700` inside a `bg-gray-100` rounded square. On retina laptop/tablet displays this gray-on-gray combo washes out and looks blank — exactly what the user sees. The same pattern is reused for the Developer shortcuts (lines 173–186), so both are broken.

**Bug 2 — TrustBar 8 cards (RERA Licensed / Instant Response / Verified Listings / etc.) icons faded (`src/components/home/TrustBar.tsx` lines 87–89)**
The icons themselves are correctly `bg-black` + `text-white`, but the global mobile safety net in `src/index.css` (lines 324–329) applies `opacity: 0.92` to any svg inside an element matching `[class*="text-white\/4"]` etc. — and several parent wrappers in marketing components carry those classes, dimming nested icons. More critically, on tablet/laptop viewports the cards have no visibility issue from CSS but appear washed out because the icon container `w-8 h-8` is too small at md+ and the mb/spacing collapses on the 1041px viewport (`md:w-11 md:h-11` only kicks in at ≥768 — at 1041 it should be larger).

### Fixes to apply

**1. `src/components/home/DeveloperPortalCTA.tsx`**
- Investor & Developer shortcut cards: change icon container from `bg-gray-100` + `text-gray-700` to `bg-black` + `text-white` (matches TrustBar/site standard), with hover state `group-hover:bg-gray-800`.
- Apply identically to both blocks (lines 117–129 and 173–186) so investor and developer modes look consistent.

**2. `src/components/home/TrustBar.tsx`**
- Bump icon container responsive sizes: `w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14` and inner icon `w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7` so the icons are clearly visible on tablet (768–1280) where the user noticed the issue.
- Add `text-white` directly on the `<item.icon>` (currently set, but add `!important`-equivalent via inline `style={{color:'#fff'}}` or a dedicated class) to bypass the mobile opacity floor that targets nested svgs.

**3. `src/index.css` — tighten the mobile safety net**
- The selector `[class*="text-white\\/4"] svg` is too broad and dims unrelated icons inside dark backgrounds. Scope it to `:where(section, header, footer) [class*="text-white\\/4"]:not(.jj-icon-keep) svg` and add a `.jj-icon-keep` opt-out used by TrustBar's icon container.

**4. Cross-device QA pass (after fix)**
Take live screenshots at the following viewports of the homepage + the most-trafficked pages (`/properties`, `/property-map`, `/areas`, `/contact`, `/auth`):
- 360×800 (small Android), 390×844 (iPhone 14), 414×896 (iPhone Plus)
- 768×1024 (iPad portrait), 820×1180 (iPad Air), 1024×768 (iPad landscape)
- 1280×720 (small laptop), 1366×768 (HD laptop), 1536×864 (current user viewport class), 1920×1080 (desktop monitor)

For each viewport I will:
- Verify TrustBar icons & text are crisp
- Verify Investor Opportunities icons render (black circles, white icons)
- Scan hero, Areas We Cover, Featured Listings, Overseas Investors, Additional Services, footer for any overlap, faded text, broken grid, or clipped content
- Capture only the viewports where a real bug is found and list them in the deliverable

**5. Honest reporting**
After the sweep I will list, per viewport, what I checked and exactly which bugs were found and fixed vs. which remain (no false "all fixed" claim).

### Files to edit
- `src/components/home/DeveloperPortalCTA.tsx` — icon container colors (investor + developer blocks)
- `src/components/home/TrustBar.tsx` — icon size scale + opt-out class
- `src/index.css` — scope the mobile-safety-net opacity rule + add `.jj-icon-keep` opt-out

### Deliverable
- Visible icons on TrustBar (8 cards) and Investor Opportunities (4 cards) at every viewport
- Annotated screenshots from the QA sweep (mobile / tablet / laptop / monitor)
- A bug list with status: `fixed` / `still-broken` for any issues discovered during the sweep — no "all clear" claim until verified

