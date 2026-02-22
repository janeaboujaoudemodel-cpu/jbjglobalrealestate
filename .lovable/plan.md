

# Comprehensive Mobile Audit and UX Fix Plan

This plan addresses all reported issues: vertical/broken content on mobile, project detail navigation, news extraction, homepage service wiring, guide book structure, and broker hub certificate.

---

## 1. Fix Vertical/Broken Content in Real Estate Intelligence Suite (CRITICAL)

**Problem:** Tool sub-tabs in `RealEstateSuite.tsx` render as single vertical characters on mobile because buttons lack `whitespace-nowrap` and `min-w-fit`, and the container doesn't properly enable horizontal scrolling.

**Fix in `src/pages/business-suite/RealEstateSuite.tsx`:**
- Add `whitespace-nowrap min-w-fit` to all tool sub-tab buttons (line 232)
- Add `scrollbar-hide` to the flex container (line 223)
- Add `whitespace-nowrap min-w-fit` to section tab buttons (line 205)
- Ensure both tab rows use `overflow-x-auto` with proper touch scrolling

This same fix pattern will be applied globally to **all suite pages** that use similar tab layouts:
- `src/pages/business-suite/ProductivitySuite.tsx`
- `src/pages/business-suite/CreativeSuite.tsx`
- `src/pages/toolkit/VoiceSuite.tsx`
- Any other suite page with horizontal tabs

---

## 2. Fix Project Detail Sticky Navigation (Row 3: Details/Gallery/Developer)

**Problem:** The third navigation row (Details, Gallery, Developer, Location, Brochure, AI Analyzer, Mortgage) doesn't scroll horizontally on mobile swipe. The active tab doesn't update when scrolling through sections.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx`:**
- Add `touch-action: pan-x` and `-webkit-overflow-scrolling: touch` to the Row 2 scroll container (line 600)
- Add `whitespace-nowrap min-w-fit` to each button (line 614)
- Implement an `IntersectionObserver` that watches each section ref and updates `activeTab` when a section enters the viewport (scroll-spy behavior)
- Ensure the active tab button auto-scrolls into view using `scrollIntoView({ inline: 'center', block: 'nearest' })`

---

## 3. Global Mobile Audit -- Prevent Content Overflow Everywhere

**Problem:** Buttons, cards, and content overflow their containers across multiple pages on mobile.

**Fix -- apply `whitespace-nowrap min-w-fit` or `overflow-hidden text-ellipsis` pattern to:**
- All horizontal pill/tab navigations site-wide
- Filter shortcut buttons in `FilterShortcutBar.tsx` (already partially addressed, reinforce)
- Ensure no card or button text wraps to 2-3 lines by adding `line-clamp-1` or `truncate` where appropriate
- Add `overflow-hidden` to card containers to prevent content from visually escaping

---

## 4. News Extraction from Provident (One-Time Batch Import)

**Problem:** Need to extract all blog/news articles from Provident's website into the `market_news` table.

**Fix:**
- The edge function `import-provident-blog` already exists and works
- Invoke it with a high limit (e.g., `{ "limit": 500 }`) to capture all articles in one batch
- The function already handles deduplication by normalized title and URL
- It strips Provident branding from source attribution
- After import, verify data in `market_news` table and update source attribution to point to original publishers (Dubai Holding, Khaleej Times, etc.) where identifiable from article content
- No Provident logos or links will be shown -- the existing `source` field says "Provident Estate" but the UI should display only the article's original publisher

**Post-import cleanup:**
- Update `source` field entries from "Provident Estate" to neutral "Market Intelligence" or the actual original source
- Ensure the News & Insights page (`/news`) displays all imported articles with proper cards, photos, and links

---

## 5. Homepage Services Cards -- Wire to Existing Pages

**Problem:** Services cards may show "Coming Soon" instead of linking to already-created pages.

**Fix in `src/components/home/ServicesGrid.tsx`:**
- Verify all 4 service cards (Buy, Rent, Sell, Management) link to their respective guide pages
- Current links: `/buyer-guide`, `/tenant-guide`, `/seller-guide`, `/landlord-guide` -- these already exist
- Remove any "Coming Soon" labels if present
- Add additional service cards if the user has created more service pages (e.g., Property Valuation, Golden Visa, Listing Portal)

---

## 6. Golden Visa Guide -- Add Book Cover and Book-Style Structure

**Problem:** The Golden Visa page needs a premium book cover photo, book-style layout with TOC, and side navigator.

**Fix in `src/pages/guides/GoldenVisaGuide.tsx`:**
- Add a 3D book cover component (using existing `Book3D` component) at the top of the hero section, styled with gold/champagne cover featuring "UAE Golden Visa" title
- The Table of Contents section already exists (lines 176-203) with clickable navigation
- Add a sticky side navigator (similar to `GuideSectionNav`) that tracks the active section using IntersectionObserver
- Fix the React warning about `SectionHeader` not using `forwardRef` (line 56) -- wrap it with `React.forwardRef` or remove the ref usage

---

## 7. Broker Hub -- Add Certificate Section

**Problem:** The Broker Hub page needs a visible certificate section.

**Fix in `src/pages/BrokerHub.tsx`:**
- Add a "Professional Certification" section after the documents section (around line 396)
- Display a premium certificate card with gold border, showing JBJ broker certification details
- Include a CTA button linking to `/services/broker-certification`
- The certification card in `quickAccessCards` already exists (line 42) but needs a dedicated visual section

---

## 8. Apply Book-Style Structure to All Guide Pages

**Problem:** All guide, FAQ, and market intelligence pages should follow a consistent book structure: cover photo, table of contents, then detailed content.

**Fix pattern applied to:**
- Buyer Guide, Seller Guide, Landlord Guide, Tenant Guide
- FAQ pages (Buyer FAQ, Seller FAQ)
- Market Overview, Area Intelligence, Market Reports
- Legal pages (styled as legal books): Terms of Service, Privacy Policy, Cookie Policy, Disclaimers

Each page will:
1. Show the corresponding book cover (from `bookCollections.ts`) at the top
2. Display an interactive Table of Contents with numbered sections
3. Include a sticky side navigator (desktop) / top scroll nav (mobile)
4. Content sections with proper IDs for scroll-to navigation

---

## Technical Summary of Files to Edit

| File | Changes |
|------|---------|
| `src/pages/business-suite/RealEstateSuite.tsx` | Add `whitespace-nowrap min-w-fit` to tab buttons, fix mobile scroll |
| `src/pages/business-suite/ProductivitySuite.tsx` | Same tab button fix |
| `src/pages/business-suite/CreativeSuite.tsx` | Same tab button fix |
| `src/pages/toolkit/VoiceSuite.tsx` | Same tab button fix |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Fix Row 3 scroll, add scroll-spy, auto-scroll active tab |
| `src/components/filters/FilterShortcutBar.tsx` | Reinforce overflow protection |
| `src/pages/guides/GoldenVisaGuide.tsx` | Add book cover, sticky side nav, fix forwardRef warning |
| `src/pages/BrokerHub.tsx` | Add certificate section |
| `src/components/home/ServicesGrid.tsx` | Verify all links, remove "Coming Soon" |
| Edge function invocation | One-time batch import of Provident news |

