

# Fix Plan: Handpicked Cards, Area Images, Descriptions, and Prices

## Issue 1: "by Developer" Under Project Title (Handpicked Section)

Currently the developer name appears at the bottom of the card. The user wants it directly under the project title, styled in gold and clickable to the developer page.

**File:** `src/components/home/FeaturedListings.tsx`

**Changes (lines 220-223):**
- After the project title `<h3>`, add a "by Developer Name" line in gold
- Make it a `<Link>` to `/developer/{developer.slug}`
- Stop event propagation so it doesn't trigger the parent card link
- Keep the existing "by developer_name" at the bottom but remove it to avoid duplication

```tsx
{/* Title */}
<h3 className="text-black font-semibold text-sm mb-0.5 line-clamp-2 group-hover:text-gold transition-colors min-h-[40px]">
  {project.name}
</h3>
{/* Developer name - gold, clickable */}
{project.developer?.slug ? (
  <Link
    to={`/developer/${project.developer.slug}`}
    onClick={(e) => e.stopPropagation()}
    className="text-gold text-xs font-medium hover:text-gold-light transition-colors mb-1 block"
  >
    by {project.developer_name}
  </Link>
) : project.developer_name ? (
  <span className="text-gold text-xs font-medium mb-1 block">by {project.developer_name}</span>
) : null}
```

Then remove the duplicate "by developer_name" from lines 241-245.

---

## Issue 2: Missing Price for Palm Central Private Residences

Web research confirms: **Palm Central Private Residences by Nakheel** has a launch price of **AED 2,500,000**.

**Database update:**
```sql
UPDATE projects SET price_from = 2500000 WHERE slug = 'palm-central-private-residences-nakheel-3031';
```

Note: Binghatti Vintage and Palm Jebel Ali already have prices set (AED 600,000 and AED 18,500,000 respectively) from the previous fix.

---

## Issue 3: Area Property Count Discrepancy

The areas page hero says "2,010 properties" but the database shows:
- **Total projects in `projects` table:** 614
- **Sum of `property_count` in `areas` table:** 1,675
- **Total active areas:** 183

The `property_count` values in the `areas` table appear to be sourced from Reelly/Provident and may include properties not yet synced to the platform. The actual synced project count is 614. This is informational -- the area counts reflect the source data's numbers, not locally synced projects.

No code change needed here unless you want the counts adjusted. The numbers shown come directly from the `areas.property_count` column which is populated during sync.

---

## Issue 4: Area Images -- 144 Areas Missing Photos

**Scale:** 144 out of 183 active areas have NO image (both `image_url` and `hero_image_url` are NULL). 85 areas also lack descriptions.

This is a large-scale data enrichment task. The approach:

### Step 1: Create an edge function `enrich-area-images`
This function will:
1. Query all areas missing images
2. For each area, use Firecrawl (already configured) to scrape the Provident area guide page (e.g., `https://www.provident.ae/areas/{area-slug}`) to find a community-level hero image
3. If Provident doesn't have an image, fall back to a Google search for `"{area name} Dubai aerial view community`
4. Store the found image URL in `areas.image_url` and `areas.hero_image_url`
5. Process in batches of 10 to avoid timeouts

### Step 2: Create an edge function `enrich-area-descriptions`
This function will:
1. Query all areas missing descriptions
2. For each area, scrape the Provident area guide page for description text
3. If not found, use AI (Gemini Flash) to generate a 2-3 sentence description based on the area name and emirate
4. Clean the description of any brand references (Provident, Reelly)
5. Store in `areas.description`

### Step 3: Add an "Enrich Areas" button in the admin/sync tools
Allow the owner to trigger the enrichment batch from the admin panel with progress tracking via `sync_jobs`.

**Key files:**
- New: `supabase/functions/enrich-area-images/index.ts`
- New: `supabase/functions/enrich-area-descriptions/index.ts`
- Existing admin panel component for triggering

---

## Issue 5: JVT (Jumeirah Village Triangle) Image

JVT actually already has both images set in the database:
- `image_url`: Reelly S3 image
- `hero_image_url`: Unsplash image

If it appears missing in the UI, it may be a caching issue or the Unsplash image URL being filtered out by the `repair-area-images` function. Will verify and ensure these images display correctly.

---

## Summary

| # | Issue | Action | Type |
|---|-------|--------|------|
| 1 | Developer name under title | Move "by Developer" below title, gold, clickable | Code change |
| 2 | Palm Central price | Set price_from = 2,500,000 | DB update |
| 3 | Property count discrepancy | Informational -- counts from source data | No change |
| 4 | 144 areas missing images | New edge functions for batch Firecrawl + AI enrichment | New edge functions |
| 5 | 85 areas missing descriptions | New edge function for batch description enrichment | New edge function |
| 6 | JVT image | Already has images -- verify display | Verification |

