
## Goal
Fix the footer “Education Hub” section so **Books / Guides / Market Reports are individually clickable**, ensure **all 5 Business Suites** show (not 4), and **create the /education-hub page** exactly as previously specified (premium black + gold + champagne styling consistent with `/guides`).

---

## What I found in the current code
### Footer issues (confirmed in `src/components/Footer.tsx`)
1. **Non-clickable Education Hub sub-items**
   - The footer currently renders:
     - `Books, Guides & Market Reports` as a plain `<p>` (line ~768), so there is nothing clickable.

2. **Business Suites truncated to 4**
   - Footer uses:
     - `businessSuitesLinks.slice(0, 4)` (line ~815), which hides the 5th suite.

3. **Education Hub title currently links to `/guides`**
   - `const educationHubLink = { href: "/guides", label: "Education Hub" };` (line ~310)
   - Needs to point to the new `/education-hub`.

### Routing status (confirmed in `src/App.tsx`)
- `/guides`, `/broker-education`, and `/market-intelligence/reports` routes already exist.
- `/education-hub` does **not** exist yet and must be added (lazy import + route).

---

## Implementation plan (code changes)

### A) Fix footer Education Hub sub-links (make them clickable)
**File:** `src/components/Footer.tsx`

1. Update the Education Hub title link target:
- Change:
  - `educationHubLink.href` from `"/guides"` → `"/education-hub"`

2. Replace the non-clickable paragraph with three separate `<Link>` items:
- Replace this:
```tsx
<p className="text-zinc-500 text-xs mb-3">Books, Guides & Market Reports</p>
```
- With a small list of links styled exactly like other footer lists:
```tsx
<ul className="space-y-2 mb-3">
  <li>
    <Link to="/broker-education" className="text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1">
      Books
    </Link>
  </li>
  <li>
    <Link to="/guides" className="text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1">
      Guides
    </Link>
  </li>
  <li>
    <Link to="/market-intelligence/reports" className="text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1">
      Market Reports
    </Link>
  </li>
</ul>
```

Acceptance check:
- All three items must be clickable and route correctly.
- No nested-link invalid structure (they will be siblings of the title `<Link>`, not nested inside it).

---

### B) Show all 5 Business Suites in the footer
**File:** `src/components/Footer.tsx`

- Change:
```tsx
{businessSuitesLinks.slice(0, 4).map(...)}
```
- To:
```tsx
{businessSuitesLinks.map(...)}
```

Acceptance check:
- Footer shows all 5:
  - All Tools Suite
  - Real Estate Suite
  - Broker Intelligence Suite
  - Creative & Communication
  - Productivity Suite

---

### C) Create the Education Hub page at `/education-hub`
**File (new):** `src/pages/EducationHub.tsx`

This page will follow the **same premium pattern as `src/pages/Guides.tsx`**:
- `min-h-screen bg-black`
- Hero uses `jj-hero-fullscreen` with a **video placeholder style block** (like Guides)
- Content sections use:
  - `.jj-layer-2` (champagne outer wrapper)
  - `.jj-card-inner` (champagne inner cards)
- Animations via `framer-motion` (`fadeInUp`, `staggerContainer`) consistent with Guides.

#### Page structure (exactly as previously specified)
1. **Hero**
   - Title: “Education Hub”
   - Subtitle: explains the hub consolidates Books, Guides, Market Reports
   - CTA buttons:
     - Jump to resources section (anchor)
     - Contact / Ask a Question

2. **Books Library section**
   - Preview cards (champagne cards) linking to: `/broker-education`
   - Copy aligned with premium institutional tone.

3. **Guides Library section**
   - Preview cards linking to: `/guides`
   - Emphasize categories (Buyer/Seller/Landlord/Tenant etc.)

4. **Market Intelligence section**
   - Preview cards linking to: `/market-intelligence/reports`
   - Include “Monthly / Quarterly / Annual” style preview cards (all route to the reports hub)

5. **CTA section**
   - “Need help choosing what to read?” with buttons to `/contact` and `/contact?type=support`

Acceptance check:
- Page loads with correct styling (black background + champagne sections like Guides).
- No duplicated footer rendering inside this page (footer remains global via layout).

---

### D) Register the new route in the router
**File:** `src/App.tsx`

1. Add lazy import near other core pages:
```tsx
const EducationHub = lazy(() => import("./pages/EducationHub"));
```

2. Add route inside the `<Route element={<AdminBypass><MainLayoutWrapper /></AdminBypass>}>` block, near `/guides`:
```tsx
<Route path="/education-hub" element={<EducationHub />} />
```

Acceptance check:
- Navigating directly to `/education-hub` renders the new hub page.
- Footer “Education Hub” title links to `/education-hub`.

---

## QA / Test checklist (must pass)
1. From `/` (home), scroll to footer:
   - Click **Books** → lands on `/broker-education`
   - Click **Guides** → lands on `/guides`
   - Click **Market Reports** → lands on `/market-intelligence/reports`
2. Footer **Business Suites** shows all 5 suites.
3. Click footer **Education Hub** title → lands on `/education-hub`.
4. On `/education-hub`, verify:
   - Sections render correctly on mobile + desktop
   - Buttons and preview cards route correctly
   - No layout duplication (footer/contact sections not double-rendering)

---

## Files involved
- **Modify:** `src/components/Footer.tsx`
- **Create:** `src/pages/EducationHub.tsx`
- **Modify:** `src/App.tsx`
