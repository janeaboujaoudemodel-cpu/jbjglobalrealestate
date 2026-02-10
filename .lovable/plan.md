
# Fix: Developer Marquee Links — Wrong Routes and Mismatched Slugs

## Root Cause

Two problems cause the 2-3 minute delay / blank developer page:

### 1. Wrong Route Path (line 133 of `DeveloperPartnersMarquee.tsx`)
The marquee links use `/developers/${slug}` (plural). The app has a redirect rule that catches `/developers/:slug` and redirects to `/developer/:slug` (singular). This extra redirect hop adds latency and causes a flash of the CTA section while the lazy-loaded `DeveloperDetail` component re-mounts after navigation.

### 2. Mismatched Slugs (lines 48-61)
Two developers in the marquee have slugs that don't exist in the database:
- `ellington-properties` in marquee, but database has `ellington`
- `danube-properties` in marquee, but database has `danube`

When clicked, these navigate to a developer page that queries the DB with the wrong slug, gets no result, and shows "Developer not found."

---

## Fix (Single File)

### `src/components/DeveloperPartnersMarquee.tsx`

1. **Line 133**: Change `to={"/developers/${developer.slug}"}` to `to={"/developer/${developer.slug}"}` (singular, direct route -- no redirect)

2. **Line 49**: Change slug from `"ellington-properties"` to `"ellington"`

3. **Line 59**: Change slug from `"danube-properties"` to `"danube"`

All other slugs (`damac`, `emaar`, `meraas`, `sobha`, `nakheel`, `binghatti`, `select-group`, `majid-al-futtaim`, `dubai-properties`) match the database and need no changes.

---

## Impact

- Every developer logo click from the homepage marquee will instantly navigate to the correct detail page
- No more redirect hops or "not found" states
- The lazy-loaded DeveloperDetail component loads once, not twice
