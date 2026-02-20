
# Comprehensive Bug Fix and UI Refinement Plan

This plan addresses all remaining tasks extracted from your recent prompts, organized by priority.

---

## 1. Emoji Removal (Global Sweep)

Several files still contain emojis that need to be stripped:

### Compare.tsx (Property Comparison Page)
- **Line 325**: `📊 Property Details Comparison` in download report HTML
- **Line 352**: `⭐ Ratings & Analysis` in download report HTML  
- **Line 367-368**: `✅ Pros` and `⚠️ Cons` in download report HTML
- **Line 374**: `🏆 Our Recommendation` in download report HTML
- **Line 383**: `💡 Investment Advice` in download report HTML
- **Line 389**: `⚠️ Risk Factors` in download report HTML
- **Line 396-398**: `📧`, `📞`, `🌐` in footer of download report HTML
- **Line 740**: `🥇 Top 1`, `🥉 Top 2`, `🥈 Top 3` badge labels

### Favorites.tsx
- Replace all medal emojis (`🥇`, `🥈`, `🥉`) with text labels or Lucide icons (Crown, Medal, Award)

### ComparisonBar.tsx
- Replace all medal emojis with text-only labels

### Other Files with Emojis
- `SmartLeadAlerts.tsx` (line 292): `💡 Suggested` 
- `ProjectIntegrationPanel.tsx`: `✅` in toast, `⭐ Featured`
- `CustomerHappiness.tsx`: `⭐` and `💡` in toast messages
- `Testimonials.tsx`: Star emojis in rating dropdown
- `AdminLeads.tsx`: Multiple emojis in source labels
- `FoundersAssistant.tsx`: `✅` and `⚠️` labels
- `JBJDesignStudio.tsx`: `✉️`, `📞`, `🌐` in email signature HTML
- `BeautyFilters.tsx`: `💡` and `⚠️` labels
- `MarketingHub.tsx`: Various emojis in template names
- `QuizResults.tsx`: Medal emojis in badge dropdown
- `GuidedTour.tsx`: Medal emojis in description text

---

## 2. Property Comparison Page - Premium Overhaul

### Photo Alignment
- Set all project images in the comparison table header (`<th>`) to use a fixed `h-40` or `aspect-[16/9]` with `object-cover` so all photos are the same height

### Location on One Line
- Add `whitespace-nowrap overflow-hidden text-ellipsis` or `truncate` class to the Location row cells so they stay on a single line

### Comparison Table as Excel-like Board
- Add alternating row backgrounds (`even:bg-zinc-800/20 odd:bg-zinc-900/40`) for better readability
- Add sticky first column styling improvements

### Pros/Cons in Green/Red with Like/Dislike
- In the ratings cards, add ThumbsUp icon for Pros (green) and ThumbsDown icon for Cons (red)
- Make Pros background `bg-green-950/30` and Cons `bg-red-950/30` (already partially done)

### Share with Team - Premium Export
- The WhatsApp and Email share buttons are already present (lines 679-700)
- Enhance the share content to include company header with: JBJ Global Real Estate branding, contact numbers, and a formatted summary of the comparison

---

## 3. AI Property Analyzer Border Color Fix

The user wants the AI Property Analyzer border in the Compare page to be **gold/champagne** (not yellow). The border wrapper on line 711 uses `border-gold/30` which renders as gold. Verify the `AIPropertyAnalyzer` component itself and `LegalDisclaimer variant="ai-tools"` use gold/champagne borders, not yellow or purple.

---

## 4. Homepage Mobile Fixes

### Toolkit Card Buttons Overflow
- Already partially fixed with `truncate` and `overflow-hidden` in `ToolkitShowcaseCard.tsx`
- Reduce button padding further on mobile: `px-1.5 sm:px-3`
- Reduce font to `text-[10px] sm:text-sm`

### "View All Projects" Padding
- Locate the Handpicked/Featured Properties section and increase bottom padding on the "View All Projects" link

### "Find Your Starting Point" Mobile Layout  
- Check card sizing on 390px viewport and ensure cards don't overflow or cramp

### Explore Services Card Divider
- The internal divider (line 362) uses `border-dashed border-gold/40` which is already differentiated from the outer section divider - verify visually

### Financial Tools Duplicated Title
- Search for the mortgage/financial section on the homepage and remove any duplicated heading

---

## 5. Video Loading Performance

### WhyDubaiCapitalSection
- Already changed to `preload="metadata"` 
- Further optimize by using `preload="none"` and only loading when section enters viewport (IntersectionObserver lazy-load pattern)

### Hero Section Loading
- Already using deferred video loading strategy per memory
- Ensure hero image uses `fetchPriority="high"` and `loading="eager"`

---

## 6. Areas Section Improvements

### "Areas We Cover" Title
- Already has gold-champagne gradient text applied
- Verify it renders correctly on mobile

### Padding Under "View All Areas"  
- Currently `mt-10 mb-4` - increase to `mt-10 mb-8` for more breathing room

---

## 7. Branded Loader Logo Fix

- Currently using `jbj-monogram-light-transparent.png` - verify this is the correct asset without the square box behind the "B"
- If the logo still shows a box, switch to `jbj-monogram-nobuffer.png` or `jbj-monogram-transparent.png`

---

## 8. Market Intelligence Book Image Loading

- Find the market intelligence book section and ensure the image uses `loading="eager"` and `fetchPriority="high"` to prevent partial loading

---

## 9. Support Ticket Email Confirmation Test

- Verify the support ticket form submits correctly and triggers an email confirmation via the backend

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/Compare.tsx` | Remove all emojis from download HTML, fix photo alignment, single-line locations, add ThumbsUp/Down icons, enhance share export |
| `src/pages/Favorites.tsx` | Replace medal emojis with Lucide icons |
| `src/components/ComparisonBar.tsx` | Replace medal emojis with text labels |
| `src/pages/CustomerHappiness.tsx` | Remove emojis from toasts |
| `src/pages/services/Testimonials.tsx` | Remove star emojis from dropdown |
| `src/pages/AdminLeads.tsx` | Remove emojis from source labels |
| `src/pages/FoundersAssistant.tsx` | Remove emojis from stat labels |
| `src/pages/JBJDesignStudio.tsx` | Remove emojis from email signature HTML |
| `src/pages/toolkit/BeautyFilters.tsx` | Remove emojis from section labels |
| `src/pages/admin/MarketingHub.tsx` | Remove emojis from template names |
| `src/pages/QuizResults.tsx` | Replace medal emojis |
| `src/components/GuidedTour.tsx` | Replace medal emojis in text |
| `src/components/crm/SmartLeadAlerts.tsx` | Remove emoji from suggested label |
| `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` | Remove emojis |
| `src/components/home/ToolkitShowcaseCard.tsx` | Further reduce mobile button sizing |
| `src/components/home/AreasWeCover.tsx` | Increase bottom padding |
| `src/components/ui/BrandedLoader.tsx` | Verify correct logo asset |
| Homepage sections | Fix duplicated financial tools title, book image loading |

Estimated scope: ~20 files to edit, primarily emoji removal and mobile layout polish.
