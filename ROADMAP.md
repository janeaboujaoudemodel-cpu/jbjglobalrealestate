# JBJ Global Real Estate — Product Roadmap

*Living document. Update via PR, same as code — no direct pushes to `main`. Last updated: Aug 16, 2026.*

Based on the CTO technical review of jbjglobalrealestate (jbj.ae), the Aug 12 full audit & design recommendations, and ongoing verification through Claude Code sessions.

---

## How to use this file

- **This is the single source of truth for roadmap status.** If Lovable, a Claude Code session, or a conversation elsewhere produces a finding, it gets folded in here via PR — not left to live only in a chat log.
- Every item should carry: what it is, current status, and — for anything marked resolved — the commit/PR that proves it, not just a claim.
- **Do not mark anything "Resolved" without a commit hash, test output, or screenshot to cite.** This doc has already caught several false "done" claims by requiring that discipline — keep it.
- Multiple developers can edit sections independently and open separate PRs; conflicts are just merge conflicts on this one file, same as any other code change.
- **Every edit to this file gets a Changelog entry below** — id, date, author, one-line description, commit hash. This is in addition to (not a replacement for) normal git history: `git log ROADMAP.md` / `git blame ROADMAP.md` always work too, but the table makes the history scannable without needing git commands.

---

## Changelog

*Newest first. To add an entry: increment the ID, add a new row at the top, fill in date (UTC), your name or session identifier (be honest — "Claude Code session" or "Lovable sync (bot)" is correct when that's what it was, don't attribute automated changes to a person), a one-line description, and the commit hash (`pending` if not yet committed, e.g. mid-PR).*

