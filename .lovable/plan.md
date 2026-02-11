

# Fix Plan: Area Page Errors, AI Analyzer, and Missing Project Prices

## Issue 1: AreaProjectsGrid 400 Error (Root Cause of Multiple Failures)

**Root Cause:** The `AreaProjectsGrid.tsx` query references `project_images(image_url, alt_text, sort_order)` but the actual column in the `project_images` table is `display_order`, not `sort_order`. PostgREST returns error code `42703` ("column project_images_1.sort_order does not exist").

This same bug exists in multiple files that use `sort_order` instead of `display_order`:

**Files to fix:**

| File | Line | Change |
|------|------|--------|
| `src/components/area-detail/AreaProjectsGrid.tsx` | 26 | `sort_order` to `display_order` |

Additionally, the `AreaDevelopersBar.tsx` (line 18) uses `developer:developers(...)` which also fails if the query structure is wrong. Need to verify.

## Issue 2: AI Area Intelligence Stuck on "Analyzing..."

**Root Cause:** The AI analyzer depends on the `stats` query succeeding first (line 123: `if (isVisible && stats && stats.totalProjects > 0`). The stats query itself works fine (returns 200), so the AI call should trigger. However, testing the edge function directly shows it works and returns a full analysis.

The actual issue is that the `AreaProjectsGrid` error may be causing React Query to throw unhandled errors that cascade. Additionally, I tested the edge function and it responds successfully -- the issue may be intermittent or related to the frontend not properly handling the response.

I will also add better error handling to ensure the AI section doesn't get permanently stuck.

## Issue 3: Missing Prices for Palm Jebel Ali and Binghatti Vintage

The Reelly API is currently returning 500 errors, so I cannot fetch prices from there. However, web research found:

- **Palm Jebel Ali Villas (Nakheel):** Starting from AED 18,500,000 (5-bedroom villas, Frond C launch price AED 18M+)
- **Binghatti Vintage (Majan):** Starting from AED 600,000 (studio apartments)

**Database update needed:**
```sql
UPDATE projects SET price_from = 18500000 WHERE slug = 'palm-jebel-ali-villas-nakheel-656';
UPDATE projects SET price_from = 600000 WHERE slug = 'binghatti-vintage-binghatti-3046';
```

## Issue 4: DLD Market Widget Price Display

After inspecting the "Dubai Market Intelligence" section on the area page, the data appears to be rendering correctly (YTD Volume AED 55.1B, 18,500 transactions, etc.). The section uses hardcoded data from `dldMarketData.ts`. If there's a specific price formatting issue, it may be related to the area page's project queries failing (Issue 1), causing the overall page to appear broken.

Once Issue 1 is fixed, the full page should render correctly and any layout shifts near the DLD widget should resolve.

## Summary of Changes

| # | Issue | File/Location | Fix |
|---|-------|---------------|-----|
| 1 | Projects grid 400 error | `AreaProjectsGrid.tsx` line 26 | Change `sort_order` to `display_order` |
| 2 | AI analyzer stuck | Cascading from Issue 1; will verify after fix | May need error handling improvement |
| 3 | Missing prices | Database | Update price_from for 2 projects |
| 4 | DLD widget | No code change | Resolves with Issue 1 fix |

