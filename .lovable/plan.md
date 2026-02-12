
## Fix Build Error + Filter Bar Layout + AI Analyzer

### Critical Issue: Build Size Exceeds 512MB Limit

The project build fails because the total encoded size (520MB) exceeds the 512MB limit. The most likely cause is the 3 video files in `public/videos/`:
- `hero-video.mp4`
- `team-hero-dubai-landmarks.mp4`
- `team-hero-dubai-skyline.mp4`

**Fix:** Move these videos to external hosting (Lovable Cloud file storage) and reference them by URL instead of bundling them in the project. This will reduce the build size by ~100-200MB.

Steps:
1. Upload the 3 video files to Lovable Cloud storage (create a `videos` bucket)
2. Update `src/pages/Index.tsx` and `src/pages/MeetTheTeam.tsx` to reference storage URLs instead of local `/videos/` paths
3. Delete the video files from `public/videos/`

---

### AI Analyzer Status

The AI analyzer edge function is **working correctly** -- it returns a 200 response with full analysis data and the cache is functioning. The issue is that the build failure prevents the latest frontend code from deploying. Once the build error is resolved, the analyzer UI will render properly.

---

### Filter Bar Layout: Compact 2-Row Design

**Row 1 (single connected bar):** Search input (wider) + Map + Saved + Currency dropdown (shows "AED" as trigger text, opens full currency selector on click) + Filter + Mode Investor -- all connected with shared borders for a premium look, less rounded corners.

**Row 2 (filter pills + sort):** Price | Payments | Handover | Property Type | Bedrooms | Status | Construction | Newest | Low-High | High-Low | A-Z | Hide Sold (last)

Specific changes to `src/components/filters/FilterShortcutBar.tsx`:
- Remove the separate `CurrencySwitcher` component from UtilityButtons
- Create a currency trigger button styled as part of the connected bar that shows current currency code (e.g., "AED") and opens the currency dropdown
- Reorder Row 1 items: Search (flex-grow) | Map | Saved | AED/Currency | Filter | Mode Investor
- Use `rounded-none` on inner items and `rounded-l-xl` / `rounded-r-xl` on first/last items to create a connected toolbar appearance
- Move "Hide Sold" to the end of Row 2
- Merge sort pills inline in Row 2 after the filter popovers

---

### Summary of Changes

| File | Change |
|------|--------|
| `public/videos/` | Delete 3 MP4 files (move to cloud storage) |
| `src/pages/Index.tsx` | Update video src to storage URL |
| `src/pages/MeetTheTeam.tsx` | Update video src to storage URL |
| `src/components/filters/FilterShortcutBar.tsx` | Restructure Row 1 as connected toolbar; reorder: Search + Map + Saved + Currency + Filter + Mode; Row 2: filters + sort + Hide Sold last |

### Technical Notes

- A new storage bucket `videos` will be created with public access policy
- Video files will be uploaded programmatically via the storage API
- The currency trigger in the connected bar will reuse the existing `SUPPORTED_CURRENCIES` list and `currencyChange` event pattern from `CurrencySwitcher.tsx`
- The connected bar uses shared border styling (`border-r border-gold/20`) between items with outer rounding only on first/last elements
