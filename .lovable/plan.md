

# Fix: Expired Handover Filter + Missing Tools in Creative Suite

## Problem 1: Old/Expired Projects Being Recommended

The AI Home Matchmaker (Quiz) and Recommended Projects section do NOT filter out projects with past handover dates. A project handed over in December 2016 still appears as a recommendation -- this is unacceptable because if the handover already passed, the project is effectively completed/sold.

### Fix

**Files to edit:** `src/pages/Quiz.tsx`, `src/components/project-detail/RecommendedProjects.tsx`, `src/pages/QuizResults.tsx`

Add a handover date expiry check in all three locations:
- Parse `handover_date` and check if it's in the past (before today's date)
- If the handover date contains a year earlier than 2026, or if parsing it as a date results in a date before today, exclude the project entirely
- Handle various formats: "December 2016", "Q4 2025", "2024", "Ready" (Ready is always valid)
- Logic: extract the year from `handover_date` using regex. If the year is less than 2026 (current year), treat it as expired and filter it out
- "Ready" projects remain valid (already handed over and available)

Specific changes:
1. **Quiz.tsx** (line ~242): Add a new hard exclusion after the sold-out check:
   - Extract year from `project.handover_date` 
   - If year exists and year < 2026, return false (exclude)
   
2. **RecommendedProjects.tsx** (line ~28): Add the same handover expiry filter in the `useMemo` filter function, alongside the existing `sold` check

3. **QuizResults.tsx** (line ~71): Add handover expiry filter in the post-query normalization/filter step

---

## Problem 2: Missing Tools in Creative Suite

The Creative Suite page (`/business-suite/creative`) only shows 4 tools: Document Generator, Translation Hub, Video Tour Script, Background Remover.

The user expects to see ALL creative and corporate tools listed there as well -- specifically: Business Card Designer, Logo Maker, Presentation, Company Profile, CV/Resume Builder, and Cover Letter Generator.

### Fix

**File to edit:** `src/pages/business-suite/CreativeSuite.tsx`

Add a second section called "Creative Suites" with tool cards for:
- Presentation Editor (`/presentation`)
- Business Card Designer (`/toolkit/corporate-suite/business-card`)
- Logo Maker (`/toolkit/corporate-suite/logo`)
- CV / Resume Builder (`/toolkit/corporate-suite/cv-builder`)
- Cover Letter Generator (`/toolkit/corporate-suite/cover-letter`)
- Company Profile (`/toolkit/corporate-suite/company-profile`)

These will appear in a new grid section below the existing "All Tools" section, with a section divider labeled "Creative Suites" -- matching the existing layout pattern used in ProductivitySuite.tsx.

Update the hero tool count from "4 Tools Included" to reflect the actual total (10 tools).

---

## Technical Details

### Handover Date Expiry Helper Function

```text
function isHandoverExpired(handoverDate: string | null): boolean {
  if (!handoverDate) return false;
  const lower = handoverDate.toLowerCase();
  if (lower.includes("ready")) return false;
  const yearMatch = handoverDate.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return year < 2026; // current year
  }
  return false;
}
```

### Files Changed Summary

| File | Change |
|------|--------|
| `src/pages/Quiz.tsx` | Add handover expiry exclusion in `getRecommendations` filter |
| `src/components/project-detail/RecommendedProjects.tsx` | Add handover expiry exclusion in `recommendedProjects` filter |
| `src/pages/QuizResults.tsx` | Add handover expiry filter in post-query normalization |
| `src/pages/business-suite/CreativeSuite.tsx` | Add 6 new tool cards in a "Creative Suites" section, update tool count |

