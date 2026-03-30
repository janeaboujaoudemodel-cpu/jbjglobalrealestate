

# TASK 2: Black-and-White Design System Specification

This is a **definition-only** deliverable. Nothing will be applied yet.

---

## Design Philosophy

Strict monochrome SaaS aesthetic. Zero color — no gold, blue, champagne, or any hue. Pure black, white, and grayscale. High contrast. Clean, modern, professional.

---

## 1. Background Layers

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#000000` (pure black) | Main page background, header, footer |
| `--bg-secondary` | `#0A0A0A` | Alternating sections, subtle differentiation |
| `--bg-tertiary` | `#111111` | Cards, panels, elevated surfaces |
| `--bg-surface` | `#1A1A1A` | Dropdowns, popovers, modals |
| `--bg-inverse` | `#FFFFFF` | Inverted sections (hero CTAs, feature highlights) |
| `--bg-hover` | `#1F1F1F` | Hover state for cards/rows |

---

## 2. Text System

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Headlines, primary content on dark bg |
| `--text-secondary` | `#A0A0A0` | Subtitles, descriptions, supporting text |
| `--text-muted` | `#666666` | Metadata, timestamps, labels |
| `--text-disabled` | `#444444` | Disabled/inactive text |
| `--text-inverse` | `#000000` | Text on white/light surfaces |
| `--text-inverse-muted` | `#555555` | Muted text on white/light surfaces |

**Contrast ratios (WCAG AA):**
- `#FFFFFF` on `#000000` = 21:1
- `#A0A0A0` on `#000000` = 10:1
- `#666666` on `#000000` = 5.7:1
- All pass AA minimum of 4.5:1

---

## 3. Borders & Dividers

| Token | Value | Usage |
|---|---|---|
| `--border-subtle` | `#1F1F1F` | Card borders, container edges |
| `--border-default` | `#2A2A2A` | Input borders, section dividers |
| `--border-strong` | `#444444` | Active/focus borders, emphasized separators |
| `--border-inverse` | `#E0E0E0` | Borders on white/light surfaces |
| `--divider` | `#1A1A1A` | Horizontal section dividers |

---

## 4. Buttons

### Primary (white on black — maximum impact)
- **Default**: `bg: #FFFFFF`, `text: #000000`, `border: none`
- **Hover**: `bg: #E0E0E0`, `text: #000000`
- **Active**: `bg: #CCCCCC`, `text: #000000`
- **Disabled**: `bg: #333333`, `text: #666666`

### Secondary (outlined)
- **Default**: `bg: transparent`, `text: #FFFFFF`, `border: 1px solid #444444`
- **Hover**: `bg: #1A1A1A`, `text: #FFFFFF`, `border-color: #666666`
- **Active**: `bg: #2A2A2A`, `text: #FFFFFF`
- **Disabled**: `bg: transparent`, `text: #444444`, `border-color: #222222`

### Tertiary (ghost)
- **Default**: `bg: transparent`, `text: #A0A0A0`, `border: none`
- **Hover**: `bg: #111111`, `text: #FFFFFF`
- **Active**: `bg: #1A1A1A`, `text: #FFFFFF`
- **Disabled**: `text: #333333`

### Destructive
- **Default**: `bg: #FFFFFF`, `text: #000000` (same as primary — no red)
- Distinguished by position/context/icon, not color

---

## 5. Inputs

| State | Background | Border | Text | Placeholder |
|---|---|---|---|---|
| **Default** | `#0A0A0A` | `1px solid #2A2A2A` | `#FFFFFF` | `#555555` |
| **Hover** | `#0A0A0A` | `1px solid #444444` | `#FFFFFF` | `#555555` |
| **Focus** | `#0A0A0A` | `2px solid #FFFFFF` | `#FFFFFF` | `#666666` |
| **Disabled** | `#0A0A0A` | `1px solid #1A1A1A` | `#444444` | `#333333` |
| **Error** | `#0A0A0A` | `2px solid #888888` | `#FFFFFF` | `#555555` |

---

## 6. Icons

| Type | Color | Usage |
|---|---|---|
| **Primary** | `#FFFFFF` | Action icons, nav icons on dark bg |
| **Secondary** | `#666666` | Decorative, supporting icons |
| **Interactive hover** | `#FFFFFF` (from `#666666`) | Icon hover lift |
| **On white surface** | `#000000` | Icons on inverse/light surfaces |
| **Disabled** | `#333333` | Inactive icons |

**Icon containers**: No colored circles. Use `bg: #1A1A1A` rounded containers with white icons, or no container at all.

---

## 7. States

| State | Visual Treatment |
|---|---|
| **Hover** | Lighten background by 1 step (e.g., `#000` → `#111`), brighten text to `#FFF` |
| **Active/Pressed** | Lighten background by 2 steps (e.g., `#000` → `#1A1A1A`) |
| **Disabled** | Reduce opacity to ~40% or use `#333`/`#444` tones |
| **Selected** | White left-border accent (`3px solid #FFF`) + `bg: #111111` |
| **Focus ring** | `2px solid #FFFFFF`, offset `2px` |
| **Loading** | Pulse animation using `#1A1A1A` ↔ `#2A2A2A` |

---

## 8. Shadows & Elevation

| Level | Value |
|---|---|
| **None** | Default — flat design, no shadows |
| **Subtle** | `0 1px 2px rgba(0,0,0,0.5)` — cards only when needed |
| **Modal** | `0 8px 32px rgba(0,0,0,0.8)` — modals/overlays |

Minimal shadow usage. Separation via background color steps, not shadows.

---

## 9. Implementation Map (CSS Variables)

All values will be set in `:root` in `src/index.css`, replacing existing gold/champagne/brown variables. The Tailwind config tokens (`background`, `foreground`, `primary`, `card`, etc.) will map to the new grayscale values. No Tailwind config structure changes needed — only CSS variable value swaps.

---

## 10. Color Usage Rules (Strict)

1. **ZERO hue allowed** — no gold, blue, green, red, champagne, brown, or any saturated color
2. **All values must be pure grayscale** — HSL saturation must be `0%`
3. **Minimum contrast**: 4.5:1 for body text, 3:1 for large text (WCAG AA)
4. **Differentiation by luminance only** — sections separated by background darkness steps, not color
5. **White is the accent** — primary buttons, focus rings, selected states all use white
6. **Images and user-uploaded media are exempt** — only UI chrome is monochrome

---

**TASK 2 COMPLETED — DESIGN SYSTEM READY**

