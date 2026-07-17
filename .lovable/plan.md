
## Scope

Three linked changes to the public entry experience and the AI tools catalog.

---

### 1. Landing page (the public entry before login)

**What visitors see on `/` when signed out today:** the hero, plus the top nav with FEATURED · NEW LAUNCH · GUIDES · INVESTORS · DEVELOPERS · BROKERS.

**Changes**
- On the signed-out landing page only, hide the top nav categories. Keep the wordmark, Log in, and Sign up.
- Add a short line under the hero subheadline: *"This is the private entrance to JBJ Global Real Estate — the site itself unlocks after you log in or create an account."* (final wording tunable, no use of the word "gate")
- Authenticated users are unaffected — full nav remains for them and on all inner pages.

### 2. Universal AI-tool subscription lock

Applies to every AI tool **except AI Home Finder**.

Behavior when a non-subscriber opens any locked AI tool:
- The tool page still loads and shows a **read-only demo/preview**: description, screenshots of a sample run, example inputs and a canned example output, "what this tool does" bullets.
- Inputs, buttons, and "Run" are disabled with a lock overlay: *"Subscribe to use this tool"* + Subscribe CTA linking to pricing.
- No AI calls fire. Every AI-tool edge function also re-checks the subscription server-side and returns 402 if missing (client lock is UX only).

Shared implementation:
- New `<AiToolAccessGate toolKey="..." mode="subscription | one-shot-then-subscription">` wrapper used by all AI tool pages.
- `useAiToolAccess(toolKey)` hook returns `{ status: 'preview' | 'trial' | 'unlocked', usesLeft, requireSubscription() }`.
- Server: shared helper `assertAiToolAccess(userId, toolKey)` used by every AI edge function.

### 3. AI Home Finder — free, one-shot

- Any signed-in user can run it **once**. Guests are prompted to sign in first (no subscription required for the first run).
- On the second attempt, the tool locks with the same subscribe prompt as the other tools.
- Usage tracked in a new `ai_tool_free_uses` row (`user_id`, `tool_key='ai_home_finder'`, `used_at`). Server also enforces the 1-use cap; client shows remaining count.

### 4. Sitemap visibility

- Sitemap and `globalSearchIndex` currently list every AI tool regardless of the owner's visibility flag in `ai_tool_visibility`.
- Change `Sitemap.tsx` and the global search index to filter AI tool entries by `ai_tool_visibility.is_public = true` (owner-controlled). Hidden tools disappear from both.
- `public/sitemap.xml` is static — regenerate via existing sitemap generator so hidden tools drop out of the XML too.

---

## Technical notes

- Landing detection: `GlobalHeader` reads `location.pathname === '/'` + `!user` to switch to a slim mode. No new route needed.
- `AiToolAccessGate` reads `useSubscription()` (already present for Stripe). "Active" = `active | trialing | past_due` with a future `current_period_end`.
- Free-use table:
  ```sql
  create table public.ai_tool_free_uses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    tool_key text not null,
    used_at timestamptz not null default now(),
    unique (user_id, tool_key)
  );
  ```
  With GRANTs + RLS (`user_id = auth.uid()` for select/insert; no updates/deletes from client).
- Every AI edge function gets a 3-line header calling `assertAiToolAccess`; returns 402 with `{ error: 'subscription_required' }` on fail. AI Home Finder function calls the one-shot variant.

## Rollout order

1. DB migration (`ai_tool_free_uses`) + shared server helper.
2. Client wrapper `<AiToolAccessGate>` + `useAiToolAccess`.
3. Wrap all AI tool pages (batched edit).
4. Landing page trim + copy line.
5. Sitemap + search-index visibility filter.
6. Playwright: signed-out landing, signed-in non-subscriber on a locked tool (see demo, cannot run), signed-in non-subscriber on Home Finder (run once, second time locked), hidden-in-admin tool absent from `/sitemap`.

## Out of scope

- Pricing page copy changes.
- Stripe product/price edits (existing tiers reused).
- Redesign of individual AI tool pages beyond adding the gate wrapper and demo block.

---

Say **continue** to execute in the rollout order above, or tell me which of the four sections to reorder / drop.
