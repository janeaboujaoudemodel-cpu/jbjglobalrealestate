

## Session 5 — Global Dark Brown Frame, Black→Brown Replacement, Footer Restructure

### Problem Summary
1. **Header misalignment**: Horizontal utility bar appears one line below the sidebar header — different visual weight
2. **Color mismatch**: Sidebar header (champagne gold) vs horizontal bar (champagne gold) look disconnected; sidebar body is light champagne — user wants the entire L-shaped frame in **dark luxury brown**
3. **Black surfaces everywhere**: Section wrappers, icon boxes, dividers, card backgrounds all use `bg-black` — must become dark brown globally
4. **Footer structure**: Social icons, Write Us, Google need consolidation into a single premium strip; Mode/Currency/Unit need to be visible; footer cards need square edges
5. **Sidebar section dividers**: Currently have black-tinted separators between sections — need fully connected brown with gold dividers only

### Color Definitions
- **Dark Luxury Brown**: `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]`
- **Gold text**: `text-gold` / `text-[hsl(var(--gold))]`

---

### A. L-Shaped Frame: All Dark Brown

**File: `src/components/navigation/HorizontalUtilityBar.tsx`**
- Line 127: Replace champagne gradient `bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` with dark brown gradient
- Change `border-[hsl(var(--gold)/0.2)]` border to `border-gold/20`
- Update text colors: `text-black/50`, `text-black/60`, `text-black/80` → `text-gold/70`, `text-gold`, `text-gold` respectively
- Label class (line 119): `text-black/50` → `text-gold/60`
- Buy/Rent/Sell labels: `text-black/60 group-hover:text-black/80` → `text-gold/70 group-hover:text-gold`
- Area unit toggle: inactive text `text-black/30 hover:text-black/50` → `text-gold/30 hover:text-gold/60`

**File: `src/components/navigation/GlobalFilterBar.tsx`**
- Line 104: Replace champagne gradient with same dark brown gradient
- FilterShortcutBar variant: may need `"dark"` variant or override text colors

**File: `src/components/navigation/GlobalVerticalNav.tsx`**
- **Sidebar header** (line 1071): Replace `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` with dark brown gradient
- Company text (lines 1079-1080): `text-black/85` → `text-gold`, `text-black/50` → `text-gold/60`
- Collapse button (line 1084): Update bg and border for dark brown context
- **Sidebar body** (line 1382): Replace `bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` with dark brown gradient
- All section labels (line 1173-1176): `text-black/80`, `text-black/45`, `text-black/70` → gold variants
- Nav items: `text-black/80` → `text-gold/80`, `hover:text-black` → `hover:text-gold`
- Active state gradients in nav items → dark brown with gold border
- Section divider dots/lines between sections: keep gold, remove any black-tinted bg
- **Collapsed sidebar** (line 1280+): Same dark brown treatment
- Collapsed section icons bg (line 1293): `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` → dark brown
- **Footer area** (line 1233): `bg-gradient-to-t from-[#F0E8D8]/50` → dark brown
- Contact/Support/Sign Out text: adjust for dark bg
- My Shortcuts button: update for dark brown context (gold border, gold text)
- Highlighted items styling: update for dark bg

---

### B. Global Black → Dark Brown (All Public Pages)

**File: `src/index.css`**
- `.jj-section-champagne` (line 503): `bg-black` → dark brown gradient
- Update any CSS classes referencing `bg-black` as page-level background

**File: `src/components/ui/section-divider.tsx`**
- Line 23: Default `bg-black` → `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]`

**File: `src/components/BestIdeaAward.tsx`**
- Line 123: `bg-black` → dark brown
- Lines 163, 176 (prize card boxes): `bg-black` → dark brown

**File: `src/components/SupportTicketBox.tsx`**
- Line 419: `bg-black` → dark brown
- Line 456 (commitment box): `bg-black` → dark brown

**File: `src/components/CombinedContactNewsletter.tsx`**
- Line 58: `bg-black` → dark brown

**File: `src/components/StatsCounter.tsx`**
- Line 123 (icon boxes): `bg-black` → dark brown

**File: `src/components/home/TrustBar.tsx`**
- Icon boxes: `bg-black` → dark brown

**File: `src/components/home/WhyChooseUs.tsx`** (if it has black backgrounds)

**File: `src/components/market-intelligence/DataSourcesPanel.tsx`**
- Line 46: `bg-black` → dark brown
- Section header text: `text-black` → `text-white` or `text-gold` for dark bg readability

---

### C. Footer Restructure

**File: `src/components/Footer.tsx`**

1. **Footer cards square edges** (line 37): `FooterCard` component — change `rounded-xl` → `rounded-none`
2. **Social + Write Us + Google → single strip** (lines 666-695): Restructure to a single horizontal row containing:
   - Social media icons (SocialLinks)
   - Gold divider
   - "Write Us" with email link
   - Gold divider  
   - Google Business Profile badge
   All in one connected premium strip
3. **Mode switcher** (line 687-691): Make it a full-width visible card with label and current mode displayed
4. **Currency & Unit** (line 694-695): `FooterCurrencyUnit` — ensure all three controls (Currency dropdown, ft²/m² toggle) sit side by side in a visible row; currently they do but may need larger sizing

---

### D. Sidebar Sections Fully Connected

**File: `src/components/navigation/GlobalVerticalNav.tsx`**
- Section dividers (lines 1162-1167): Remove the black-tinted gradient dots/lines between sections, replace with thin gold-only dividers (`bg-gold/20`) — no black, fully connected dark brown

---

### Files Modified
1. `src/components/navigation/HorizontalUtilityBar.tsx` — dark brown bg, gold text
2. `src/components/navigation/GlobalFilterBar.tsx` — dark brown bg
3. `src/components/navigation/GlobalVerticalNav.tsx` — dark brown full sidebar, gold text, connected sections
4. `src/components/ui/section-divider.tsx` — default bg → dark brown
5. `src/index.css` — `.jj-section-champagne` bg → dark brown
6. `src/components/BestIdeaAward.tsx` — black → dark brown
7. `src/components/SupportTicketBox.tsx` — black → dark brown
8. `src/components/CombinedContactNewsletter.tsx` — black → dark brown
9. `src/components/StatsCounter.tsx` — icon boxes dark brown
10. `src/components/home/TrustBar.tsx` — icon boxes dark brown
11. `src/components/Footer.tsx` — square cards, social strip, mode/currency visible
12. `src/components/market-intelligence/DataSourcesPanel.tsx` — bg dark brown

### Database Changes
None.

### Testing Steps
1. Visit `/` — verify sidebar + horizontal bar + filter bar all match dark brown, edge-to-edge same color
2. Scroll homepage — verify all section dividers, Best Idea Award, Support Ticket, Stats, CTA band use dark brown (no black)
3. Scroll to footer — verify cards have square edges, social/write-us/google in one strip, mode and currency visible
4. Collapse sidebar — verify collapsed state also dark brown
5. Check other public pages (e.g. `/properties`, `/about`) — verify no black backgrounds remain