| ID | Date (UTC) | Author | Change | Item(s) | Commit / PR |
|---|---|---|---|---|---|
| RM-033 | 2026-08-18 | Claude Code session (PR #44) | JBJ-022 worked around without repo admin: all three summary-posting workflows now write their report to the run's own job summary via `core.summary.addRaw(body).write()` *before* attempting the PR comment. The job summary needs no token permissions, so it survives the repo-level Actions setting that makes `issues.createComment` 403 with "Resource not accessible by integration" — the setting the workflows already try to satisfy with `permissions: issues: write`, which cannot override it. Previously a 403 meant the report simply vanished and only a `core.warning` remained; now the PR comment is a convenience and the job summary is the guaranteed copy. **This does not close JBJ-022** — the underlying permission is still wrong and still needs a human with repo admin if PR comments are wanted; it removes the consequence, not the cause. | JBJ-022, JBJ-011 | `pending`, PR #44 |
| RM-032 | 2026-08-18 | Claude Code session (PR #44) | JBJ-011/JBJ-022: **PR #44 is now fully green — all 6 checks pass on `a79532a`** (Vitest, audit/Tool Emerald, snapshot/Report Pill, Contrast PR Gate, Validate PDF exports, PASS 142), `mergeable_state: clean`, no review comments. The last red check was not a content failure: PASS 142's own logs reported `staticOutcome = 'success'` and `sweepOutcome = 'success'`, but the job ran 20m35s against `timeout-minutes: 20`, so GitHub cancelled it at the ceiling *after* the gate had already passed and the check surfaced red. Two siblings were within ~2 minutes of the same cliff on the same run (Contrast PR Gate 17m58s, Validate PDF exports 17m43s) — that is a coin flip on runner speed, not headroom. Raised all three build+Playwright jobs to 30 minutes; left the fast ones alone (audit 6m22s, snapshot 5m46s, Vitest 1m09s). Diagnosis confirmed on the re-run: PASS 142 took **20m39s** — over 20 minutes again — and passed cleanly under the new ceiling. Also confirmed JBJ-022 is still live and still correctly contained: the run logged `Could not post the PR summary comment: Resource not accessible by integration. The gate result above is unaffected.` The workflow already declares `permissions: issues: write`, so the 403 is imposed above the workflow file at the repo's Actions settings and **still needs a human with repo admin** — no session-side fix exists. The try/catch added in `30ceaa7` behaved as intended, downgrading the comment failure to a warning instead of failing a passing gate. | JBJ-011, JBJ-022 | `a79532a`, PR #44 |
| RM-031 | 2026-08-17 | Claude Code session (PR #44) | JBJ-026: cleared the entire static-a11y baseline — 995 tolerated entries → **0**, checker now green with an empty allowlist, so any new violation fails the gate instead of joining a growing waiver list. Three of those "violations" were defects in the checker itself, not in the app: (a) `matchOpenTags` used `<tag\b([^>]*?)(/?>)`, which truncates attributes at the first `>` — and in JSX that `>` is usually the arrow of an inline handler, so every attribute after `onKeyDown={(e) =>` was invisible and correctly-keyboard-enabled elements were reported as `click-events-have-key-events`; rewritten as a character walk tracking brace depth and string state. (b) `bodyHasVisibleText` stripped `{…}` wholesale, so `{formData.location \|\| "Select location…"}` and `{loading ? <span>Submitting…</span> : <span>Submit application</span>}` read as unnamed controls; it now recognises string literals inside expressions and JSX text nodes between `>` and `<`. (c) `contentEditable` hosts are now exempt from `click-events-have-key-events` — they are focusable and keyboard-operable by definition, and DocumentStudio's click handler is delegated from real `<button aria-label="Remove field">` descendants, so Enter/Space already reaches it. **Caught and reverted a regression of my own making**: the bulk labeller had added `aria-label` to 414 controls that already had visible text, 214 of them with wording that diverged from it (`aria-label="Next"` on a button reading "Continue") — a WCAG 2.5.3 Label-in-Name failure, and it broke two `ModeSelectionModal` tests by renaming the button out from under `getByRole`. Audited every label this branch added against the base tree and removed 403; the 11 kept are `aria-label={label}`-style bindings whose value *is* the visible text. Verified: 481/481 Vitest pass (was 479/481), `check:a11y:static` green with an empty baseline, `tsc --noEmit` error-file set byte-identical to base `3644d5c` (26 files, all pre-existing zod-v4/`xlsx` drift), production build succeeds. | JBJ-026, JBJ-011 | `pending`, PR #44 |
| RM-030 | 2026-08-17 | Claude Code session | JBJ-025: the eight Aikido "exposed secret" findings all resolve to the same value — the project's Supabase **publishable (anon)** key, plus a Stripe `pk_test_` publishable key and a Sentry DSN. None are private credentials, so **no rotation is required**; treated as hygiene, not incident response. Removed `.env` and `.env.development` from version control and gitignored `.env*` (keeping `.env.example`); de-duplicated the anon key from four source files into `src/config/backendDefaults.ts`; and added migration `20260817160000_edge_function_key_indirection.sql`, which introduces `public.edge_function_anon_key()` / `edge_function_url()` and recreates the four trigger functions and two pg_cron jobs that had the key inline, so a future rotation is one `UPDATE` on `app_settings` instead of a hunt through five migration files. Not verified live: the migration has not been applied — Lovable owns the database, and this session has no way to confirm the two Zoho triggers and two cron jobs still fire after it lands. Needs a post-deploy check (see JBJ-025). Two Aikido findings are false positives and should be marked as such rather than fixed: the "LinkedIn Client secret in MarketingScripts.tsx" (the file contains no secret — `linkedInPartnerId` is a public tracking ID fetched from the DB at runtime), and the anon-key findings themselves once the above lands. Nine files named in the findings (`DocumentPreviewPDF.tsx`, `buildRecordHTML.ts`, `ApplicationDetailDrawer.tsx`, `BeforeAfterUpload.tsx`, `seo-crawl-report.mjs`, `build-i18n-status.mjs`, `typecheck.yml`, `divider-contract.yml`, `i18n-parity.yml`) have never existed in this repo's history — the Aikido project is scanning something other than `main`, worth confirming before trusting its file counts. | JBJ-024, JBJ-025 | `pending`, new PR |
| RM-029 | 2026-08-17 | Claude Code session | JBJ-024: remediated the open ("New") Aikido findings. Dependencies: `@xmldom/xmldom` pinned to 0.8.14 via `overrides` (patches CVE-2026-34601 / -41672 / -41673 / -41674 / -41675, all High; 0.8.13 is the advisory's patched version but npm-deprecated, 0.8.14 is not), and `unzipper` pinned to 0.12.5, which drops the `binary`→`buffers` chain — `buffers@0.1.1` publishes no license at all and was the UNLICENSED finding. XSS: added `src/utils/safeHtml.ts` (rich/SVG/whole-document DOMPurify profiles that fail closed with no DOM, plus `safeJsonLd`) and `src/utils/printWindow.ts`; sanitized 8 unsanitized `dangerouslySetInnerHTML` sinks, fixed a real JSON-LD `</script>` breakout in `NewsDetail.tsx`, and replaced all 9 `document.write` print/preview flows with a DOMParser-based writer. URL handling: added `src/utils/safeUrl.ts` (scheme allowlist, replacing reliance on the blocklist in `security-standards.ts`) and routed 55 `window.open` + 18 `window.location.href` dynamic targets through it. SSRF: added `supabase/functions/_shared/ssrf-guard.ts` (scheme/credential/port checks, IPv4+IPv6 private-range tables, per-hop redirect re-validation) and applied it to the 9 edge functions that fetch caller- or DB-supplied URLs. Path traversal: added `src/utils/storagePath.ts` and `scripts/lib/safePath.mjs`; sanitized 9 storage keys built from raw `file.name` and 21 extension derivations (`split('.').pop()` is itself a traversal vector), and confined CLI `--css=`/file-argument paths to the repo (plus tmpdir, which the guard's own fixtures need). CI: pinned all 6 workflows' actions to commit SHAs and set `persist-credentials: false` on every checkout. Also replaced the two `assert`-based CSS parser round-trip guards with explicit raises (`python -O` strips asserts, which would have let a lossy parse overwrite `index.css`). Verified: 481/481 Vitest tests pass (34 new), `check:contrast:pr-gate` green, `tsc --noEmit` introduces no new error files vs. the pre-change baseline. | JBJ-024, JBJ-025 | `pending`, new PR |
| RM-028 | 2026-08-17 | Claude Code session | JBJ-005 Part 0 (PR #42, chronologically precedes RM-027's batch 1 but merges after it — renumbered from a conflicting RM-027 on rebase): confirmed `Dialog`/`AlertDialog` (already exist) as the target pattern per RM-022's decision — no new primitive built. While confirming, found and fixed a real pre-existing bug: `AlertDialog` used Tailwind z-index classes ~100,000 below `Dialog`'s inline z-index, so an `AlertDialog` opened from inside an open `Dialog` (e.g. delete-confirm from a form modal, live in `DeleteImportButton.tsx`) rendered invisibly underneath it. Fixed by matching `Dialog`'s inline-style z-index pattern. Verified: `tsc --noEmit` clean, `check:a11y:static` output byte-identical before/after (pre-existing 200 `button-name`/`click-events-have-key-events` findings unaffected, out of scope). Proposed batching for the actual migration (admin/owner-backend → CRM/form-embedded → public-facing) posted in the PR description, which RM-027/batch 1 already executed on. | JBJ-005 | `d24f69b`, PR #42 |
| RM-027 | 2026-08-17 | Claude Code session | JBJ-005 batch 1: migrated 12 admin/owner-backend/internal-tooling custom modals onto shared `Dialog` (11 files) / `Sheet` (1 file, `FoundersNotificationCenter.tsx` — redirected from `Dialog` after confirming `Dialog` has zero animation by design, `dialog.tsx` line ~109, which would have silently dropped its slide-in transition; `Sheet` genuinely animates and matches its slide-over shape). Verified: `tsc --noEmit` clean, `check:a11y:static` improved 200→197 (3 real fixes — removed hand-rolled backdrop click-handlers the linter flagged — plus line-number drift on unrelated pre-existing findings), dev server boots clean. Found and flagged a new bug (JBJ-023): `DocumentStudio.tsx`'s two remaining hand-rolled dialogs ("Save as Template", "Start page with AI") were migrated by mistake initially, then reverted after confirming shared `Dialog`'s hardcoded z-index (120001) can't clear the editor's own `zIndex: 2147483000` overlay — migrating them would have made both dialogs invisible while editing a document, a real regression, not preserved behavior. Also surfaced (not fixed, out of scope, different file) that `AssetLibraryDialog.tsx` already uses plain `Dialog` inside that same overlay and is very likely already silently broken today for the identical reason, pre-existing and unrelated to this batch. | JBJ-005, JBJ-023 | `a5e558d`, PR #43 |
| RM-026 | 2026-08-17 | Claude Code session (status update, credit to a human/Salim's account for the actual fix) | JBJ-021 fully resolved: a follow-up commit (`b343cdf`, pushed by `janeaboujaoudemodel-cpu` directly to PR #39's branch from an environment with real `cdn.sheetjs.com` access) regenerated the lockfile's `xlsx` entry, closing the desync RM-025 had flagged as blocked. Confirmed via live CI: Vitest green, PDF Export QA and Contrast PR Gate both reaching and passing their real checks (all three still show a GitHub "failure" conclusion solely due to JBJ-022's unresolved comment-posting permissions issue). | JBJ-021 | `b343cdf`, PR #39 |
| RM-025 | 2026-08-17 | Claude Code session | Fixed `npm ci` override conflicts (react-hook-form, recharts pinned to exact versions matching their overrides) and regenerated `package-lock.json`, which also caught up ~12 other packages whose package.json bumps had never been synced to the lockfile (not just the brace-expansion desync originally diagnosed). Discovered a third pre-existing desync mid-fix — `xlsx` lockfile entry (0.18.5) doesn't match package.json's CDN-hosted 0.20.2 — confirmed via live CI on PR #39, not resolved: `xlsx@0.20.2` is CDN-only (no npm registry mirror exists) and this session's sandbox blocks that CDN. Also confirmed live (same PR's CI) the repo-level workflow-permissions issue blocking PR-comment posting — needs Salim's manual action, no tool access to fix from this session. | JBJ-021, JBJ-022 | `10ad896`, PR #39 |
| RM-024 | 2026-08-16 | Claude Code session | Guide Consolidation Stage 2, part 1: folded five standalone FAQ pages into their matching guide pages (accordion section, old routes redirect to `#faq` anchors), removed the now-empty FAQ hub audience picker, fixed a hash-scroll gap in `ScrollToTopOnMount` that anchor redirects depend on. Stage 2 part 2 (Rental Guide → Tenant/Landlord split) deferred — found Tenant/Landlord Guide already independently cover the same ground as `RentGuide.tsx`'s content-mapping table; flagged rather than resolved unilaterally. Added JBJ-020 for the landlord rental-content gap this surfaced. | JBJ-018, JBJ-020 | `dd27252`, PR #37 |
| RM-023 | 2026-08-16 | Claude Code session | Documented the JBJ-019 self-verification decision in CLAUDE.md as a new "PR review process" section (near where PR #17's roadmap-tracking section lands); updated JBJ-019 status to fully resolved | JBJ-019 | `pending`, new PR |
| RM-022 | 2026-08-16 | Jane (decision) | Decided both open governance/scope questions: JBJ-005 migrates all 45 modals onto the shared Dialog wrapper (full migration, not per-component patching); JBJ-019 formally accepts self-verification as the PR review process, documented as a real tradeoff rather than a silent gap | JBJ-005, JBJ-019 | — |
| RM-021 | 2026-08-15 | Claude Code session (PR #4) | Merged and published Guide Consolidation Stage 1 live — nested canonical guide URLs, FAQ consolidation, old routes redirected. Required a temporary branch-protection bypass to merge (self-approval block); re-enabled and re-verified after. Surfaced JBJ-019 (no genuine second reviewer available) as an open governance question affecting all future PRs. | JBJ-018, JBJ-019 | `1b7555c`, PR #4 |
| RM-020 | 2026-08-16 | Claude Code session (PR #17) | Added roadmap-tracking conventions section to CLAUDE.md (item-ID format, Changelog format, evidence-before-resolved discipline, when to route through a human) — branched clean off the just-merged CLAUDE.md commit, not stacking on stale code | — | `4410be7`, PR #17 (open, not merged) |
| RM-019 | 2026-08-16 | Claude Code session (merge verification) | Independently re-verified diff scope of PR #13 and PR #14 against GitHub directly (not just relayed claims) before merging both — confirmed each touched exactly 1 file. Merged both clean, no admin override needed. | JBJ-007 | PR #13 → `433f4689`, PR #14 → `80e6d5c` |
| RM-018 | 2026-08-16 | Claude Code session (Step 5, Sidebar `!important` pass) | Real per-declaration cascade audit on Sidebar found only 2/445 `!important`s safely removable (0.45% yield) — root cause traced to 54 `pass-NNN-*.css` override files (~1,962 more `!important`s) loaded after all six extracted areas. Paused rather than continue at same yield; scoped as new item JBJ-017. Also found 2 dynamically-loaded stylesheets invisible to static-import cascade analysis. | JBJ-017 | — |
| RM-017 | 2026-08-16 | Claude Code session (cleanup run) | Merged CLAUDE.md from stale branch (51 commits behind) after fixing 2 stale sections (lockfile framing, branch-protection confirmation); added ROADMAP.md pointer | JBJ-007 | PR #14 → merged `80e6d5c` |
| RM-016 | 2026-08-16 | Claude Code session (cleanup run) | Attempted to delete dead branch claude/lovable-edits-sync-check-4280ds — blocked by GitHub 403 (session credentials lack ref-deletion rights); confirmed genuinely dead (not an ancestor of main) and still reachable in history | JBJ-004 | — |
| RM-015 | 2026-08-16 | Claude Code session (4-phase run) | Investigated JBJ-009 — found original premise wrong, service-role bypasses RLS, nothing actually broken; recommended optional doc-only policy and a manual smoke test of 2 low-activity tables | JBJ-009 | — |
| RM-014 | 2026-08-16 | Claude Code session (4-phase run) | Confirmed JBJ-002 fully resolved via direct code read — FROM headers fixed, constants genuinely in use, no gap | JBJ-002 | — |
| RM-013 | 2026-08-16 | Claude Code session (4-phase run) | Attempted to open PR for JBJ-004 — found `main` already contains a superseding fix ("PASS 375") for the same bug; branch `7105547` is now dead code, no PR opened, decision pending | JBJ-004 | `7105547` (unmerged, superseded) |
| RM-012 | 2026-08-16 | Claude Code session (4-phase run) | Added `ROADMAP.md` to the repo via PR — extracted faithfully from the `.docx` via direct OOXML parsing (soffice unavailable in sandbox) | all | `c071f0e`, PR #13 → merged `433f4689` |
| RM-011 | 2026-08-16 | Claude (roadmap session) | Converted roadmap to `ROADMAP.md` for centralized, PR-reviewed multi-developer tracking; assigned stable JBJ-### IDs to all tracked items | all | — |
| RM-010 | 2026-08-16 07:50 | Jane (Lovable publish) | Published OwnerGuard access-control fix live to jbj.ae | JBJ-001 | deployment `add2383a` |
| RM-009 | 2026-08-15 | Claude Code session (PR #9) | Fixed and merged OwnerGuard inverted-boolean access-control bug | JBJ-001 | `3584a68` → merged `ab5f5115`, PR #9 |
| RM-008 | 2026-08-15 | Claude Code session (PR #7, CI triage) | Found OwnerGuard.tsx inverted-boolean bug incidentally while triaging CI checks | JBJ-001 | `0e4f807`, PR #7 |
| RM-007 | 2026-08-15 | Claude Code session (modal centering) | Fixed owner-backend modal-centering root cause; found ~45 unscoped modal components needing a separate pass | JBJ-004, JBJ-005 | `7105547` (branch, not yet merged) |
| RM-006 | 2026-08-14 | Jane (Lovable publish) | Published PR #1 (Sentry + tests + lockfile fix) live to jbj.ae; `VITE_SENTRY_DSN` left intentionally unset | JBJ-003, JBJ-006, JBJ-007 | — |
| RM-005 | 2026-08-14 | Claude Code session (PR #1 merge) | Merged Sentry error monitoring + 32 business-logic tests + lockfile fix to `main` | JBJ-003, JBJ-006, JBJ-007 | `fd66773`, PR #1 |
| RM-004 | 2026-08-14 20:21 | Lovable sync (`gpt-engineer-app[bot]`) | Email-constant refactor (`HELPDESK_EMAIL`/`CAREERS_EMAIL`), FROM header fix on 2 edge functions — cross-referenced as the likely resolution of the sender-identity bug | JBJ-002 | `3e57da5` → merged `e1e6784` |
| RM-003 | 2026-08-14 | Dev/Lovable | Rate limiting added to `advisory-desk-request` + 7 other public functions | JBJ-008 | `fd8e5bf` |
| RM-002 | 2026-08-14 05:17 | Dev/Lovable | Fixed `AdvancedFilterPanel` PostgREST 1,000-row pagination cap (project-count undercount) | — | `cce0fdd` |
| RM-001 | 2026-08-13 | CTO Technical Review (initial) | Original audit compiled — CSS architecture, test coverage, rate-limiting findings | JBJ-010, JBJ-006, JBJ-008 | — |

*Entries RM-001 through RM-010 are reconstructed from session history when this changelog was introduced (RM-011) — dates/times are as accurate as available records allow but weren't logged in real time. RM-011 onward should be added live, as part of the same PR that makes the change.*

---



## 1. What's already built

Measured directly from the codebase — 531 pages, 1,417 components, 506 Supabase edge functions, and 1,154 database migrations (re-verified Aug 14–16; original CTO review measured 512 / 1,350 / 507 / 1,149 — growth is consistent with healthy ongoing development, not drift).

**Core platform**
- Full broker/client marketplace with mode switching
- CompanyHub — relational network mapping companies, brokers, and clients
- CRM with business-card scanning

**Monetization & growth**
- Tiered points / loyalty system
- Broker education & certification platform — sequential unlock paths, generated certificates

**Transactions**
- JBJ Bookings
- DocuSign e-signature integration
- HR / commissions handling

**Integrations**
- External listing sync — Reelly, Provident
- AI chat, AI voice (ElevenLabs / VAPI), AI content generation

**Scale, confirmed by a full source audit (Aug 12)**
- 200+ public routes and 40+ separate back-office modules — not just CRM, but a full HR hub, IT department, security console, kanban, whiteboard, mindmap, video builder, and call review system, among others
- A heavy production dependency list beyond the core stack: a full WASM video-transcoding engine (`@ffmpeg/ffmpeg` + `util`), five separate document-generation libraries (`pdfjs-dist`, `jspdf`, `docx`, `pptxgenjs`, `exceljs`, `xlsx`, `jszip`), the full Tiptap rich-text suite, Leaflet mapping, and a native iOS/Android app wrapper (Capacitor) bundled inside the web build
- Route-level code-splitting is implemented correctly — each page lazy-loads — which limits some of the damage from this scale, though shared/top-level imports of the above libraries would still bloat the main entry chunk if not also split

---

## 2. Roadmap by phase

### Phase 1 — Near-term (2–4 weeks)
*Stabilization only. No new features planned until these close.*

- [x] Rate-limit `advisory-desk-request` — done Aug 14, extended to 8 public functions (corrected scope — see §5/§7)
- [x] Resolve the triple-lockfile situation — **merged & verified**, see §5
- [ ] Start `index.css` componentization — pilot on the CRM shell
- [ ] Wire `check:contrast:pr-gate` / `check:a11y` into a real CI workflow

### Phase 2 — Mid-term (1–3 months)
*Highest-leverage phase. Untested money paths were the single biggest gap between "looks solid" and "is solid" — largely closed now, see §5.*

- [x] Business-logic test coverage: DocuSign completion, booking creation, commission calculation, lead routing — **merged & verified (32/32 new tests pass)**
- [ ] Complete the `index.css` consolidation app-wide
- [ ] Refresh README and `database/README.md` counts
- [ ] Full storage-bucket and edge-function-auth audit

### Phase 3 — Longer-term (3+ months)
*Where the product differentiators live — the features that make JBJ hard to copy. Hard-blocked on Phases 1–2.*

- [ ] Service/domain map across 506 edge functions and 1,154 migrations
- [ ] Broker education & certification as the primary product wedge
- [ ] CompanyHub / relational network as a competitive moat
- [ ] Usage-driven roadmap decisions via a real analytics dashboard

---

## 3. Item status at a glance

*Item IDs (JBJ-###) are stable references — cite them in commit messages and Changelog entries (e.g. "fixes JBJ-002") instead of re-describing the item each time.*

| ID | Item | Status | Phase |
|---|---|---|---|
| JBJ-001 | OwnerGuard access-control bug | **PUBLISHED live** (Aug 16, 07:50 UTC) — manual owner-login check still pending | Resolved |
| JBJ-002 | Sender identity (`jane@jbj.ae` bug) | **Resolved & confirmed** — FROM headers fixed, constants in use | Resolved |
| JBJ-003 | Error monitoring (Sentry wiring) | **PUBLISHED & live** — DSN intentionally unset, safe no-op | Resolved |
| JBJ-004 | Modal centering (owner-backend root cause) | **Resolved on `main`** via superseding fix — dead branch needs manual deletion (§6) | Resolved |
| JBJ-005 | Custom-rolled modal audit (~45 components) | **In progress (Aug 17)** — real inventory found 43 modal instances across 33 files (close to, replaces, the ~45 estimate). Part 0 infra fix (AlertDialog z-index vs. Dialog, PR #42) landed. Batch 1 (admin/owner-backend/internal-tooling, PR #43) done: 12 of 43 migrated to shared `Dialog`/`Sheet`, a11y count improved (200→197). 2 more (`DocumentStudio.tsx` Save As/Add Page) deferred — see JBJ-023. Batches 2–3 (CRM/form-embedded is actually already fully migrated — nothing left there; public-facing remains) not yet started | Near-term |
| JBJ-006 | Business-logic test coverage | **MERGED & verified** — 32/32 new tests pass | Resolved |
| JBJ-007 | Lockfile drift (3 lockfiles present) | **MERGED & verified** — clean install confirmed outside Lovable sandbox | Resolved |
| JBJ-008 | Rate limiting on public functions | Corrected — flat limiter exists but doesn't differentiate gated vs. public | Near-term |
| JBJ-009 | 4 zero-policy RLS tables | **Investigated — not actually broken** (service-role bypasses RLS by design); optional doc-only follow-up | Resolved |
| JBJ-010 | `index.css` consolidation (9,029 `!important`s) | Open — not started | Near/mid-term |
| JBJ-011 | CI for contrast / a11y checks | Open — no workflow yet | Near-term |
| JBJ-012 | Storage & edge-function auth audit | Not started | Mid-term |
| JBJ-013 | Broker certification platform | Built — expand as wedge | Longer-term |
| JBJ-014 | CompanyHub relational network | Built — expand as moat | Longer-term |
| JBJ-015 | Usage-driven analytics | Not started | Longer-term |
| JBJ-016 | Inconsistent live project count (hero-section number unconfirmed) | Partially resolved — open question remains | Near-term |
| JBJ-017 | Pass-file `!important` audit (54 `pass-NNN-*.css` files, ~1,962 declarations) | New — identified, not scoped or started; needs its own engagement | Future (post-Step 5) |
| JBJ-018 | Guide consolidation, Stage 1 (nav/routing + FAQ) + Stage 2 (FAQ fold-in / Rental Guide split) | Stage 1 **MERGED & live** (`1b7555c`). Stage 2's FAQ fold-in done, pending merge (see this PR) — five standalone FAQ pages folded into their guides' accordion sections, old routes redirect to anchors. Stage 2's Rental Guide → Tenant/Landlord content split **not done**: Tenant/Landlord Guides were found to already independently cover the same ground as `RentGuide.tsx`'s mapping table (rental-market, budgeting/costs, process steps, JBJ-support sections all pre-exist) — deferred pending a decision on how to reconcile rather than duplicating content | Resolved (Stage 1), Stage 2 partial |
| JBJ-019 | Second-reviewer / self-approval governance gap | **Resolved (Aug 16)** — self-verification formally accepted as the process, documented in CLAUDE.md | Resolved |
| JBJ-020 | Landlord-side rental content gap | Scoped, not started — see full write-up below | Near-term |
| JBJ-021 | `npm ci` lockfile desync + override conflicts | **Resolved (PR #39, Aug 17)** — override conflicts (react-hook-form, recharts) and brace-expansion/12+ other package desyncs fixed by this session; the `xlsx` desync discovered mid-fix (blocked here by sandbox CDN access) was resolved by a follow-up commit from an environment with real access to `cdn.sheetjs.com`. `npm ci` now confirmed green on CI: Vitest passing, PDF Export QA and Contrast PR Gate both reaching and passing their actual checks — see full write-up below | Resolved |
| JBJ-022 | Repo workflow permissions block PR-comment posting | Confirmed via live CI evidence (PR #39) — needs Salim to change `Settings → Actions → General → Workflow permissions` | Blocked on manual action |
| JBJ-023 | `DocumentStudio.tsx`'s full-screen editor overlay (`zIndex: 2147483000`) sits above shared `Dialog`'s hardcoded z-index (120001, `dialog.tsx`), which can't be overridden by a consumer — any plain `Dialog` rendered while the editor is open is invisible/inert underneath it | New — found during JBJ-005 batch 1. `AssetLibraryDialog.tsx` (pre-existing, unrelated to this batch, not touched) already uses plain `Dialog` inside this same overlay and is very likely already silently broken in production today for this reason — not confirmed live, but the z-index math is unambiguous. `DocumentStudio.tsx`'s own "Save as Template"/"Start page with AI" dialogs were reverted back to their original hand-rolled implementation (with the correct `zIndex: 2147483100`) rather than ship them broken. Needs a decision: either a documented Dialog z-index escape hatch for exceptional high-z-index hosts, or lowering the editor shell's z-index | Near-term |
| JBJ-024 | Aikido security findings (open/"New" set) | **Fixed in code, not yet deployed** (Aug 17) — 13 of 15 findings remediated: dependency CVEs, XSS sinks, `document.write`, URL validation, SSRF guards, path traversal, GitHub Actions pinning, python `assert` misuse. 481/481 tests pass. Awaiting merge + Lovable publish before any can be called live | Near-term |
| JBJ-026 | Static a11y baseline drift (was 995 tolerated entries; GitHub issue #5 tracked it at 485) | **Cleared in code, not yet merged** (Aug 17, PR #44) — baseline emptied to 0 and `check:a11y:static` passes against it, so the gate is now a real gate. Includes three fixes to the checker itself (attribute truncation at inline-arrow `>`, expression-rendered text treated as no-name, `contentEditable` mis-flagged) and the removal of 403 redundant `aria-label`s this branch had added over already-visible text (WCAG 2.5.3). Issue #5's count is stale and should be closed or restated once this merges | Near-term |
| JBJ-025 | Aikido "exposed secret" findings — all publishable keys | **Code change landed, live verification pending** (Aug 17) — every flagged value is publishable (Supabase anon, Stripe `pk_test_`, Sentry DSN); **no rotation needed**. `.env`/`.env.development` untracked + gitignored, key de-duplicated to one module, and migration `20260817160000` moves it behind `app_settings`. **Blocked on a human:** confirm after deploy that the two Zoho triggers and two pg_cron jobs still fire — this session cannot reach the database. Also: mark the LinkedIn-secret finding as a false positive, and check which branch/repo Aikido is actually scanning (9 named files don't exist here) | Near-term |

---

## 4. Featured differentiators

The four features flagged as the real competitive edge, once near-term stabilization is out of the way.

**Broker education and certification — the wedge.** Sequential unlock paths with generated certificates on completion — a full learning platform inside the CRM, not just static content. Already fully built and live.

**CompanyHub relational network — the moat.** Maps relationships between companies, brokers, and clients. Most real estate CRMs are contact-centric; a relational network is structurally different — it captures who introduced whom, which relationships feed which listings. Hard to copy because it's accumulated graph data, not a feature toggle.

Ways to extend it:
- Relationship strength scoring — surface warm vs. dormant connections based on recent activity and deal history
- Path-finding — "who at JBJ knows someone at Company X" as a queryable feature
- Referral-attribution layer — feeds directly into the existing HR/commissions system for automated referral splits
- Network effect — a broker who leaves loses their relationship map, increasing retention
- Aggregate market intelligence — anonymized insights only possible because of the graph structure
- Client-facing and developer/partner-facing views into relevant slices of the network

> Risk: a relational network doesn't look broken, so it's easy to under-invest in while fighting near-term fires. Left untouched, the moat stays shallow.

**Tiered points and loyalty.** Gamifies broker engagement alongside certification.

**Usage-driven roadmap.** Once analytics has an explicit date range wired up, future feature decisions can be based on real usage data instead of guesswork.

---

## 5. Urgent — live, user-reported bugs (P0)

> Reported directly against the live site. These outrank the phased backlog below — fix first, verify with evidence, do not report done without proof.

### JBJ-001 — OwnerGuard mode-gating bug — access-control failure, found and FULLY CLOSED (Aug 15–16)

**What it was:** `OwnerGuard.tsx`'s check preventing owner-only content (`/owner`, `/admin`) from leaking while browsing in Broker/Developer/Investor mode used the inverse condition (`!isRegisteredOwnerEmail` instead of `isRegisteredOwnerEmail`) — dead code that could never fire for the population it was meant to protect against. Net effect: a registered owner switching to Broker/Developer/Investor mode fell through to owner-only content regardless of active mode.

**How it was found:** surfaced incidentally during CI-check triage (PR #7, commit `0e4f807`) — not part of the original CTO review scope. Two parallel Claude Code sessions were independently triaging failing CI checks (PR #6 and PR #7) without visibility into each other; this was one session's find.

**Fix:** single-operator change, `!isRegisteredOwnerEmail` → `isRegisteredOwnerEmail`. Verified: 17/17 tests passing (including two that specifically exercised this bug), clean build, guard logic manually read end-to-end to confirm no gap remains.

**Status:** merged to `main` via PR #9 (`3584a68`, merged `ab5f5115`), synced to Lovable, **published live** — confirmed via deployment id `add2383a-365d-433e-b2f5-099f8f661996`, `updated_at` 07:50:01 UTC (2026-08-16). Fully closed at the code/deploy level.

**Still pending:** the actual manual verification (log in as a registered owner, switch modes, confirm `/owner`/`/admin` unreachable) has **not** been performed — requires real owner credentials no Claude Code session has. Worth doing directly given the severity.

> **Process note (standing practice going forward):** two things diverged from actual live status in one day — the Aug 14 rate-limiting item (claimed gap, actually already working — a traffic-confound false alarm) and two parallel Claude Code sessions producing overlapping-but-different PRs without either knowing about the other. When running more than one session against the same repo concurrently, scope them to non-overlapping work, or check in on both before either opens a PR.

### JBJ-002 — Live-chat lead notification sender-identity — RESOLVED, confirmed (Aug 16)

Original finding (Aug 12 audit): live-chat notifications were sent from `jane@jbj.ae`, a mailbox that doesn't exist. Delivery itself worked (real delivery goes to `infoo.jane@gmail.com`), but reply-ability and DMARC/sender-identity checks would fail.

**Confirmed resolved via direct code read (Aug 16):** the FROM header on both `advisory-desk-request` and `chat-support-notify` now reads `Contact@JBJ.AE`, not `jane@jbj.ae`. `CAREERS_EMAIL`/`HELPDESK_EMAIL` are defined in `stats.ts` and genuinely imported and used in `CareersContactBlock.tsx`, `resendClient.ts`, and `crm-send-developer-registration/index.ts` — not just defined and dangling. No gap remains. Closed.

### JBJ-009 — 4 tables with RLS enabled but ZERO policies — INVESTIGATED, NOT actually broken (Aug 16)

`jbj_booking_audit_log`, `jbj_booking_email_verifications`, `owner_calendar_api_clients`, and `webauthn_challenges` all have RLS enabled but no policies defined.

**Original premise was half right, half wrong.** Investigated via code search plus a live database query (confirmed directly: `service_role` has `rolbypassrls = true`; `anon`/`authenticated` do not). Every access path to these 4 tables — `booking-public-create`, `owner-calendar-api`, all 4 `webauthn-*` functions — deliberately uses a service-role client, which bypasses RLS by design. Zero direct anon-key/client-side usage found anywhere in `src/`. **"Denied including from the app's own backend" was false — the backend never goes through RLS for these tables in the first place.**

Live evidence: `jbj_booking_audit_log` (7 rows, most recent 3 days old) and `jbj_booking_email_verifications` (1 row, sparse by design) are confirmed working. `owner_calendar_api_clients` (0 rows) and `webauthn_challenges` (11 rows, all from launch week, none since) show no *confirmed* recent activity — not evidence of breakage, but also not confirmed healthy; a manual smoke test of those two specifically is still worth doing, unrelated to RLS.

**No policy fix needed.** Optional, not urgent: replace the implicit zero-policy lockout with an explicit documented policy, so the backend-only intent is stated rather than incidental. Closed as "not a bug."

### JBJ-004 — Modal centering (owner-backend root cause) — SUPERSEDED, decision needed

Real root cause found and fixed via Playwright browser measurement (Aug 15) — see below for what shipped. **Update (Aug 16): do not merge this branch as-is.**

While branch `claude/lovable-edits-sync-check-4280ds` (commit `7105547`) sat waiting for a PR, `main` advanced ~30 commits and already contains a more thorough fix for the same bug (internally referenced as "PASS 375") — it measures the real rendered content-shell element directly (including `main[data-owner-content]` on the owner backend) rather than relying on a passed-in value. Confirmed this isn't cosmetic by attempting the merge directly: real conflicts across all 3 files this fix touches.

**`7105547` is now dead code.** No PR was opened. **Branch deletion attempted and blocked** — see §6.

Original fix detail, for reference: the public `/properties` filter panel was already fixed by an earlier commit (`30f5023`, 0.0px drift confirmed). The bug this branch fixed was `useModalViewportInset.ts` failing to detect the sidebar on the owner/admin backend (`data-owner-rail` was a dead attribute, matched nowhere). Verified with 3 screenshots and a clean `check:quality` run at the time — now moot given the superseding fix already on `main`.

**Still valid, not superseded:** the scope finding that ~45 custom-rolled modal/popup components exist outside the shared `Dialog`/`AlertDialog` wrapper and don't participate in either fix — tracked separately as JBJ-005, unaffected by this update.

### JBJ-016 — Inconsistent live project count across the site — VERIFIED PARTIALLY RESOLVED

Only one place in the codebase displays a live-projects count — `AdvancedFilterPanel.tsx` line 358, reading live from Supabase. No project-count field exists in `stats.ts`, and no count display was found in the homepage hero components at all.

The panel's undercount (PostgREST's 1,000-row cap truncating the query) was already fixed in commit `cce0fdd` (Aug 14, 05:17 UTC).

**Open question:** the reported "1,398" hero-section number has no corresponding code anywhere. Needs a screenshot with URL and timestamp before closing — may be a stale cached page rather than a live second source.

---

## 6. Other open items

**All three previously-blocked cleanup items are now DONE (Aug 16):** dead branch deleted, PR #13 merged (`433f4689`), PR #14 merged (`80e6d5c`). `ROADMAP.md` and `CLAUDE.md` are both now live on `main` — the centralization work described in this doc's own introduction is complete.

**One more open:** **PR #17** — adds the roadmap-tracking conventions section to `CLAUDE.md` (item-ID format, Changelog format, when to route through a human). Open, awaiting review/merge.

**Worth doing, not urgent:**
- Manual smoke test of `owner_calendar_api_clients` and `webauthn_challenges` — both show no confirmed recent activity (0 rows / none since launch week), unrelated to the RLS question already closed for JBJ-009
- Manual owner-login check for JBJ-001 (still outstanding — no session has owner credentials)

**Not covered this engagement:**
- Re-privatize the GitHub repo once the current review-access period is done
- Full portfolio review of the other 4 Lovable projects
- Live browser QA of the public site

### JBJ-021 — `npm ci` lockfile desync + override conflicts — RESOLVED (Aug 17, PR #39)

Surfaced as "brace-expansion override vs. lockfile mismatch, causing intermittent `npm ci` failures" — investigating it directly found the actual picture was broader and the failures weren't intermittent at all.

**Root cause #1 (the actual thing blocking every run) — override/direct-dependency conflict.** `react-hook-form` and `recharts` each had a top-level `overrides` entry that was a *different string* from their own `dependencies` range (e.g. `"^7.81.0"` vs. override `"7.81.0"`). npm's `assertRootOverrides` check rejects this combination outright — `npm install`/`npm ci` fail immediately, before ever reaching any lockfile-sync check. Confirmed deterministic (not intermittent) using CI's own npm version (10.8.2), against live CI logs on `main` at the time. **Fixed**: pinned both direct-dependency ranges to their exact override versions, the same pattern `zod` already used successfully in this file.

**Root cause #2 — the originally-diagnosed brace-expansion desync, plus ~12 more like it.** Once the override conflict was cleared, a real `npm install` regenerated the whole lockfile in one pass. This caught up brace-expansion (`1.1.12` → `1.1.18`, matching the override) *and* revealed the same "package.json bumped, lockfile never regenerated" pattern was much more widespread than one package: `browserslist`, `js-yaml`, `nanoid`, `picomatch`, `raw-body`, `rollup`, `uuid`, `yaml`, `zod`, `@hono/node-server`, `dompurify`, `pdfjs-dist`, `react-router-dom` were all already-committed package.json changes the lockfile had never caught up to. None of these are new version bumps — every one was already what `package.json` declared. **Fixed** as a side effect of the same lockfile regeneration.

**Root cause #3 — `xlsx` desync — discovered mid-fix, resolved by a follow-up commit.** Getting past root cause #1 unmasked a third, pre-existing desync: the lockfile pinned `xlsx@0.18.5`, but `package.json` wanted the CDN-hosted `xlsx@0.20.2` (same run of Aikido commits). Confirmed live on PR #39's own CI. **Could not be fixed in the Claude Code cloud session that found it**: `xlsx@0.20.2` is distributed only via SheetJS's own CDN (`cdn.sheetjs.com`) — the npm registry's latest published version is still `0.18.5`, so no registry mirror had `0.20.2` either. That session's sandbox network policy blocked `cdn.sheetjs.com` outright (403 from the proxy itself, a policy denial rather than an npm error), and fabricating a lockfile entry (resolved URL, integrity hash, transitive deps) without actually fetching the real tarball was correctly judged not an acceptable workaround. Flagged in the PR instead of worked around.

**Resolved same day**: a follow-up commit (`b343cdf`, pushed directly to the PR branch from an environment with real `cdn.sheetjs.com` access) regenerated the lockfile with the correct `xlsx@0.20.2` entry. Confirmed via live CI on the same PR: Vitest went green; PDF Export QA's build succeeded and ran its actual content check (surfacing only the separate, already-documented, out-of-scope low-DPI Company Profile PDF issue — not a regression); the Contrast Regression Check's actual sweep passed cleanly across every route (0 violations, desktop and mobile). All three checks' GitHub-reported conclusion still shows failure, but only because of JBJ-022's comment-posting 403 crashing the job after the real work already succeeded — see below.

### JBJ-022 — Repo workflow permissions block PR-comment posting — CONFIRMED, needs manual action

The Contrast Regression Check workflow explicitly grants `issues: write` in its own YAML (with a comment acknowledging this exact failure mode) and still gets `403 Resource not accessible by integration` posting PR comments — the check's actual work (build, Playwright, contrast sweep) runs and passes, only the comment step fails. This points to `Settings → Actions → General → Workflow permissions` being set to read-only at the repo (or org) level, overriding what the YAML requests.

**Confirmed with live evidence (PR #39, Aug 17):** the Contrast PR Gate job's actual token check succeeded (`31 pairs · 0 fail · 1 allowlisted`), then crashed posting its comment with the 403 above. The response headers included `x-accepted-github-permissions: 'issues=write; pull_requests=write'` — direct proof the workflow's GitHub token carries neither scope right now, regardless of the YAML's own `permissions:` block.

**Could not be checked or changed directly**: the GitHub MCP toolset available to Claude Code sessions on this repo has no tool for reading or updating repository Settings → Actions (same category of gap as JBJ-019's original branch-protection finding — this integration is scoped to content/PR/issue/commit operations, not repo administration).

**Needed: Salim goes to `Settings → Actions → General → Workflow permissions` and switches from "Read repository contents permission" to "Read and write permissions."**

---

## 7. Engineering task backlog (detailed)

*Specific, ready-to-execute tasks. Run via Claude Code (web or local CLI) — these require real repo access.*

### Near-term — ready now

- [ ] **Contrast fix — Sitemap.tsx "Get In Touch" section.** Missing `data-surface="emerald"` on the wrapping `<section>`; `<h2>`/`<p>` force black text via `allow-black` + inline overrides. Add the tag, remove the overrides, match the `HubCard` component's correct pattern two sections above.
- [ ] **Docs fix — contrast-system.md Gold row.** Table lists Gold's Foreground as `#FFFFFF`; actual CSS variable is `--gold-foreground: 0 0% 10%` (black). Correct the table.
- [ ] **Contrast fix — PaymentPlanEditor.tsx number inputs.** `inputBase` sets white text on champagne background across 4 inputs, each marked `data-no-contrast-guard`. Fix the color or wrap in `data-surface="champagne"`; remove the guard-bypass attributes.
- [ ] **CSS token consolidation.** 30 separate `:root` blocks, duplicate definitions (`--background` 5×, `--tw-ring-color` 20×, etc.). Consolidate into one `:root` + one `.dark` block. Show a diff before applying; re-run `check:quality` after.
- [ ] **Freeze new CSS debt (do this first — zero risk).** Guardrail: no new `!important`, `:root` blocks, or global classes added to `index.css` from now on. Flag instead of adding if a future task seems to need one.
- [ ] **Full-codebase sweep of contrast-guard escape hatches.** Search for every use of `allow-white`, `allow-black`, `data-no-contrast-guard`, `// contrast-ok`. Report file, actual surface color, and whether the forced color is correct. Fix violations; leave documented exceptions (`scripts/contrast/allowlist.json`) alone.
- [ ] **Dependency cleanup — expanded.** Move test libraries to `devDependencies`. Confirm `xlsx`/`exceljs` are actually used; remove if not. Confirm heavy libraries (`ffmpeg`, `tiptap`, `capacitor`, etc.) are genuinely lazy-loaded, not just page-split.
- [ ] **Bundle size analysis.** Run a production build with `rollup-plugin-visualizer` enabled; report the 15 largest chunks.
- [ ] **JBJ-005 — Migrate all ~45 custom-rolled modals onto the shared `Dialog`/`AlertDialog` wrapper.** Approach decided (Aug 16) — full migration, not per-component patching, so there's one source of truth going forward instead of 45 separate maintenance points. In progress: Part 0 infra fix landed (AlertDialog z-index bug, PR #42). Real inventory (Aug 17) found 43 modal instances across 33 files — `src/components/crm/**`/`src/components/broker-crm/**` already fully migrated, nothing left there. Batch 1 (admin/owner-backend/internal-tooling, 12 files, PR #43) done — see its PR description for the full per-file list and flags, including one file (`FoundersNotificationCenter.tsx`) redirected to shared `Sheet` instead of `Dialog` since it's a slide-over panel and `Dialog` has zero animation by design, and two dialogs in `DocumentStudio.tsx` deferred (JBJ-023, z-index conflict with its editor overlay). Batch 2 (public-facing modals) not started.
- [ ] **Duplicate RLS policy on `project_documents`.** Two overlapping public-SELECT policies. Confirm what the table stores; remove the duplicate or scope down if it holds anything owner/client-specific.
- [ ] **XSS hardening — full sweep.** `HtmlT.tsx` sets `innerHTML` with no sanitization — add `DOMPurify.sanitize()` inside the component itself. Broader: search all of `src/` for `dangerouslySetInnerHTML` and confirm DOMPurify is used everywhere it should be.
- [ ] **Bot protection & rate limiting — expanded.** Add honeypot fields to the 4 known lead forms. Broader: audit every public lead-intake endpoint for both rate limiting and bot protection, not just the four already known.
- [ ] **Cap unbounded queries — reframed as scraping prevention.** `useDevelopers()` has no `.limit()`. `useProjectsListing()` has no PostgREST-layer rate limiting. Broader: check for any other public route returning full result sets without pagination caps. Report the chosen approach before implementing.
- [ ] **`advisory-desk-request` rate limiting — corrected.** It already has a flat 5 req/10min IP limiter — the actual bug is it applies to both the gated *and* public paths. Split it so only the guest path is limited; the JWT-verified gated path should bypass it. Confirm IP hashing; confirm/add 429 + Retry-After.

### Mid-term — larger, phased efforts

- [ ] **Map the CSS file before touching it.** Group all ~3,606 rule blocks in `index.css` by feature area; report location count and `!important` usage per group. Report only, no changes yet — this determines real priority order for the work below.
- [ ] **Scope global CSS by feature area.** Move component-specific CSS out of the global file, one area at a time, highest `!important` usage first: (1) Sidebar → (2) Cards → (3) Buttons/CTAs → (4) Hero/video → (5) Modals → (6) Forms. Screenshot + `check:quality` gate after each. Stop and report on any regression.
- [ ] **Remove `!important` once each area is scoped.** Same six areas, same order, same verification discipline. **PAUSED after Sidebar (Aug 16) — see JBJ-017.** Real per-declaration cascade analysis on the extracted `sidebar.css` found only 2 of 445 `!important`s provably safe to remove (0.45% yield) — the other 443 have real competitors elsewhere in the cascade. Root cause: the 54 `pass-NNN-*.css` override files (loaded after all six extracted area files) contain ~1,962 more `!important`s and are the actual specificity winners driving this. Continuing area-by-area at the same yield was correctly judged not worth the remaining four areas — see JBJ-017 for the real fix.
- [ ] **Diagnose prerendering before fixing it.** Confirmed: the live homepage returns only the empty `<noscript>` fallback. Investigate why `vite-plugin-prerender` isn't producing output before implementing anything.
- [ ] **Implement the prerendering fix**, based on the diagnosis. Public non-authenticated routes only. Verify by fetching built HTML directly with JS disabled.
- [ ] **Audit legacy redirect chains.** 30+ redirect-only routes — check for multi-hop chains and flag for cleanup.

### Needs a product decision before starting

- [x] **JBJ-018 — Consolidate overlapping guide pages — Stage 1 DONE (Aug 15). Stage 2 FAQ fold-in done (pending merge); Rental Guide split deferred.** See full write-up below.
- [ ] **JBJ-020 — Landlord-side rental content gap.** Scoped, not started. See full write-up below.

### Needs its own scoped future engagement (not part of Step 5)

- [ ] **JBJ-017 — Pass-file `!important` audit.** Surfaced Aug 16 during Step 5's Sidebar removal pass, not part of Step 5's completed work.

  A full audit of `!important` usage across the 54 `pass-NNN-*.css` override files (~1,962 declarations, loaded after all six extracted area files — the actual specificity winners behind Sidebar's 0.45% removal yield). Needs to determine: which overrides are load-bearing, which are dead (target selectors no longer in the live DOM — same pattern already found in Sidebar), and which represent genuine unresolved specificity conflicts that a real fix could resolve instead of another override file.

  **Materially larger and riskier than the six-area extraction** — these files are themselves the historical record of the codebase repeatedly patching around specificity problems, not a clean pre-scoped boundary. Recommend scoping this as its own engagement with its own review/brief before implementation starts, same pattern as the original CTO review scoped the current remediation phases.

  **Prerequisite:** Step 5's six-area extraction should be merged to `main` first, so this starts from a clean, current baseline instead of stacking on an unmerged branch.

  **Methodological finding to carry forward:** two stylesheets — `private-surfaces.css` and `route-surfaces.css` — are real, currently-shipping cascade competitors invisible in `main.tsx`'s static import list. They load via dynamic `import()` from components mounted in `App.tsx`, landing after the synchronous bundle on the routes where they apply. `private-surfaces.css` contains genuine sidebar-scoped rules (chrome also renders on backend routes via `BrokerPortalLayout.tsx`). **Any future cascade analysis on this codebase must account for dynamically-loaded stylesheets, not just static imports** — this is a real gap in how the six-area extraction's tooling was scoped, worth carrying into whatever tooling gets built for this audit.

- [x] **JBJ-018 — Guide consolidation, Stage 1 — MERGED and published live (Aug 15), commit `1b7555c`.**

  Nav/routing restructuring shipped via PR #4: nested canonical URLs (`/guides/buyer`, `/guides/seller`, `/guides/tenant`, `/guides/landlord`, `/guides/invest`), old flat URLs redirect to the new canonical paths, the guide library trimmed to guides only, Broker FAQ redirected to `/faq` (matching the existing Investor FAQ precedent), and the redundant `/faqs` nav link removed in favor of `/faq` directly. 2 commits, 12 files. Independently re-verified twice before merge (typecheck, line-by-line a11y diff against a clean pre-PR base) — and confirmed live via a direct nav check against jbj.ae post-publish, not just assumed from sync status.

  **Stage 2, part 1 (FAQ fold-in) — DONE, pending merge.** Five standalone audience FAQ pages (`BuyerFAQ.tsx`, `SellerFAQ.tsx`, `TenantFAQ.tsx`, `LandlordFAQ.tsx`, `InvestorFAQ.tsx`) folded into an accordion section on their matching guide page, above `GuideNavigation`. Old routes (`/buyer-faq`, `/seller-faq`, `/tenant-faq`, `/landlord-faq`, `/investor-faq`) now redirect to the guide's `#faq` anchor instead of rendering a retired page — same preserve-the-link pattern Stage 1 used for `/broker-faq` → `/faq`. Required a supporting fix: `ScrollToTopOnMount` (`src/components/ScrollToTop.tsx`) previously force-scrolled to page-top on every route change regardless of URL hash, which would have silently broken every one of these anchor redirects — patched to scroll to the hash target instead, with retry for lazy-loaded route content. FAQ hub's "Browse by Audience" picker removed (all four entries it linked to no longer exist as standalone pages). `bookCollections.ts` updated to match: the five FAQ "book" entries removed from the Guides Library; Investor FAQ's own stale `/investor-faq` CTA link fixed to the in-page anchor.

  **Stage 2, part 2 (Rental Guide → Tenant/Landlord split) — NOT DONE, deferred by explicit decision, not an oversight.** The original Stage 1 write-up assumed splitting `RentGuide.tsx`'s content into Tenant/Landlord Guide was a straightforward move. On review of the actual destination pages, it isn't: `TenantGuide.tsx` and `LandlordGuide.tsx` already have their own independently-authored sections covering the same ground as every row of `RentGuide.tsx`'s content-mapping table — rental-market fundamentals, a payment/cheque-structure and costs section, a multi-step rental-process walkthrough (Tenant Guide's is more granular than RentGuide's), and their own "How JBJ Supports You" sections. Moving RentGuide's sections in as literal additional blocks would create visible duplicate content (two cheque-structure sections, two process breakdowns, etc.) on the same page; reconciling them instead would mean rewriting/merging content, which is editorial judgment beyond a content move. Flagged rather than resolved unilaterally — needs a decision on which approach to take before Stage 2 part 2 proceeds. `RentGuide.tsx` and `/rent-guide` are untouched and still serve their full original content in the meantime.

  **Unconfirmed:** whether the `/rental-yield`/`/dubai-rental-yield` redirect routes (part of the original task's scope) were addressed in Stage 1 — not mentioned in what shipped, worth a direct check before assuming either way.

  **Process finding, worth real attention — not a footnote:** merging PR #4 required a temporary branch-protection bypass. GitHub blocks self-approval, and the PR was authored under the same account that would need to approve it — so "Require a pull request before merging" was disabled, the PR merged, then immediately re-enabled with the full checkbox state re-verified against the original baseline (protection on, 1 approval required, dismiss-stale-approvals on, no force-push/deletion/bypass). **Presumably PR #1 and PR #9 hit the same constraint — not confirmed retroactively.** Worth checking directly rather than assuming, given how much of this roadmap's "Resolved" status depends on those two PRs specifically.

  **Decided (Aug 16) — see JBJ-019 for the resolution.**

- [ ] **JBJ-020 — Landlord-side rental content gap.** Surfaced during Stage 2's FAQ fold-in (this PR) as the scope boundary called out explicitly in that PR's brief, not discovered incidentally.

  Outside its own "For Landlords" bullet points, `RentGuide.tsx` — the content Stage 2 part 2 would otherwise have split into Tenant/Landlord Guide — is almost entirely tenant-perspective. There is no real landlord-side rental content anywhere in the codebase covering: the property listing process, tenant screening, the landlord's own Ejari obligations, DEWA transfer between tenancies, or RERA renewal/eviction notice rules. Landlord Guide's existing sections (rental pricing, costs, JBJ support) don't cover this ground either.

  **Scoped, not started.** Needs real regulatory accuracy and Jane's input to write correctly — explicitly not something to draft speculatively. Whoever picks this up should also revisit JBJ-018 Stage 2 part 2 at the same time, since a real landlord-side content pass may change what (if anything) still needs to move over from `RentGuide.tsx`.

- [x] **JBJ-019 — Who provides genuine independent PR review? DECIDED (Aug 16): self-verification, formally accepted.**

  Directly surfaced by JBJ-018's merge process: Claude Code sessions cannot serve as a second reviewer for their own (or any Claude Code-authored) PR, regardless of branch-protection settings — GitHub's self-approval block is structural, not configurable around.

  **Decision: self-verification is the accepted process here, explicitly, not by default.** The standard going forward is what JBJ-018 already did in practice — re-running checks, diffing against a clean pre-PR base, confirming diff scope matches what's claimed — plus a human read of the diff when practical. This is a real, documented tradeoff, not a gap being quietly accepted: there is no independent reviewer catching what self-verification misses. If that changes (a second human reviewer joins, or a genuinely distinct AI reviewing identity becomes available), this decision should be revisited — it's the current answer, not a permanent one.

  **Done (Aug 16):** written into `CLAUDE.md` itself as a new "PR review process" section, so every future Claude Code session knows self-verification is the accepted bar rather than something to flag as a blocker each time. Fully closed.

- [ ] **CI infrastructure gap, ticketed separately.** 3 of the known-failing CI checks (see JBJ-011) trace to the runner itself missing Playwright browsers and `bunx` — infrastructure, not code. A GitHub issue was opened for this specifically, alongside the existing issue #5 tracking the 485-violation a11y baseline drift. Worth linking both issues here once numbers are confirmed, so this doc and GitHub's own issue tracker don't drift apart.

  **Update (Aug 17, PR #44):** the a11y half of this is done — the baseline is cleared to 0 and the static gate passes with an empty allowlist (JBJ-026). Issue #5's "485" was already stale when written; the real count at the time this branch started was 995. The Playwright/`bunx` runner gap is separate and still open.

---

## Historical context — why the CSS work has to be architectural, not another patch

`src/index.css` is **32,721 lines**, with **9,029 `!important` declarations** across 3,606 rule blocks (~2.5 per block on average — a healthy Tailwind/shadcn project should be close to zero). 30 separate `:root` blocks mean later definitions silently override earlier ones depending on file order.

The project's own `.lovable/plan/` history contains **20+ past attempts** at fixing this exact problem (titled things like *"full-site-css-conflict-sweep,"* *"global-contrast-system-rebuild,"* *"site-wide-css-contract-repair,"* dated across Aug 3 and Aug 12 alone) — each patched symptoms, none touched the root cause. A JS-based runtime "contrast repaint" was also tried and removed (per a code comment in `App.tsx`) after it caused a platform-wide hover/scroll flicker — a patch-layer fix was already tried and made things worse.

This is why the CSS tasks in §7 are scoped as an architectural fix (map → scope → de-`!important`), not another targeted patch.
