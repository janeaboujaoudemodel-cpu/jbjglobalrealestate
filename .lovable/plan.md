
# Two Fixes: Recommended Project Cards + Premium AI Analyzer

---

## Part 1 — Recommended Project Cards: Symmetry & Layout Fixes

### Current Problems
- Cards are different heights because the content section has variable-length titles, developer names, and location text that push the price divider down inconsistently.
- Handover date badge is placed in the **top badges row** alongside "On Sale" — it visually competes and clutters the top-left.
- Location is blank for projects like "Terwa Homes" and "Wyndham Garden Bucharest Airport Hotel" because their `location` field is `null` in the database, but `area_name` and `emirate` are available as fallbacks.

### Fixes for RecommendedProjects.tsx

**1. Equal Card Height (Symmetry)**
Change the card `Link` wrapper to use `flex flex-col h-full` so every card stretches to the same height. Make the content section `flex flex-col flex-1` and push the price divider to the bottom with `mt-auto`.

```
Card (flex flex-col h-full)
  ├─ Image section (fixed aspect ratio)
  └─ Content section (flex flex-col flex-1)
       ├─ Title
       ├─ Developer
       ├─ Location (flex-1 — grows to fill)
       └─ Divider + Price + Payment Plan (mt-auto, always at bottom)
```

**2. Handover Date → Bottom Right Corner**
Remove the handover date badge from the top badges row. Place it as an absolutely-positioned chip at `bottom-3 right-3` on the image, styled distinctly (dark/translucent gold background). The developer logo stays at `bottom-3 left-3`.

**3. Location Fallback**
Add a display helper that returns: `project.location ?? project.area_name ?? project.emirate ?? null`. This ensures "Terwa Homes" shows its `area_name` or emirate instead of a blank row.

**4. Consistent Grid**
Wrap the grid in `items-stretch` so all three columns always reach the same height, and the content stretches within each card.

---

## Part 2 — ProjectAIAnalyzer: Premium Upgrade

### Current Problems
- The "Price Per Sqft" card shows only 2 lines of cleaned text — no visual impact.
- The "Supply vs Demand" card is similarly plain text.
- The user previously saw area performance charts and richer data — this feels missing.

### Upgrade Plan for ProjectAIAnalyzer.tsx

**1. Price Per Sqft — Visual Bar Chart (Recharts)**
Parse the AI text from `sections.pricePerSqft` to extract:
- Current avg price/sqft (e.g. `AED 1,250/sqft`)
- YoY change % (e.g. `+12%`)

Display a horizontal bar chart using `recharts` `BarChart` with:
- A single bar showing current price vs a benchmark (Dubai average: AED 1,400/sqft as reference)
- Gold fill for the current area bar
- A secondary bar in grey for "Dubai Avg"
- Below the chart: the raw text detail for context

**2. Investment Metrics — Stat Pills**
Parse `sections.investment` to extract rental yield % and capital appreciation %. Display as two large circular/pill stats side by side: "6.2% Rental Yield" and "8.1% Capital Appreciation" in gold on black backgrounds — replacing plain text.

**3. Supply vs Demand — Mini Progress Indicator**
Parse absorption rate from the text (e.g. "85% absorption"). Show a thin horizontal progress bar (gold fill) with the percentage labeled, followed by the pipeline units text below.

**4. Pros & Cons — Styled List Items**
Enhance the Pros/Cons cards: parse bullet points from `cleanMarkdown()` output and render each as an individual pill-style row with a checkmark (✓) for pros in emerald and an ✗ for cons in red.

**5. Full Analysis Fallback**
If any section is empty (regex miss), the card still renders but shows a subtle "Data not available" message instead of hiding entirely — preventing the "nothing renders" experience.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/project-detail/RecommendedProjects.tsx` | Fix card symmetry (flex-col h-full), move handover date to bottom-right image corner, add location fallback (area_name → emirate), align divider at bottom |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Upgrade Price Per Sqft to Recharts bar chart, upgrade Investment Metrics to stat pills, upgrade Supply/Demand to progress bar, upgrade Pros/Cons to styled list rows, always render section cards even if data is sparse |

No backend or edge function changes required.

---

## Visual Result

**Recommended Cards (after fix):**
```text
┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────────┐
│  [Image 16:10]              │  │  [Image 16:10]              │  │  [Image 16:10]              │
│  [On Sale]     [Recommended]│  │  [On Sale]     [Recommended]│  │  [On Sale]     [Recommended]│
│  [Dev Logo]   [Q4 2026 ▸]  │  │  [Dev Logo]   [Q2 2027 ▸]  │  │  [Dev Logo]   [Q1 2028 ▸]  │
├─────────────────────────────┤  ├─────────────────────────────┤  ├─────────────────────────────┤
│  Project Name               │  │  Project Name               │  │  Project Name               │
│  by Developer               │  │  by Developer               │  │  by Developer               │
│  Dubai Hills, Dubai  ← fill │  │  Bukadra, Meydan ← fill     │  │  Damac Hills ← fallback     │
│  ─────────────────────────  │  │  ─────────────────────────  │  │  ─────────────────────────  │
│  From AED 1.2M   [60/40]   │  │  From AED 2.1M   [70/30]   │  │  Price on request            │
└─────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────────┘
         ↑ same height                  ↑ same height                   ↑ same height
```

**AI Analyzer Price Per Sqft (after fix):**
- Gold bar chart comparing area avg vs Dubai avg
- Current price highlighted in large gold text
- YoY trend shown as a colored badge (green if positive)
