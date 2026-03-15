

## AI Tools Color Theme Audit & Deduplication

### Current State
All 15 AI tools already use `AIToolPremiumLayout` with unique accent colors and consistent internal theming (cards, inputs, buttons, badges all match their tool's color). The Neighborhood Insights (teal) pattern the user likes is already the standard across all tools.

### Issue Found
Two tools share the same color — **Call Summarizer** and **Competitor Analysis** both use `orange`. This needs deduplication to give each tool a distinct identity.

### Color Map (current → proposed)

| Tool | Current Color | Proposed |
|------|--------------|----------|
| Neighborhood Insights | teal | teal (keep) |
| Price Predictor | blue | blue (keep) |
| ROI Calculator | emerald | emerald (keep) |
| Market Report | indigo | indigo (keep) |
| Lead Qualification | purple | purple (keep) |
| Objection Handler | rose | rose (keep) |
| Follow-up Scheduler | cyan | cyan (keep) |
| Translation Hub | amber | amber (keep) |
| Document Generator | lime | lime (keep) |
| Contract Reviewer | red | red (keep) |
| Video Tour Script | pink | pink (keep) |
| Meeting Summarizer | violet | violet (keep) |
| Property Analyzer | sky | sky (keep) |
| Call Summarizer | orange | orange (keep) |
| **Competitor Analysis** | **orange (duplicate)** | **gold** |

### Implementation
Single file change: `AICompetitorAnalysisPremium.tsx` — change `accentColor` and `gradientFrom` from `"orange"` to `"gold"`, and update all internal `orange-` class references to `gold/` equivalents. The `AIToolPremiumLayout` already has a `gold` color definition ready to use.

### Files to modify
- `src/components/ai-tools/premium/AICompetitorAnalysisPremium.tsx` — retheme from orange to gold

