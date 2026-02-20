
# Fix JBJ AI Analyzers — Two Issues

## Root Cause Analysis

### Issue 1: Wrong Logo (Black Background)
In `ProjectAIAnalyzer.tsx` line 7 and 183-184, it imports and uses `jbj-monogram-dark.png` — this is the version with a **dark/black background**. The correct asset for a light-background context is `jbj-monogram-nobuffer.png` (transparent background, no buffer padding), already used in the header. The fix is a one-line import change.

### Issue 2: Analysis Arrives But Nothing Renders
The network log confirms the edge function **is returning a complete `fullAnalysis` string** (status 200, full response body visible). The bug is entirely in the **client-side regex parsing**.

The AI returns text in this format:
```
**1. Area Overview**
Damac Hills is a master-planned...

**2. Price Per Sqft**
...
```

The number (`1.`) is **inside** the bold markers. But the `extractSection()` regex in `ProjectAIAnalyzer.tsx` expects the number **outside**:
```typescript
// Pattern 1 — WRONG: expects "1. **Area Overview**"
new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}\\*\\*`, 'i')
```

The actual format is `**1. Area Overview**` — so none of the three patterns match, all sections return `""`, all the conditional renders (`{sections?.overview && ...}`) evaluate to `false`, and the page shows nothing even though data loaded successfully.

The same regex bug exists in `AreaAIAnalyzer.tsx`.

### Issue 3: Developer Intelligence
There is no dedicated Developer AI Analyzer component currently wired up. The user references it as a feature that was previously working. It needs to be confirmed whether this exists elsewhere in the codebase — and if it's missing, it needs to be created following the same pattern as `ProjectAIAnalyzer`.

---

## Fixes

### Fix 1 — Logo in ProjectAIAnalyzer.tsx
**File:** `src/components/project-detail/ProjectAIAnalyzer.tsx`

Change line 7:
```typescript
// BEFORE:
import jbjMonogramDark from "@/assets/jbj-monogram-dark.png";

// AFTER:
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
```

Change line 184:
```tsx
// BEFORE:
src={jbjMonogramDark}

// AFTER:
src={jbjMonogramNobuffer}
```

The `jbj-monogram-nobuffer.png` is the transparent-background version already confirmed present in `/src/assets/`.

---

### Fix 2 — Section Regex in ProjectAIAnalyzer.tsx
**File:** `src/components/project-detail/ProjectAIAnalyzer.tsx`

The `extractSection` function (lines 20–31) needs an additional pattern to handle the `**1. Section Name**` format:

```typescript
function extractSection(text: string, sectionName: string): string {
  const patterns = [
    // Format: **1. Area Overview** (number inside bold — actual AI output)
    new RegExp(`\\*\\*\\d+\\.\\s*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*\\d+\\.|$)`, 'i'),
    // Format: 1. **Area Overview** (number outside bold)
    new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\d+\\.\\s*\\*\\*|$)`, 'i'),
    // Format: ## Area Overview
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|\\d+\\.\\s*\\*\\*|$)`, 'i'),
    // Format: **Area Overview**
    new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z]|\\d+\\.\\s*\\*\\*|$)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}
```

The first pattern is the new one that matches the actual AI response format. Since it's first in the array, it will always match first when the format is correct.

---

### Fix 3 — Section Regex in AreaAIAnalyzer.tsx
**File:** `src/components/area-detail/AreaAIAnalyzer.tsx`

The same `extractSection` function exists at lines 14–25 with the same bug. Apply the identical fix — add the `**1. Section Name**` pattern as the first entry.

---

### Fix 4 — Developer AI Analyzer
**File:** Need to search and confirm.

Based on the codebase search, there is no `DeveloperAIAnalyzer` component. The user says it was previously working. I'll create a `DeveloperAIAnalyzer.tsx` component that follows the same pattern as `ProjectAIAnalyzer.tsx` — it calls the same `ai-property-analyzer` edge function but with developer-specific context (developer name, total projects, flagship developments, areas of operation), and displays developer-focused sections (Developer Overview, Market Share, Project Pipeline, Investment Track Record, Pros, Cons, Rating).

The component will be wired into the developer detail page wherever it previously existed.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Fix logo (dark-bg → nobuffer/transparent), fix `extractSection` regex |
| `src/components/area-detail/AreaAIAnalyzer.tsx` | Fix `extractSection` regex (same pattern fix) |
| `src/components/developer-detail/DeveloperAIAnalyzer.tsx` | Create new component (or restore if it was deleted) |
| Developer detail page | Wire in `DeveloperAIAnalyzer` if not already present |

---

## What the User Will Experience After Fix

1. **Logo** — The loading spinner in Project AI Intelligence shows the JBJ monogram with a transparent background, matching the header/footer logo.
2. **Project AI Intelligence** — Scrolling to the section triggers analysis; the AI response arrives (already confirmed working at the network level), sections parse correctly, all 8 cards (Area Overview, Price Per Sqft, Supply vs Demand, Developer Landscape, Investment Metrics, Pros, Cons, Rating) render.
3. **Area Intelligence** — Same fix applies; charts and cards render on area pages.
4. **Developer Intelligence** — Restored component analyzes the developer's portfolio and renders insights on developer detail pages.

No backend changes required — the edge function is working correctly (confirmed by the 200 response in network logs).
