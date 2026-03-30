

# Global Color Palette Upgrade

## Scope

Update all color values across the entire platform to the new refined palette. This touches **CSS variables**, **hardcoded hex values**, and **HSL inline values** across hundreds of files.

## Strategy

Update in two phases:
1. **Central CSS variables** in `src/index.css` and `tailwind.config.ts` — affects all components using CSS variable references
2. **Hardcoded hex/HSL replacements** across all `.tsx`, `.ts`, `.css`, and `.html` files — systematic find-and-replace

## Phase 1: CSS Variable Updates (`src/index.css`)

| Variable | Current HSL | New HSL | New Hex |
|----------|------------|---------|---------|
| `--gold` | `42 45% 59%` | `42 45% 59%` | ✅ Keep |
| `--gold-light` | `42 50% 65%` | `44 55% 75%` | `#E0CFA0` |
| `--gold-dark` | `42 40% 50%` | `40 50% 36%` | `#8A6B2E` |
| `--gold-muted` | `42 35% 55%` | `42 35% 55%` | ✅ Keep |
| `--champagne-1` | `39 52% 90%` | `38 55% 90%` | `#F3E9D7` |
| `--champagne-2` | `38 38% 85%` | `38 40% 83%` | `#E6D8C3` |
| `--champagne-3` | `38 28% 74%` | `38 30% 70%` | `#CBB89A` |
| `--pearl-1` | `40 38% 96%` | `40 38% 96%` | ✅ Keep |
| `--pearl-2` | `39 28% 92%` | `37 38% 94%` | `#F7F2EA` |
| `--pearl-3` | `38 24% 87%` | `38 40% 89%` | `#EFE6D6` |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `220 9% 46%` | `#6B7280` |
| `--destructive` | `0 84.2% 60.2%` | `0 79% 50%` | `#DC2626` |
| `--handover` | `24 95% 52%` | `21 92% 48%` | `#EA580C` |

## Phase 2: Hardcoded Hex Replacements (Global Find-Replace)

### Gold System (~74 files, ~4500+ occurrences)
| Find | Replace | Notes |
|------|---------|-------|
| `#C9A84C` | `#B89555` | Primary gold variant |
| `#B8973F` | `#A68444` | Gold gradient endpoint |
| `#A78636` | `#957539` | Gold hover endpoint |
| `#D4B87A` | `#E0CFA0` | Gold light (3 files) |

### Champagne Surface System (~500+ occurrences, ~6 files in CSS, ~353+ in TSX)
| Find | Replace | Notes |
|------|---------|-------|
| `#F5EBD7` | `#F7F1E6` | Surface light |
| `#E8DCC8` | `#ECE2D2` | Surface mid / body bg |
| `#D4C4A8` | `#D8C7A6` | Surface dark |

### Pearl System (~353 files, ~5600+ occurrences)
| Find | Replace | Notes |
|------|---------|-------|
| `#F5F0E6` | `#F7F2EA` | Pearl mid |
| `#EDE4D3` | `#EFE6D6` | Pearl dark |

### Dark System HSL (~124 files, ~870+ occurrences)
| Find | Replace | Notes |
|------|---------|-------|
| `hsl(38,35%,12%)` | `hsl(32,28%,13%)` | Dark start |
| `hsl(36,30%,16%)` | `hsl(33,27%,15%)` | Dark mid |
| `hsl(34,25%,12%)` | `hsl(33,28%,11%)` | Dark end |
| `hsl(38 35% 12%)` | `hsl(32 28% 13%)` | Space-syntax variant |
| `hsl(36 30% 16%)` | `hsl(33 27% 15%)` | Space-syntax variant |
| `hsl(34 25% 12%)` | `hsl(33 28% 11%)` | Space-syntax variant |

### Initial Paint (`index.html`)
| Find | Replace |
|------|---------|
| `#1a1510` | `#18130F` |

### Functional Colors (edge functions + components)
| Find | Replace | Notes |
|------|---------|-------|
| `#EF4444` (case-sensitive) | `#DC2626` | Destructive red |
| `#ef4444` (lowercase) | `#dc2626` | Lowercase variant in edge functions |
| `#F97316` | `#EA580C` | Handover orange |
| `#10B981` / `#10b981` | `#059669` | Success green |

### Text System
| Find | Replace | Notes |
|------|---------|-------|
| `#8B7355` | `#8A7356` | Warm brown icon (~19 files) |

### Scrollbar HSL in `src/index.css`
All `hsl(42 45% 59%` references stay — gold primary is unchanged.

## Phase 3: Remaining Header/Nav Hardcoded Gradients

The navigation header gradient uses `#E8DCC8`, `#DCCFB5`, `#D4C4A8` — these map to the champagne system and will be updated:
| Find | Replace |
|------|---------|
| `#DCCFB5` | `#E0D3BF` (proportional shift matching new champagne mid) |

## Files Modified

- `src/index.css` — CSS variables + hardcoded HSL/hex in utility classes
- `index.html` — initial paint color
- `tailwind.config.ts` — verify variable references (no hex changes needed there)
- `src/contexts/BrandPaletteContext.tsx` — default palette hex values
- **~74 files** with `#C9A84C` → `#B89555`
- **~31 files** with `#B8973F` → `#A68444`
- **~353+ files** with pearl/champagne hardcoded hex values
- **~124 files** with dark HSL values
- **~7 files** with functional color hex values
- **~19 files** with warm brown icon color
- Edge function files with lowercase hex variants

## What Does NOT Change
- `#C8A766` (primary gold) — kept as-is
- `#D4AF37` (bright gold) — kept as-is
- `#FDFBF7` (pearl light) — kept as-is
- `#000000`, `#1A1A1A`, `#FFFFFF` — text colors kept
- AI tool colors — excluded
- No layout, structure, or branding changes

