

# Comprehensive Fix: News Images, Navigation, Footer, Insights Dropdown, and Missing Pages

## Issues Identified and Fixes

### 1. News: Remove Fake (Unsplash) Photos -- Use Real Source Images

**Problem:** The `ai-news-collector` edge function has a hardcoded `CATEGORY_IMAGE_POOL` of Unsplash stock photos. When AI scrapes news and cannot extract the original article image, it falls back to these generic stock photos. Currently 6 out of 10 recent articles use Unsplash images instead of real ones.

**Fix:**
- **`supabase/functions/ai-news-collector/index.ts`**: Remove the entire `CATEGORY_IMAGE_POOL` and `DEFAULT_POOL`. Update the AI prompt to instruct it to ALWAYS extract the real `image_url` from the source article's `og:image` meta tag. If no image is found, set `image_url` to `null` instead of a fake photo.
- **`src/pages/News.tsx` (line 55)**: Change the fallback from `"https://images.unsplash.com/..."` to `null`, and render a styled placeholder (e.g., a gradient card with the category icon) when `image_url` is null. No stock photos ever.
- **Database cleanup**: Update existing `market_news` rows that have `unsplash.com` in `image_url` to set them to `null`, so they show the placeholder instead.

### 2. Insights Dropdown: Content Overflows -- Fit to Screen

**Problem:** `MegaMenuInsights` uses `noScroll` which removes `max-height` and `overflow-y`, causing the 8-card grid (2 rows of 4) to potentially extend beyond the viewport on smaller screens. The user wants all content visible without scrolling.

**Fix:**
- **`src/components/header/MegaMenuInsights.tsx`**: Keep `noScroll` but make cards more compact. Reduce padding from `py-3 lg:py-4` to `py-2 lg:py-3`, and use `compact` prop on all `MegaMenuCard` elements (already done). Also reduce the gap from `gap-3` to `gap-2` to tighten the grid.
- **`src/components/header/mega-menu-primitives.tsx`**: In `MegaMenuShell`, when `noScroll` is true, add `max-height: calc(100vh - var(--header-height, 128px) - 24px)` with `overflow-y: auto` as a safety net so content never clips. This way it fits on screen AND scrolls gracefully if needed.

### 3. Company News vs Latest News -- Separate Routes

**Problem:** "Company News" (`/news?category=company`) opens the same `/news` page but filters by category "company". However, no news articles in the database have category "company" -- so it shows nothing or everything. The user wants Company News to be distinctly about JBJ Global, not world property news.

**Fix:**
- **`src/pages/News.tsx`**: Add a `category` query parameter handler. When `?category=company` is present, filter to show only articles with category "Company News". Add "Company News" to the categories array.
- **`supabase/functions/ai-news-collector/index.ts`**: Add "Company News" as a valid category so JBJ-related articles can be tagged separately.

### 4. Press Kit: Hide Founder Content Behind Founder Toggle

**Problem:** The Press Kit page (`/press-kit`) shows founder photos, biography, and personal details. The user wants this content hidden unless the Founder toggle is enabled.

**Fix:**
- **`src/pages/PressKit.tsx`**: Wrap the founder-specific sections (Quick Bio, Founder Headshots) with the existing `<FounderContent>` component or check `isFounderVisible` from `useFounderVisibility()`. When hidden, show only the Company Fact Sheet, Media Contact, and company-only sections.

### 5. Awards Page Missing from Insights Dropdown Company Card

**Problem:** The Awards page exists at `/awards` and is in the footer, but it is NOT listed in the MegaMenuInsights "Company" card.

**Fix:**
- **`src/components/header/MegaMenuInsights.tsx`**: Add `{ label: 'Awards', href: '/awards', icon: Award }` to the `companyLinks` array.

### 6. E-Signature / Document Scanner Missing from Footer

**Problem:** E-Signature (`/e-signature`) and Document Scanner (`/document-scanner`) exist as routes but are not in the footer.

**Fix:**
- **`src/components/Footer.tsx`**: Add to `professionalTools` array:
  - `{ href: "/document-scanner", label: "Document Scanner" }`
  - `{ href: "/e-signature", label: "E-Signature" }`

### 7. Missing Pages in Footer -- Full Audit

Several created pages are not in the footer. After auditing all routes vs footer links, the following are missing:

| Page | Route | Add To Footer Section |
|------|-------|--------------------|
| Awards | `/awards` | Already present |
| E-Signature | `/e-signature` | Professional Tools |
| Document Scanner | `/document-scanner` | Professional Tools |
| Press Kit | `/press-kit` | About & Careers |
| Company Profile | `/company-profile` | About & Careers |
| Philanthropy | `/philanthropy` | About & Careers |
| Reviews | `/reviews` | About & Careers |
| Education Hub | `/education-hub` | Already has standalone link |

**Fix:**
- **`src/components/Footer.tsx`**: Add the missing links to their respective sections.

### 8. Developer Search: Add Headquarters to /developers

**Problem:** The `/developers` page search only filters by `name` and `description`, not `headquarters`.

**Fix:**
- **`src/pages/Developers.tsx` (line 104-107)**: Add `|| (dev.headquarters?.toLowerCase().includes(query))` to the search filter.

### 9. News Page: Add Hero Section Video

**Problem:** The News page has a plain hero section. User wants a video hero like the Press Kit page.

**Fix:**
- **`src/pages/News.tsx`**: Replace the current hero section with a video background hero similar to Press Kit. Use the same `press-kit-hero.mp4` video or another appropriate video asset as a looping background with overlay gradient.

---

## Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/ai-news-collector/index.ts` | Remove Unsplash image pools; extract real `og:image` from sources; fallback to `null` |
| `src/pages/News.tsx` | Remove Unsplash fallback; add placeholder for missing images; add video hero; handle `?category=company` |
| `src/components/header/MegaMenuInsights.tsx` | Add Awards to Company links; tighten spacing |
| `src/components/header/mega-menu-primitives.tsx` | Add safety max-height to `noScroll` mode |
| `src/pages/PressKit.tsx` | Wrap founder sections with `FounderContent` |
| `src/components/Footer.tsx` | Add E-Signature, Document Scanner, Press Kit, Company Profile, Philanthropy, Reviews |
| `src/pages/Developers.tsx` | Add `headquarters` to search filter |
| Database | Set `image_url = null` for `market_news` rows with `unsplash.com` URLs |

## Scope Exclusions (Addressed Separately)

- **Brochure generation with Downtown photo**: This is a separate feature involving PDF generation with dynamic project names -- will require its own dedicated plan.
- **DocuSign**: The DocuSign component exists within `BrokerIntelligence` page at `/internal/market-intelligence/brokers` under the "DocuSign" tab. It is NOT a standalone page. If the user wants it as a standalone route, that is a separate task.
- **News badge/label styling**: Will be refined as part of the News page hero video update (premium badges with glassmorphism).

