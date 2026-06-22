
# PASS XX-A — Global Emerald Token Unification

Scope: track 1 only (you picked it as priority). News pipeline, routing/wiring audit, sidebar/fullscreen rules, and backend-card restyle are deferred to PASS XX-B/C/D — I will not touch them in this pass.

## Goal

One — and only one — official Emerald gradient system, applied through shared primitives. Zero stray `bg-green-*`, `bg-emerald-*`, `from-green-*`, dark/black/faded greens. Zero unintentional opacity-50/60/70 on enabled UI.

## Root cause (from audit)

- 636 files use raw `bg-green-* / bg-emerald-* / text-emerald-* / border-emerald-*` Tailwind utilities directly — every one of them is its own shade of green.
- Two emerald gradient tokens already exist in `index.css` (`--jj-emerald-ombre`, `--jj-emerald-light-ombre`) plus primitives `.jj-pill-emerald`, `.jj-pill-emerald-metallic`, `.jj-cta-emerald`, but they are not enforced — components keep inlining their own greens.
- "Faded" look comes from `opacity-50/60/70` and `text-muted-foreground/60` applied to enabled cards (Pending Tasks, stats, empty states).

## Approach — three locked layers

### 1. Single source of truth (tokens)

In `src/index.css` (token block only, no new PASS overrides):

```
--emerald-1: #064E3B   /* primary */
--emerald-2: #047857   /* hover/light */
--emerald-3: #022C22   /* deep */
--emerald-ink: #064E3B
--emerald-on: #FFFFFF  /* foreground on any emerald surface */
--gradient-emerald: linear-gradient(135deg,#047857 0%,#064E3B 55%,#022C22 100%)
--gradient-emerald-hover: linear-gradient(135deg,#0A6B53 0%,#064E3B 52%,#031B12 100%)
```

All existing emerald variables alias to these. Delete duplicate `--ai-emerald: 262 50% 55%` (that's purple, mislabeled).

### 2. Shared primitives (the ONLY way to render emerald)

Create / consolidate in `src/components/ui/`:

- `<EmeraldBadge variant="solid|soft|outline" size="sm|md">` — replaces every `bg-green-*` / `bg-emerald-*` badge. White text + white svg locked.
- `<EmeraldPill>` — for "Starter", "Broker Workspace", "Live Roles", "21 Open", AI chips, online indicator, notification dot, chatbot badge.
- `<EmeraldButton>` — wraps shadcn Button with metallic emerald variant for "Apply", "Meet Jessica", all primary CTAs.
- `<EmeraldDot>` — single online/active dot (replaces ad-hoc `bg-green-500` indicators).

All four use `--gradient-emerald` + `--emerald-on` and inherit the Universal Contrast Guard. Each carries `data-ink-emerald` so the global guard keeps text/icons white at hover.

### 3. Codemod sweep (kill stray greens)

A Node script (`scripts/emerald-codemod.ts`, run once via `bun`) that walks `src/**/*.{ts,tsx}` and:

- Replaces well-known patterns:
  - `bg-green-500 text-white` / `bg-emerald-600 ...` on a `<Badge>` → `<EmeraldBadge>`
  - `bg-green-500` on a span dot → `<EmeraldDot>`
  - `from-green-* to-emerald-*` gradient buttons → `<EmeraldButton>`
- For ambiguous matches, replaces the raw class with `data-emerald-needs-review` + console-logs the file/line so I can hand-review the remainder (target: <20 manual touch-ups).

Files I already know need hand edits: `pages/News.tsx`, `pages/Onboarding.tsx`, `OwnerDashboardOverview.tsx`, `OwnerTemplates.tsx`, `ListingAdmin.tsx`, `LandlordRentalPortal.tsx`, `AdvancedBrokerToolkit.tsx`, `crm/ApplicantStatusPill.tsx`, `crm/StatusPillSelect.tsx`, `HandoverPill.tsx`.

### 4. De-fade pass

Audit script flags `opacity-50|60|70` and `/(50|60|70)"` on `<Card>`, `<Badge>`, stat tiles, empty states under `pages/owner` + `components/owner`. Remove unless the element has `disabled` / `aria-disabled="true"`. Pending Tasks popup specifically: remove blanket `opacity-60` wrapper.

### 5. Tailwind guard (prevent regression)

Add ESLint rule via `eslint-plugin-tailwindcss` `no-custom-classname` override forbidding `^(bg|text|from|to|via|border)-(green|emerald)-\d+$` outside `src/components/ui/emerald/*`. Lint warning, not error, so existing CI keeps passing while remaining offenders are visible.

## Files touched (estimate)

- New: `src/components/ui/emerald/{EmeraldBadge,EmeraldPill,EmeraldButton,EmeraldDot,index}.tsx`, `scripts/emerald-codemod.ts`, `.eslintrc` rule
- Edit: `src/index.css` (token block + delete `--ai-emerald` purple)
- Codemod-edit: ~120-180 files (subset of the 636; many are constants/utilities that don't render UI and get skipped)
- Hand-edit: ~10 files listed above

No files deleted. No routing, no data, no edge functions touched.

## Verification (you picked: walk every sidebar route, all 4 portals)

After implementation, Playwright (headless, viewport 1280×1800) script that:

1. Restores Supabase session from sandbox env, navigates to each portal entry:
   - Owner: `/owner` + every item in `GlobalVerticalNav` owner section
   - Broker: `/broker` + each broker sidebar route
   - Developer: `/developer-portal` + each route
   - Investor: `/investor` + each route
2. For every route: screenshot to `/tmp/browser/passXX/{portal}/{slug}.png`, then run an in-page assertion:
   ```js
   document.querySelectorAll('[class*="bg-green-"],[class*="bg-emerald-"]:not([data-emerald-ok])').length === 0
   ```
3. Failures are listed by route + selector. I iterate until the list is empty.
4. I'll report back with the screenshot grid and the assertion summary — not before.

## Out of scope (next passes, on your call)

- B: News engine filter to Dubai RE topics + repaint News page
- C: Routing/wiring/404 audit + sidebar↔header sync + portal page parity
- D: Sidebar-always-visible / fullscreen-on-click + backend card restyle (Starter/Workspace/Activity/empty states)

Approve and I'll execute A end-to-end, including the full portal walkthrough, before reporting.
