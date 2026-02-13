
## Deep Audit and Deduplication Fix

### Problem Summary
The database has widespread duplication and shared-image issues:

| Entity | Issue | Count |
|--------|-------|-------|
| News Articles | Exact duplicate stories (same topic, different title wording) | 8 duplicate pairs to delete |
| News Articles | Different articles sharing the same image URL | 35 articles across 13 shared image URLs |
| News Articles | Property Finder articles all using the same Abu Dhabi generic image | 8 articles |
| News Articles | The National articles all using the same 90x90 thumbnail | 5 articles |
| Projects | Duplicate project names | 121 duplicates |
| Areas | Duplicate area names | 3 duplicates |

### Root Causes
1. The news collector's dedup check matches on EXACT title only (line 882), so "New Malls in Dubai (2026-2028)" and "New Malls in Dubai: What's Coming Between 2026 and 2028" are treated as different articles
2. Property Finder and The National source pages serve a listing page OG image (not individual article images), so every article from that source gets the same generic image
3. The collect action runs across multiple sources that cover the same story, creating cross-source duplicates
4. Projects are imported from both Reelly and Provident with slightly different records for the same property

---

### Part 1: Delete Duplicate News Articles (keep 1, delete the rest)

**8 duplicate pairs identified** -- delete the newer one in each pair:

| Keep | Delete | Topic |
|------|--------|-------|
| New Malls in Dubai (2026-2028) | New Malls in Dubai: What's Coming Between 2026 and 2028 | Same article |
| JVT vs JVC: Comparison | JVT vs JVC: Which One is Right for You? | Same article |
| Duplex vs Townhouse (if exists as separate) | -- | Merged variant |
| DLD launches Phase II... (longer title) | DLD launches Phase II... (shorter title) | Same article |
| Dubai's ultra-luxury property boom... | Dubai's ultra-luxury property boom... (exact dupe) | Same article |
| Buying an off-plan property... (?) | Buying an off-plan property... (!) | Same article |
| Sharjah Real Estate Exhibition... | Sharjah Real Estate Exhibition... (shorter) | Same article |
| Aldar's net profit 8.8B... | Aldar's net profit 8.8B... (shorter) | Same article |
| Empower Records... | Empower Records... (variant title) | Same article |

Execute SQL DELETE for the 8 duplicate IDs.

### Part 2: Fix Shared/Wrong Images on Remaining News Articles

After dedup deletion, ~27 articles will still share images with other articles. These need unique, real images from their actual source pages.

**Strategy per source:**

- **Property Finder** (8 articles, all using Abu Dhabi generic image): Scrape each article's individual blog page URL (currently all point to `/blog/` listing page). Use Firecrawl Search to find each article's actual page and extract its OG image.
- **The National** (5 articles, all using 90x90 thumbnail): The source URL is `thenationalnews.com/business/property/` (listing page). Search for each article title on The National to find the actual article page with a proper hero image.
- **Gulf Business** (5 articles sharing 90x90 thumbnails): Same issue -- listing page thumbnails. Search for individual article pages.
- **Other shared images**: WAM, Dubai Media Office, etc. -- search for unique images per article.

**Implementation**: Update `ai-news-collector/index.ts`:
- Add a new `"dedup-and-fix"` action that:
  1. Deletes known duplicate IDs
  2. Identifies all shared-image articles
  3. For each, searches for the article's individual page via Firecrawl Search using the title
  4. Extracts the OG image from the individual article page (not the listing page)
  5. Sets to NULL if no unique image is found

Also fix the `collect` action dedup logic (line 882-886):
- Add fuzzy title matching: normalize titles by removing punctuation and comparing first 6 words
- Before insert, check if a similar title already exists (not just exact match)

### Part 3: Fix Shared Images -- Improve Source URL Quality

The root problem is that many articles have listing page URLs (e.g., `propertyfinder.ae/blog/`) instead of individual article URLs. 

**Fix**: In the `collect` action, when the AI extracts articles, if the `source_url` is the same as the source listing page URL, use Firecrawl Search to find the actual article page URL before inserting.

### Part 4: Deduplicate Projects (121 duplicates)

For each duplicate project name:
1. Keep the record with the most complete data (most non-null fields, most images)
2. Delete the other records
3. This will be done via SQL, keeping the "richest" record per name

### Part 5: Deduplicate Areas (3 duplicates)

For each duplicate area name:
1. Keep the record with the image (or the older one)
2. Delete the duplicate

### Part 6: Prevent Future Duplicates

**News Collector** (`ai-news-collector/index.ts`):
- Change dedup from exact title match to fuzzy match (normalize: lowercase, remove punctuation, compare first 50 chars)
- Add a secondary check: if `source` and first 6 words of title match, skip

**Add `KNOWN_BAD_URLS` entries** for listing-page OG images that should never be used:
- `propertyfinder.ae/blog/wp-content/uploads/2025/06/Abu-Dhabi_img.webp`
- `thenational-the-national-prod.cdn.arcpublishing.com/resizer/v2/6IL6H574R5EKRPWJCIXKWA4NYE` (90x90 thumbnail)
- Any `90x90` or `width=90` images

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/ai-news-collector/index.ts` | Add fuzzy dedup logic; add listing-page OG images to KNOWN_BAD_URLS; add `"dedup-and-fix"` action; reject tiny images (90x90) |
| Database (SQL) | DELETE 8 duplicate news articles; DELETE duplicate projects (keep richest); DELETE duplicate areas |

### Execution Order

1. Delete 8 duplicate news articles via SQL
2. Delete 121 duplicate projects via SQL (keep richest record per name)  
3. Delete 3 duplicate areas via SQL
4. Update `ai-news-collector` with fuzzy dedup and bad URL blocklist
5. Deploy and trigger `fix-images` action to fix shared images on remaining articles
6. Verify via screenshots and DB queries
