

# Audit: Remove White Background Behind JBJ Logo — Global Fix

## Problem
The asset `jbj-monogram-light-bg.png` has a baked-in white/light background. It's used in **8 files** and creates a visible white frame around the logo wherever the parent background isn't pure white.

## Affected Files

| File | Context | Fix |
|------|---------|-----|
| `src/components/chat/ChatWelcome.tsx` | Chat welcome screen logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/components/chat/ChatEmailCheck.tsx` | Chat email entry logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/components/chat/ChatConfirmDetails.tsx` | Chat confirm details logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/components/navigation/GlobalVerticalNav.tsx` | Sidebar nav logo (2 instances) | Switch to `jbj-monogram-nobuffer.png` |
| `src/components/navigation/PropertiesVerticalNav.tsx` | Properties sidebar logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/components/GlobalHeader.tsx` | Walkthrough modal logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/pages/NotFound.tsx` | 404 page logo | Switch to `jbj-monogram-nobuffer.png` |
| `src/pages/AreaGuides.tsx` | Area card fallback image | Switch to `jbj-monogram-nobuffer.png` |

## Approach

1. **Replace all imports** of `jbj-monogram-light-bg.png` with `jbj-monogram-nobuffer.png` in all 8 files above
2. **No CSS hacks** — the `nobuffer` asset already has true transparency
3. All usages are on light-toned backgrounds (chat panels, sidebar nav, modals) where the dark-letter nobuffer variant is correct

## Already Clean (No Changes Needed)
- `Footer.tsx` — already uses `nobuffer`
- `BrandMonogram.tsx` — already uses `nobuffer`
- `BrandedLoader.tsx` — uses correct variants
- `JBJLogo.tsx` — uses correct variants
- `index.css` — no remaining `mix-blend` workarounds
- Dark background contexts (Index, News, ComingSoon, AlertsDemo, ActionGateModal) — correctly use `jbj-monogram-light-transparent.png`

