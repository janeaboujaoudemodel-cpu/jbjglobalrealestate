
# Fix Footer Education Hub Links & Create Education Hub Page

## Issues Identified

1. **Non-clickable text in Education Hub card**: The text "Books, Guides & Market Reports" at line 768 is just a paragraph (`<p>` tag), not individual clickable links
2. **Business Suites truncated**: Only showing 4 of 5 business suites due to `.slice(0, 4)` on line 815
3. **Missing Education Hub page**: No dedicated `/education-hub` page exists - it currently just links to `/guides`

---

## Solution

### 1. Update Footer - Education Hub Card

**File: `src/components/Footer.tsx`**

Replace the static paragraph with three clickable links:

```tsx
// Current (non-clickable):
<p className="text-zinc-500 text-xs mb-3">Books, Guides & Market Reports</p>

// Updated (clickable links):
<ul className="space-y-2 mb-3">
  <li>
    <Link to="/broker-education" className="text-zinc-700 hover:text-gold text-xs sm:text-sm inline-block hover:translate-x-1">
      Books
    </Link>
  </li>
  <li>
    <Link to="/guides" className="text-zinc-700 hover:text-gold text-xs sm:text-sm inline-block hover:translate-x-1">
      Guides
    </Link>
  </li>
  <li>
    <Link to="/market-intelligence/reports" className="text-zinc-700 hover:text-gold text-xs sm:text-sm inline-block hover:translate-x-1">
      Market Reports
    </Link>
  </li>
</ul>
```

### 2. Update Footer - Business Suites Card

**File: `src/components/Footer.tsx`**

Remove the `.slice(0, 4)` to show all 5 business suites:

```tsx
// Current:
{businessSuitesLinks.slice(0, 4).map((link) => (

// Updated:
{businessSuitesLinks.map((link) => (
```

This will now display:
- All Tools Suite
- Real Estate Suite
- Broker Intelligence Suite
- Creative & Communication
- Productivity Suite

### 3. Create Dedicated Education Hub Page

**New File: `src/pages/EducationHub.tsx`**

Create a central hub page that consolidates all educational resources:

- **Section 1: Books** - Links to `/broker-education` with 3D book cards
- **Section 2: Guides** - Links to the Guides Library at `/guides` with categorized guides
- **Section 3: Market Reports** - Links to `/market-intelligence/reports` with monthly/quarterly/annual reports

The page will use the same champagne/gold premium styling as the existing Guides page.

### 4. Add Route for Education Hub

**File: `src/App.tsx`**

Add lazy import and route:

```tsx
// Import
const EducationHub = lazy(() => import("./pages/EducationHub"));

// Route
<Route path="/education-hub" element={<EducationHub />} />
```

### 5. Update Footer Link

**File: `src/components/Footer.tsx`**

Update the Education Hub link destination:

```tsx
// Current:
const educationHubLink = { href: "/guides", label: "Education Hub" };

// Updated:
const educationHubLink = { href: "/education-hub", label: "Education Hub" };
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/EducationHub.tsx` | **CREATE** | New page consolidating Books, Guides, Market Reports |
| `src/components/Footer.tsx` | **MODIFY** | Make Education Hub links clickable, show all 5 business suites |
| `src/App.tsx` | **MODIFY** | Add `/education-hub` route |

---

## Education Hub Page Structure

```
/education-hub
├── Hero Section (video placeholder)
├── Section: Books Library
│   ├── Premium 3D book cards
│   └── Link to /broker-education
├── Section: Guides Library  
│   ├── Categorized guide cards (Buyer, Seller, Landlord, etc.)
│   └── Link to /guides
├── Section: Market Intelligence
│   ├── Report type cards (Monthly, Quarterly, Annual)
│   └── Link to /market-intelligence/reports
└── CTA Section
```

---

## Technical Notes

- The Education Hub page will follow the existing Guides page styling (black background, gold accents, champagne cards)
- Uses existing `BookCard` component from Guides page for consistency
- All sections will have "View All" links to their respective full pages
- The page will be public (no auth required)
