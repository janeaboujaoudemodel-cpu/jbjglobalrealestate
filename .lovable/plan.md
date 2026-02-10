
# Comprehensive Fix Plan: News Images, Insights Dropdown, Press Kit, Footer, and Navigation Gaps

This plan addresses all the issues you raised, organized by priority.

---

## Issue 1: Fake Photos on News Articles

**Problem:** Many news articles in the database have `image_url = NULL` (e.g., "Aldar delivers 36% rise in profit"). When no image exists, the UI shows a placeholder icon instead of a real photo. The `ai-news-collector` edge function is not extracting images from every source article.

**Fix:**
- Update the `ai-news-collector` edge function to always attempt image extraction from the source URL using Firecrawl during the enrichment pass
- For articles that still have no image after extraction, use a curated fallback photo pool per category (Policy, Economic, Market Update, Developer News) -- these will be real Dubai photos, not AI-generated
- Run a one-time backfill query to re-enrich existing articles that have NULL `image_url` values
- Strictly block any generic logos, site icons, or placeholder images from being stored

---

## Issue 2: Insights Dropdown -- Content Cropped, Cannot Scroll

**Problem:** The `MegaMenuShell` component has `noScroll` set but the code is broken -- both the `noScroll=true` and `noScroll=false` branches apply the exact same styles (`maxHeight` + `overflowY: 'auto'`). The intended behavior was: when `noScroll=true`, all content should fit on screen without scrolling; when `noScroll=false`, allow scrolling.

Currently at line 38-44 of `mega-menu-primitives.tsx`, both conditions are identical, so the `noScroll` prop does nothing useful. The real issue is that the 8-card grid content exceeds the viewport height on smaller screens.

**Fix:**
- When `noScroll=true`: Keep `maxHeight` and `overflowY: 'auto'` so that content CAN scroll if it exceeds viewport. The intent from the user is "fit content in viewport" which means making cards more compact OR allowing scroll when they don't fit
- Make the cards even more compact: reduce padding from `py-2 lg:py-3` to `py-1.5 lg:py-2`, reduce gap from `gap-2` to `gap-1.5`
- Ensure `overflowY: 'auto'` works properly so the dropdown scrolls smoothly when content overflows

---

## Issue 3: Company News Opens Same Page as Latest News

**Problem:** "Company News" in the Insights dropdown links to `/news?category=company` which correctly filters to `Company News` category. However, there are likely no articles with category "Company News" in the database, so it shows the same results as "All".

**Fix:**
- Verify if any articles exist with category "Company News" in the database
- If none exist, this is a content issue -- the `ai-news-collector` needs to tag JBJ-specific announcements as "Company News"
- Add a dedicated company news section on the News page that shows JBJ-specific announcements (milestones, team updates, partnerships) separately from market news
- If no company news exists yet, show an empty state with a clear message

---

## Issue 4: Press Kit Page -- Wrap with Founder Toggle

**Problem:** The Press Kit page (`/press-kit`) shows founder photos, biography, and personal details. When the founder toggle is OFF, only the founder-specific sections are hidden (they're already wrapped in `<FounderContent>`), but the company sections remain visible. This is correct behavior.

**Current state:** The page already uses `<FounderContent>` wrappers around the bio and headshot sections (lines 200-320). The company fact sheet, media contact, and brand guidelines remain visible.

**Fix:** The current implementation is actually correct -- founder content is wrapped. No changes needed unless you want the entire page hidden, in which case we wrap the entire page route in `<FounderContent>`.

---

## Issue 5: Awards Page Missing from Navigation

**Problem:** The Awards page exists at `/awards` and IS in the Insights dropdown (Company card, line 89) and IS in the Footer (About section, line 220). It is accessible.

**Current state:** Awards is present in both MegaMenuInsights and Footer. No fix needed.

---

## Issue 6: Missing Pages in Footer and Header Navigation

**Problem:** Several created pages are not linked in the footer or navigation, making them unfindable.

**Pages missing from Footer that exist in the codebase:**
- `/education-hub` -- Education Hub (has a variable but not in the accordion)
- `/meeting-center` -- Meeting Center
- `/ai-call-summarizer` -- Call Summarizer
- `/presentations` -- Presentations
- `/form-builder` -- Form Builder
- `/kanban-board` -- Kanban Board
- `/spreadsheet` -- Spreadsheet
- `/whiteboard` -- Whiteboard
- `/mind-map` -- Mind Map
- `/video-builder` -- Video Builder
- `/ai-hub` -- AI Hub
- `/ai-personal-shopper` -- AI Personal Shopper
- `/ai-financial-advisor` -- AI Financial Advisor
- `/map` -- Property Map
- `/calculator/roi` -- ROI Calculator
- `/communities` -- Communities
- `/pricing` -- Pricing
- `/digital-card` or `/card` -- Digital Card
- `/request-valuation` -- Request Valuation

**Fix:**
- Add missing public-facing pages to the footer under appropriate categories
- Add new footer sections if needed (e.g., "Productivity" for meeting center, kanban, whiteboard, etc.)
- Ensure the Footer remains role-agnostic (no broker-internal links)
- Add missing pages to the MegaMenuInsights dropdown where relevant

---

## Issue 7: News Category Labels -- Premium Styling

**Problem:** The category labels on news cards need a more premium look.

**Current state:** Category badges use `text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20`. This is already per the memory spec.

**Fix:** Enhance with category-specific accent colors (gold for Market Update, emerald for Economic, blue for Policy, etc.) while keeping the dark backdrop for readability.

---

## Technical Details: Files to Modify

### 1. `src/components/header/mega-menu-primitives.tsx` (lines 38-44)
- Fix the broken `noScroll` logic -- ensure scrolling works when content exceeds viewport

### 2. `src/components/header/MegaMenuInsights.tsx`
- Make cards more compact to fit more content in viewport
- Add any missing navigation links

### 3. `src/components/Footer.tsx`
- Add all missing public-facing pages to appropriate footer sections
- Add new sections for Productivity tools, AI Hub, etc.

### 4. `src/pages/News.tsx`
- Enhance category badge styling with category-specific accent colors
- Ensure Company News filter works correctly

### 5. `supabase/functions/ai-news-collector/index.ts`
- Enhance image extraction to always attempt Firecrawl enrichment
- Add category-specific real Dubai photo fallbacks
- Run backfill for NULL image_url articles

### 6. `src/pages/PressKit.tsx`
- Verify founder content wrapping is comprehensive (already partially done)
- Ensure non-founder company content remains visible when toggle is off

---

## Execution Order

1. Fix the Insights dropdown scroll issue (quick CSS fix)
2. Add all missing pages to Footer
3. Fix news image extraction in the edge function
4. Enhance news card category labels
5. Verify Press Kit founder toggle coverage
