

# Complete Uncompleted Tasks: Daily Sync, Label Fix, Image Fix, New Project Detector

## Identified Uncompleted Tasks

1. **News card category labels not readable** -- text is `text-gold` on `bg-gold/10` which is hard to read. Need white text.
2. **Still 16 duplicate images** in the database (5 articles share MOET logo, 5 share The National image, 4 share Property Finder image).
3. **No daily automated sync** -- news collection and DLD stats are static, not updating automatically.
4. **No automatic Provident sync** -- new projects from Provident are not detected automatically.
5. **No "New Project Detector"** in listing admin -- no way to see if a Provident listing is already on the website.
6. **Hero still at 60vh/70vh** in NewsDetail -- plan said 80vh/90vh but it wasn't applied.

---

## Part 1: Fix News Card Category Label (White Text)

**File: `src/pages/News.tsx`** (line 265)

Change the category badge on news cards from `text-gold bg-gold/10` to `text-white bg-black/50 backdrop-blur-sm` so the label is clearly readable on top of any image.

Also fix the featured card category badge (line 209) to use white text.

---

## Part 2: Fix Remaining Duplicate Images

**File: `supabase/functions/ai-news-collector/index.ts`**

Add the 3 newly identified bad/duplicate URLs to `KNOWN_BAD_URLS`:
- `moet.gov.ae/documents/` (UAE Ministry logo used by 5 articles)
- `thenationalnews.com/resizer` pattern shared by 5 articles
- `propertyfinder.ae/blog/wp-content/uploads/2025/09/Header-image.png` shared by 4 articles

Then trigger `fix-images` to re-scrape and assign unique images.

---

## Part 3: Fix NewsDetail Hero Height

**File: `src/pages/NewsDetail.tsx`** (line 149)

Change `h-[60vh] md:h-[70vh]` to `h-[80vh] md:h-[90vh]` as planned but not implemented.

---

## Part 4: Daily Automated News + DLD Sync (pg_cron)

Set up a `pg_cron` scheduled job that calls the `ai-news-collector` edge function daily at 6 AM UAE time (2 AM UTC) with `action: "collect"`, followed by `action: "enrich"`.

This requires enabling `pg_cron` and `pg_net` extensions and running:

```sql
SELECT cron.schedule(
  'daily-news-collect',
  '0 2 * * *',  -- 2 AM UTC = 6 AM UAE
  $$ SELECT net.http_post(
    url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/ai-news-collector',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"action":"collect"}'::jsonb
  ) $$
);
```

And a second job 30 minutes later for enrichment.

For DLD stats: since DLD doesn't have a public API, the stats will remain manually curated in the code. A note will be added to indicate when to update them.

---

## Part 5: Daily Provident Auto-Sync + New Project Detector

### A. Daily Provident Sync (pg_cron)

Schedule the `discover-all-projects` edge function to run daily at 7 AM UAE time. This already discovers all Provident projects and inserts new ones into `pending_project_imports`.

```sql
SELECT cron.schedule(
  'daily-provident-sync',
  '0 3 * * *',  -- 3 AM UTC = 7 AM UAE
  $$ SELECT net.http_post(
    url := 'https://mdafrewypkkrildjgtey.supabase.co/functions/v1/discover-all-projects',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{"action":"discover","source":"provident"}'::jsonb
  ) $$
);
```

### B. New Project Detector in Listing Admin

**File: `src/components/listing-admin/ProjectApprovalQueue.tsx`**

Add a "New Projects Detected" badge/section at the top of the approval queue that:
- Queries `pending_project_imports` for items added in the last 24 hours
- Shows a count badge: "3 New Projects Detected Today"
- For each new project, shows whether it already exists in `projects` table (by slug match)
- Labels each as "NEW" (not on website) or "EXISTING" (already on website) with colored badges

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/News.tsx` | White text on category labels (lines 265, 209) |
| `src/pages/NewsDetail.tsx` | Hero height 80vh/90vh (line 149) |
| `supabase/functions/ai-news-collector/index.ts` | Add 3 new bad URLs to blocklist |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Add "New Projects Detected" section with existing/new indicators |

### Database Changes (SQL -- not migration, contains project-specific data)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily news collection at 6 AM UAE (2 AM UTC)
SELECT cron.schedule('daily-news-collect', '0 2 * * *', ...);

-- Daily news enrichment at 6:30 AM UAE (2:30 AM UTC)
SELECT cron.schedule('daily-news-enrich', '30 2 * * *', ...);

-- Daily Provident discovery at 7 AM UAE (3 AM UTC)
SELECT cron.schedule('daily-provident-sync', '0 3 * * *', ...);
```

### Label Fix (News.tsx)

```tsx
// Before (hard to read)
<span className="text-xs text-gold bg-gold/10 backdrop-blur-sm px-3 py-1 rounded-full border border-gold/20">

// After (white, readable)
<span className="text-xs text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 font-medium">
```

### New Project Detector Logic

```text
1. Query pending_project_imports WHERE created_at > NOW() - INTERVAL '24 hours'
2. For each, check projects table for matching slug
3. Display badge: "NEW - Not on website" (green) or "EXISTING - Already listed" (amber)
4. Show count in header: "X New Projects Detected Today"
```

