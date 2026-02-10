

# Fix AI Area Intelligence Loading + Disclaimer "Contact Our Team" Links

## Issue 1: AI Area Intelligence Spinner Never Stops

**Root Cause:** The backend function works correctly (tested and returns full analysis in ~10 seconds). The issue is on the frontend in `AreaAIAnalyzer.tsx`:

- The `useEffect` that auto-triggers analysis has a dependency on `handleAnalyze` which is wrapped in `useCallback` with `[areaName]` dependency. However, the trigger condition checks `!analysis && !isAnalyzing` -- if the component re-renders (e.g., from parent state changes or React Query refetches), the `hasTriggered.current` ref may not persist correctly across remounts.
- Additionally, if the `supabase.functions.invoke` call silently fails (e.g., CORS mismatch from the preview domain, or a network timeout), the catch block sets a generic error message but the `isAnalyzing` state may not reset properly in all edge cases.

**Fix in `src/components/area-detail/AreaAIAnalyzer.tsx`:**
- Add a timeout fallback: if analysis takes longer than 30 seconds, show a "retry" button instead of infinite spinner
- Add error state handling with a visible retry button
- Ensure the `finally` block always resets `isAnalyzing` to false (it does, but add a safety timeout)
- Replace the infinite spinner with a timeout-aware loading state

**Changes:**
- Add `hasTimedOut` state that triggers after 30 seconds
- In the loading UI (lines 159-163), show a "Retry" button when timed out instead of endless spinner
- Add `error` state to show meaningful feedback instead of silent failure

## Issue 2: Disclaimer Links -- "Contact Our Team" CTA

Every disclaimer that says "does not constitute financial advice" should append a clickable "Contact our team" link.

**Files to update (7 locations):**

1. `src/components/area-detail/AreaAIAnalyzer.tsx` (line 272) -- footer disclaimer
2. `src/components/shared/DLDMarketWidget.tsx` (line 187) -- full version disclaimer
3. `src/components/shared/DLDMarketWidget.tsx` (line 64-66) -- compact version disclaimer
4. `src/components/client-intelligence/ClientMarketSnapshot.tsx` (line 221-224)
5. `src/components/client-intelligence/ClientMarketContext.tsx` (line 148-151)
6. `src/components/AIMarketAnalyzer.tsx` (line 408-412)
7. `src/components/ai-tools/premium/AIROICalculatorPremium.tsx` (line 339-343)

**Pattern for each:** Append a `Link` to `/contact` styled in gold:

```
...does not constitute financial advice. <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
```

## Technical Summary

| File | Change |
|------|--------|
| `src/components/area-detail/AreaAIAnalyzer.tsx` | Add 30s timeout + retry button + "Contact our team" link in footer |
| `src/components/shared/DLDMarketWidget.tsx` | Add "Contact our team" link in both compact and full disclaimers |
| `src/components/client-intelligence/ClientMarketSnapshot.tsx` | Add "Contact our team" link |
| `src/components/client-intelligence/ClientMarketContext.tsx` | Add "Contact our team" link |
| `src/components/AIMarketAnalyzer.tsx` | Add "Contact our team" link |
| `src/components/ai-tools/premium/AIROICalculatorPremium.tsx` | Add "Contact our team" link |

