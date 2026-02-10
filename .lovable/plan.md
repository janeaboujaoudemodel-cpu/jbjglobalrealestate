
# Fix Slow Routing, Description Formatting, and Missing Project Data

## Issues Identified

### 1. Slow Page Navigation (Routing)
The `ProjectDetail` component is lazy-loaded. With 200+ lazy components in `App.tsx`, every route change shows the `PageLoader` spinner while the JS chunk downloads. The fix: **prefetch** the ProjectDetail chunk when the user hovers on a card, so by the time they click, the module is already cached.

### 2. Description Renders as One Block
All project descriptions from Reelly come as plain text with section labels like "Project general facts", "Location description and benefits", "Finishing and materials", "Kitchen and appliances" — but these are **not** formatted as markdown headings. The `renderMarkdownToHtml` function only converts lines starting with `#` into headings. Since Reelly descriptions use plain-text section titles, they render as a wall of text. Fix: detect known section patterns and auto-format them as styled headings with separators.

### 3. Missing Amenities, Photos, Documents (1,809 projects)
Database audit reveals:
- **1,809 projects** have 0 documents (no brochures, floor plans)
- **1,767 projects** have 0 or 1 images
- **1,809 projects** have no amenities

Most projects come from Reelly with only basic metadata. The `sarah-test-extraction` edge function exists and can extract full data from Provident pages (images, PDFs, amenities), but it works one project at a time. Fix: build a **batch extraction** endpoint that processes projects in bulk from Provident.

---

## Implementation Plan

### Step 1: Fix Slow Routing (Prefetch on Hover)

**File: `src/components/home/FeaturedListings.tsx`**
- Add `onMouseEnter` handler on each project card Link that triggers `import("../../pages/ProjectDetail")` to prefetch the chunk
- This means when the user clicks, the module is already in browser cache -- instant navigation

**File: `src/components/PropertiesReellyContent.tsx`** (or wherever property grid cards live)
- Same prefetch pattern on property card hover

### Step 2: Fix Description Formatting

**File: `src/lib/markdownUtils.ts`**
- Add a new function `formatReellyDescription()` that detects known Reelly section patterns and converts them to proper markdown headings before the main render pass
- Patterns to detect (case-insensitive, at start of line after blank line):
  - "Project general facts" -> Remove entirely (redundant with "About" heading)
  - "Location description and benefits" -> `## Location`
  - "Finishing and materials" -> `## Finishing & Materials`
  - "Kitchen and appliances" -> `## Kitchen & Appliances`
  - "Furnishing" -> `## Furnishing`
  - Any standalone short line (under 40 chars) followed by a blank line and longer paragraph text -> auto-detect as a section heading
- Add visual separators (gold divider line) between sections

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- Call the new `formatReellyDescription()` before `renderMarkdownToHtml()` in the description section

### Step 3: Batch Provident Extraction for Missing Data

**File: `supabase/functions/provident-batch-extract/index.ts`** (new)
- Accepts `{ action: "extract-batch", limit: 25 }` 
- Queries projects that have 0 documents and 0 images
- For each project, attempts to find its Provident listing page by slug matching
- Uses the existing Gatsby page-data.json approach (from `_shared/provident/pagedata.ts`) to find PDF URLs
- Uses Firecrawl to scrape the full page for images
- Inserts extracted images into `project_images` and documents into `project_documents`
- Rate-limited: 1 concurrent request, 3s delay between items

This follows the existing architecture in `sarah-test-extraction` but works in batch mode.

---

## Technical Details

### Prefetch Pattern (Step 1)
```text
// On card hover, trigger module prefetch
const prefetchProjectDetail = () => {
  import("../../pages/ProjectDetail");
};

<Link 
  to={`/project/${slug}`} 
  onMouseEnter={prefetchProjectDetail}
>
```
This is a standard React pattern. The browser caches the import, so when React Router navigates to the route, the Suspense boundary resolves instantly.

### Description Formatter (Step 2)
Known Reelly section titles to detect:
- "Project general facts"
- "Location description and benefits"  
- "Finishing and materials"
- "Kitchen and appliances"
- "Furnishing"
- "Location description"
- "Project highlights"

Each gets converted to a styled `<h3>` with a gold top border for visual separation. "Project general facts" is stripped entirely since the page already has "About [Project Name]" as the heading.

### Batch Extraction (Step 3)
The flow for each project:
1. Derive Provident slug from project name (lowercase, hyphenated)
2. Fetch `page-data.json` from Provident Gatsby endpoint -> extract PDF URLs (brochure, floor plans, payment plan)
3. If Firecrawl is available, scrape the listing page for CloudFront image URLs
4. Insert results into `project_images` and `project_documents` tables
5. Update project record with amenities if found
6. Log progress to `sync_jobs` table

### Files Summary

| File | Action | Purpose |
|---|---|---|
| `src/lib/markdownUtils.ts` | Edit | Add `formatReellyDescription()` to auto-detect section headings |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Edit | Apply description formatter before rendering |
| `src/components/home/FeaturedListings.tsx` | Edit | Add prefetch on hover for ProjectDetail |
| `supabase/functions/provident-batch-extract/index.ts` | New | Batch extraction of images/docs from Provident for projects missing data |
