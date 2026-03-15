

# Remove Risk Disclosure Globally

## What & Why

The Risk Disclosure page and all links to it will be completely removed from the website. The page content could discourage investors.

## Changes (7 files)

### 1. Delete page file
- **Delete** `src/pages/RiskDisclosure.tsx`

### 2. Remove route — `src/routes/PublicRoutes.tsx`
- Remove the lazy import (line 120) and the `<Route path="/risk-disclosure">` (line 324)

### 3. Remove from Footer — `src/components/Footer.tsx`
- Remove `{ label: "Risk Disclosure", href: "/risk-disclosure" }` (line 369)

### 4. Remove from MegaMenu — `src/components/header/MegaMenuInsights.tsx`
- Remove `{ label: 'Risk Disclosure', href: '/risk-disclosure', icon: FileText }` (line 117)

### 5. Remove from sidebar nav — `src/components/navigation/GlobalVerticalNav.tsx`
- Remove `{ label: "Risk Disclosure", href: "/risk-disclosure", icon: FileText }` (line 258)

### 6. Remove link from Trust & Compliance — `src/pages/TrustAndCompliance.tsx`
- Remove the "Risk Disclosure" link and its preceding separator `|` (lines 156-157)

### 7. No other references
- No AI configs, no constants, no other pages reference this page.

