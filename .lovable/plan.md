

# TASK 3: Apply Black-and-White Design System Across Entire Front-End

## Summary
The CSS variables in `src/index.css` are already converted to grayscale (Task 2), but **800+ component files** still contain hardcoded color hex values and colored Tailwind classes. This task eliminates all remaining color across the platform.

---

## Execution Strategy

Due to the massive scale (400+ files with champagne hex, 700+ files with colored utilities, 800+ files with gold references), we use a **layered approach**: fix the core design tokens/components first, then use CSS overrides for the long tail.

---

## Step 1: Core UI Components (8 files)

### `src/components/ui/button.tsx`
- Replace all AI-variant colored gradients (`AI_EMERALD`, `AI_PURPLE`, etc.) with grayscale equivalents: `bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white border border-white/20`
- Replace `BRAND_PRIMARY` champagne gradient with `bg-white text-black border border-white`
- Replace `BRAND_SECONDARY` gold borders with `border-white/40`
- Replace `BRAND_HERO` gold icon refs with white
- Replace `BRAND_DARK` gold refs with white/gray

### `src/components/ui/input.tsx`
- Replace champagne gradient bg with `bg-[#0A0A0A]`
- Replace `border-gold` with `border-white/20`
- Replace `focus:ring-gold/50` with `focus:ring-white/50`
- Keep `text-black` → change to `text-white`

### `src/components/ui/select.tsx`
- `SelectTrigger`: Replace champagne gradient with `bg-[#0A0A0A] border-white/20 text-white`
- `SelectContent`: Replace `bg-[#FDFBF7]` with `bg-[#111111] border-white/20 text-white`
- `SelectItem`: Replace hover gold with `hover:bg-white/10`
- Remove all `text-gold` chevron colors → `text-white/60`

### `src/components/ui/card.tsx`
- `CardDetail`: Change `text-gold` to `text-white`

### `src/components/ui/hero-button.tsx`
- Replace `text-gold` arrow with `text-white`
- Replace `hover:border-gold/80` with `hover:border-white/80`

### `src/components/ui/themed-icon.tsx`
- Replace `text-gold` with `text-white`

### `src/components/ui/section-divider.tsx`
- Replace gold gradient lines with white/gray gradient lines
- Replace champagne variant bg with grayscale

### `src/components/FreeAccessBadge.tsx`
- Replace emerald/gold colors with grayscale equivalents

---

## Step 2: Header & Navigation (4 files)

### `src/components/header/mega-menu-primitives.tsx`
- Replace inline `background: 'linear-gradient(135deg, #F7F1E6 ...)` with `background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 50%, #0A0A0A 100%)'`
- Replace `border-gold/40` with `border-white/20`
- Replace all champagne text/link colors with grayscale

### `src/components/GlobalHeader.tsx`
- Replace any remaining champagne/gold gradient references in header background
- Replace all `text-gold` icon references with `text-white`

### Mega menu files (`MegaMenuBuy`, `MegaMenuSell`, `MegaMenuRent`, `MegaMenuProjects`, `MegaMenuDevelopers`, `MegaMenuAreas`, `MegaMenuInsights`, `MegaMenuMore`, `MegaMenuLanguage`, `MegaMenuAccount`)
- These inherit from mega-menu-primitives, so most fixes propagate automatically

---

## Step 3: Footer (1 file)

### `src/components/Footer.tsx`
- Replace `FooterCard` champagne gradient with `bg-[#111111] border-white/20`
- Replace all `text-gold` with `text-white`
- Replace all `border-gold` with `border-white/20`
- Replace Poppins font references with Inter (the global font)
- Replace gold textShadow/boxShadow with grayscale equivalents

---

## Step 4: Global CSS Override Layer (1 file — `src/index.css`)

Add a **catch-all CSS override block** at the end of `src/index.css` that forcibly neutralizes the most common hardcoded color patterns across all 400+ files. This is far more efficient than editing every file individually:

```css
/* GLOBAL MONOCHROME OVERRIDE — catches hardcoded colors in 800+ component files */

/* Champagne gradients → dark surface */
[class*="from-[#FDFBF7]"],
[class*="from-[#F7F1E6]"],
[class*="from-[#F7F2EA]"],
[class*="from-[#ECE2D2]"],
[class*="from-[#E8DCC8]"],
[class*="from-[#EFE6D6]"],
[class*="from-[#DCCFB5]"],
[class*="from-[#D8C7A6]"],
[class*="from-[#D4C4A8]"] {
  --tw-gradient-from: #1A1A1A !important;
  --tw-gradient-via: #111111 !important;
  --tw-gradient-to: #0A0A0A !important;
  color: white !important;
}

/* Gold hex text → white */
[class*="text-[#D4AF37]"],
[class*="text-[#C8A766]"],
[class*="text-[#B8860B]"] {
  color: white !important;
}

/* White/light backgrounds on cards/containers → dark */
[class*="bg-white"],
[class*="bg-[#FDFBF7]"],
[class*="bg-[#F7F1E6]"],
[class*="bg-[#F7F2EA]"] {
  background-color: #111111 !important;
  color: white !important;
}
```

This override block catches the vast majority of the 8000+ hardcoded color instances without touching each file.

---

## Step 5: Tailwind Color Remap (1 file — `tailwind.config.ts`)

Override ALL Tailwind color utilities to grayscale by extending the color palette:

```ts
// Remap all colored utilities to grayscale
emerald: { 50: '#f5f5f5', 100: '#e5e5e5', ..., 500: '#737373', 600: '#525252', ... },
blue: { /* same grayscale */ },
purple: { /* same */ },
// etc for all color families
```

This ensures every `text-emerald-500`, `bg-blue-600/20`, `border-purple-400/30` etc. across all 700+ files automatically becomes grayscale without editing each file.

---

## Step 6: Remaining High-Visibility Component Files (batch)

After the global overrides, fix key components that have inline styles or patterns the CSS overrides can't catch:

- `src/components/home/CTABand.tsx` and `CombinedContactNewsletter.tsx`
- `src/components/home/` homepage sections
- `src/components/crm/` CRM components
- `src/components/investor/` portfolio components
- Any component using `style={{ color: '#D4AF37' }}` inline

---

## What Will NOT Change
- No layout changes
- No content removal
- No page/section/feature removal
- Header and footer remain 100% complete
- All functionality preserved

## Result
- Every UI surface renders in strict black, white, and grayscale
- All contrast meets WCAG AA (4.5:1 minimum)
- Consistent visual language across all 800+ component files

