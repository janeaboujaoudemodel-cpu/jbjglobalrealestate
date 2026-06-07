# Plan

Three workstreams. Each is verified on mobile + desktop with before/after screenshots.

## 1) Mobile header + tour + welcome contrast

**Mobile header missing on reload (`src/components/GlobalHeader.tsx`)**
- `shouldUseMobileHeader = isTouchLayout || !isDesktopWidth` depends on `isTouchLayout` which is computed after mount → first paint can render the *desktop* header inside a phone-width viewport, then unmount on hydration leaving a blank.
- Fix: SSR-safe initial state — read `window.matchMedia('(pointer:coarse)')` and `window.innerWidth` synchronously in the `useState` initializer (already partially done for width — add the same for `isTouchLayout`), and also force a `useLayoutEffect` re-render before paint.
- Guarantee at least one of `MobileHeader` / `DesktopHeader` is rendered for every value of `shouldUseMobileHeader` (no `null` window between states).

**Guided Tour cropped on phone (`src/components/GuidedTour.tsx`)**
- Replace fixed‑width tooltip card with `max-w-[calc(100vw-2rem)]` + `max-h-[calc(100dvh-6rem)] overflow-auto` and clamp the spotlight rect to viewport.
- Stop the tour from horizontally overflowing by anchoring to viewport center on screens < 640px instead of element‑relative.

**Navy buttons missing white text/icons in Tour + Welcome**
- Audit all CTAs inside `GuidedTour`, `MobileMenuWalkthrough`, and `WelcomeRoleGreeter` / welcome card.
- Apply the locked `.jj-cta-dark` primitive (`data-cta="dark"`) instead of raw `bg-[#102540]` so the global contrast guard cannot flip them; add `allow-white` + inline `WebkitTextFillColor:#FFFFFF` on the icon spans (same pattern already proven in `WebDevDock` Send button).
- Add a single global rule in `src/index.css` under the existing PASS‑6 block:
  ```css
  [data-cta="dark"], [data-cta="dark"] * { color:#fff !important; -webkit-text-fill-color:#fff !important; }
  [data-cta="dark"] svg { color:#fff !important; stroke:#fff !important; }
  ```

**Light contrast audit (deep, automated)**
- Run `scripts/contrast/` (already in repo) against `/`, `/welcome`, `/take-the-tour`, mobile menu, list‑property steps, mortgage tool, and AI assistant pages. Capture failing pairs into `contrast-audit.json`.
- Fix only the regressions surfaced by the audit, in this order: navy CTAs → champagne pills → tour spotlight overlay text.

## 2) Hide WebDev dock for non-owners (verify + harden)

The dock at `src/components/owner-webdev/WebDevDock.tsx` is already gated by `isDesktop && !!user && isOwnerEmail(user.email) && authIsOwner && roleIsOwner`. The current leak (user sees it logged out) is almost certainly the `Sparkles` floating button cached by the SW.

- Add an **explicit deny** at the very top of `DeferredAppExtras.tsx`: do NOT mount `WebDevDock` or `WebDevChangeHighlight` unless `isOwnerEmail(user?.email)` is true synchronously. This prevents the lazy chunk from even being requested by anonymous browsers.
- Bump the chunk's import cache key and add `<meta name="x-webdev" content="owner-only">` so we can verify via DOM that the chunk never appears for guests.
- Add an `e2e/webdev-hidden.spec.ts` Playwright check that loads `/` as anonymous and asserts no `[data-owner-webdev-dock]` node and no `/owner-webdev/` network chunk.

## 3) Upgrade WebDev dock to a Lovable‑style mini IDE

Wire the existing dock end‑to‑end so the owner can iterate visually like in Lovable.

Capabilities to add (all on top of existing `owner_change_requests` + `owner_ui_overrides`):

1. **Screenshot markup**
   - After `captureScreenshot`, open an inline canvas with brush + rectangle + arrow + text tools (use `react-konva`, already in lockfile). Markup is flattened into the JPEG before submit.

2. **Versioning**
   - New column `owner_ui_overrides.version` (int, default 1).
   - Each new instruction targeting the same selector inserts a new row instead of mutating. Dock shows a vertical timeline `v1 · v2 · v3` with click‑to‑preview.

3. **Before / After preview**
   - For each `ready` change, the dock renders two thumbnails: the pre‑override screenshot (already stored) and a fresh post‑override screenshot generated client‑side via `html2canvas` against the previewed DOM.

4. **Take me there (already exists) — enhance**
   - When navigating cross‑route, after highlight, scroll the target into view and pulse a 2px gold ring for 1.2s.
   - Add a small "Reviewing v3 of 5" pill above the highlight with `← prev / next →` to step through versions in place.

5. **Save / Don't save / Restore**
   - `Save` → set status `approved` (existing).
   - `Don't save` → soft‑delete (set `status='rejected'`, keep row for 30 days).
   - New `Restore` button on rejected rows; new `Recently rejected` tab in the dock.

6. **Cross‑page change feed**
   - New top‑level tab `Inbox` in the dock listing every `ready` change site‑wide with route, thumbnail, and the same Take‑me‑there / Save / Don't‑save actions, so the owner doesn't have to navigate to find pending edits.

7. **Chat thread per change**
   - Each row gains a comment thread (`owner_change_messages` table) so the owner can iterate with the AI on the same change without spawning new rows. Submitting a follow‑up message reuses the override row and bumps `version`.

## Verification

After each workstream:
- `browser--view_preview` at 390×844 and 1440×900.
- `browser--screenshot` of: home (reload), `/take-the-tour` step 1 and 3, welcome card, list‑property step 2 CTA, mortgage calculator, mobile menu.
- Anonymous incognito visit confirms `WebDevDock` chunk is not requested.
- Post fixes, save before/after pairs to `/mnt/documents/contrast-audit/` and present them.

## Technical notes

- All button/text colour locks go through `.jj-cta-dark` and the universal guards already in `src/index.css` — no raw Tailwind colour classes on CTAs.
- New DB columns and tables ship in one migration with GRANTs:
  ```sql
  alter table public.owner_ui_overrides add column if not exists version int not null default 1;
  create table public.owner_change_messages (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references public.owner_change_requests(id) on delete cascade,
    author text not null,           -- 'owner' | 'ai'
    body text not null,
    created_at timestamptz not null default now()
  );
  grant select, insert, update, delete on public.owner_change_messages to authenticated;
  grant all on public.owner_change_messages to service_role;
  alter table public.owner_change_messages enable row level security;
  create policy "owner manages own change messages" on public.owner_change_messages
    for all to authenticated using (public.has_role(auth.uid(), 'owner')) with check (public.has_role(auth.uid(), 'owner'));
  ```
- Edge function `owner-webdev-propose` extended to accept `parent_request_id` and to write into `owner_change_messages`.
- No new external services; uses existing Lovable AI Gateway + Resend for owner notifications.
