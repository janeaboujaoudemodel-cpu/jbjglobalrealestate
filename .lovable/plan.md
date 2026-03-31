

# Global Contrast & Typography Fix Plan

## Problem Summary
The codebase has three systemic violations across 500+ files:
1. **Poppins font** used in 154 files (~1,629 instances) — must be Inter
2. **Low-contrast zinc text** (`text-zinc-400`, `text-zinc-500`, `text-zinc-300`) on dark backgrounds — 348+ files with zinc-400, 362+ with zinc-500, 177+ with zinc-300
3. **Gold accent color** used extensively where monochrome is required (650 files) — though gold is allowed per the design system for "Solution/CTA Layer" accents, so this is lower priority

## Approach: Batch-by-Category

Given the enormous scope, I'll work through files in logical batches. Each batch will apply these three rules:

### Rule 1: Remove Poppins
- Delete all `style={{ fontFamily: "Poppins, sans-serif" }}` and similar inline Poppins references
- Exception: `cvResumeTypes.ts` (user-selectable font options for CV builder — keep as a design choice)

### Rule 2: Fix Zinc Text Contrast
Context-dependent replacements:
- **On dark backgrounds** (`bg-zinc-900`, `bg-black`, dark overlays):
  - `text-zinc-400` → `text-white/70` (secondary text)
  - `text-zinc-500` → `text-white/60` (tertiary text)
  - `text-zinc-300` → `text-white/85` (body text)
- **On light/white backgrounds**:
  - `text-zinc-400` → `text-gray-500` (secondary text)
  - `text-zinc-500` → `text-gray-500` (secondary text)
  - `text-zinc-300` → `text-gray-400` (only if on light bg — rare)
  - `text-zinc-600` stays or becomes `text-gray-600`

### Rule 3: CTA Buttons
- Primary CTAs: `bg-black text-white` (already handled by button system, but many files use custom classes)
- Secondary CTAs: `bg-transparent text-black border-gray-300`
- On dark sections: `bg-white text-black` for maximum contrast

## Implementation Batches (Priority Order)

### Batch 1 — Public-Facing Pages (highest user visibility)
Files: `Index.tsx`, `Properties.tsx`, `Contact.tsx`, `About.tsx`, `Services.tsx`, `AreaGuides.tsx`, `AreaDetail.tsx`, `Communities.tsx`, `CommunityDetail.tsx`, `ProjectDetail.tsx`, `DeveloperDetail.tsx`, `Developers.tsx`, `Compare.tsx`, `ThankYou.tsx`, `FAQ.tsx`, `BuyerGuide.tsx`, `SellerGuide.tsx`, `RentGuide.tsx`, `LandlordGuide.tsx`, `TenantGuide.tsx`

### Batch 2 — Home Page Components
Files: All `src/components/home/*` files, `PreFooterSeparator.tsx`, `ContinueSearching.tsx`, `LeadCapturePopup.tsx`, `WelcomeModal.tsx`, `RoleSelectionModal.tsx`, `InquiryFormModal.tsx`

### Batch 3 — Service Pages
Files: All `src/pages/services/*`, `InvestorServices.tsx`, `MarketIntelligence.tsx`, `MortgageCalculator.tsx`

### Batch 4 — AI Tools & Premium Layouts
Files: All `src/components/ai-tools/*`, all AI page files (`AI*.tsx`), `AIToolPremiumLayout.tsx`

### Batch 5 — Dashboards & Admin
Files: `Dashboard.tsx`, `BrokerDashboard.tsx`, `InvestorDashboard.tsx`, `OwnerDashboard*.tsx`, `Admin*.tsx`, `CRM*.tsx`

### Batch 6 — Remaining Components
Files: Navigation, header, footer, shared UI components, modals, remaining pages

## Technical Details

- Each batch will use `code--search_files` to find violations in the target files, then `code--line_replace` for surgical fixes
- The `cvResumeTypes.ts` Poppins reference will be preserved (user font selection feature)
- Dark-section components (intentional dark UI per design system) keep dark backgrounds but get upgraded text contrast
- Estimate: ~6 implementation messages to cover all batches

## What Will NOT Change
- Button system (`button.tsx`) — already compliant
- Mega-menu primitives — already monochrome
- `text-gold` on icons — allowed per design system for accent/CTA layer
- CV/Resume builder font options — user choice feature

