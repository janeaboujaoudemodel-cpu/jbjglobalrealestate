

## Plan: Pending Project Debugging — 5 Fixes

### Task 1: Fix Broken First Image

**Problem**: The first image in pending approval cards may fail to load due to overly aggressive URL filtering in `filterValidImages()` or cross-origin issues with `referrerPolicy`.

**Fix in `PendingImportCard.tsx`**:
- Add `referrerPolicy="no-referrer"` to the `SafeImage` component (line 306) — some external CDN images (especially Provident/Reelly) get blocked by strict referrer policies.
- Also update the `filterValidImages` call to preserve the original first image even if it looks like a "site asset" — add `reelly-backend.s3.amazonaws.com` and `ggfx-providentestate.s3` to `TRUSTED_IMAGE_DOMAINS` in `imageUtils.ts` if not already there.

**Fix in `imageUtils.ts`**: Add `reelly-backend.s3.amazonaws.com` and `ggfx-providentestate.s3.eu-west-2.amazonaws.com` to `TRUSTED_IMAGE_DOMAINS`.

### Task 2: Fix Developer Link to Specific Developer Page

**Problem**: `PendingImportCard.tsx` line 388 constructs the developer slug from the developer name using `encodeURIComponent(item.developer_name.toLowerCase().replace(/\s+/g, '-'))`. This is fragile and may not match the actual developer slug in the database. The card type doesn't include a `developer_slug` field.

**Fix**:
- Add `developer_slug?: string | null` to `PendingImportCardItem` type.
- In `ProjectApprovalQueue.tsx` where items are passed to `PendingImportCard`, look up the developer slug from the `developer_id` or pass it from the pending import data.
- Update the `Link` in `PendingImportCard.tsx` line 388 to use `item.developer_slug` when available, falling back to the name-based slug.
- In `ProjectApprovalQueue.tsx`, fetch developer slugs for the batch of imports and attach them.

### Task 3: Fix Back Button Behavior

**Problem**: The "Back to Queue" button in `PendingImportPreview.tsx` (line 584) navigates to `/listing-admin?view=data-ops&syncTab=approvals`. This is correct. However, `ListingAdmin.tsx` defaults `activeView` to `'data-ops'` and `dataOpsTab` to `"provident-hub"` (line 147). If the URL params don't override correctly (e.g., due to the `useEffect` dependency on `location.search` not re-triggering), the user lands on Provident Hub instead of Approvals.

**Fix**: The `useEffect` at line 153 has `activeView` in its condition check (`mappedView !== activeView`), which may prevent re-setting the view if it's already `data-ops`. Remove the `!== activeView` guard so the syncTab always gets applied. Also ensure the route uses the full path `/listing-admin` not just relative.

### Task 4: Fix Missing Handover Dates

**Problem**: This is a data-level issue. Many projects in the `pending_project_imports` table have null `handover_date` fields.

**Fix**: This requires running an enrichment pass, not a code change. The existing Provident enrichment tools can fill these. No code changes needed — but we should ensure the card clearly shows "No handover" instead of hiding it silently. Already handled by line 93 in `PendingImportCard.tsx` which flags it as optional missing.

### Task 5: Fix Card Edge Spacing

**Problem**: The grid container in `ProjectApprovalQueue.tsx` line 1211 wraps cards in `p-6` padding inside a bordered div, but the outer `CardContent` may not have sufficient horizontal padding.

**Fix**: Ensure the grid wrapper at line 1211 has adequate padding. Currently `p-6` which should be fine. Check if the parent `CardContent` or the overall Listing Admin container has edge-to-edge layout issues. Add `px-2 sm:px-4` to the grid wrapper if needed. Also check `ListingAdmin.tsx` container padding around the approvals tab content.

### Files Summary

| File | Change |
|------|--------|
| `src/lib/imageUtils.ts` | Add Reelly/Provident S3 domains to `TRUSTED_IMAGE_DOMAINS` |
| `src/components/listing-admin/PendingImportCard.tsx` | Add `referrerPolicy="no-referrer"` to SafeImage, add `developer_slug` field, use it in Link |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Fetch developer slugs, pass `developer_slug` to PendingImportCard, add padding to grid container |
| `src/pages/ListingAdmin.tsx` | Fix URL param sync logic to always apply `syncTab` param |
| `src/pages/listing-admin/PendingImportPreview.tsx` | No changes needed — back button URL is correct |

### Implementation Order

1. Fix image loading (imageUtils + PendingImportCard referrerPolicy)
2. Fix developer slug linking
3. Fix back button URL param sync
4. Fix card edge spacing

