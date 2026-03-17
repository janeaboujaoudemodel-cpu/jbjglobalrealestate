

## Revert L-Shaped Frame to Previous Champagne/Light Brown Colors

### What Changed & What To Revert

Session 5 changed the entire L-shaped navigation frame from champagne/light brown to dark luxury brown. The user wants **only the header + sidebar** reverted to the previous lighter champagne-brown style. All other public page sections/cards/footer remain as-is.

### Changes

**1. `src/components/navigation/HorizontalUtilityBar.tsx`**
- Line 127: Revert `bg-gradient-to-r from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` → `bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
- Revert border to `border-[hsl(var(--gold)/0.2)]`
- Revert text colors: `text-gold/60` → `text-black/50`, `text-gold/70` → `text-black/60`, `text-gold` → `text-black/80`
- Buy/Rent/Sell labels: `text-gold/70 group-hover:text-gold` → `text-black/60 group-hover:text-black/80`
- Area unit toggle inactive: `text-gold/30 hover:text-gold/60` → `text-black/30 hover:text-black/50`
- Icon colors: `text-[hsl(var(--gold))]` keep as gold (icons were gold before too)
- Rail dividers: keep gold (were gold before)

**2. `src/components/navigation/GlobalFilterBar.tsx`**
- Line 104: This was already dark brown before Session 5 (confirmed from original code). Keep as-is — no revert needed.

**3. `src/components/navigation/GlobalVerticalNav.tsx`**
- **Sidebar header** (line 1071): Revert `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` → `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
- Company text (line 1079-1080): `text-gold` → `text-black/85`, `text-gold/60` → `text-black/50`
- Collapse button (line 1084): Revert to `bg-black/5 hover:bg-black/10 border border-black/10`
- **Sidebar body** (line 1382): Revert `bg-gradient-to-b from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` → `bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- Section labels: `text-gold` → `text-black/80`, `text-gold/45` → `text-black/45`, `text-gold/70` → `text-black/70`
- Nav items: `text-gold/80` → `text-black/80`, `hover:text-gold` → `hover:text-black`
- Active items: Revert gradient to `from-[#F5EBD7] to-[#D4C4A8]` with `text-black`
- My Shortcuts button: Revert gold-only styling to previous black/gold mixed styling
- **Collapsed sidebar** (line 1280+):
  - Header strip (line 1283): Revert `from-[hsl(38,35%,12%)] to-[hsl(34,25%,12%)]` → `from-[#F5EBD7] to-[#D4C4A8]`
  - Section icons bg (line 1293): Revert dark brown → `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
  - Icon text colors: `text-gold/40` → `text-black/40`, active styling adjust for light bg
  - Expand button (line 1373): Revert dark brown → champagne styling
- **Footer area** (line 1233): Revert `from-[hsl(38,35%,10%)]/50` → `from-[#F0E8D8]/50`
- Contact/Support/Sign Out text: Revert for light bg readability
- Section dividers: Keep gold-only separators (this improvement stays)

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — champagne bg, black text
2. `src/components/navigation/GlobalVerticalNav.tsx` — champagne header, light body, black text

### No Changes To
- GlobalFilterBar (was already dark brown)
- Footer, section-divider, index.css, BestIdeaAward, SupportTicketBox, StatsCounter, TrustBar, DataSourcesPanel, CombinedContactNewsletter (these stay as Session 5 left them)

### Database Changes
None.

### Testing
1. Verify horizontal bar is champagne with black text, edge-to-edge aligned with sidebar header
2. Verify sidebar header matches horizontal bar champagne tone
3. Verify sidebar body is light champagne with readable black text
4. Verify collapsed sidebar matches the same champagne tones
5. Verify the rest of the site (sections, cards, footer) remains unchanged from Session 5

