# Fix footer readability + mode chip + connect card

Six issues to fix across `Footer.tsx`, `SocialLinks.tsx`, `GoogleMyBusinessLink.tsx`, and `ModeSwitcher.tsx`.

---

## 1. Copyright + legal company name unreadable

**File**: `src/components/Footer.tsx`

The `© 2026 JBJ Global Real Estate · All Rights Reserved` line and the `JBJ Global Real Estate L.L.C S.O.C. — Dubai mainland brokerage…` paragraph use `text-white/90` on the deep ink footer (`#0A0908`). Combined with the runtime contrast guard (which can damp opacity further) they read as faint gray.

Fix: Bump both legal blocks to **solid champagne ink**:
- Copyright row → `color: #FDFBF7` (no opacity), `font-weight: 500`, slight tracking.
- Legal paragraph (line 622) and Arabic paragraph (line 637) → `color: rgba(255,255,255,0.96)`, with the company name `<bdi>` rendered in a soft champagne accent (`#E6CFA0`, weight 600) so the brand is visually distinct.
- Add `data-no-contrast-guard` on the legal block wrapper so the runtime guard doesn't second-guess it.

## 2. Footer brand logo + name styling

The white-on-dark logo tile (line 500-513) currently shows the monogram inside a dark glass chip with a faint border, which the user dislikes. Replace with a clean **transparent presentation**:

- Remove the `bg-[#FDFBF7]/[0.04]` tile and `boxShadow` — keep just the monogram on the dark surface, vertically centered next to the wordmark.
- Wordmark `JBJ Global Real Estate`: bump to `text-[16px] font-semibold tracking-[0.22em]`, color `#FDFBF7`, with a subtle champagne underline accent already present.
- Adjust monogram: `h-12 w-12 object-contain` with a soft champagne drop-shadow (`drop-shadow(0 2px 6px rgba(200,167,102,0.35))`) — premium, no boxed frame.

## 3. "Connect" card → gold metallic mirror

The card holding social icons + Google Business + Mode + Currency/Unit (line 529) uses `bg-[#F7F2EA]` (flat champagne). The user wants a **metallic gold mirror** treatment.

Update the wrapper to a multi-stop gold gradient with subtle inner sheen:
```
background:
  linear-gradient(135deg, #D4B66A 0%, #B89555 35%, #8B6F3D 55%, #B89555 75%, #E6CFA0 100%);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.45),
  inset 0 -1px 0 rgba(0,0,0,0.25),
  0 6px 24px rgba(0,0,0,0.35);
border: 1px solid rgba(255,255,255,0.25);
```
Plus a faint diagonal highlight overlay (pseudo-element via inline `::before` style is not possible — instead use a second absolutely-positioned `<span>` with a `linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)` for the mirror sweep).

Inside the card on this gold metal surface, all text + dividers must read in **ink black** (`#1A1A1A`) for premium contrast:
- "Connect" eyebrow → already `#1A1A1A`, keep.
- Currency button text, Unit toggle text → switch from `text-white/90` to `text-[#1A1A1A]`.
- Vertical dividers → `#1A1A1A`/30 instead of gold/40.
- Currency dropdown panel button border → `#1A1A1A`/30.

Add `data-no-contrast-guard` on the metal card so the dark-surface guard doesn't flip its children to white.

## 4. Google Business Profile badge — champagne + ink, never silver

**File**: `src/components/marketing/GoogleMyBusinessLink.tsx` (badge variant, line 65–106)

Current: dark `from-zinc-800/80 via-zinc-900/90 to-black` chip with `text-white/85` label — reads silver/gray on the Connect card and is hard to see.

Replace badge styling to match the new gold metal card:
- Remove the dark gradient. New surface: `bg-[#FDFBF7]` chip with `border border-[#1A1A1A]/15`, subtle inner highlight.
- Inner Google logo holder: drop the dark inner box, render the colored G logo directly on the champagne chip at `w-7 h-7`.
- Stars: keep amber 5-star row (already premium).
- Label "Google Business Profile" → `text-[#1A1A1A] font-semibold text-[12px]`, with `text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/70` eyebrow `Verified` above the stars.
- Hover: `bg-[#F7F2EA]`, no color change on text. Adds `data-no-contrast-guard`.

