

## AI Hub Page Merge + Owner Sidebar Routing Fix

### Investigation Results

**Two pages identified:**

| Page | File | Route | Theme | Tool Count |
|------|------|-------|-------|------------|
| OLD (unwanted) | `src/pages/toolkit/RoyalToolsHub.tsx` | **NO ACTIVE ROUTE** (orphaned file) | Champagne/gold/white pearl throughout | 38 tools (from `royalToolsRegistry.ts`) |
| CORRECT (wanted) | `src/pages/AIHub.tsx` | `/ai-hub` | Dark background with colored category sections (purple, blue, amber, pink, teal) + search bar | 60 tools (inline arrays) |

**Direct links for verification:**
- Old champagne page: **Has no active route** — `RoyalToolsHub.tsx` is imported nowhere in routing
- Correct colored AI Hub: `https://jbjglobalrealestate.lovable.app/ai-hub`

**Owner sidebar current state:**
`OwnerSidebarNav.tsx` line 78: `{ label: "JBJ Royal Tools Hub", icon: Crown, path: "/ai-hub" }` — this already points to the CORRECT page (`AIHub.tsx`).

**Why the user may see confusion:**
Multiple navigation components still reference `/toolkit` as their link text/destination. While `/toolkit` redirects to `/ai-hub`, these indirect references create confusion. Also, 7 components still show `/toolkit` as the href:
- `GlobalVerticalNav.tsx` → `/toolkit`
- `GlobalHeader.tsx` mobile menu → `/toolkit`
- `Footer.tsx` → `/toolkit`
- `GlobalSearchModal.tsx` → `/toolkit`
- `PropertiesVerticalNav.tsx` → `/toolkit`
- `MegaMenuToolkit.tsx` (2 links) → `/toolkit`
- `ToolSuiteHeader.tsx` back button → `/toolkit`

### Tool Comparison (Merge Audit)

| Metric | Count |
|--------|-------|
| Tools in old RoyalToolsHub registry | 38 |
| Tools already in AIHub | 60 |
| Tools in registry missing from AIHub | 1 (`Creative Suite` at `/studio`) |
| Tools in AIHub not in registry | 22 (corporate suite tools, property analyzer, price predictor, etc.) |
| Duplicates to remove | 0 (AIHub already deduplicated) |

**The AIHub is already a superset.** Only 1 tool needs adding: "Creative Suite" (`/studio`).

### Implementation Plan

#### 1. Fix all navigation links: `/toolkit` → `/ai-hub` (7 files)
Update direct hrefs in `GlobalVerticalNav.tsx`, `GlobalHeader.tsx`, `Footer.tsx`, `GlobalSearchModal.tsx`, `PropertiesVerticalNav.tsx`, `MegaMenuToolkit.tsx`, `ToolSuiteHeader.tsx` to point to `/ai-hub` directly instead of relying on the redirect chain.

#### 2. Add missing "Creative Suite" tool to AIHub
Add one entry to the `mediaAndCreativeTools` array in `AIHub.tsx`:
```
{ id: "creative-suite", title: "JBJ Creative Suite", description: "Full-featured creative studio for video projects, marketing packs, and property presentations.", icon: Sparkles, link: "/studio", category: "design" }
```

#### 3. Archive old RoyalToolsHub
The file `src/pages/toolkit/RoyalToolsHub.tsx` has no route and is already orphaned. No action needed — it's dead code. The `/toolkit` route in `ToolkitRoutes.tsx` already redirects to `/ai-hub` and never renders `RoyalToolsHub`.

#### 4. Keep redirect safety net
Keep `<Route path="/toolkit" element={<Navigate to="/ai-hub" replace />} />` in `ToolkitRoutes.tsx` for any external/bookmarked links.

### Final Counts After Merge
- Tools in final AI Hub: **61** (60 existing + 1 Creative Suite)
- Duplicate pages remaining: **0** (RoyalToolsHub is orphaned, no route serves it)
- Navigation links pointing to wrong page: **0** (all updated to `/ai-hub`)

### Files Modified
| File | Change |
|------|--------|
| `src/pages/AIHub.tsx` | Add Creative Suite to mediaAndCreativeTools |
| `src/components/navigation/GlobalVerticalNav.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/GlobalHeader.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/Footer.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/GlobalSearchModal.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/navigation/PropertiesVerticalNav.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/header/MegaMenuToolkit.tsx` | `/toolkit` → `/ai-hub` |
| `src/components/toolkit/ToolSuiteHeader.tsx` | `/toolkit` → `/ai-hub` |

