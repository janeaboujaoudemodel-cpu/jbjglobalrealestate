

# Listing Admin Data Quality Crisis — Root Cause & Fix Plan

## What's Actually Happening

I queried the live database and found the following:

**Total projects in DB: 2,778 — ALL are marked `is_published = true`.**

The breakdown:
- **1,414 from Reelly API** — most have data (descriptions, developers, images)
- **1,334 from Provident Portal** — **~274 are empty stubs** (no description, no developer, no meaningful data). These are the broken ones you're seeing. They were imported with just a name and a cover image URL, then auto-published.
- **15 name-level duplicates** (e.g. "La Perla" exists from both Provident and Reelly as separate entries)

### Why "In Binghatti Point" is empty
The Provident scraper imported ~40+ "In Binghatti ..." projects as stubs — name and cover image only. No description, no developer_name, no developer_id, no price, no handover. All were set to `is_published = true`. When you view one in the backend, the AI Intelligence section tries to generate analysis from zero data, producing meaningless/fabricated output.

### Why Recommended Projects show broken cards
`RecommendedProjects.tsx` does **no quality filtering** — it picks from all published projects. So stub projects with no description, no developer logo, no price can appear as recommendations.

### Why it says "1,819 live approved" vs 2,778
The `SourceCountsPanel` shows queue counts (pending/approved imports), not the actual published total. The "2,778 Total" comes from `useProjectsTotalCount()` which counts all rows. The confusion is that ALL 2,778 are published, including the 274 stubs.

---

## Fix Plan (5 tasks)

### 1. Unpublish incomplete stub projects (database fix)
Run a data operation to set `is_published = false` on projects that fail minimum quality:
- No description OR description < 50 chars
- No developer (both `developer_id` and `developer_name` are null)

This will immediately unpublish ~274 broken stubs, moving them to "Drafts" where they can be enriched before republishing. The published count will drop from 2,778 to ~2,487 real projects.

### 2. Deduplicate cross-source entries (database fix)
For the 15 duplicate project names (same project from Provident + Reelly), merge data into the richer record and delete the stub. Strategy:
- Keep the record with more data (description, developer, images)
- Delete the empty duplicate

### 3. Add quality gate to prevent future auto-publishing
Modify the import/sync pipeline to NOT set `is_published = true` on projects that lack:
- Description (≥50 chars)
- Developer name or ID
- At least 1 image

Files: `SyncDashboard.tsx`, `ProvidentPortalHub.tsx`, and the edge functions that handle imports.

### 4. Add quality filter to RecommendedProjects
In `src/components/project-detail/RecommendedProjects.tsx`, filter out projects missing description or developer before scoring. Same fix for `RecommendedDevelopers.tsx` (already has `is_active` check but should also check logo).

### 5. Guard AI Intelligence from empty data
In `src/components/project-detail/ProjectAIAnalyzer.tsx`, check if the project has meaningful data before triggering analysis. If description is null/empty AND no developer AND no price — show a "Data pending" message instead of generating fake analysis.

---

## Files Modified

| File | Change |
|------|--------|
| Database (data operation) | `UPDATE projects SET is_published = false WHERE (description IS NULL OR ...) AND (developer_id IS NULL AND developer_name IS NULL)` |
| Database (data operation) | Deduplicate 15 cross-source duplicates |
| `src/components/project-detail/RecommendedProjects.tsx` | Add quality filter: require description + developer |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Guard against empty data — show "Insufficient data" instead of fake analysis |
| `src/components/listing-admin/SyncDashboard.tsx` | Add quality gate before auto-publishing |
| `src/components/listing-admin/ProvidentPortalHub.tsx` | Add quality gate on import |

