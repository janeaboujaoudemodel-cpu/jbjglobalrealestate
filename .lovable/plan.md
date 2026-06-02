# Plan — Unified Ombré Tool Style + Access Gating

## Scope

**Restyle (apply Property Measurement's exact layout/UX, accent→black ombré, ToolAnimatedFrame, stepper, centered cards):**
1. Mortgage Calculator (`/mortgage-calculator`) — Navy accent
2. Rental Index (`/rental-index`) — Burgundy accent
3. AI Home Finder (`/ai-home-finder` or current route) — Teal accent
4. Property Evaluator (`/property-evaluator`) — Amber accent
5. Interior Design AI (`/interior-design-ai`) — Violet→Pink→Tiffany custom accent
6. Business Card Scanner (`/business-card-scanner`) — Rose accent
7. Property Comparison (`/compare`) — Emerald accent (already partly themed; align fully)

Each page gets its own `ToolTheme` entry in `src/components/tools/toolThemes.ts`, wrapped in `<ToolAnimatedFrame theme={…}>`, with the same step header, centered card stack, gradient CTAs, and accent chips that Property Measurement uses. Contrast verified against ink-on-light surfaces and white-on-dark CTAs per the contrast guard.

**Hard "do not touch" list:** Property Measurement, List Property for Sale, List Property for Rent.

## Access Matrix

| Tool | Owner | JBJ Broker | Other Brokers | Investor / Developer / Logged-out |
|---|---|---|---|---|
| Property Comparison | ✅ Full | ✅ Full | 🔒 Request Access | ❌ Hidden (sidebar + route) |
| Business Card Scanner | ✅ Full | ✅ Full | 🔒 Request Access | ❌ Hidden (sidebar + route) |
| Mortgage / Rental Index / Home Finder / Evaluator / Interior Design | ✅ | ✅ | ✅ | ✅ Visible & usable |

Implementation:
- Extend `useCompareAccess` → generalize into `useGatedToolAccess(toolId)` returning `{ visible, unlocked, isJBJBroker, isOwner }`. JBJ broker detection reuses `useUserRole().isJBJBroker` (already in codebase).
- Sidebar (`GlobalVerticalNav.tsx`): filter Compare + Business Card Scanner items by `visible`.
- Route guards: `/compare` and `/business-card-scanner` render existing `CompareAccessGate`-style component when `!visible` (redirect to `/access-denied` or hub).
- Locked broker view: themed gate card "Request Access" button → posts to existing `broker_access_request_system` (per memory), shows pending state. JBJ broker bypass automatic.
- Interior Design AI stays under **Tools & Workspace** in the vertical sidebar for all users.

## Technical Details

**New per-tool themes** added to `toolThemes.ts`:
```
mortgageNavy   #102540 → #000
rentalBrick    #8B1E2E → #000
homeFinderTeal #0E7490 → #000
evaluatorAmber #B45309 → #000
interiorBlend  custom: #7C3AED → #EC4899 → #5EEAD4 → #000 (3-stop hero, 2-stop CTA)
cardScanRose   #BE185D → #000
compareEmerald #0F7A4D → #000  (already exists, reuse)
```

**Per-tool page refactor** (each of the 6 files):
1. Replace current outer wrapper with `<ToolAnimatedFrame theme={toolThemes.xxx}>`.
2. Keep all existing business logic + edge function calls untouched.
3. Convert hero section to mirror PropertyMeasurement: chip → title → subtitle → step indicator.
4. Wrap step content in the dark ombré card (`heroGradient` bg, white text, accent borders).
5. Primary CTA = `ctaGradient`; secondary = champagne outline.
6. Run white-on-light + same-tone contrast guard on each.

**Access plumbing:**
- `src/hooks/useGatedToolAccess.ts` (new) — wraps `useUserRole` + `useIsAppOwner`.
- `src/components/access/ToolLockGate.tsx` (new) — themed lock card with "Request Access" CTA, reused by Compare + Card Scanner. Uses tool's own theme accent.
- Sidebar filter in `GlobalVerticalNav.tsx`: hide Compare/Scanner items when `!visible`.
- Route-level: wrap `/compare` and `/business-card-scanner` in a `<GatedToolRoute toolId="…">` that returns `ToolLockGate` when locked, full page when unlocked, `<Navigate to="/" />` when hidden.

## Validation (per tool)

- Browser screenshot at 1178×891.
- Verify step indicator + centered card render at viewport.
- Verify CTA contrast (white text on accent→ink gradient).
- Verify no white-on-light or same-tone violations.
- Verify sidebar visibility flips correctly across investor / broker / JBJ broker / owner modes for Compare + Scanner.

## Files

**New**
- `src/hooks/useGatedToolAccess.ts`
- `src/components/access/ToolLockGate.tsx`
- `src/components/access/GatedToolRoute.tsx`

**Edit**
- `src/components/tools/toolThemes.ts` (add interior + alias names)
- `src/pages/MortgageCalculator.tsx`
- `src/pages/RentalIndex.tsx`
- `src/pages/AIHomeFinder.tsx` (or current home-finder file)
- `src/pages/PropertyEvaluator.tsx`
- `src/pages/InteriorDesignAI.tsx`
- `src/pages/BusinessCardScanner.tsx`
- `src/pages/Compare.tsx` (theme alignment + route gate)
- `src/components/navigation/GlobalVerticalNav.tsx` (filter Compare + Scanner)
- `src/App.tsx` or relevant routes file (wrap `/compare` and `/business-card-scanner`)

**Untouched (locked)**
- `src/pages/PropertyMeasurement.tsx`
- List Property for Sale / Rent pages

## Execution Order

1. Add themes + new access hook/components.
2. Wire sidebar + route gates for Compare and Business Card Scanner.
3. Restyle the 6 tool pages one at a time, screenshot-verifying each.
4. Final pass: investor / broker / JBJ broker / owner sidebar + route smoke test.
