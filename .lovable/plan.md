

## Plan: Listing Admin — Critical Fixes (Tabs, Descriptions, Navigation, Source Panel, Emojis, Generator)

### Issues Identified

**1. Data Ops tabs overflow — Enrichment Center, Emergency Mirror, Developer Visibility break out of the tab bar**
- `ListingAdmin.tsx` lines 758-809: 7 `TabsTrigger` items in a single `TabsList` with no overflow handling
- Scrolling the tab bar triggers browser back navigation (overscroll-behavior not set)

**2. Project Approval shows broken HTML in descriptions**
- `PendingImportCard.tsx` line 261: `truncate(item.description, 120)` shows raw HTML tags
- Must sanitize using `sanitizeForDisplay()` from `contentSanitizer.ts` before displaying

**3. Clicking a project card navigates to wrong tab (Reelly Sync)**
- `ProjectApprovalQueue.tsx` line 1232: `navigate(/listing-admin/preview/${item.id})` but route in `AdminRoutes.tsx` line 102 redirects `/listing-admin/preview/:id` to `/owner/listing-admin` — which defaults to `data-ops` view with `reelly` tab (line 140)
- Fix: Navigate using search params to stay in the approvals tab, or open a preview modal instead

**4. Auto-Approve Developer Listing toggle is in Project Approvals — should be in Developer Hub**
- `ListingAdmin.tsx` line 815: `<AutoApproveToggle />` rendered inside `approvals` tab content
- Move to Developer Hub / AdminDevelopers page

**5. SourceCountsPanel shows only Reelly — must show both Reelly and Provident as selectable categories**
- `SourceCountsPanel.tsx`: Hardcoded "Reelly-Only Mode Active" banner
- Must add a selector between Reelly and Provident sources, defaulting to neither (user chooses)

**6. Published count (2,778) is incorrect / publishing without permission**
- The extraction pipeline sets `is_published: true` on approve. Need to remove auto-publish from extraction upserts; only publish on explicit admin approval

**7. "Data OPS" label is confusing**
- Rename to something clearer like "Admin Panel" or "Sync & Sources"

**8. ListingGenerator state lost on page refresh**
- Already has `localStorage` persistence (`STORAGE_KEY`) and cloud draft sync, but the `files` state (actual File objects) cannot survive refresh — need to persist file data as base64 and restore

**9. Duplicate file/text detection missing in ListingGenerator**
- No check for duplicate uploads or duplicate description text

**10. Generate listing too slow / times out**
- Model upgrade already done in previous step; verify deployment. Increase batch size further if needed.

**11. Emoji usage in AdminDevelopers tabs**
- `AdminDevelopers.tsx` line 390: `📊 Overview`, line 399: `📅 Briefings` — must replace with Lucide icons

**12. Extraction jobs show "Found 1616, matched 0" — enrichment center broken**
- This is a backend data issue with the extraction pipeline returning zero matches

---

### Implementation

#### 1. Fix Tab Overflow in ListingAdmin Data Ops
**File: `src/pages/ListingAdmin.tsx`**
- Add `flex-wrap` or horizontal scroll with `overscroll-behavior-x: contain` to the `TabsList`
- Use `overflow-x-auto` with `scrollbar-hide` class and `overscroll-behavior: contain` to prevent back-navigation
- Reduce tab text sizes for compactness

#### 2. Sanitize Descriptions in PendingImportCard
**File: `src/components/listing-admin/PendingImportCard.tsx`**
- Import `sanitizeForDisplay` from `@/utils/contentSanitizer`
- Apply to description before truncation: `truncate(sanitizeForDisplay(item.description), 120)`
- Also apply in `ProjectApprovalQueue.tsx` detail modal (line 1350+)

#### 3. Fix Project Review Navigation
**File: `src/components/listing-admin/ProjectApprovalQueue.tsx`**
- Change `onReview` to open the detail modal (`setSelectedImport(item)`) instead of navigating away
- Remove the broken `navigate(/listing-admin/preview/...)` call

#### 4. Move AutoApproveToggle to Developer Hub
**File: `src/pages/ListingAdmin.tsx`**
- Remove `<AutoApproveToggle />` from `approvals` tab content (line 815)
- Add an auto-approve toggle for extraction projects instead (optional)

**File: `src/pages/AdminDevelopers.tsx`**
- Import and render `AutoApproveToggle` component in the Developer Hub header area

#### 5. Rewrite SourceCountsPanel — Dual Source Selector
**File: `src/components/listing-admin/SourceCountsPanel.tsx`**
- Remove "Reelly-Only Mode" banner
- Add two selectable source cards: "External Source A" and "External Source B" (Reelly / Provident internally)
- Show counts for the selected source only
- Wire card clicks to navigate to approvals with correct source filter

#### 6. Rename "Data Ops" to "Sync & Sources"
**File: `src/pages/ListingAdmin.tsx`**
- Change button label from "Data Ops" to "Sync & Sources" (line 719)
- Update URL param handling to keep backward compat

#### 7. Fix ListingGenerator State Persistence
**File: `src/components/listing-admin/ListingGenerator.tsx`**
- Already persists to localStorage + cloud. The issue is `File` objects can't serialize. Files are already converted to base64 (line 140-144). On restore, reconstruct `UploadedFile[]` from `filesMeta` base64 data.
- Add duplicate file detection: compare file name + size before adding
- Add duplicate text detection: compare description text before submitting

#### 8. Replace Emojis with Lucide Icons in AdminDevelopers
**File: `src/pages/AdminDevelopers.tsx`**
- Line 390: Replace `📊 Overview` with `<BarChart3 className="w-4 h-4 mr-1" /> Overview`
- Line 399: Replace `📅 Briefings` with `<Calendar className="w-4 h-4 mr-1" /> Briefings`

#### 9. Fix Description Sanitization in ProjectApprovalQueue Detail Modal
**File: `src/components/listing-admin/ProjectApprovalQueue.tsx`**
- Apply `sanitizeForDisplay()` to description rendering in the detail modal section (around line 1350+)

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/ListingAdmin.tsx` | Fix tab overflow with scroll + contain, rename "Data Ops", move AutoApproveToggle out |
| `src/components/listing-admin/PendingImportCard.tsx` | Sanitize descriptions before display |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Fix review click to open modal not navigate away, sanitize descriptions |
| `src/components/listing-admin/SourceCountsPanel.tsx` | Rewrite as dual-source selector panel |
| `src/pages/AdminDevelopers.tsx` | Replace emoji with Lucide icons, add AutoApproveToggle |
| `src/components/listing-admin/ListingGenerator.tsx` | Add duplicate file/text detection, fix file restoration |

