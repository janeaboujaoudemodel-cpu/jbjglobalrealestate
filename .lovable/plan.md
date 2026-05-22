## Goal

Every first-time visitor sees a non-dismissable picker with exactly three categories — **Investor**, **Broker**, **Developer** — and the rest of the site re-skins itself to that single choice. The legacy combined "Investor + Broker" mode is removed everywhere.

## Recommendation on timing

Show the picker **immediately on first visit, before login**. The choice is saved to `localStorage` so the homepage / nav re-skins right away, and it is auto-synced to the account on the user's next login (existing `register-mode-lead` edge function already handles this). This gives the strongest personalization signal without a login wall, and matches your request ("when user opens, immediately ask").

This supersedes the current `mem://features/auth/login-first-mode-and-crm-categorization` rule, which I'll update.

---

## 1. Forced 3-category picker on first visit

Rework `src/components/ModeSelectionModal.tsx`:

- Open automatically when `localStorage.jj_mode_selected !== 'true'` — for both anonymous and logged-in users.
- Non-dismissable: no X button, no outside-click close, no Esc, no backdrop dismissal.
- Exactly three cards: **Investor**, **Broker**, **Developer**. Remove the "Visitor / Partnership" option.
- Persist locally on selection (`jj_user_mode` + `jj_mode_selected=true`); if logged in, also upsert `user_preferences.selected_mode` and call `register-mode-lead` edge function (already exists).
- A subtle "You can change this anytime from your profile menu" line, but no skip link.

Wire it through `PopupCoordinatorContext` so it overrides other popups on first paint.

## 2. Remove the combined `investor_broker` mode site-wide

Drop the 4th mode from the type union and every consumer:

- `src/contexts/UserModeContext.tsx` and `src/hooks/useUserMode.ts`: `UserMode = 'investor' | 'broker' | 'developer'`. Delete `isCombinedMode`. `normalizeMode` collapses any legacy `investor_broker` to `broker` (broker is the more privileged surface).
- `src/components/ModeSwitcher.tsx`, `src/pages/ModeHub.tsx`, `src/pages/MyDashboard*.tsx`, `src/components/dashboard/ProfileSummaryCard.tsx`, `src/components/dashboard/BadgesLevelCard.tsx`, `src/components/profile/GoldenIDCard.tsx`, `src/components/navigation/UserAvatarMenu.tsx`, `src/components/header/MegaMenuAccount.tsx`, `src/components/home/CategorySelectorSection.tsx`, `src/components/tier/TierProgressCard.tsx`, `src/hooks/useTierProgress.ts`, `src/pages/Auth.tsx`, `src/pages/Index.tsx`, `src/components/__tests__/ModeSwitcher.colors.test.tsx`: remove combined-mode branches; everywhere it appeared as a UI option, drop it.
- One-shot DB normalization migration: `UPDATE user_preferences SET selected_mode='broker' WHERE selected_mode='investor_broker'`.

## 3. Mode-aware global navigation

Make navigation react to the single selected mode:

- **Investor mode**: nav shows Properties, Market Intelligence, Investor Dashboard, Guides. Hide broker-only and developer-only links.
- **Broker mode**: nav shows Broker Toolkit / Broker CRM / Broker Education / **Careers**. Hide developer portal entry.
- **Developer mode**: nav shows Developer Hub / Developer Reports / **Careers — Developer Representative**. Hide broker tools.

Touchpoints: the global header (`src/components/header/*`, `MegaMenuAccount.tsx`), `OwnerSidebarNav` stays admin-only and untouched. Homepage hero CTAs in `src/pages/Index.tsx` swap target route based on `mode`.

## 4. Careers — Developer Representative

- New page `src/pages/CareersDeveloperRep.tsx` (mirrors the existing broker careers page styling — champagne, ink, gold hairline) describing the developer-rep role + apply CTA pointing to the existing lead form.
- Route `/careers/developer-representative` registered in `src/routes/PublicRoutes.tsx`.
- Header link added when `isDeveloperMode === true`; also surfaced as a card on the developer-hub overview.

## 5. Memory / standards updates

- Update `mem://architecture/auth/forced-category-selection-standard` → now applies to anonymous users too, three options only.
- Update `mem://features/auth/login-first-mode-and-crm-categorization` → mode pick happens pre-login; CRM lead created on first login sync.
- Add a one-liner to Core index: "Mode = investor | broker | developer (no combined mode). Picker is forced on first visit."

## Out of scope

- Owner / admin role surfaces (separate `useUserRole`), CRM internals, and the `/owner/users` analytics hub built last turn — all untouched.
- Visual redesign of the picker — keeps current champagne+gold styling.
- Re-skin of every deep page; this plan covers nav + homepage + dashboard entrypoints. Page-level mode gating beyond that can follow in a second pass.

## Technical details

- DB migration: single `UPDATE` on `user_preferences`. No schema change (column stays `text`).
- Type change `UserMode` is breaking — TS compile will surface every remaining reference; sweep with `rg "investor_broker|isCombinedMode"`.
- `PopupCoordinatorContext` priority: mode-selection-modal must outrank cookie banner and any marketing popups on first paint.
- E2E sanity: (a) fresh incognito → picker appears, can't dismiss, selecting Broker re-skins nav; (b) login after selection → `user_preferences` upserted and `crm_leads` row created via `register-mode-lead`; (c) existing `investor_broker` user logs in → silently migrated to `broker`.
