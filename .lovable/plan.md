

# DLD Date Labels, Unified Stats UI, Rich News Content, and Smart Lead Popup System

## Overview

This plan addresses 5 areas: (1) adding date labels to DLD stats, (2) making the 2025 recap use the same visual UI as 2026, (3) adding top nationalities data, (4) reformatting news article content from text walls into premium visual layouts, and (5) building a smart lead popup strategy based on user behavior.

---

## Part 1: Add Dates to DLD Transaction Breakdown + Daily View

**File: `src/pages/News.tsx`**

The DLD stats cards currently show "Transaction Type", "Payment Method", "Gift Transactions" but no dates. Users think it's yearly data.

**Changes:**
- Add a date subtitle to each breakdown card showing "As of 10 Feb 2026" (dynamically computed)
- Add a toggle/tabs above the breakdown: "YTD 2026" vs "Today's Transactions" so users can see both yearly and daily snapshots
- The daily view shows a smaller card with today's date and reduced numbers (simulated daily average from YTD: total / days elapsed)
- Add a "Last Updated" timestamp badge to the header

---

## Part 2: Unify 2025 Recap to Match 2026 UI (Progress Bars + Colors)

**File: `src/pages/News.tsx`** (lines 506-568)

The 2025 recap currently uses a plain 4-column grid with just numbers and text. It needs to match the 2026 card which has:
- Icon headers (Building2, Banknote, Gift)
- Progress bars with gold/zinc colors
- Percentage badges with emerald/zinc styling

**Changes:**
- Replace the simple 2x4 grid with the same 3-card breakdown layout: Transaction Type (Off-plan vs Secondary with progress bars), Payment Method (Cash vs Mortgage with progress bars), Gift Transactions (centered big number)
- Each card gets the same `bg-white/60 rounded-xl p-4 border border-gold/10` styling
- Add a "Top 10 Areas 2025" table below the 2025 card (same table format as 2026)
- Add a "Top 10 Buyer Nationalities" card with flag indicators and transaction percentages (Indian, British, Russian, Chinese, Pakistani, Egyptian, etc.)

---

## Part 3: Top Buyer Nationalities Section

**File: `src/pages/News.tsx`**

Add a new card after the Top 10 Areas table:

- Title: "Top Buyer Nationalities"
- Source: "Dubai Land Department (DLD)"
- Format: Ranked list with country name, transaction count, percentage, and a progress bar (same UI as transaction breakdown)
- Data: Indian (25%), British (9%), Russian (7%), Chinese (6%), Pakistani (5%), Egyptian (4%), French (3%), Canadian (3%), Lebanese (3%), American (2%)

---

## Part 4: Rich News Article Content (No More Text Walls)

**Files: `src/pages/NewsDetail.tsx`, `src/lib/markdownUtils.ts`, `supabase/functions/ai-news-collector/index.ts`**

The news content is currently one block of text with only gold separators every 3 paragraphs. This is boring and unreadable. Changes:

### A. Enhanced AI Enrichment (Edge Function)
When enriching articles, the AI prompt will be updated to generate structured content with:
- Key statistics extracted as a JSON array (e.g., "AED 8.8B profit", "+45% growth")
- A "Key Takeaways" bullet list (3-5 points)
- Sub-sections with headers
- Store these as new columns: `key_stats` (JSONB), `key_takeaways` (JSONB)

### B. NewsDetail Visual Formatting
- **Stats Banner**: If `key_stats` exists, render a gold-themed stats bar at the top of the article (like the DLD KPI grid -- 3-4 numbers in a row)
- **Key Takeaways Box**: Render a champagne-themed box with bullet points before the main content
- **Section Headers**: The markdown renderer already handles `##` and `###` -- ensure the AI generates content with proper headers
- **Pull Quotes**: Extract the first bold sentence from each section and render it as a styled pull-quote block
- **Inline Stats Cards**: When numbers are mentioned inline (e.g., "AED 761 billion"), render them in a highlighted inline badge

### C. Markdown Renderer Enhancement
- Allow `<div>`, `<span>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` in the sanitizer whitelist for richer content rendering
- Parse markdown tables (`| Col1 | Col2 |`) into HTML tables with premium styling

---

