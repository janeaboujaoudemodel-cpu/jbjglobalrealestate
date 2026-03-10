

# Registration Prompt + Global Champagne Color Palette Upgrade

## Part 1: Registration/Mode Prompt for Visitors

The current `ModeSelectionModal` only asks logged-in users to pick Investor/Broker mode. The user wants **all visitors** (including non-logged-in) to be prompted to register as either **Investor** or **Broker** (with a third option: "Visitor looking for partnership").

**Changes:**
- **Update `ModeSelectionModal.tsx`** to show for ALL visitors (not just logged-in users who haven't selected):
  - If not logged in: show 3 options (Investor, Broker, Visitor/Partnership) with a "Register Now" CTA that redirects to `/auth` with the selected mode as a query param
  - If logged in but no mode: current behavior (select mode directly)
  - Always present Investor and Broker as the two primary gold-themed options, with "Visitor / Partnership" as a secondary option
- **Restyle the modal** to use the champagne palette:
  - Background: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` (already done)
  - Option cards: `bg-white/80 border border-gold/30` (matching "Stay in the Loop" card)
  - Selected state: gold border + gold background tint
  - Remove the emerald/blue/purple colors — use **gold-only** theming for all options

## Part 2: Global Color Palette Upgrade

The user wants **all white/pearl background sections** replaced with the champagne gradient, and **inner cards** to match the "Stay in the Loop" style (`bg-white/80 border border-gold/30 rounded-2xl shadow-sm backdrop-blur-sm`).

The existing 3-layer system in `index.css` already defines this:
- **Layer 1 (Page)**: `bg-black` — keep as-is
- **Layer 2 (Section)**: `jj-layer-2` = champagne gradient `#F5EBD7 → #E8DCC8 → #D4C4A8` — already applied on most pages
- **Layer 3 (Cards)**: `jj-card-inner` = `#FDFBF7 → #F5F0E6 → #EDE4D3` with gold border — already defined

The issue is some pages/components still use **raw `bg-white`** for sections or cards instead of the design system classes.

**Files to update (sections using `bg-white` as main background):**

1. **`src/pages/LandlordRentalPortal.tsx`** — `bg-white` section → champagne gradient
2. **`src/pages/Auth.tsx`** — loading state `bg-white` → champagne gradient
3. **`src/components/WhyDubaiSection.tsx`** — dark theme with `bg-zinc-900/50` cards → convert to champagne layer system (champagne background, `bg-white/80 border-gold/30` cards)
4. **`src/components/home/WhyChooseUs.tsx`** — `bg-black` with dark cards → champagne layer
5. **`src/components/home/TestimonialsSection.tsx`** — `bg-black` → champagne layer
6. **`src/components/home/StartingPointSection.tsx`** — `bg-black` → champagne layer
7. **`src/components/home/AreasWeCover.tsx`** — `bg-black` → champagne layer
8. **`src/components/home/WhyDubaiCapitalSection.tsx`** — `bg-black` (video section — may need to keep dark for cinematic effect; will use champagne overlay for stat cards)
9. **`src/components/StatsCounter.tsx`** — already uses `jj-layer-2`, but inner cards may need `bg-white/80 border-gold/30`
10. **`src/pages/TicketSurvey.tsx`** — `bg-white` cards → `bg-white/80 border border-gold/30`
11. **`src/components/ConsultationRequestForm.tsx`** — form inputs `bg-white` → keep for form usability but add champagne backdrop

**Pattern for conversion:**
- Section wrapper: stays `bg-black` but uses `jj-layer-2` child (already the pattern)
- For standalone pages without `bg-black` parent: use `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`
- Inner cards: `bg-white/80 backdrop-blur-sm border border-gold/30 rounded-2xl shadow-sm`
- Form inputs: keep `bg-white` for usability (readable)

**Note:** The homepage `Index.tsx` hero and AI Home Finder sections with dark/cinematic themes will retain their dark styling — only the content sections and cards get upgraded.

## Files to Edit

1. **`src/components/ModeSelectionModal.tsx`** — Redesign with registration CTA for visitors, gold-only theme, 3 options (Investor, Broker, Partnership Visitor)
2. **`src/pages/LandlordRentalPortal.tsx`** — `bg-white` → champagne
3. **`src/pages/Auth.tsx`** — loading `bg-white` → champagne
4. **`src/components/WhyDubaiSection.tsx`** — dark cards → champagne cards with `bg-white/80 border-gold/30`
5. **`src/components/home/WhyChooseUs.tsx`** — inner cards → champagne style
6. **`src/components/home/TestimonialsSection.tsx`** — cards → champagne style
7. **`src/components/home/StartingPointSection.tsx`** — tab content cards → champagne
8. **`src/components/home/AreasWeCover.tsx`** — area cards → champagne
9. **`src/pages/TicketSurvey.tsx`** — `bg-white` cards → `bg-white/80 border-gold/30`

