
# Comprehensive Data Extraction & Display Fix Plan

## Issues Summary

| Issue | Root Cause | Priority |
|-------|------------|----------|
| Queue not showing all | Pagination (60/page) - "Load More" button exists | Low (feature working) |
| `#` hashtags in descriptions | Markdown not rendered as HTML | High |
| Missing Reelly data (floor plans, units, amenities) | API only provides basic project data | High |
| Floor plans broken | `floor_plan_types` empty for Reelly imports | High |
| Bedroom labels incomplete | Only min/max, not labels | Medium |
| Reelly login not working | `REELLY_EMAIL`/`REELLY_PASSWORD` secrets exist but unused | Clarified - API uses only `REELLY_API_KEY` |

---

## Phase 1: Fix Markdown/Hashtag Rendering in Descriptions

**Problem:** The `description` field from Reelly contains markdown text with `#` headers that display literally.

**Solution:** Create a markdown-to-HTML renderer and sanitize before display.

### File: `src/lib/markdownUtils.ts` (New)

```typescript
import DOMPurify from 'dompurify';

/**
 * Convert markdown text to safe HTML
 * Handles: headers (#), bold (**), italic (*), lists, links
 */
export function renderMarkdownToHtml(markdown: string | null): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-lg mt-4 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-xl mt-6 mb-3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-2xl mt-8 mb-4">$1</h2>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-5 space-y-1">$&</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br/>');
  
  // Wrap in paragraph
  if (!html.startsWith('<')) html = `<p>${html}</p>`;
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'ul', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
  });
}

/**
 * Strip all markdown formatting for plain text display
 */
export function stripMarkdown(markdown: string | null): string {
  if (!markdown) return '';
  return markdown
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s*/gm, '• ')
    .trim();
}
```

### File: `src/components/project-detail/ProjectDetailLayout.tsx`

Update the description section (around line 604):

**Before:**
```tsx
<p className="mt-4 text-body text-muted-foreground leading-relaxed whitespace-pre-line">
  {project.description || "Details will be provided by our team."}
</p>
```

**After:**
```tsx
{project.description ? (
  <div 
    className="mt-4 text-body text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
    dangerouslySetInnerHTML={{ 
      __html: renderMarkdownToHtml(project.description) 
    }}
  />
) : (
  <p className="mt-4 text-body text-muted-foreground">
    Details will be provided by our team.
  </p>
)}
```

---

## Phase 2: Enhance Reelly API Sync with Additional Endpoints

**Problem:** The Reelly API `/projects` endpoint only provides basic data. We need to check for additional endpoints for:
- Floor plans
- Unit types and availability
- Gallery images
- Documents/brochures

**Investigation Required:** Check Reelly API documentation for:
- `/projects/{id}` - Detailed single project endpoint
- `/projects/{id}/units` - Unit types and pricing
- `/projects/{id}/floorplans` - Floor plan images/PDFs
- `/projects/{id}/media` - Additional gallery images

### File: `supabase/functions/reelly-api-sync/index.ts`

Add detailed project fetch for each project:

```typescript
// Add after basic project sync
async function fetchProjectDetails(apiKey: string, projectId: number): Promise<ReellyProjectDetails | null> {
  try {
    const url = `https://api-reelly.up.railway.app/api/v2/clients/projects/${projectId}`;
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// In the sync loop, after basic data:
const details = await fetchProjectDetails(apiKey, project.id);
if (details) {
  // Extract additional fields: floor_plans, units, gallery, documents
  mappedProject.floor_plan_types = details.floor_plans?.map(fp => ({
    label: fp.name,
    imageUrl: fp.image_url,
    pdfUrl: fp.pdf_url,
  })) || null;
  
  mappedProject.unit_types = details.units?.map(u => ({
    type: u.type,
    bedrooms: u.bedrooms,
    size_sqft: u.size,
    price_from: u.price,
  })) || null;
}
```

**Note:** This requires API documentation to confirm endpoint structure. If `/projects/{id}` doesn't provide more data, we may need to use the "API + fill missing assets" approach via Firecrawl for specific pages.

---

## Phase 3: Add Missing Database Columns

### Database Migration

```sql
-- Add columns for Reelly detailed data if not exists
ALTER TABLE pending_project_imports 
  ADD COLUMN IF NOT EXISTS unit_types JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS available_units INTEGER,
  ADD COLUMN IF NOT EXISTS master_plan_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Add same columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS master_plan_url TEXT;
