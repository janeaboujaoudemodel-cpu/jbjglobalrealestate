

## Fix: Mega Menu Hidden Behind Fixed Filter Bar

### Problem
The mega menu (`MegaMenuShell`) uses `z-[9999]`, which is the **same** z-index as the fixed filter bar on `ProjectDetailLayout.tsx` (`z-[9999]`) and only 1 above the fixed filter bars on other pages (`z-[9998]`). When both are rendered, the mega menu appears behind or at the same level as the filter bar.

### Root Cause
- `MegaMenuShell` → `z-[9999]`
- Fixed filter bars → `z-[9998]` (Developers, Properties, AreaGuides, AreaDetail, PropertiesReelly) or `z-[9999]` (ProjectDetailLayout)

### Fix

**1. Raise `MegaMenuShell` z-index to `z-[10050]`** (dialog-level, above all page-level sticky elements)

File: `src/components/header/mega-menu-primitives.tsx` line 27
- Change `z-[9999]` → `z-[10050]`

**2. Add backdrop blur + semi-transparent background to all fixed filter bar wrappers**

This gives a frosted-glass effect matching the site's champagne background:

| File | Line | Current z-index | Add backdrop |
|------|------|----------------|-------------|
| `Developers.tsx` | 355 | `z-[9998]` | Add `backdrop-blur-md bg-gradient-to-br from-[#FDFBF7]/90 via-[#F5F0E6]/90 to-[#EDE4D3]/90` (replace opaque bg) |
| `Properties.tsx` | 1140 | `z-[9998]` | Add `backdrop-blur-md` to the outer section, keep `bg-black` with slight transparency |
| `PropertiesReelly.tsx` | 273 | `z-[9998]` | Add `backdrop-blur-md` and make bg semi-transparent |
| `AreaGuides.tsx` | 286 | `z-[9998]` | Add `backdrop-blur-md` and make bg semi-transparent |
| `AreaDetail.tsx` | 234 | `z-[9998]` | Add `backdrop-blur-md` and make bg semi-transparent |
| `ProjectDetailLayout.tsx` | 679 | `z-[9999]` | Keep `z-[9999]`, add `backdrop-blur-md` |

All 6 files affected will get the frosted blur treatment on their fixed filter containers.

