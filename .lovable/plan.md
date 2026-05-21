## Goal
Bring the homepage hero in line with the four reference photos you sent. Keep the current sidebar + top-utility bar layout (it already matches the photo), keep the auto-rotating "I'm a… Investor / Broker / Developer" pills, and fix only what differs.

## Changes

### 1. Hero copy (matches photo)
In `src/pages/Index.tsx`:
- Replace the single `<h1>` "Your Trusted Gateway to Dubai's Real Estate Ecosystem" with the two-line layout from the photo:
  - Small uppercase eyebrow above the headline: `DUBAI'S TRUSTED REAL ESTATE ECOSYSTEM` — tracked-out, white/85, drop-shadow for legibility.
  - Main `<h1>`: `Your Gateway to Dubai's Finest Real Estate` (two lines, same bold serif-free Inter weight, same text-shadow stack we already use).
- Keep the existing motion variants, sizing clamp, and balance/hyphen rules so it stays premium across breakpoints.

### 2. Header / top bar parity
The reference photo's header is the current sidebar + 88px top utility strip (Tasks, bell, mail, compass, headphones, AED, sq ft / sq m, profile). That already exists — no structural change. Only verify:
- The hero pulls up flush under the 88px header (already handled via `pt-[max(12vh,88px)]`).
- No extra chrome (no second nav row) renders between the utility bar and the hero on this route.

### 3. Everything else stays
- Auto-rotating spotlight on Investor / Broker / Developer pills — keep.
- Quick-action pill row (Browse Properties, AI Home Finder, Sell Your Property, Explore AI Tools, Market Intelligence, News, + the 2 extras) — keep.
- Three-pillar dark card (For Investors / For Brokers / For Developers) — keep.
- "Book a Free Consultation" CTA — keep.
- Partners marquee, Get Verified strip, Explore Our Services panel below — untouched.

## Files touched
- `src/pages/Index.tsx` — eyebrow + headline only inside the hero block (≈ lines 240–256).

## Out of scope
No backend, no routing, no other section restyle in this pass. If you want me to also retouch the Explore Our Services tabs or the Get Verified strip from photos 3 & 4, say the word and I'll do that as a follow-up.