```

---

## Phase 4: Hybrid Extraction Strategy (API + Fill Missing Assets)

Since the user selected "API + fill missing assets", implement a two-stage approach:

### Stage 1: Reelly API (fast, structured data)
- Basic project info ✓
- Developer info ✓
- Location/coordinates ✓
- Pricing ✓
- Status ✓

### Stage 2: Targeted Firecrawl Scraping (only for missing assets)
- Floor plan images/PDFs
- Brochure PDFs
- Amenity photos with labels
- Master plan images

### File: `supabase/functions/reelly-fill-missing-assets/index.ts` (New)

```typescript
/**
 * Fill missing assets for Reelly-imported projects
 * Uses Firecrawl to scrape the public Reelly page for assets not in API
 */

async function fillMissingAssets(importId: string, reellyProjectId: number) {
  // Only scrape if we're missing specific assets
  const { data: pending } = await supabase
    .from("pending_project_imports")
    .select("floor_plan_types, documents, amenities_list")
    .eq("id", importId)
    .single();
  
  const needsFloorPlans = !pending?.floor_plan_types?.length;
  const needsDocuments = !pending?.documents?.length;
  
  if (!needsFloorPlans && !needsDocuments) {
    return { skipped: true };
  }
  
  // Scrape the Reelly public page for this project
  const url = `https://reelly.io/off-plan/${reellyProjectId}`;
  const scrapeResult = await firecrawlScrape(url);
  
  // Extract floor plans, brochure, etc.
  const extracted = extractAssets(scrapeResult);
  
  // Update only missing fields
  await supabase
    .from("pending_project_imports")
    .update({
      floor_plan_types: needsFloorPlans ? extracted.floorPlans : pending.floor_plan_types,
      documents: needsDocuments ? extracted.documents : pending.documents,
    })
    .eq("id", importId);
}
```

---

## Phase 5: Display Bedroom Types as Labels

### File: `src/components/project-detail/ProjectDetailLayout.tsx`

Update bedroom display to show full labels when available:

```tsx
// Around line 372, update bedroomsText calculation
const bedroomsText = useMemo(() => {
  // If bedroom_types array exists with labels, show those
  if (project.bedroom_types && Array.isArray(project.bedroom_types) && project.bedroom_types.length > 0) {
    return project.bedroom_types.join(', ');
  }
  // Fallback to min/max
  if (!project.bedrooms_min) return null;
  if (project.bedrooms_min === project.bedrooms_max) return `${project.bedrooms_min} BR`;
  return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
}, [project.bedrooms_min, project.bedrooms_max, project.bedroom_types]);
```

---

## Phase 6: Clarify Reelly Login Issue

**Status:** The `REELLY_EMAIL` and `REELLY_PASSWORD` secrets were stored but are **not used** anywhere in the codebase. The Reelly API uses only `REELLY_API_KEY` for authentication via the `X-API-Key` header.

**Your Options:**
1. **If API key works:** Continue using API key only (current approach works)
2. **If API key stopped working:** Contact Reelly support to reissue or verify the API key
3. **If session login is required:** Implement a session-based auth flow using the email/password (would require significant changes)

**Current State:** The Reelly API syncs are working with the API key. If you're having issues with your Reelly **website** login (not this app), that's a separate issue to resolve directly with Reelly.

---

## Implementation Order

1. **Phase 1** - Fix markdown rendering (immediate visual fix)
2. **Phase 5** - Display bedroom types labels (requires Phase 2/3 data)
3. **Phase 3** - Database columns (prep for new data)
4. **Phase 2** - Enhance Reelly API sync (pending API documentation)
5. **Phase 4** - Hybrid fill missing assets (for floor plans/brochures)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/markdownUtils.ts` | Create | Markdown to HTML conversion |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Edit | Render description as HTML, bedroom labels |
| `supabase/functions/reelly-api-sync/index.ts` | Edit | Add detailed project fetch |
| `supabase/functions/reelly-fill-missing-assets/index.ts` | Create | Scrape missing floor plans/brochures |
| Database migration | Create | Add missing columns |

---

## Expected Outcome

After implementation:
1. **Descriptions** render cleanly without `#` hashtags showing as text
2. **Bedroom labels** show full types like "1 BR, 2 BR, 3 BR Duplex, Penthouse"
3. **Floor plans** section shows data when available, fallback message when not
4. **Reelly data** is enriched with targeted scraping for missing assets only
5. **Provident and Reelly queues** properly separated with source filter tabs
