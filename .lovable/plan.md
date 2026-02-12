

## Wire Filters Everywhere + Payment Plan on Project Cards

### Problem Summary
1. **DeveloperDetail page**: Already correctly applies `applyShortcutFilters` (line 101). Already wired.
2. **AreaProjectsGrid**: Already correctly applies `applyShortcutFilters` (line 172). Already wired.
3. **ProjectDetailLayout**: Has `FilterShortcutBar` but the `shortcutFilters` state is never applied to filter any project lists on the page. Need to check if there are similar/recommended project sections that need filtering.
4. **Payment Plan on ProjectCard**: The user wants the real payment plan summary displayed on the bottom-right corner of each project card, above the CTA buttons. Data source: `payment_breakdown` field (699 of 2410 projects have it). This is real structured data with milestones and percentages.

### Changes

#### 1. Add Payment Plan Summary to ProjectCard

**File: `src/components/ProjectCard.tsx`**

The `payment_breakdown` field is a JSON array of objects like:
```json
[
  { "milestone": "Down Payment", "percentage": 20 },
  { "milestone": "During Construction", "percentage": 40 },
  { "milestone": "On Handover", "percentage": 40 }
]
```

Add a compact payment plan display at the bottom-right of the card content area (above the CTA buttons), showing a shorthand like "20/40/40" or "20% | 40% | 40%" derived from the real `payment_breakdown` data. Only show this when `payment_breakdown` exists and has entries.

Implementation:
- Add a helper function `getPaymentPlanSummary()` that reads `(project as any).payment_breakdown` and extracts the percentages
- Display it as a small gold-accented badge at the bottom-right of the content section, e.g.: "20/40/40" with a CreditCard icon
- If no `payment_breakdown` data exists, show nothing (no fake data)

#### 2. Verify Filter Wiring on All Pages

| Page | FilterShortcutBar present? | applyShortcutFilters applied? | Action needed? |
|------|---------------------------|-------------------------------|----------------|
| Properties.tsx | Yes | Yes (line 335) | No |
| DeveloperDetail.tsx | Yes | Yes (line 101) | No |
| AreaProjectsGrid.tsx | Yes | Yes (line 172) | No |
| ProjectDetailLayout.tsx | Yes | No -- but no project list to filter | No action needed |

All pages with project listings already have filters correctly wired. The ProjectDetailLayout shows a single project detail, not a list, so the FilterShortcutBar there serves as navigation/context rather than filtering.

### Technical Details

#### ProjectCard.tsx Changes

Add after the description section (around line 357), before the Link closing tag:

```tsx
{/* Payment Plan Badge - Bottom Right */}
{(() => {
  const breakdown = (project as any).payment_breakdown;
  if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) return null;
  const percentages = breakdown
    .map((b: any) => b.percentage)
    .filter((p: any) => typeof p === 'number');
  if (percentages.length === 0) return null;
  return (
    <div className="px-4 pb-2 flex justify-end">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-1">
        <CreditCard className="w-3 h-3" />
        {percentages.join('/')}
      </span>
    </div>
  );
})()}
```

- Import `CreditCard` from lucide-react
- Only displays when real `payment_breakdown` data exists
- Shows compact format like "20/40/40" which represents Down Payment / Construction / Handover percentages

### Files to Change

| File | Change |
|------|--------|
| `src/components/ProjectCard.tsx` | Add CreditCard import; add payment plan badge from real `payment_breakdown` data |

### What This Does NOT Do
- Does not invent or fabricate any payment plan data
- Does not change filter wiring on pages where it already works (Developer, Area, Properties)
- The `payment_plan` text field (only 1 project has it) is ignored in favor of the structured `payment_breakdown` array (699 projects have it)