## Part 5: Smart Lead Popup Strategy

**Files: `src/components/LeadCapturePopup.tsx`, new `src/hooks/useSmartPopupStrategy.ts`**

Currently the popup shows once after 5 seconds on homepage only, then never again. The user wants intelligent, behavior-based popup timing.

### Strategy Rules:

1. **First Visit**: Show after 8 seconds on homepage (current behavior, slightly delayed)
2. **Return Visit (no signup)**: Show after viewing 3+ property pages in one session
3. **High Intent Signals**: Show immediately when user:
   - Clicks "Download Brochure" but hasn't registered
   - Uses a calculator tool
   - Views 5+ pages in one session
   - Scrolls past 70% on a project detail page
4. **Frequency Cap**: Maximum 1 popup per session, maximum 3 popup shows total before permanent dismissal
5. **Cooldown**: If dismissed, wait 3 days before showing again (stored in localStorage with timestamp)
6. **Context-Aware Content**: The popup headline changes based on what the user was doing:
   - Browsing properties: "Found Something You Like?"
   - Using AI tools: "Unlock Full AI Access"
   - Reading news: "Get Market Updates Delivered"
   - Default: "Unlock Premium Features"

### Behavior-Based Personalization (Future Phase):

The `user_behavior_tracking` and `visitor_sessions` tables already exist. For the personalization of property suggestions and email campaigns, this requires:
- A new edge function `smart-recommendations` that queries the user's viewed projects, areas, and price ranges
- A "Recommended For You" section on the homepage based on session data
- Email automation requires a third-party email service (SendGrid/Resend) which is a separate integration

For now, the plan implements the smart popup timing + context-aware messaging. The full personalization engine (email campaigns, in-site advertising based on Google search history) is a larger project that would need to be scoped separately, as accessing a user's Google search history is not possible due to browser privacy restrictions. We can only use the referrer URL and UTM parameters to understand how they arrived.

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/News.tsx` | Add date labels to DLD cards, add YTD/Daily toggle, unify 2025 recap UI with progress bars, add Top Nationalities card |
| `src/pages/NewsDetail.tsx` | Add stats banner, key takeaways box, pull quotes, richer formatting |
| `src/lib/markdownUtils.ts` | Add table parsing, allow more HTML tags in sanitizer |
| `src/components/LeadCapturePopup.tsx` | Integrate smart popup strategy hook, context-aware headlines |
| `supabase/functions/ai-news-collector/index.ts` | Update enrichment prompt to generate key_stats and key_takeaways |

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useSmartPopupStrategy.ts` | Smart popup timing logic based on user behavior signals |

### Database Changes

```sql
-- Add structured content columns to market_news
ALTER TABLE market_news ADD COLUMN IF NOT EXISTS key_stats JSONB DEFAULT '[]';
ALTER TABLE market_news ADD COLUMN IF NOT EXISTS key_takeaways JSONB DEFAULT '[]';
```

### Smart Popup State (localStorage)

```text
lead_popup_show_count: number (max 3)
lead_popup_last_dismissed: timestamp
lead_popup_session_pages: number
lead_popup_context: string (properties|ai|news|default)
```

### DLD Date Display Format

```tsx
// Each breakdown card gets a date subtitle
<span className="text-[10px] text-zinc-400 mt-1">
  Data as of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
</span>
```

### Top Nationalities Data

```typescript
const topNationalities = [
  { country: "India", percentage: 25, transactions: 4625, flag: "IN" },
  { country: "United Kingdom", percentage: 9, transactions: 1665, flag: "GB" },
  { country: "Russia", percentage: 7, transactions: 1295, flag: "RU" },
  { country: "China", percentage: 6, transactions: 1110, flag: "CN" },
  { country: "Pakistan", percentage: 5, transactions: 925, flag: "PK" },
  { country: "Egypt", percentage: 4, transactions: 740, flag: "EG" },
  { country: "France", percentage: 3, transactions: 555, flag: "FR" },
  { country: "Canada", percentage: 3, transactions: 555, flag: "CA" },
  { country: "Lebanon", percentage: 3, transactions: 555, flag: "LB" },
  { country: "United States", percentage: 2, transactions: 370, flag: "US" },
];
```

