

# Auto-Generate AI Area Intelligence

## Problem
The AI Area Intelligence section requires users to click "Generate AI Area Analysis" button, and even when clicked, it shows "Analysis not available" because:
- The request body sends `{ prompt, area }` but the edge function expects `{ area, propertyType }`
- The response reads `data?.analysis` but the function returns `data?.fullAnalysis`

## Solution

**File:** `src/components/area-detail/AreaAIAnalyzer.tsx`

### Changes:
1. **Auto-trigger on load**: Add a `useEffect` that calls the analysis automatically once `stats` data is available (no button click needed)
2. **Fix request body**: Send `{ area: areaName, propertyType: "all" }` to match the edge function's expected format
3. **Fix response mapping**: Read `data?.fullAnalysis` instead of `data?.analysis`
4. **Remove the button**: Replace the button UI with a loading spinner that shows while the analysis generates automatically
5. **Cache results**: Use the existing `useState` to prevent re-fetching on re-renders

### Technical Details
- Add `useEffect` with dependency on `stats` — when stats load and analysis is null, auto-call `handleAnalyze()`
- Update the invoke call: `supabase.functions.invoke("ai-property-analyzer", { body: { area: areaName, propertyType: "all" } })`
- Update response: `setAnalysis(data?.fullAnalysis || "Analysis not available.")`
- Replace button section with a centered `Loader2` spinner and "Analyzing [area]..." text during loading
- Add `useRef` flag to prevent duplicate calls

