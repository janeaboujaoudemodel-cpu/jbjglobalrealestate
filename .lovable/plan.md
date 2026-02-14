

## Fix Three Issues: Duplicate Gallery Images, Slow AI Analyzer, and Developer Logo Cropping

---

### Issue 1: Remove Duplicate Project Gallery Images (Database Cleanup)

**Problem**: 45 projects have duplicate images in the `project_images` table. Some are extreme -- Oceano has 3,441 rows for just 24 unique images (172 copies each!), Damac Lagoons Views has the same, and 4B Living has 641 rows for 21 unique images.

**Fix**: Run a SQL cleanup that:
1. For each project, identifies duplicate `image_url` entries
2. Keeps only the row with the lowest `id` (oldest/first inserted) for each unique URL
3. Deletes all other duplicate rows

This is a single database operation:

```text
DELETE FROM project_images
WHERE id NOT IN (
  SELECT MIN(id)
  FROM project_images
  GROUP BY project_id, image_url
);
```

**Quality note**: Since the duplicates are exact same URLs, there is no "higher quality" vs "lower quality" version to choose from -- they are identical copies. The cleanup simply removes redundant rows.

For cases where the same image exists at different resolutions (e.g., `small_lagoon-views-1.jpg` vs `lagoon-views-1.jpg` vs `medium_lagoon-views-1.jpg`), those are different URLs and will be handled separately by identifying size-variant patterns (small_, medium_ prefixes) and keeping only the original (highest quality) version.

---

### Issue 2: Fix Slow/Stuck AI Project Analyzer

**Problem**: The "JBJ AI is analyzing Vincitore Aqua Flora..." spinner runs indefinitely. The project-level AI analyzer (`AIMarketAnalyzer`) calls the `ai-market-analyzer` edge function, which appears to time out or fail silently.

**Root causes identified**:
- The `ai-market-analyzer` edge function has no timeout handling -- if the AI gateway is slow, it hangs
- The frontend `AIMarketAnalyzer` component has no timeout mechanism (unlike the Developer analyzer which has a 30-second timeout)
- No caching -- every visit triggers a fresh AI call

**Fix**:

| File | Change |
|------|--------|
| `src/components/AIMarketAnalyzer.tsx` | Add a 25-second timeout with AbortController on the fetch call. Add a timeout state that shows a "Taking longer than expected" message with a retry button. Add sessionStorage caching (like the developer analyzer already does) to avoid repeated calls. |
| `supabase/functions/ai-market-analyzer/index.ts` | Add a `signal: AbortSignal.timeout(20000)` to the AI gateway fetch call so the edge function itself doesn't hang indefinitely. Add DB caching similar to the developer analyzer (check `project_ai_cache` table first, cache for 24 hours). |

A new `project_ai_cache` table will be created:
- `project_slug` (text, primary key)
- `analysis_json` (jsonb) 
- `generated_at` (timestamptz)

---

### Issue 3: Developer Logo Cropping Fix

**Problem**: After removing the padding, some developer logos that are wide/landscape-oriented get cropped on the sides because the 56x56 container clips them. The user wants ALL logos fully visible without any cropping.

**Fix**: Add back a small amount of padding (`p-1`) to give the `object-contain` calculation breathing room, preventing edge clipping while keeping the logo as large as possible.

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` (line 88) | Change `bg-white` to `bg-white p-1` -- adds just 4px padding on each side, enough to prevent edge cropping while keeping logos visually full |

---

### Technical Summary

| # | Area | What Changes |
|---|------|-------------|
| 1 | Database | SQL migration to delete duplicate `project_images` rows (keeping one per unique URL per project) |
| 2 | Database | SQL to remove size-variant duplicates (small_, medium_ prefixes), keeping highest quality |
| 3 | Database | Create `project_ai_cache` table for project analyzer caching |
| 4 | `supabase/functions/ai-market-analyzer/index.ts` | Add 20s timeout on AI gateway call + DB caching |
| 5 | `src/components/AIMarketAnalyzer.tsx` | Add 25s client-side timeout, retry button, sessionStorage cache |
| 6 | `src/components/DeveloperCard.tsx` | Add `p-1` to logo container to prevent side cropping |

