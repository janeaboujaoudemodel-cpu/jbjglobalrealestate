
# Fix: News Fake Photos, Press Kit Privacy, Insights Dropdown, and Missing Navigation Links

## Issues Found

### Issue 1: News articles showing with no images (not "fake" photos)
The database shows that most news articles have `image_url: NULL`. The `ai-news-collector` enrichment pass is supposed to scrape real images from source URLs using Firecrawl, but many articles remain un-enriched. The "Aldar delivers 36%" article and others simply have no image at all -- the News page likely shows a fallback/placeholder when `image_url` is null.

**Fix:** Run the enrichment pass to scrape real images from source URLs. Also add a proper "no image" fallback in the News page that shows a branded JBJ gradient card instead of any stock/placeholder photo. Ensure the `ai-news-collector` "enrich" action is triggered to fill missing images from actual article sources.

### Issue 2: Press Kit page shows founder content publicly
The PressKit page (`src/pages/PressKit.tsx`) imports founder photos and displays them without being wrapped in `FounderContent`. When founder visibility is toggled off, the page still shows all founder photos and personal details.

**Fix:** Wrap founder-specific sections (headshots gallery, personal bio) with `<FounderContent>`. Keep company-level content (company overview, brand assets, contact info) always visible. The page stays accessible but only shows company information when the founder toggle is off.

### Issue 3: Insights mega-menu cannot scroll / content cropped
The `MegaMenuShell` in `mega-menu-primitives.tsx` has broken `noScroll` logic. Lines 38-44 show that both the `noScroll: true` and `noScroll: false` branches produce the **exact same CSS** -- both set `maxHeight` and `overflowY: 'auto'`. The intent of `noScroll` was to have NO max-height so content fits naturally, but the implementation is identical in both branches. On smaller screens or when content exceeds viewport, items get cropped.

**Fix:** When `noScroll` is true, remove `maxHeight` entirely and set `overflowY: 'visible'` so the content renders at its natural height. Keep the existing auto-scroll behavior for `noScroll: false`.

### Issue 4: "Company News" link opens the same News page
The link `/news?category=company` does open the News page and sets the category filter to "Company News". However, the filter only works on initial load via `categoryParam`. If the user navigates from an already-loaded News page, the category won't update because the state is initialized once.

**Fix:** Add a `useEffect` to sync the `selectedCategory` state with URL search params so clicking "Company News" from the dropdown always activates the correct filter.

### Issue 5: Awards page missing from Company card in Insights dropdown
Awards IS actually present in the MegaMenuInsights Company card (line 89). This is already correct. The user may not have seen it because the content was cropped (Issue 3).

### Issue 6: Missing pages from footer and header navigation
Multiple pages exist in the router but are NOT in the footer:
- `/e-signature` -- E-Signature Dashboard (in footer as "E-Signature" under Professional Tools but links to wrong path)
- `/contract-forms` -- Contract Forms (NOT in footer)
- `/document-scanner` -- Document Scanner (in footer)
- `/reviews` -- Reviews (in footer under About)
- `/company-profile` -- Company Profile (in footer under About)
- `/philanthropy` -- Philanthropy (in footer under About)

Pages that need to be added to footer:
- `/contract-forms` -- needs to be in Services or Legal card
- `/investor-dashboard` -- needs to be in Investor Hub
- `/investor-services` or `/investors` -- needs to be in Investor Hub
- `/referral-partner` -- needs to be in Services

### Issue 7: News hero section needs video
The News page already imports `heroVideo` from `@/assets/videos/press-kit-hero.mp4` (line 12) but the current hero section does not use a video background.

**Fix:** Add the video as a background to the News hero section, similar to how PressKit does it.

### Issue 8: News category labels need premium styling
The category badges on news cards should use premium styling consistent with the UI design system.

---

## Technical Plan

### File 1: `src/components/header/mega-menu-primitives.tsx`
**Fix the noScroll logic (lines 38-44):**
- When `noScroll` is true: remove `maxHeight` and set `overflowY: 'visible'` so all 8 cards display without cropping
- When `noScroll` is false: keep existing `maxHeight` + `overflowY: 'auto'`

### File 2: `src/pages/PressKit.tsx`
**Wrap founder sections with FounderContent:**
- Wrap the founder headshots gallery section with `<FounderContent>`
- Wrap any personal bio/founder detail sections with `<FounderContent>`
- Keep company overview, brand guidelines, and media contact sections always visible
- Add a company-focused fallback section when founder is hidden

### File 3: `src/pages/News.tsx`
**Three changes:**
1. Add `useEffect` to sync `selectedCategory` with URL `category` param on navigation
2. Add video background to the hero section using the already-imported `heroVideo`
3. Improve the fallback for articles with no image -- show a branded gradient card with category icon instead of broken/missing image
4. Upgrade category badge styling to premium look (semi-transparent dark background with gold accents)

### File 4: `src/components/Footer.tsx`
**Add missing pages to footer cards:**
- Add `/contract-forms` (RERA Contract Forms) to the Services card
- Add `/investor-dashboard` to Investor Hub links
- Add `/referral-partner` (Referral Partner) to Services card
- Verify E-Signature link points to `/e-signature`

### File 5: `src/components/header/MegaMenuInsights.tsx`
**Add missing links:**
- Add "Reviews" to Company card
- Add "Education Hub" link to Guides card
- Add "Contract Forms" to Services card

### Deployment
No edge function changes needed. No database changes needed. All changes are frontend only.

## Summary Table

| File | Change |
|------|--------|
| `src/components/header/mega-menu-primitives.tsx` | Fix noScroll: remove maxHeight when true, allow natural content height |
| `src/pages/PressKit.tsx` | Wrap founder photos/bio with FounderContent; keep company sections visible |
| `src/pages/News.tsx` | Sync category filter with URL; add hero video; fix no-image fallback; premium badges |
| `src/components/Footer.tsx` | Add contract-forms, referral-partner, investor-dashboard links |
| `src/components/header/MegaMenuInsights.tsx` | Add Reviews, Education Hub, Contract Forms links |
