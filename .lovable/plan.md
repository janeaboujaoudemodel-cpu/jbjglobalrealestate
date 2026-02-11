

# Fix Plan: Developer Marquee Spacing + Handpicked Cards

## Issue 1: Developer Marquee Logos Touching

The logos in the developer partners marquee are too close together. Current padding is `px-3 md:px-5 lg:px-6` per logo container, which creates insufficient gaps between logos.

**File:** `src/components/DeveloperPartnersMarquee.tsx` (line 77)

**Fix:** Increase horizontal padding from `px-3 md:px-5 lg:px-6` to `px-6 md:px-10 lg:px-12` to restore proper spacing between logos.

---

## Issue 2: Handpicked Cards -- Missing Prices for Palm Jebel Ali & Binghatti Vintage

Both projects have `price_from: null` in the database. Without prices, "Price TBA" is shown.

**Database check:** The projects exist but lack pricing data:
- `palm-jebel-ali-villas-nakheel-656` -- price_from is NULL
- `binghatti-vintage-binghatti-3046` -- price_from is NULL

These prices need to be set. If you provide the correct prices, I'll update them in the database. Otherwise, the card will continue showing "Price TBA" since there's no data to display.

---

## Issue 3: Project Title Color -- Black Instead of Gold

**File:** `src/components/home/FeaturedListings.tsx` (line 219)

Currently the project title is `text-gold`. The user wants it in **black**.

**Fix:** Change `text-gold` to `text-black` and update hover to `group-hover:text-gold`.

---

## Issue 4: Description + "...more" Under Project Name

The `useFeaturedProjects` query does NOT include `description` in its SELECT, so descriptions never appear even though the card template already has description rendering logic.

**File:** `src/components/home/FeaturedListings.tsx`

**Fix 1 (line 48):** Add `description` to the select query:
```
.select("id, name, slug, developer_name, price_from, area_name, location, cover_image_url, bedrooms_min, bedrooms_max, handover_date, description, images:project_images(image_url), developer:developers(id, name, slug, logo_url)")
```

**Fix 2 (lines 224-228):** Update the description block to always show when description exists, with a "...more" suffix styled in black (not underlined) with an ArrowUpRight icon:
```tsx
{(project as any).description && (
  <p className="text-zinc-600 text-xs line-clamp-2 mb-2">
    {String((project as any).description).replace(/<[^>]*>/g, '').slice(0, 120)}
    <span className="text-black font-medium ml-1 inline-flex items-center gap-0.5">
      ...more <ArrowUpRight className="w-3 h-3 inline" />
    </span>
  </p>
)}
```

---

## Summary

| # | Issue | File | Change |
|---|-------|------|--------|
| 1 | Logos touching | DeveloperPartnersMarquee.tsx | Increase padding to `px-6 md:px-10 lg:px-12` |
| 2 | Missing prices | Database | Need correct prices from user |
| 3 | Title color | FeaturedListings.tsx | `text-gold` to `text-black` |
| 4 | Missing descriptions | FeaturedListings.tsx | Add `description` to query + style "...more" |

