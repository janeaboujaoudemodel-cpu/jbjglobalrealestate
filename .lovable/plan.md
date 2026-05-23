
## 1. "What JBJ Brokers Receive" — premium card grid

File: `src/pages/BrokerEducation.tsx` (lines ~450–473)

- Tighten the 8 cards: 2-line clamped descriptions, consistent height, premium feel — champagne surface, 1px gold hairline border (no fills, per memory), soft inner shadow, gold-on-ink IconTile.
- Add subtle motion: gentle lift + gold hairline glow on hover, staggered fade-in.
- Promote **one** card (AI Tools Access) to a "featured" tile: spans 2 cols on lg, animated — a slow continuous shimmer sweep across the gold hairline + a softly pulsing IconTile. Pure CSS/framer-motion, no heavy libs.
- Keep all 8 benefits (no removal), Inter only, all text ink `#1A1A1A` (no faded gold).

## 2. Certification "Congratulations" header

File: `src/components/certification/CertificatePreview.tsx`

- Replace the plain `<Award />` with a richer **certificate medallion icon** (ribbon + seal composition built from lucide `Award` + `Medal` layered with a gold gradient ring + subtle rotating shimmer).
- Color: champagne→gold metallic gradient fill (allowed inside the certificate component as a decorative seal, not as a page surface).
- Text "Congratulations!" stays ink; subtitle ink/70.

## 3. Certificate body — readability fix + metallic mirror

Same file. Current problems: white text on dark + gold gradient text on dark = unreadable, low contrast, breaks champagne palette.

Rebuild the certificate plate without breaking the surrounding card:
- **Surface**: deep obsidian `#0E0B07` → `#1A1410` with a subtle diagonal **metallic mirror sweep** (animated linear-gradient that drifts slowly, ~8s loop, paused on `prefers-reduced-motion`). Hairline gold border + inner gold double-rule frame.
- **Typography hierarchy (all legible on dark)**:
  - Brand wordmark: champagne `#EFE6D6`, tracked, medium weight (no gradient text).
  - "Certificate of Achievement" eyebrow: gold `#B89555`, 0.3em tracking.
  - "This is to certify that": champagne `#EFE6D6`.
  - Recipient name: large serif-display, solid champagne with a single thin gold underline (no gradient fills on text → fixes the unreadable shimmer).
  - Body line + "Certified JBJ Broker" title: champagne, gold accent rule above/below the title.
  - Date / Certificate ID: champagne/80, gold hairlines.
- Corner flourishes: keep, thicken to 1.5px gold.
- Background pattern: keep the subtle gold fleck SVG at lower opacity so it doesn't fight text.

## 4. Stamp + signature on the certificate

- Add a signature block bottom-left: handwritten signature image + printed name "Jeyhun Babayev" + title "Founder & CEO, JBJ Global Real Estate", separated by a gold hairline.
- Add a circular company stamp bottom-right using `<StampOverlay />` (already standardized, uses `mix-blend-mode: multiply` for realistic ink).
- Hide both on the locked preview (or show ghosted at 25% opacity with a "Preview" watermark) so unearned certificates don't look issued.

**Blocker — need the actual asset files.** I couldn't find any stamp/signature in `public/`, `src/assets/`, or in the `owner_signature_assets` table. Before I build this step I need you to either:
  - re-upload the stamp PNG and signature PNG in this chat, or
  - tell me the exact filename/path if they're already in the repo.

## 5. Out of scope
- No DB or edge-function changes.
- No changes to phase cards, hooks, or certification logic.
- No removals — purely visual upgrades.

## Technical notes
- All animations via `framer-motion` + CSS keyframes already in the design system; respect `prefers-reduced-motion`.
- Gold used only as 1px hairline / thin underline / decorative seal — never as a fill surface (per `no-gold-fills` memory). The metallic mirror sweep lives on the dark certificate plate, not on champagne UI.
- Featured "AI Tools" card uses cream `#EFE6D6` highlight + gold hairline, never a solid gold fill.
