

# Sell With Us Page Premium Redesign + Property Evaluator Upgrade

## Scope

Two major workstreams: (A) Transform the `/sell` page into a premium, full-service selling hub with integrated portal, AI valuation, and listing submission — all without leaving the page. (B) Upgrade the Property Evaluator's color lock, hover states, and edge function to use AI with trusted government sources.

---

## Part A: Sell With Us Page — Premium Redesign

### Current State
- Basic black page with gold accents, static text cards, no integrations
- CTAs link away to `/sell/valuation` and WhatsApp — user leaves the page
- No AI, no portal, no listing submission, no valuation inline

### New Design

**A1. Hero Section — Cinematic Full-Bleed**
- Full-viewport hero with premium background image (Dubai skyline)
- Gradient overlay: `from-black/80 via-black/60 to-transparent`
- Animated headline with `bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-white`
- Two CTAs: "Get Instant AI Valuation" (scrolls to inline evaluator) and "List Your Property" (scrolls to inline listing form)
- Trust badges row: DLD Licensed, 2,700+ Properties, RERA Certified

**A2. How It Works — Premium Timeline**
- Vertical timeline with numbered steps (the existing 6 steps)
- Each step card: glass-morphism (`backdrop-blur-xl bg-white/5 border border-white/10`)
- Step numbers in gradient circles
- No gold hover borders — use `hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`

**A3. Integrated AI Property Valuation Section**
- Embed a streamlined version of the Property Evaluator form directly in the page
- Collapsed by default, expands on CTA click with smooth animation
- Uses the existing `property-evaluation` edge function
- Shows results inline (estimated value, confidence, market insights)
- "Want a detailed report?" CTA opens full `/property-evaluator` page

**A4. Integrated Listing Submission**
- Embed a compact version of listing submission (property type, location, contact)
- Quick 3-field form: Property Type, Community, Phone Number
- On submit: captures lead via `capture-lead` edge function and shows confirmation
- "Full listing with photos" link goes to `/listing-portal/submit`

**A5. Who We Support Cards — Premium Glass**
- 3 cards with glass-morphism, subtle gradient borders
- Icons instead of plain text headers
- Hover: `scale-[1.02] shadow-2xl` — no gold borders

**A6. Document Checklist — Interactive**
- Animated checklist with checkmark icons
- Each item has a subtle info tooltip

**A7. CTA Block — Split Design**
- Left: "Speak to a Selling Advisor" with WhatsApp integration
- Right: "Get Started Now" scroll-to-top to the valuation section
- Premium dark gradient background

### Color Palette for Sell Page
- Primary: White text on deep black/zinc-950
- Accent: Clean white borders and subtle white glows (no gold)
- CTAs: `bg-white text-black` for primary, `border-white/30 text-white` for secondary
- Cards: Glass-morphism with `bg-white/5 backdrop-blur-xl`

---

## Part B: Property Evaluator — Color Lock & Hover Fix

### B1. Color Lock (CRITICAL — never change)
- Keep the existing blue theme: `from-blue-400 to-cyan-400`, `bg-blue-500`, `border-blue-500/30`
- The hero gradient stays: `from-blue-950/80 via-black/70 to-black`
- All tab triggers stay: `data-[state=active]:bg-blue-500`

### B2. Card Hover Fix — Match Blue Theme
- Current problem: Step 1 "Property Information" card shows gold border on hover
- Fix: Replace `hover:border-gold` with `hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]`
- Apply 3D depth effect: `hover:scale-[1.01] transition-all duration-300`
- All cards in the evaluator get consistent blue hover: `hover:border-blue-500/50`

### B3. Edge Function Upgrade — Trusted Sources Only
- Upgrade the AI prompt in `property-evaluation/index.ts` to explicitly instruct the model:
  - Use ONLY government and institutional sources: DLD (Dubai Land Department), RERA, Dubai REST API, Property Monitor, Knight Frank UAE, JLL Middle East, CBRE, Savills
  - Reference real transaction data from DLD public records
  - Include Dubai Rental Index (RERA) for rental yield calculations
  - Cite Abu Dhabi DoM (Department of Municipalities) for Abu Dhabi properties
  - Never use data from newly established or unverified real estate companies
- Upgrade model from `gemini-2.5-flash` to `google/gemini-2.5-pro` for higher accuracy
- Expand the `communityPrices` map to include Abu Dhabi communities (Al Reem Island, Saadiyat, Yas Island, Al Raha Beach, etc.) and all 7 Emirates
- Add more granular comparable transaction generation with realistic DLD-style data
- Add source citations in the response: "Sources: DLD Transaction Data, RERA Rental Index, Property Monitor Q1 2026"

### B4. Response Structure Fix
- The edge function returns `estimatedValue` as an object `{low, mid, high, pricePerSqFt}` but the frontend tries to use `evaluation.estimatedValue.toLocaleString()` as if it's a number
- Fix the frontend to properly consume the response: show low-mid-high range
- Display: "AED 1,800,000 — AED 2,200,000" with mid value highlighted

---

## Implementation Order

1. **B2** — Property Evaluator hover fix (quick, high visibility)
2. **A1-A7** — Sell With Us page full redesign
3. **B3** — Edge function upgrade with trusted sources
4. **B4** — Response structure alignment

---

## Technical Notes

- The existing `property-evaluation` edge function is fully deployed with rate limiting, IP blocking, and auth — no structural changes needed
- The Sell page will import and reuse existing components: `supabase.functions.invoke('property-evaluation')` and `supabase.functions.invoke('capture-lead')`
- No database migrations needed — all changes are frontend UI + edge function prompt upgrades
- Property Evaluator blue theme colors are LOCKED and must never be changed in future iterations

