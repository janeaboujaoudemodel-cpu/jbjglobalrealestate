

## Fix RecommendedProjects, Zero Projects, Map Mode, and Payment Plan Display

### Issues Identified

1. **RecommendedProjects imported but never rendered** in `ProjectDetailLayout.tsx` -- the component is imported (line 56) but `<RecommendedProjects>` is never used in the JSX.

2. **Zero projects on Properties page** -- The `useProjects()` hook joins `images` and `documents` tables for all 2400+ projects, likely hitting the default 1000-row limit or timing out. The listing page query needs to be lighter (no heavy joins) as noted in the architecture memory.

3. **Map button not working visually** -- The split-screen code exists in `Properties.tsx` (line 1153) but likely fails because zero projects load (see issue 2). Once projects load, the map mode should work.

4. **Payment plan format** -- Currently shows "20/40/40" but user wants just the numbers without percent signs (confirmed already correct), displayed on ALL external cards including homepage "Handpicked For You" section.

5. **Payment plan on FeaturedListings (homepage)** -- The `useFeaturedProjects` query does NOT select `payment_breakdown`, so the data is missing. Need to add it to the query and render it next to the handover date.

### Plan

#### 1. Fix useProjects to NOT join heavy tables for listing queries

**File: `src/hooks/useProjects.ts`**

Create a new lightweight hook `useProjectsListing()` that selects only the columns needed for cards (no `images`, no `documents` joins). The Properties page will use this instead of `useProjects()`. This fixes the zero projects issue.

Alternatively, add `.limit(2500)` to the existing `useProjects` query and remove the `images`/`documents` joins for the listing query only.

Change the select to:
```
*, developer:developers(id, name, slug, logo_url), community:communities(id, name, slug)
```

Remove `images:project_images(...)` and `documents:project_documents(...)` from the listing query -- these are only needed on detail pages. Add `.limit(2500)` to handle the full dataset.

**File: `src/pages/Properties.tsx`** -- Use the lighter query.

#### 2. Render RecommendedProjects in ProjectDetailLayout

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Find the appropriate location (after the main content, before footer/contact section) and add:
```tsx
<RecommendedProjects
  currentProjectId={project.id}
  currentDeveloperId={project.developer_id}
  currentLocation={project.location}
  currentEmirate={project.emirate}
/>
```

#### 3. Add payment_breakdown to FeaturedListings query and display it

**File: `src/components/home/FeaturedListings.tsx`**

- Add `payment_breakdown` to the `FeaturedProject` interface
- Add `payment_breakdown` to the Supabase select query
- In the ProjectCard component, display the payment plan next to the handover date (left side of the row) as a small gold badge showing just the numbers joined by `/` (e.g., "20/40/40")

The handover row (lines 251-262) will become:
```tsx
<div className="flex items-end justify-between mt-2 min-h-[36px]">
  {/* Payment Plan - Left */}
  {paymentSummary && (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2 py-0.5">
      <CreditCard className="w-3 h-3" />
      {paymentSummary}
    </span>
  )}
  {/* Handover - Right */}
  {project.handover_date && (
    <span className="text-orange-500 text-xs font-bold">{project.handover_date}</span>
  )}
</div>
```

#### 4. Payment plan on RecommendedProjects cards

**File: `src/components/project-detail/RecommendedProjects.tsx`**

The `useProjects()` hook already includes `payment_breakdown` via `*`. Add payment plan badge to each recommended project card, matching the same format (numbers joined by `/`).

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useProjects.ts` | Create `useProjectsListing()` with lighter query (no images/docs joins, add logo_url to developer, add limit 2500) |
| `src/pages/Properties.tsx` | Use `useProjectsListing()` instead of `useProjects()` |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add `<RecommendedProjects>` to the JSX |
| `src/components/home/FeaturedListings.tsx` | Add `payment_breakdown` to query + interface; display payment plan badge next to handover |
| `src/components/project-detail/RecommendedProjects.tsx` | Add payment plan badge to recommended project cards |

### Result
- Properties page will load all 2400+ projects (lighter query, no timeouts)
- Map mode will work because projects will actually load
- RecommendedProjects will render on project detail pages
- Payment plan (real data only, format: "20/40/40") will show on homepage featured cards, properties listing cards, and recommended project cards

