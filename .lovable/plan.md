
# Complete Fix Plan: Automatic API Data Flow, Progress Bugs & Payment Plan Display

## Root Cause Analysis

### Issue 1: 778 Reelly imports show as "Incomplete" with no developer

**Database Query Results:**
```
no_developer: 778 (100% missing)
no_floor_plans: 778 (100% missing)
no_payment_plan: 778 (100% missing)
```

**Root Cause:** The `reelly-api-sync` edge function:
1. Saves `developer_name` as a string ("Dar Global") but NOT `developer_id`
2. The completion check requires `developer_id` (foreign key) NOT just developer_name
3. No payment_plan, no floor_plan_types extracted - Reelly API doesn't provide these fields directly

### Issue 2: Fix Progress Shows "1 on 50" then "5000%" - Broken Numbers

**Root Cause:** The "Fix All" runner is designed for **Provident extraction** (Firecrawl scraping), not for Reelly API data. When it runs against Reelly imports:
- It calls `batch-extract-pending` which uses Firecrawl to scrape
- Reelly source URLs (`https://reelly.io/project/34#reelly_34`) aren't Provident pages
- The scraper fails or returns garbage data
- Progress calculation shows wrong percentages due to error accumulation

### Issue 3: Payment Plan 3-Color Visualization Not Showing

**Root Cause:** The `PaymentPlanVisualization` component only renders when:
```tsx
{(!!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown) && (
```

But Reelly imports have:
- `payment_plan: null`
- `payment_breakdown: {}` (empty object)
- No payment plan documents

The API doesn't provide payment plan data directly, so the section never renders.

### Issue 4: User Expectation - Automatic Loading Without Manual Sync

**Current State:** Reelly data is synced to `pending_project_imports` (staging table) and requires manual approval before appearing on the website.

**User Expectation:** Once API connection exists, data should flow automatically to the live website without admin intervention.

---

## Solution Architecture

### Philosophy Change: Reelly = Live API, Provident = Scraping Queue

```text
+-------------------+     +----------------------+     +-------------+
|    Reelly API     | --> |   pending_project    | --> |   projects  |
| (structured data) |     |      imports         |     |   (live)    |
+-------------------+     +----------------------+     +-------------+
                               |
                               | AUTO-APPROVE if complete
                               v
                          [website displays]

vs current:

+-------------------+     +----------------------+     +-------------+
|    Reelly API     | --> |   pending_project    | --> |   projects  |
+-------------------+     |      imports         |     +-------------+
                          +----------------------+
                               |
                               | MANUAL APPROVAL REQUIRED
                               v
                          [admin clicks approve]
```

---

## Implementation Plan

### Phase 1: Fix Developer Linking in Reelly Sync

**Problem:** `developer_name` is saved but `developer_id` is null

**File:** `supabase/functions/reelly-api-sync/index.ts`

**Change:** After mapping project data, look up or create developer in the `developers` table:

```typescript
// After mapReellyToImport, before database insert:
async function getOrCreateDeveloper(supabase, developerName: string): Promise<string | null> {
  if (!developerName) return null;
  
  // Try to find existing developer by name (case-insensitive)
  const { data: existing } = await supabase
    .from("developers")
    .select("id")
    .ilike("name", developerName)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  // Create new developer
  const slug = developerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { data: newDev, error } = await supabase
    .from("developers")
    .insert({
      name: developerName,
      slug: slug,
      is_active: true,
    })
    .select("id")
    .single();
  
  if (error) {
    console.error(`Failed to create developer ${developerName}:`, error);
    return null;
  }
  
  return newDev?.id || null;
}

// In sync loop:
const developerId = await getOrCreateDeveloper(supabase, project.developer);
mappedProject.developer_id = developerId;
```

### Phase 2: Extract Payment Plan from Description/Overview

**Problem:** Reelly API doesn't provide `payment_plan` field, but the description often contains payment info.

**File:** `supabase/functions/reelly-api-sync/index.ts`

**Change:** Parse payment plan from project overview:

```typescript
function extractPaymentPlanFromOverview(overview: string | null): {
  payment_plan: string | null;
  payment_breakdown: object | null;
} {
  if (!overview) return { payment_plan: null, payment_breakdown: null };
  
  // Look for payment plan patterns
  // Pattern 1: "60/40", "70/30", "80/20"
  const ratioMatch = overview.match(/(\d{2})\/(\d{2})\s*payment/i);
  if (ratioMatch) {
    return {
      payment_plan: `${ratioMatch[1]}/${ratioMatch[2]}`,
      payment_breakdown: {
        down_payment: `${Math.min(parseInt(ratioMatch[1]), 20)}%`,
        during_construction: `${parseInt(ratioMatch[1]) - Math.min(parseInt(ratioMatch[1]), 20)}%`,
        on_completion: `${ratioMatch[2]}%`,
      }
    };
  }
  
  // Pattern 2: "10% down payment", "20% on booking"
  const downPaymentMatch = overview.match(/(\d+)%?\s*(?:down\s*payment|on\s*booking)/i);
  const handoverMatch = overview.match(/(\d+)%?\s*(?:on\s*handover|on\s*completion)/i);
  
  if (downPaymentMatch || handoverMatch) {
    const down = downPaymentMatch ? parseInt(downPaymentMatch[1]) : 20;
    const handover = handoverMatch ? parseInt(handoverMatch[1]) : 40;
    const construction = 100 - down - handover;
    
    return {
      payment_plan: `${down + construction}/${handover}`,
      payment_breakdown: {
        down_payment: `${down}%`,
        during_construction: `${construction}%`,
        on_completion: `${handover}%`,
      }
    };
  }
  
  return { payment_plan: null, payment_breakdown: null };
}
```

