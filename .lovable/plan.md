

# Fix Footer Education Hub Links & Create Education Hub Page

## Summary

This implementation will address three issues:
1. Make "Books, Guides & Market Reports" text clickable as individual links
2. Show all 5 Business Suites (currently truncated to 4)
3. Create a dedicated Education Hub page at `/education-hub`

---

## Changes Overview

### 1. Fix Non-Clickable Education Hub Links

**Current Problem**: Line 768 shows "Books, Guides & Market Reports" as a plain paragraph tag - users cannot click on these to navigate.

**Solution**: Replace the paragraph with three individual clickable links:
- **Books** → `/broker-education` (existing page with 3D book library)
- **Guides** → `/guides` (existing page with guide books)
- **Market Reports** → `/market-intelligence/reports` (existing reports page)

### 2. Show All 5 Business Suites

**Current Problem**: Line 815 uses `.slice(0, 4)` limiting display to only 4 suites.

**Solution**: Remove the `.slice(0, 4)` to display all 5:
- All Tools Suite
- Real Estate Suite
- Broker Intelligence Suite
- Creative & Communication
- Productivity Suite

### 3. Create Education Hub Page

**New Page**: A central landing page consolidating all educational resources with the same premium black/gold/champagne styling used on the Guides page.

**Page Structure**:
- Hero section with video placeholder and "Education Hub" branding
- Books Library section with preview cards linking to `/broker-education`
- Guides Library section with preview cards linking to `/guides`
- Market Intelligence section with preview cards linking to `/market-intelligence/reports`
- CTA section for questions/support

### 4. Update Main Education Hub Link

**Current**: Points to `/guides`
**Updated**: Will point to `/education-hub`

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/Footer.tsx` | MODIFY | Replace static paragraph with 3 clickable links; remove `.slice(0, 4)` from business suites; update `educationHubLink.href` to `/education-hub` |
| `src/pages/EducationHub.tsx` | CREATE | New hub page consolidating Books, Guides, and Market Reports |
| `src/App.tsx` | MODIFY | Add lazy import and route for `/education-hub` |

---

## Technical Details

### Footer.tsx Changes

```text
Line 310: Change href from "/guides" to "/education-hub"

Line 768: Replace:
  <p className="text-zinc-500 text-xs mb-3">Books, Guides & Market Reports</p>

With:
  <ul className="space-y-2 mb-3">
    <li><Link to="/broker-education" className="...">Books</Link></li>
    <li><Link to="/guides" className="...">Guides</Link></li>
    <li><Link to="/market-intelligence/reports" className="...">Market Reports</Link></li>
  </ul>

Line 815: Change:
  {businessSuitesLinks.slice(0, 4).map(...)}
To:
  {businessSuitesLinks.map(...)}
```

### EducationHub.tsx Structure

The new page will use the same design patterns as `Guides.tsx`:
- Black background with gold accents
- Champagne gradient cards (jj-layer-2, jj-card-inner)
- 3D book card previews for Books section
- Framer Motion animations for reveal effects
- Premium hero button CTAs

### App.tsx Route Addition

```tsx
const EducationHub = lazy(() => import("./pages/EducationHub"));

<Route path="/education-hub" element={<EducationHub />} />
```

---

## Expected Results

After implementation:
- Footer "Education Hub" card will have 3 clickable links (Books, Guides, Market Reports)
- All 5 Business Suites will be visible in the footer
- Clicking "Education Hub" title will navigate to the new `/education-hub` page
- The Education Hub page will serve as a central navigation point for all educational content

