# Hero Search Bar + AI Concierge Redesign

Scope: hero only (`src/components/home/HomeHeroSearch.tsx` + Book CTA in `src/pages/Index.tsx`). New edge function for the AI Concierge. No other components touched.

---

## 1. Premium glass search bar (`HomeHeroSearch.tsx`)

Replace the current bar with a single crystal-mirror glass shell — no gold-filled button, no visual divider mid-bar.

Structure (one continuous pill):
```
[ 🔍  input……………………………………  | Search → ]  [ ✨ Ask our AI Concierge ]
```
- Outer shell: same glass tone as the Book CTA (`rgba(253,251,247,0.10)`, blur 18px saturate 160%), `border-[#D4B896]/55` 1px hairline only, inner highlight `inset 0 1px 0 rgba(255,255,255,0.22)`. No solid gold fills anywhere.
- Search button: still inside the same shell on the right, but rendered as **transparent glass** (`bg-white/8 hover:bg-white/14`, ink-on-cream only on hover via `#EFE6D6` + `border-[#B89555]`), text `#FDFBF7`. Removes the current yellow block + yellow border. No vertical divider line between input and the Search button — they share the same surface; affordance comes from hover state alone.
- Mobile: collapses to icon-only submit, same glass treatment.

### Inline results (not the header modal)
The user explicitly does not want the same modal opening that the header icon opens. Two changes:
- Remove `onFocus={launch}` so just clicking/typing no longer launches the full overlay.
- Submit + chip clicks open results in an **anchored dropdown panel directly under the bar** (same glass, full hero width, max-h 70vh, scrollable). The panel reuses the existing `useGlobalSearch` hook/data layer that powers `GlobalSearchModal` (results, role-aware shortcuts, nearest-match, Contact JBJ fallback) — only the chrome is new. Pressing Esc or clicking outside closes it.
- Header search icon continues to open the existing fullscreen `GlobalSearchModal` unchanged.

---

## 2. Ask our AI Concierge (new)

Second action sitting flush against the Search button inside the same shell, separated only by a subtle 1px champagne hairline (`bg-[#D4B896]/30`) — not a hard divider, just a seam.

Button copy: `✨ Ask our AI Concierge`. Same crystal-glass treatment, sparkle icon in `#E2C9A0`.

Click opens a **Concierge drawer** (`src/components/home/AIConcierge.tsx`, new) — right-side sheet on desktop, bottom sheet on mobile, glass-on-dark to match hero. Streaming chat UI:

- New edge function `supabase/functions/ai-concierge/index.ts` that calls Lovable AI Gateway (`google/gemini-3-flash-preview`, streaming SSE) with a system prompt encoding:
  - Full platform map (routes, portals, key features, role-based shortcuts pulled from a const).
  - Tone: concise, helpful, step-by-step with shortcuts.
  - Fallback rule: if it cannot confidently answer or the user expresses frustration / explicit human request, respond with a short apology and a single CTA link to `/contact` (or open the existing `ContactJBJ` panel / support ticket route).
- Handles 429/402 → toast "Concierge is busy, please try again" / "Concierge credits exhausted".
- No history persistence in v1 (session-only state). LOVABLE_API_KEY auto-provisioned.

---

## 3. Pills under the search bar

Current hover state breaks (background flash, border jump). Replace with a classic stylish look:
- Base: `bg-white/6 border border-[#D4B896]/35 text-[#FDFBF7]/85`.
- Hover: `bg-white/12 border-[#E2C9A0]/70 text-[#FDFBF7]` with a soft 0→100% champagne underline (1px) via `::after`, 200ms ease. No background pop, no scale.
- Spacing tightened to `gap-2`, padding `px-3.5 py-1.5`, font 12px medium, uppercase tracking removed on the chips themselves (the "Try" label keeps its tracking).
- Add one new chip: `Ask the Concierge` that opens the drawer instead of running a search.

---

## 4. Book a Free Consultation — smaller + reorganized

In `src/pages/Index.tsx` (lines ~292–343):
- Reduce size: `h-10 sm:h-11`, `px-5 sm:px-6`, text `text-[13px]`, icon `h-3.5 w-3.5`. Keep the existing glass→cream hover treatment (already approved last turn) but at the new scale.
- Reorganize vertical rhythm so the hero reads: headline → search bar → pills → small Book CTA. Tighten the wrapper from `pt-2` to `pt-1`, and reduce the parent `space-y-3 sm:space-y-4 md:space-y-5` to `space-y-3 sm:space-y-3 md:space-y-4` so the CTA reads as a secondary affordance under the search, not a co-equal hero button.

---

## Technical notes

- New files: `src/components/home/AIConcierge.tsx`, `supabase/functions/ai-concierge/index.ts`, `supabase/config.toml` block for the function (`verify_jwt = false`).
- Reuse: `useGlobalSearch` (or refactor the data layer out of `GlobalSearchModal` into a hook if not already separated) so the inline dropdown and the header modal share one source of truth.
- Memory update after build: `mem://features/home/hero-and-portal-cta-standard` — note the bar now has dual actions (Search + AI Concierge), inline dropdown (not header modal), crystal-glass only (no gold-filled buttons), and the smaller Book CTA scale.
- No changes to: header, sidebar, footer, CategorySelector, FeaturedListings, anywhere outside the hero block.
