

## Fix AI Developer Analyzer Accuracy + Gold Clickable Developer Names

### Problem 1: Inaccurate Developer Data

The `completed_projects` field in the database has wildly incorrect values for many major developers:

| Developer | Current Value | Correct Value (approx.) |
|-----------|--------------|------------------------|
| Emaar | NULL | 80,000+ |
| DAMAC | NULL | 40,000+ |
| Nakheel | 70 | 80,000+ |
| Sobha | NULL | 25,000+ |
| Binghatti | 40 | 7,000+ |
| Meraas | 25 | 15,000+ |
| Azizi | NULL | 10,000+ |
| Danube | NULL | 8,000+ |
| Ellington | NULL | 3,000+ |
| Aldar | NULL | 35,000+ |
| Omniyat | 8,000 | 2,500+ |
| Select Group | 12,000 | 5,000+ |
| Dubai Properties | 28,000 | 35,000+ |
| Al Habtoor | NULL | 5,000+ |
| Deyaar | NULL | 12,000+ |
| Samana | NULL | 2,000+ |
| MAG Group | NULL | 6,000+ |

**Fix**: Run a database migration to update `completed_projects` for all major developers with researched, accurate figures.

### Problem 2: AI Analyzer Using Generic Area Prompt for Developers

The `DeveloperAIAnalyzer` calls `ai-property-analyzer` with `area: developerName`, which uses an area-focused prompt ("Analyze X, Dubai for Y properties"). This produces area-style analysis instead of developer-specific intelligence.

**Fix**: Create a dedicated edge function `ai-developer-analyzer` with a developer-specific system prompt that:
- Focuses on developer track record, portfolio quality, delivery history
- Uses the correct `completed_projects` count from the database
- Asks for developer-specific sections: Company Overview, Portfolio Analysis, Track Record, Financial Strength, Price Positioning, Investment Metrics, Pros, Cons, Rating

### Problem 3: Developer Name Not Gold/Clickable in AI Analyzers

In `DeveloperAIAnalyzer.tsx` line 419, the developer name is rendered as:
```tsx
<span className="font-semibold text-black">{developerName}</span>
```
It should use `DeveloperLink` with gold color and hover underline.

Same check needed for all places where developer names appear in AI analyzer sections.

---

### Changes

#### 1. Database Migration -- Fix completed_projects for Major Developers

Update the `completed_projects` column for ~20 major developers with accurate, researched unit delivery numbers.

#### 2. New Edge Function: `ai-developer-analyzer`

Create `supabase/functions/ai-developer-analyzer/index.ts` with a developer-specific prompt:
- System prompt focused on developer analysis (not area analysis)
- Accepts: `developerName`, `completedProjects`, `foundedYear`, `headquarters`, `activeProjects`, `projectCount`
- Sections: Company Overview, Portfolio Strength, Track Record and Delivery, Price Per Sqft Positioning, Supply Pipeline, Investment Metrics, Pros, Cons, Investment Rating
- Uses the shared `ai-utils.ts` for AI calls

#### 3. Update `DeveloperAIAnalyzer.tsx`

- Change the API call from `ai-property-analyzer` to `ai-developer-analyzer`
- Pass all developer context fields directly (not crammed into `area` string)
- Replace `<span className="font-semibold text-black">{developerName}</span>` with `DeveloperLink` component (gold, hover underline, clickable)
- Import `DeveloperLink` from `@/components/ui/developer-link`
- Also update the "AI is analyzing..." and "AI analysis ready for..." text to use `DeveloperLink`
- Add `developerSlug` prop to the component interface

#### 4. Update `DeveloperDetail.tsx`

- Pass the new `developerSlug` prop to `DeveloperAIAnalyzer`

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ai-developer-analyzer/index.ts` | Developer-specific AI analysis edge function with accurate prompt |

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/developer/DeveloperAIAnalyzer.tsx` | Use new edge function, add `developerSlug` prop, use `DeveloperLink` for all developer name displays |
| `src/pages/DeveloperDetail.tsx` | Pass `developerSlug` to `DeveloperAIAnalyzer` |

### Database Migration

Update `completed_projects` for ~20 major developers with accurate numbers.

### Result
- AI analyzer will produce accurate, developer-focused intelligence (not area-style analysis)
- Developer names will appear in gold with hover underline, clickable to `/developer/:slug`
- Quick stats will show correct unit delivery numbers (e.g., Binghatti: 7,000+ instead of 40)