### Phase 3: Auto-Approve Complete Reelly Imports

**Problem:** User doesn't want to manually approve each project.

**File:** `supabase/functions/reelly-api-sync/index.ts`

**Change:** After insert/update, if project is "complete", auto-create in `projects` table:

```typescript
function isProjectComplete(data: any): boolean {
  return !!(
    data.name &&
    data.description &&
    data.developer_id &&
    data.images?.length > 0 &&
    data.price_from > 0
  );
}

// After upserting to pending_project_imports:
if (isProjectComplete(mappedProject)) {
  // Auto-approve: insert directly to projects table
  const projectData = {
    ...mappedProject,
    source: 'reelly',
    status: 'active',
    is_offplan: true,
  };
  
  await supabase
    .from("projects")
    .upsert(projectData, { onConflict: "slug" });
  
  // Mark pending import as approved
  await supabase
    .from("pending_project_imports")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", pendingImportId);
}
```

### Phase 4: Fix Progress Calculation Bug

**Problem:** "1 on 50" and "5000%" displays

**File:** `src/components/listing-admin/SyncDashboard.tsx`

**Change:** Add source-aware batch processing and fix percentage calculation:

```typescript
// Line ~1062 - Fix progress calculation
const progressPercent = bulkTotal > 0 
  ? Math.min(100, Math.round((bulkDone / bulkTotal) * 100))
  : 0;

// Ensure we never show > 100%
<span>{progressPercent}%</span>
```

Also, the "Fix All" button should NOT process Reelly imports with Firecrawl:

```typescript
// In batch-extract-pending, skip Reelly sources
const { data: pending } = await supabase
  .from("pending_project_imports")
  .select("id, source_url")
  .eq("status", "pending")
  .not("source_url", "ilike", "%reelly%") // Skip Reelly imports
  .ilike("review_notes", "%PENDING_SCRAPE%")
  .limit(limit);
```

### Phase 5: Create Reelly-Specific Enrichment Function

**Problem:** Reelly imports need enrichment (floor plans, etc.) from their website, not Provident.

**File:** `supabase/functions/reelly-fill-missing-assets/index.ts` (already created)

**Change:** Update to actually scrape Reelly project pages for:
- Floor plan images/PDFs
- Brochure PDFs
- Payment plan documents
- Gallery images

**UI Change:** Add "Enrich Reelly Data" button in ReellyImportPanel that calls this function instead of the Provident "Fix All".

### Phase 6: Separate Reelly Queue Actions

**File:** `src/components/listing-admin/ReellyImportPanel.tsx`

**Change:** Replace "View Queue" with dedicated Reelly actions:

```tsx
// Instead of navigating to shared queue:
<Button onClick={runReellyEnrichment}>
  Enrich Missing Data
</Button>

<Button onClick={autoApproveCompleteReelly}>
  Auto-Approve Complete
</Button>
```

---

## Database Changes

```sql
-- No new tables needed, but ensure these columns exist on pending_project_imports:
-- (Already exist based on schema check)
ALTER TABLE pending_project_imports 
  ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES developers(id);
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/reelly-api-sync/index.ts` | Edit | Add developer linking, payment extraction, auto-approve |
| `supabase/functions/reelly-fill-missing-assets/index.ts` | Edit | Enhance to scrape floor plans, brochures |
| `supabase/functions/batch-extract-pending/index.ts` | Edit | Skip Reelly sources (they use different enrichment) |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Edit | Add dedicated enrich/approve actions |
| `src/components/listing-admin/SyncDashboard.tsx` | Edit | Fix progress calculation, source-aware UI |

---

## Expected Outcome After Implementation

1. **Reelly Sync:**
   - Projects automatically link to developers (creates if needed)
   - Payment plans extracted from description text
   - Complete projects auto-approve to live website
   
2. **Admin UI:**
   - Separate "Enrich Reelly" button (not Provident Fix All)
   - Progress shows accurate percentages (never > 100%)
   - Queue properly filters by source
   
3. **Project Display:**
   - Payment Plan 3-color visualization shows when data extracted
   - Developer info displays correctly
   - All Reelly data flows automatically

4. **No Manual Work:**
   - API sync → auto-approve → live on website
   - Only incomplete projects need manual review

---

## Technical Details

### Payment Plan Colors (PaymentPlanVisualization.tsx)

The component already has 3-color support:
- **Emerald (booking):** `bg-emerald-500`
- **Amber (construction):** `bg-amber-500`  
- **Gold (handover):** `bg-gold`

The issue is that `payment_plan` and `payment_breakdown` are null. Once we extract these from the description, the visualization will appear.

### Developer ID Linking

Current flow:
1. API returns `developer: "Dar Global"` (string)
2. We save `developer_name: "Dar Global"` ✓
3. We save `developer_id: null` ✗

New flow:
1. API returns `developer: "Dar Global"`
2. Query `developers` table for name match
3. If not found, INSERT new developer
4. Save both `developer_name` AND `developer_id`
