

## Plan: Stamp Fixes, Recently Deleted System, Extract Runtime Fix, Guest Removal

### 1. Fix `ai-stamp-extract` RUNTIME_ERROR

**Root cause**: The edge function has `has_blank_screen: true` with no logs — this means it crashes before executing any code. The `deno.lock` or the import `https://deno.land/std@0.168.0/http/server.ts` may be incompatible with the current edge runtime.

**Fix** (`supabase/functions/ai-stamp-extract/index.ts`):
- Replace `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"` with the modern `Deno.serve()` pattern (no import needed)
- Redeploy the function

### 2. Arabic Top Arc + English Bottom Arc — Fix Rendering

**File: `src/lib/stampOfficialTemplate.ts`**

Current issues:
- Arabic text on top arc works via `renderTopArcTextPath` (textPath approach) — this should be correct
- English bottom arc uses per-character placement centered at 270° with `rotation = deg + 90` — user reports text still looks wrong/mirrored in some cases
- Location text (Arabic) needs to also be rendered as an arc (currently Arabic location uses `textPath` on top, but English location uses per-character bottom arc)

**Fixes**:
- Verify `renderBottomArcText` outputs correctly: characters at `startDeg` (left side of bottom arc) should be the first character of the English text. The current implementation places `chars[0]` at `startDeg` and `chars[n-1]` at the end — this IS correct for left-to-right reading. The `rotation = deg + 90` makes characters face outward. If the text appears flipped, the issue may be that the spread angle or starting angle is wrong.
- Reduce `spreadDeg` calculation to `Math.min(140, n * 8)` to prevent characters from wrapping too far
- Ensure Arabic location also uses arc rendering (currently it does via textPath on top half)

### 3. Border Width Controls — Thinner Internal Borders

Already partially implemented in `OfficialStampConfig` with `outerBorderWidth` and `innerBorderWidth`. Need to:
- Ensure the UI sliders in `StampGeneratorPage.tsx` are wired and visible
- Add more granular range (0.5-8 for outer, 0.3-4 for inner)

### 4. Recently Deleted for Stamp Projects (30-day soft delete)

**File: `src/components/stamp-generator/StampProjectsDashboard.tsx`**

Currently does hard `DELETE`. Change to:
- Add `deleted_at` column to `stamp_projects` table via migration
- Soft-delete: set `deleted_at = now()` instead of hard delete
- Add "Recently Deleted" tab showing soft-deleted items
- Add "Recover" and "Permanently Delete" bulk actions
- Auto-purge after 30 days (filter: `deleted_at IS NULL` for active, `deleted_at IS NOT NULL` for deleted)

**DB Migration**: `ALTER TABLE stamp_projects ADD COLUMN deleted_at timestamptz DEFAULT NULL;`

### 5. Remove "Continue as Guest" from Auth Page

**File: `src/pages/Auth.tsx`** (lines 672-677)
- Remove the guest button and its description text

### 6. Edge Function Redeploy

Redeploy `ai-stamp-extract` with the `Deno.serve()` pattern to fix the runtime error.

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-stamp-extract/index.ts` | Replace `serve()` import with `Deno.serve()` to fix runtime crash |
| `src/lib/stampOfficialTemplate.ts` | Tighten bottom arc spread, verify character order, ensure location arcs work |
| `src/components/stamp-generator/StampProjectsDashboard.tsx` | Soft-delete with Recently Deleted tab, bulk recover/permanent delete |
| `src/pages/Auth.tsx` | Remove "Continue as Guest" button |
| DB migration | Add `deleted_at` column to `stamp_projects` |

