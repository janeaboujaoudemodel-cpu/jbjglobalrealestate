

# TASK 3 — Visual Correction Pass: Contrast, CTAs, Dividers, Footer, Mode Colors

## Defects Identified from Code Inspection

### 1. SectionDivider is heavy — renders a `py-4 md:py-6` padded container with two gradient lines
Used ~20 times on homepage. Creates visible rectangular strips between sections.

### 2. Mortgage Calculator CTAs are broken
- `Button variant="primary"` with `text-gold` / `text-black` mixing — text becomes invisible when `text-gold` maps to `#111` via CSS override on a black bg button
- Slider labels use `text-gold` which maps to `#111` (black) — fine on white, but the "Mortgage Calculator" title also uses `text-gold` span
- Result cards use champagne gradients (`from-[#F7F1E6]`) and `text-gold` — these get overridden to white bg + black text, losing all contrast hierarchy

### 3. Hero CTA pills use `bg-[hsl(32,28%,13%)]/40` + `text-gold/70` + `border-[hsl(var(--gold)/0.3)]`
- The `hsl(32,28%,13%)` bg gets overridden to white by CSS, making pills white-on-white against the dark hero overlay — invisible
- Need to use `bg-black/40` or `bg-white/10` instead

### 4. AI Home Finder section uses dark brown gradient + champagne card
- Section bg `from-[hsl(32,28%,13%)]` → overridden to white, but gold blur orbs remain
- Card uses `from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]` + `border-gold/60` — overridden but loses visual definition

### 5. ModeSwitcher dropdown uses champagne gradients
- `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]` → overridden to white (fine)
- Mode colors (emerald, blue, purple, amber) are correct and should be PRESERVED per user requirement

### 6. Footer utility row wrapping
- Currency/unit dropdowns and email can wrap badly on narrow viewports
- Need `whitespace-nowrap` and `min-w-0` constraints

### 7. Developer Portal CTA shows for all modes
- No mode-gating — shows "Developer Center" even in Investor mode
- Should show investor-relevant content when in investor mode, or properly contextualize

## Execution Plan (7 files)

### File 1: `src/components/ui/section-divider.tsx`
Replace the heavy two-line divider with an ultra-subtle single `h-px` line:
- Remove `py-4 md:py-6` padding container
- Replace with a simple `<div className="h-px bg-gray-200/60 mx-auto max-w-7xl" />`
- Keep the component API intact (className, fullWidth props)

### File 2: `src/pages/Index.tsx`
- **Hero pills** (line 285): Change `bg-[hsl(32,28%,13%)]/40` → `bg-black/40`, `border-[hsl(var(--gold)/0.3)]` → `border-white/30`, `text-gold/70` → `text-white/70`, `hover:bg-[hsl(var(--gold)/0.15)]` → `hover:bg-white/15`, `hover:text-gold` → `hover:text-white`
- **Pillar badges** (line 296-307): `border-[hsl(var(--gold)/0.2)]` → `border-white/20`, `border-[hsl(var(--gold)/0.15)]` → `border-white/15`, `text-gold` on icon → `text-white/80`
- **Hero gold accent lines** (lines 231-242): Remove or change `from-gold/60` → `from-white/20`
- **Hero fallback** (lines 170-194): Change gold orbs to `bg-white/5`, shimmer line `via-gold/40` → `via-white/30`
- **Hero tagline badge** (line 256): `text-[hsl(var(--gold)/0.7)]` → `text-white/60`
- **Scroll indicator** (line 318): `text-[hsl(var(--gold)/0.5)]` → `text-white/40`
- **AI Home Finder section** (lines 427-494): Change section bg to `bg-gray-950` (intentional dark section), remove gold blur orbs, change card to `bg-white border border-gray-200`, remove gold box-shadows, change badge to `bg-gray-100 border-gray-300`, icon colors to gray
- **Mortgage section wrapper** (line 512): Change `bg-gradient-to-br from-[#FDFBF7]...` → `bg-gray-50 border border-gray-200`, remove gold blur orbs, fix button text contrast
- **Mortgage CTA buttons** (lines 526-539): Ensure primary = `bg-black text-white`, secondary = `bg-white text-black border-gray-300`. Remove `text-gold` spans inside buttons
- **SectionLoader spinner** (line 78): `border-gold` → `border-gray-400`

### File 3: `src/components/MortgageCalculator.tsx` (compact variant, lines 101-253)
- Title (line 108): Remove `text-gold` span, use plain `text-black`
- Slider containers (lines 119, 142, 165, 188): `border-gold/20` → `border-gray-200`, `text-gold` on icons → `text-gray-600`, `text-gold` on values → `text-black font-bold`
- Monthly payment result card (line 214): `from-gold/20 via-gold/10` → `bg-gray-900 text-white`, `border-gold/40` → `border-gray-800`, `text-gold` → `text-white`
- Stat cards (lines 223, 234, 245): `from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]` → `bg-white border border-gray-200`, `text-gold` → `text-black`, `border-gold/40` → `border-gray-200`

### File 4: `src/components/ModeSwitcher.tsx`
- **Keep mode colors** (emerald, blue, purple, amber) — this is the required "memory cue"
- **Fix dropdown background** (line 144): `bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]` → `bg-white`
- **Fix dropdown header** (line 148): `bg-gradient-to-r from-[#F7F1E6] via-[#EDE0C8] to-[#D8C7A6]` → `bg-gray-50 border border-gray-200`
- **Fix dropdown border** (line 144): `border-gold/40` → `border-gray-200`

### File 5: `src/components/home/DeveloperPortalCTA.tsx`
- Add mode-awareness: import `useUserModeContext`
- When mode is `investor`: change title from "Developer Center" to "Investor Opportunities" or show investor-relevant messaging
- When mode is `developer`: keep current Developer Center content
- When unregistered in investor mode: show investor benefits instead of developer registration

### File 6: `src/components/Footer.tsx`
- **Utility strip** (lines 550-593): Add `flex-wrap` and `whitespace-nowrap` to all text spans. Ensure email doesn't wrap mid-word using `break-keep` or truncation
- **FooterCurrencyUnit** (line 143): Add `whitespace-nowrap` to currency/unit labels
- **Logo area** (lines 449-483): Keep current implementation (already uses `jbjMonogramNobuffer` on white bg with no white box behind it — this is correct). The `bg-white` on `line 451` is just the section bg, not a box behind the logo

### File 7: `src/components/CombinedContactNewsletter.tsx`
- Remove `fontFamily: "Poppins, sans-serif"` (line 56) — must use Inter per typography standard

## What Will NOT Change
- Mode colors in ModeSwitcher (preserved as memory cue)
- Header/filter bar (already correct)
- Footer navigation cards (already correct)
- No content removal
- No layout restructuring

## Expected Visual Result
- Ultra-subtle section transitions (1px line or spacing only, no heavy bars)
- Readable mortgage CTAs (black bg + white text)
- Readable hero pills (proper contrast on dark overlay)
- AI Home Finder: clean dark section with white card
- Footer utility row: no wrapping/stacking issues
- Mode color preserved as visual memory in header/footer
- Developer section shows investor-relevant content in investor mode

