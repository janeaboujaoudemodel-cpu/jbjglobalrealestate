

## Rebrand AI Labels to "JBJ AI" and Add Project-Level AI Analyzer

### Overview
Two changes:
1. Rename all AI-related titles/labels across the platform to use the "JBJ AI" prefix (e.g., "AI Area Intelligence" becomes "JBJ AI Area Intelligence").
2. Add a full AI intelligence section to the Project Detail page, similar to the existing Area AI Analyzer -- a dedicated section that auto-triggers and provides a comprehensive investment analysis for the specific project.

---

### Part 1: Rebrand AI Labels to "JBJ AI"

Update text strings in these files:

| File | Current Text | New Text |
|------|-------------|----------|
| `src/components/area-detail/AreaAIAnalyzer.tsx` (line 152) | "AI Area Intelligence" | "JBJ AI Area Intelligence" |
| `src/components/AIMarketAnalyzer.tsx` (line 193) | "AI Market Analysis" | "JBJ AI Market Analysis" |
| `src/components/AIMarketAnalyzer.tsx` (line 230) | "AI Market Intelligence Analyzer" | "JBJ AI Market Intelligence" |
| `src/components/AIMarketAnalyzer.tsx` (line 240) | "Analyzing Market Data..." | "JBJ AI is Analyzing..." |

Additional files with AI labels (footer links, AI Hub cards, broker tools, etc.) will be scanned and updated wherever "AI" appears as a user-facing title prefix to include "JBJ AI".

---

### Part 2: Add JBJ AI Project Intelligence Section

Create a new component `src/components/project-detail/ProjectAIAnalyzer.tsx` that mirrors the Area AI Analyzer pattern:

- **Auto-trigger on scroll**: Uses IntersectionObserver to start analysis when the section becomes visible.
- **Calls the existing `ai-property-analyzer` edge function** with the project's area, property type, and context.
- **Displays the same structured sections**: Area Overview, Price Per Sqft, Supply vs Demand, Developer Landscape, Investment Metrics, Pros, Cons, and Investment Rating with the circular score widget.
- **Title**: "JBJ AI Project Intelligence"
- **Styling**: Matches the champagne gold theme used in the Area AI Analyzer.

Then integrate it into `ProjectDetailLayout.tsx`:
- Replace or augment the existing `AIMarketAnalyzer` usage (lines 972-988) with the new `ProjectAIAnalyzer` component.
- Pass project-specific data (name, location, developer, price, handover date, amenities) as props.

---

### Technical Details

**New file:**
- `src/components/project-detail/ProjectAIAnalyzer.tsx` -- Adapted from `AreaAIAnalyzer.tsx` with project-specific context passed to the `ai-property-analyzer` edge function.

**Modified files:**
- `src/components/area-detail/AreaAIAnalyzer.tsx` -- Title text update
- `src/components/AIMarketAnalyzer.tsx` -- Title text updates (compact and full variants)
- `src/components/project-detail/ProjectDetailLayout.tsx` -- Swap in the new `ProjectAIAnalyzer` component
- Other files with AI labels (footer, hub, broker tools) -- Prefix updates where applicable

No database or edge function changes are needed -- the existing `ai-property-analyzer` function already supports project-level analysis.

