
# Footer Reorganization, Header Fixes & Owner Command Center Premium UI Upgrade

## Summary of Changes

This plan addresses multiple interconnected requests to reorganize the footer, fix the header Insights dropdown, add new sections, and upgrade the Owner Command Center UI.

---

## 1. Footer Reorganization

### Current Footer Structure (Row 2)
| Sell | Investor Hub | Market Intelligence | Careers + Legal |

### New Footer Structure (Row 2)
| Sell | About & Careers | Legal | Education Hub |

### Detailed Changes:

#### A. Merge "Careers" Under "About" Section
- **Location**: `src/components/Footer.tsx`
- Move the careers links (`careerLinks`) to be displayed within the existing "About" column
- Rename column header to "About & Careers" 
- Add career links after the about links with a small divider

#### B. Move "Training Portal" Under Broker Section
- **Location**: `src/components/Footer.tsx`
- Add "Training Portal" link to a new "Broker" section (mode-aware)
- Only visible when user is in Broker mode or Combined mode
- Hidden for Investor-only mode users
- Hook into `useUserModeContext()` to conditionally render

#### C. Replace Careers Section with Legal Section
- The column that currently says "Careers + Legal" will become just "Legal"
- Legal links remain as-is (Terms, Privacy, Cookie, Disclaimers, IP, Trust & Audit)

#### D. Add New "Education Hub" Section (Title Link Only)
- Create a new column titled "Education Hub" 
- This is NOT a full section with sub-links, but a **title that links to `/guides`**
- The `/guides` page already serves as the education hub with:
  - Books/Guides (Buyer, Seller, Landlord, Tenant, etc.)
  - Market Intelligence content
  - Market Reports

#### E. Add "Business Suites" Section
- Add a new grouped section in the footer for Business Suites
- Links to the 4 existing suite pages:
  - Real Estate Suite (`/business-suite/real-estate`)
  - Broker Intelligence Suite (`/business-suite/broker`)
  - Creative & Communication Suite (`/business-suite/creative`)
  - Productivity Suite (`/business-suite/productivity`)

---

## 2. Header Improvements

### A. Fix MegaMenuInsights Height Issue
- **Problem**: The Insights dropdown is too long and gets cropped at the bottom
- **Location**: `src/components/header/MegaMenuInsights.tsx`
- **Solution**: 
  - Add `max-h-[calc(100vh-160px)] overflow-y-auto` to the inner content container
  - Reduce padding and compact the layout
  - Consider limiting visible items per column with a "See All" link

### B. Add Business Suites to Insights Dropdown
- **Location**: `src/components/header/MegaMenuInsights.tsx`
- Add a new column or sub-section for "Business Suites"
- Include the 4 suite links with appropriate icons

### C. Add Owner Command Center Shortcut to Account Dropdown
- **Location**: `src/components/header/MegaMenuAccount.tsx`
- The Owner Dashboard link already exists (lines 303-320)
- Verify it's prominently displayed and accessible
- Already shows "Owner Dashboard" with "Command Center" subtitle for owners

---

## 3. Owner Command Center UI Upgrade

### Files to Update:
- `src/pages/OwnerDashboardShell.tsx` - Main layout shell
- `src/pages/OwnerDashboardOverview.tsx` - Main overview page

### UI Improvements:

#### A. Premium Dark Theme Refinements
- Current theme is already dark (bg-black, bg-zinc-950)
- Enhance with more gold accents and gradients
- Add subtle animations and hover effects
- Improve card shadows and depth

#### B. Accessibility Improvements
- Add proper focus states with visible outlines
- Ensure sufficient color contrast (WCAG AA minimum)
- Add aria-labels to interactive elements
- Keyboard navigation support for all elements

#### C. Layout Readability
- Increase spacing between sections
- Use consistent typography hierarchy
- Ensure text is readable on all screen sizes
- Add proper text truncation for overflow

#### D. Header and Footer Visibility
- The Owner Command Center uses `OwnerDashboardShell` which has its own header
- Per memory `architecture/owner-command-center-routing-v1`, this is intentional separation from MainLayout
- Add a subtle breadcrumb or navigation hint for context

#### E. Sidebar Improvements (Already Present)
- The left sidebar already contains:
  - Properties
  - Property Map
  - Navigation items
- Keep this structure but enhance visual styling

---

## Technical Implementation Details

### Footer Changes (`src/components/Footer.tsx`):

```text
Current Row 2 Grid:
| Sell | Investor Hub | Market Intelligence | Careers + Legal |

New Row 2 Grid:
| Sell | About & Careers | Education Hub | Legal |

Additional Section:
| Business Suites (mode-aware) | Broker Tools (broker-only) |
```

### Mode-Aware Content:
- Import `useUserModeContext` hook
- Check `isInvestorMode`, `isBrokerMode` flags
- Conditionally render:
  - Broker section (visible: broker or combined mode)
  - Training Portal (visible: broker or combined mode)
  - Education Hub shows books based on mode:
    - Investor mode: Investor books
    - Broker mode: Broker books
    - Combined mode: Both

### MegaMenuInsights Height Fix:
```typescript
// Add to the shell container
<div className="max-h-[calc(100vh-160px)] overflow-y-auto">
  {/* Grid content */}
</div>
```

### Account Menu Owner Shortcut:
The shortcut already exists in `MegaMenuAccount.tsx` at lines 303-320. Verify it remains prominent and accessible.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/Footer.tsx` | Reorganize sections, add Education Hub, add Business Suites, mode-aware Broker section |
| `src/components/header/MegaMenuInsights.tsx` | Fix height/scroll, add Business Suites column |
| `src/components/header/MegaMenuAccount.tsx` | Verify Owner Command Center shortcut visibility |
| `src/pages/OwnerDashboardShell.tsx` | Premium UI enhancements, accessibility |
| `src/pages/OwnerDashboardOverview.tsx` | Layout improvements, readability, premium styling |

---

## Visual Preview of New Footer Layout

```text
ROW 1: Properties | Services | Guides | About & Careers
ROW 2: Sell | Education Hub | Market Intelligence | Legal
ROW 3 (Mode-Aware): Business Suites | Broker Tools (if broker mode)

Where:
- Education Hub = Title linking to /guides (contains books, reports, guides)
- Business Suites = Links to 4 AI tool suites
- Broker Tools = Training Portal + other broker resources (hidden for investor-only)
```

---

## Notes

1. The `/guides` page already functions as the Education Hub with book-themed cards
2. Business Suites are already implemented at `/business-suite/*`
3. Owner Command Center shortcut is already in the account dropdown
4. The Insights dropdown needs height constraints to prevent bottom cropping
