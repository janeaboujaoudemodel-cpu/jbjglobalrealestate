# JBJ Global Real Estate — CLAUDE.md

Project memory for Claude Code when working in this repo. Drop this file at the repo root (`jbjglobalrealestate/CLAUDE.md`) so every local session starts with this context instead of re-discovering it.

## What this is

A full broker/client real estate platform, not just a CRM: listings, CRM, broker commission agreements + e-signature, a loyalty/points system, broker education/certification, external listing feed sync (Reelly, Provident), document/e-signature tooling, and AI features (chat support, ROI calculator, voice agent). Live at jbj.ae. Large codebase: ~1,149 DB migrations, ~507 Supabase edge functions, ~512 pages, ~1,350 components as of Aug 2026 (the repo's own README undercounts these — trust `find`/`ls`, not the docs).

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui, React Router, TanStack Query.
- Backend: Supabase — Postgres with Row Level Security (deny-by-default policies), Deno edge functions in `supabase/functions/`.
- Mobile: Capacitor config exists (`capacitor.config.ts`) but check whether a mobile app is actually planned/submitted before treating its settings as production-relevant — as of Aug 2026 it pointed at a dev preview URL.

## How you're actually running Claude Code

If you're using Claude Code on the web (claude.ai/code) — a cloud session, not a local terminal install — GitHub push access is handled for you automatically through Anthropic's GitHub proxy: your real GitHub credentials never enter the session. Once GitHub is connected (via the GitHub App during onboarding, or `/web-setup` from a terminal), a cloud session can commit and push directly to a branch of this repo — no patch files, no manual `git apply`, no pasting tokens anywhere. `git push` only works against the session's current working branch (a safety limit, not a bug), so open a PR from that branch the normal way once you're happy with it.

Cloud environment settings that matter for this repo specifically:

- Network access: Trusted is correct and sufficient — it already covers `registry.npmjs.org`, `github.com`, and `sentry.io` (relevant once the Sentry integration ships). No need for Custom/Full.
- Environment variables: leave empty. There's no secrets store here (anything typed in that box is visible to anyone using the environment), and this repo doesn't need any for the dev/build/test loop — real secrets (Supabase keys, `VITE_SENTRY_DSN`) belong in Lovable's own env config, not here.
- Setup script: use `npm install || true`, not `bun install`. Node.js and npm come pre-installed in cloud sessions; Bun is also pre-installed but has documented proxy-compatibility issues fetching packages in this environment. Given this repo's own package-manager drift (see below), npm is the safe choice for cloud sessions regardless of what you use locally.

## The dev/hosting split — read this before pushing anything

Lovable owns the database, edge functions runtime, hosting, and the live domain. Claude Code only writes code. This is deliberate, not a limitation to work around:

1. Push code changes to `main` (the branch Lovable syncs — it only syncs one branch at a time; confirm in Lovable's GitHub settings if unsure).
2. Lovable's GitHub two-way sync automatically pulls the push into the Lovable project editor.
3. Publishing to jbj.ae is a separate, manual step in Lovable — Publish → Publish changes. Nothing goes live just because it synced. Don't assume a merged PR is live; ask or check Lovable directly.
4. Database schema changes, RLS policies, and edge function secrets are managed through Supabase/Lovable, not through anything in this repo's `.env` — see `.env.example` for which secrets are edge-function-only (`supabase secrets set KEY=value`) vs. frontend (`VITE_*`).

Claude Code cannot hold or use this project's GitHub credentials — a human performs the actual `git push`.

## Package manager — pick one, don't add a third

`lovable.toml` uses `bun`, `.replit` uses `npm`, and the repo still has `bun.lock`, `bun.lockb`, AND `package-lock.json` all committed simultaneously — that three-way coexistence itself is still unresolved drift (CTO audit, Aug 2026), not something to "fix" by picking a third tool. The functional breakage this caused is fixed, though: `package-lock.json` had 21 entries pinned to Lovable's private npm mirror, which made `npm install`/`npm ci` fail outside Lovable's own sandbox (including on a GitHub Actions runner). That was corrected in PR #1 (merged) — a clean install straight from the committed lockfile is now confirmed working outside Lovable. If your local environment already has one lockfile working, stick with it and don't introduce another in the same PR as an unrelated change.

## Testing

`npm test` runs the Vitest suite (added Aug 2026 — it didn't exist before, despite ~33 test files already being present). Existing coverage is almost entirely visual/contrast regression tests (`check:contrast:*`, `src/test/*.regression.test.ts`); business-logic coverage started with `src/lib/payment-plan/buildSchedule.test.ts` and `src/lib/crm/brokerageRevenue.test.ts` — follow that pattern for new business logic: colocate `*.test.ts` next to the source file, and actually execute assertions against the real function rather than hand-calculating expected values.

`.github/workflows/unit-tests.yml` runs the suite on every PR touching `src/**`. Separately, `.github/workflows/pass-142-heading-contrast.yml` and 5 other contrast/a11y workflows are path-filtered to specific files — don't assume a green PR means the whole suite ran; check which workflows actually triggered.

Before any visual/CSS change, run `npm run check:contrast:pr-gate` and `npm run check:a11y` locally — these are the same checks CI runs, and they're cheap to run before pushing.

## The CSS file

`src/index.css` is ~32,700 lines and growing — this is the direct, traceable cause of most of the contrast/color regressions that show up repeatedly. Do not add new rules here if a component-scoped alternative exists. `docs/contrast-system.md` documents the canonical surface tones (Page/Champagne/Gold/Ink) and the WCAG AA contract (4.5:1 general text, 3:1 exception for large gold text) — read it before touching contrast-sensitive styles. A pilot to extract the CRM section into its own file is scoped but not yet started.

## Security patterns already in place — follow them, don't reinvent

- New public-facing edge functions: call `enforceRateLimit` from `supabase/functions/_shared/rate-limit-middleware.ts` (DB-backed, windowed, per-IP-hashed). See `advisory-desk-request/index.ts` for the reference pattern.
- Owner-only edge functions: use `requireOwnerAuth` from `_shared/owner-auth-middleware.ts`.
- RLS: this repo has been through several hardening passes (`SECURITY_PHASE3_P0_CHANGELOG.md` through `PHASE6`) — deny-by-default, `service_role`-only where appropriate, `WITH CHECK` constraints. Read the existing policy on a table before adding a new one to it. Note: `service_role` bypasses RLS entirely regardless of policy count (confirmed at the DB level, `rolbypassrls = true`) — a table with RLS enabled and zero policies is not necessarily broken if every access path uses a service-role client; check which client a given edge function actually uses before assuming a zero-policy table is failing silently.
- Never render unsanitized HTML from user/DB input — this class of bug was found and patched across 5 files in Aug 2026; check for an existing sanitizer (`src/utils/__tests__/contentSanitizer.test.ts`) before adding raw `dangerouslySetInnerHTML`.

## Error monitoring

`src/lib/sentry.ts` wires Sentry into `src/utils/clientErrorLogger.ts`'s `logClientError()` — every existing error boundary already calls that function, so anything that reports through it is automatically covered. No-op until `VITE_SENTRY_DSN` is set. Prefer reporting new errors through `logClientError(surface, error, extra)` rather than a fresh `console.error` so they're covered too.

## Known open items (see the full CTO report for detail/priority order)

Current roadmap status, item tracking, and changelog live in `ROADMAP.md` at the repo root — check there before assuming an item's status from this file.

- GitHub branch protection / required-status-check enforcement: partially confirmed — PR #1 merged successfully via the GitHub API with 4 known-failing checks present (Vitest, Footer ModeSwitcher, Validate PDF exports, Contrast PR Gate) and no admin override needed, meaning those specific checks are not configured as required/blocking. Not confirmed for every check in the repo — don't assume a failing check on a *different* workflow also won't block merge without checking.
- The default payment plan in the Unit Comparison tool (`DEFAULT_PLAN_RULES` in `buildSchedule.ts`) only totals 100% of the purchase price at one specific handover distance; at typical 1-3 year handover windows it under-covers by 15-40 percentage points, and the UI doesn't currently surface the warning `buildSchedule()` already returns. Flagged, not yet fixed — needs a product decision.
- Server-side money paths (`crm-broker-commission-create`, `crm-broker-commission-sign`) have no test harness yet — no `deno test` setup exists in this repo. Reasonable next step, not yet built.
