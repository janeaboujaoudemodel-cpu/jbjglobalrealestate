

## Deploy Edge Functions + Upgrade Property Measurement UI + Harden All AI Tools

### Scope
The user wants:
1. Deploy `property-evaluation` and `property-measurement` edge functions (they already exist and are deployed — just need redeployment to pick up any changes)
2. Upgrade Property Measurement UI cards to match the teal/emerald theme (remove gold/yellow borders from `Card` component usage)
3. Ensure all AI tools are wired to backend with user auth
4. Tighten RLS
5. Upgrade AI model to faster one
6. Make responsive/device-compatible

### Current State Analysis
- **Edge Functions**: Both `property-evaluation` and `property-measurement` exist with full implementations (auth, rate limiting, IP blocklist, Lovable AI integration). Both are in `config.toml` with `verify_jwt = false` (validated in code instead). They are already deployed.
- **Property Measurement UI**: Uses `Card` from `@/components/ui/card.tsx` which has `border-2 border-gold` globally — this is causing yellow borders on every card, including inside Property Measurement where the theme is teal/emerald.
- **Property Evaluator**: Already uses blue theme with custom card classes (`blueCardPrimary`, `blueCardSecondary`) that override borders.
- **AI Models**: Property Measurement uses `google/gemini-2.5-flash`; Property Evaluation uses `google/gemini-2.5-pro`. Default should be `google/gemini-3-flash-preview` per standards.
- **Auth**: Both edge functions already enforce JWT auth. Property Measurement page uses `useAuth()`.

### Changes

**1. `src/pages/PropertyMeasurement.tsx`** — Override gold card borders with teal theme
- Replace all `Card` usages with explicit teal-themed border overrides: `border-teal-500/30` instead of inheriting the global gold border
- Cards at steps 1-5 need `className="bg-zinc-900/50 border border-teal-500/30"` (some already have `border-zinc-800` but the global Card still adds `border-2 border-gold`)
- Add explicit `!border-teal-500/30` overrides or use raw `div` with card styling to avoid the global gold border entirely
- Ensure result cards, room cards, and upload cards all use teal borders consistently
- Make all step cards responsive with proper mobile padding

**2. `supabase/functions/property-measurement/index.ts`** — Upgrade AI model
- Change model from `google/gemini-2.5-flash` to `google/gemini-3-flash-preview` (faster, better quality per standards)
- Redeploy function

**3. `supabase/functions/property-evaluation/index.ts`** — Upgrade AI model
- Change model from `google/gemini-2.5-pro` to `google/gemini-3-flash-preview` (faster responses, aligned with standard)
- Redeploy function

**4. `src/pages/PropertyEvaluator.tsx`** — Minor hardening
- Confirm auth check is present (it calls `supabase.functions.invoke` which auto-sends JWT)
- No major changes needed — blue theme cards are already properly styled

**5. Global card border fix** — The root issue is `src/components/ui/card.tsx` uses `border-2 border-gold` globally. For tools with their own color themes, this gold border bleeds through. Rather than changing the global Card (which is locked per the comment), each themed page needs explicit border overrides.

### Result
- Both edge functions redeployed with faster AI model
- Property Measurement cards show clean teal borders (no gold)
- Property Evaluator stays on its blue theme
- Auth enforced on both tools
- Responsive design maintained