Result: black-on-champagne, premium, fully readable inside the gold metal card.

## 5. Social icons — uniform with YouTube/TikTok on default + hover

**File**: `src/components/marketing/SocialLinks.tsx` (premium variant)

The premium variant already renders all 5 icons as identical chips (`bg-[hsl(var(--gold))]/15`, ink glyph, gold border, hover fills gold). User reports Facebook/Instagram/LinkedIn look different from YouTube/TikTok.

Root cause: Lucide icons (`Facebook`, `Instagram`, `Linkedin`) are stroke-based — on the gold chip the stroke is `text-[#1A1A1A]` ink, but the **fill** is transparent. YouTube/TikTok are inline SVGs with `fill="currentColor"` so they appear as solid ink shapes, visually heavier.

Fix: Swap `Facebook`, `Instagram`, `Linkedin` to inline SVG paths with `fill="currentColor"` (matching YouTube/TikTok pattern). All five icons then render as solid ink glyphs in the default state, and stay solid ink on the gold-fill hover state. Same `w-[18px] h-[18px]` sizing.

## 6. Mode chip — keep label INK BLACK in both states + premium hover effect

**File**: `src/components/ModeSwitcher.tsx` (header variant trigger, line 152–189)

Currently the trigger uses a saturated mode-color gradient (`#F97316 → #C2410C` for investor) with **white** label text. User wants the label to read **ink black** at rest AND on hover, with a floating/lifted hover effect (no color shift).

Changes to the trigger button (line 162–188):
- `triggerStyle.color` → `#1A1A1A` (was `#FFFFFF`).
- Label `<span>` inline `style={{ color: '#1A1A1A' }}` (was `#FFFFFF`).
- `<CurrentIcon>` + `<ChevronDown>` → `style={{ color: '#1A1A1A' }}`.
- Soften the gradient so ink is readable: keep mode color but blend toward champagne. Build via `linear-gradient(135deg, ${currentConfig.base}E6 0%, ${currentConfig.base}CC 100%)` plus a `0 0 0 1px rgba(0,0,0,0.15)` inner ring for definition. (`E6` = ~90% alpha; on dark footer surface this still reads as the mode color but light enough for ink contrast.)
- `boxShadow` rest: `0 2px 8px ${currentConfig.base}55, inset 0 1px 0 rgba(255,255,255,0.5)`.
- Replace `hover:brightness-110` with a **floating lift** + glow: add Tailwind `hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,0,0,0.35),0_0_0_2px_${color}55]` style via inline onMouseEnter/Leave or via a dedicated CSS class. Simpler: use `className` with `hover:-translate-y-0.5 transition-transform` and add a second inline shadow swap on `:hover` using a `data-mode-trigger` selector + a small CSS rule appended to `index.css`.
- Loading spinner color → `#1A1A1A`.
- Same change applied to the `compact` variant (line 128–149).

Mode dropdown panel rows already use ink-on-light, no change needed.

## 7. Memory updates

After implementing, append two memory notes:
- `mem://brand/footer-corporate-standard` — note the connect card is now the **gold metallic mirror** card with ink-on-gold contents, and the company name + copyright are guarded against the dark-surface contrast guard via `data-no-contrast-guard`.
- `mem://features/auth/login-first-mode-and-crm-categorization` — note the mode chip label is **always ink black**, never white, with a floating-lift hover (no color change).

---

## Files changed

- `src/components/Footer.tsx` — copyright/legal contrast, brand block restyle, gold-metal connect card, ink children
- `src/components/marketing/GoogleMyBusinessLink.tsx` — badge variant rewritten to champagne+ink
- `src/components/marketing/SocialLinks.tsx` — Facebook/Instagram/LinkedIn switched to filled SVG paths matching YouTube/TikTok
- `src/components/ModeSwitcher.tsx` — trigger label always ink black, floating-lift hover
- `src/index.css` — small `[data-mode-trigger]:hover` shadow rule
- `mem://brand/footer-corporate-standard` — refreshed
- `mem://features/auth/login-first-mode-and-crm-categorization` — appended mode chip rule

## Out of scope

- Footer link columns, contact strip, hairlines, FounderContent — no functional change.
- ModeSwitcher dropdown items — already ink-on-pastel and unaffected.
- The "No Removal" policy is respected; every link, block, and feature stays.
