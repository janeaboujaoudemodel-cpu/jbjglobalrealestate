
# Backfill Approved Listings and Remove Markdown Headers from Descriptions

## Problem Summary

1. **"Hashtags" in descriptions**: 1,801 projects have Reelly descriptions containing markdown headers like `##### Project general facts`, `##### Finishing and materials`, `##### Kitchen and appliances`, `##### Furnishing`, `##### Location description and benefits`. These display as styled headings on the page but the user wants them completely removed.

2. **Missing data on approved listings**: Many approved projects are missing amenities (1,264), floor plans, documents, payment plans, and other enrichment data that could come from Reelly detail API, Provident, or developer websites.

---

## Part 1: Remove All Markdown Headers from Descriptions (Database Fix)

Run a single SQL UPDATE to strip all markdown header markers (`#####`, `####`, `###`, `##`, `#` at line starts) from ALL 1,801 project descriptions. This converts section headers into plain paragraph text.

**SQL to execute:**
```sql
UPDATE projects
SET description = regexp_replace(
  regexp_replace(description, E'^#{1,6}\\s*', '', 'gm'),
  E'\\n{3,}', E'\\n\\n', 'g'
)
WHERE description LIKE '%#####%';
```

Also update the `renderMarkdownToHtml` function in `src/lib/markdownUtils.ts` to strip any remaining `#` header markers so future imports are also cleaned.

Also update the `bulk-approve-imports` edge function and `reelly-backfill-projects` edge function to strip markdown headers from descriptions BEFORE saving to the database, so new imports and backfills never re-introduce them.

---

## Part 2: Enhanced Backfill System

The existing backfill infrastructure already has:
- `reelly-backfill-projects` -- fetches detail data from Reelly API for approved projects
- `provident-enrich-projects` -- enriches projects with Provident data (amenities, PDFs, images)
- UI controls in `ReellyImportPanel.tsx`

### What needs to change:

**A. Clean descriptions during backfill** -- Update `reelly-backfill-projects/index.ts` (line 405-408) to strip markdown headers from `detail.overview` before saving:

```typescript
// Before saving description
let cleanDesc = detail.overview || detail.short_description || '';
cleanDesc = cleanDesc.replace(/^#{1,6}\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim();
if (cleanDesc) {
  updateData.description = cleanDesc;
}
```

**B. Clean descriptions during bulk approve** -- Update `bulk-approve-imports/index.ts` (line 222) to strip headers from the description field before inserting:

```typescript
description: (item.description || item.short_description || '')
  .replace(/^#{1,6}\s*/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim() || null,
```

**C. Clean descriptions in client-side approve** -- Update `ProjectApprovalQueue.tsx` `approveImportInDb` function to strip headers when building `projectData.description`.

---

## Part 3: Prevent Future Markdown Headers

Update `src/lib/markdownUtils.ts`:
- Modify `cleanRawText()` to also strip `#####` style headers (not just inline hashtags)
- Add a `cleanDescription()` export that strips all markdown headers for use in import pipelines

---

## Files to Modify

| File | Change |
|---|---|
| Database (SQL) | Strip `#####` headers from all 1,801 descriptions |
| `supabase/functions/reelly-backfill-projects/index.ts` | Strip headers from description before saving |
| `supabase/functions/bulk-approve-imports/index.ts` | Strip headers from description before inserting |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Strip headers in client-side approve |
| `src/lib/markdownUtils.ts` | Add `cleanDescription()` helper; update `cleanRawText()` to strip `#####` headers |
