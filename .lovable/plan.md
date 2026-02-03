
# Fix Plan: Sync Dashboard & Test Extraction Issues

## Problems Identified

1. **Rebuild Queue shows confusing "Queue cleared, 0 removed" then fails with 402** — credits exhausted not detected by UI
2. **Test extraction result disappears** when navigating away — state not persisted
3. **Test extraction marked "Incomplete"** even with core data — criteria too strict for test panel
4. **Credits exhausted banner not triggered** by Rebuild Queue errors
5. **No extraction happens** because Firecrawl has no credits (all subsequent calls fail)

---

## Implementation Plan

### Phase 1: Persist Test Extraction Results

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

- Store `testResult` in `sessionStorage` alongside the component state
- On mount, restore `testResult` from `sessionStorage` if available
- When user clicks "Reject", clear the stored result
- This ensures the test result survives tab navigation and page refreshes

### Phase 2: Separate "Core Complete" vs "Fully Complete" in Test Panel

**File: `src/components/listing-admin/TestOneListingPanel.tsx`**

- Change validation logic to distinguish:
  - **Core Complete**: 2+ images + 1+ document + description (>50 chars) + developer name
  - **Fully Complete**: Core + USPs + amenities + floor plans + payment + FAQs
- Display both statuses clearly:
  - Core Complete = green "Ready for Bulk" badge
  - Fully Complete = gold "Premium Quality" badge
- Enable the "Approve" button when **Core Complete** (not requiring Fully Complete)
- Show checklist of what's present vs missing so user can make informed decision

### Phase 3: Detect Credits Exhausted in Rebuild Queue Flow

**File: `src/components/listing-admin/SyncDashboard.tsx`**

- In `rebuildQueueFromMap()`, check if the `discover-all-projects` response contains `credits_exhausted: true` or status 402
- If detected, set `setCreditsExhausted(true)` and show the credits exhausted banner
- Stop the rebuild flow immediately with a clear message

```text
┌─────────────────────────────────────────────────────┐
│ Rebuild Queue Flow                                  │
├─────────────────────────────────────────────────────┤
│ 1. Clear queue (reset-project-import-queue)         │
│    └─ Shows "Queue cleared, X removed"              │
│                                                     │
│ 2. Discover URLs (discover-all-projects)            │
│    ├─ Success → Insert URLs → Continue              │
│    └─ 402 Error → Set creditsExhausted flag         │
│                → Show banner                        │
│                → Stop rebuild                       │
└─────────────────────────────────────────────────────┘
```

### Phase 4: Improve Error Handling for Discovery Calls

**File: `src/components/listing-admin/SyncDashboard.tsx`**

- In both `rebuildQueueFromMap()` and `fullWipeAndRebuild()`:
  - Parse the response body for `credits_exhausted` flag
  - Handle HTTP 402 status explicitly
  - Display user-friendly error: "Firecrawl credits exhausted. Please top up at firecrawl.dev/pricing"

### Phase 5: Add Clear Status Indicators

**File: `src/components/listing-admin/SyncDashboard.tsx`**

- When `creditsExhausted` is true:
  - Disable all extraction/rebuild buttons
  - Show prominent banner explaining the situation
  - Provide direct link to Firecrawl pricing page
  - Add "Retry" button that clears the flag and attempts again

---

## Technical Details

### SessionStorage Keys for Test Panel Persistence

```text
- "test_extraction_result" → JSON of testResult object
- "test_extraction_approved" → "true" if user approved
```

### Core Complete Criteria (for Approval Gate)

| Field | Requirement |
|-------|-------------|
| Images | At least 2 non-placeholder URLs |
| Documents | At least 1 mirrored PDF |
| Description | At least 50 characters |
| Developer | Not null and not "Unknown" |

### Credits Exhausted Detection Points

1. `batch-extract-pending` → returns `credits_exhausted: true` (already implemented)
2. `discover-all-projects` → returns HTTP 402 with `credits_exhausted: true` (already implemented)
3. UI handlers for both functions must check for these flags

---

## Files to Modify

1. **`src/components/listing-admin/TestOneListingPanel.tsx`**
   - Add sessionStorage persistence for test results
   - Separate Core vs Full completeness
   - Show detailed checklist of extracted fields

2. **`src/components/listing-admin/SyncDashboard.tsx`**
   - Handle 402/credits_exhausted in `rebuildQueueFromMap()`
   - Handle 402/credits_exhausted in `fullWipeAndRebuild()`
   - Improve error messages for discovery failures

---

## Expected Outcome

After implementation:
- Test extraction results persist when navigating away
- Users can approve extractions that have core data (images, docs, description)
- Credits exhausted errors are immediately detected and clearly displayed
- All extraction/rebuild buttons are disabled when credits are exhausted
- Clear guidance on how to resolve (link to Firecrawl pricing)
