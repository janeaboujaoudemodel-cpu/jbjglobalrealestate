# JBJ Global Real Estate — Product Roadmap

*Prepared August 14, 2026 · Based on the CTO technical review of the live jbjglobalrealestate repo (jbj.ae)*

# 1. What's already built

Measured directly from the codebase — 512 pages, 1,350 components, 507 Supabase edge functions, and 1,149 database migrations, roughly double what the project README claims. The product is a full broker/client marketplace, not just a CRM.

## Core platform

- Full broker/client marketplace with mode switching
- CompanyHub — relational network mapping companies, brokers, and clients
- CRM with business-card scanning

## Monetization & growth

- Tiered points / loyalty system
- Broker education & certification platform — sequential unlock paths, generated certificates

## Transactions

- JBJ Bookings
- DocuSign e-signature integration
- HR / commissions handling

## Integrations

- External listing sync — Reelly, Provident
- AI chat, AI voice (ElevenLabs / VAPI), AI content generation

## Scale, confirmed by a full source audit (Aug 12):

- 200+ public routes and 40+ separate back-office modules — not just CRM, but a full HR hub, IT department, security console, kanban, whiteboard, mindmap, video builder, and call review system, among others
- A heavy production dependency list beyond the core stack: a full WASM video-transcoding engine (@ffmpeg/ffmpeg + util), five separate document-generation libraries (pdfjs-dist, jspdf, docx, pptxgenjs, exceljs, xlsx, jszip), the full Tiptap rich-text suite, Leaflet mapping, and a native iOS/Android app wrapper (Capacitor) bundled inside the web build
- Route-level code-splitting is implemented correctly — each page lazy-loads — which limits some of the damage from this scale, though shared/top-level imports of the above libraries would still bloat the main entry chunk if not also split

# 2. Roadmap by phase

## Phase 1 — Near-term (2–4 weeks)

*Stabilization only. No new features planned until these close.*

- Rate-limit advisory-desk-request — flagged as done Aug 14 for 8 public functions, but a follow-up review found the PUBLIC/guest path on advisory-desk-request specifically was missed; reopened as a corrected task in Section 7
- Resolve the triple-lockfile situation — MERGED & verified, no longer needed as a separate task (see Section 5 verification note)
- Start index.css componentization — pilot on the CRM shell
- Wire check:contrast:pr-gate / check:a11y into a real CI workflow

## Phase 2 — Mid-term (1–3 months)

*Highest-leverage phase. Untested money paths are the single biggest gap between "looks solid" and "is solid."*

- Business-logic test coverage: DocuSign completion, booking creation, commission calculation, lead routing
- Complete the index.css consolidation app-wide
- Refresh README and database/README.md counts
- Full storage-bucket and edge-function-auth audit

## Phase 3 — Longer-term (3+ months)

*Where the product differentiators live — the features that make JBJ hard to copy.*

- Service/domain map across 507 edge functions and 1,149 migrations
- Broker education & certification as the primary product wedge
- CompanyHub / relational network as a competitive moat
- Usage-driven roadmap decisions via a real analytics dashboard

# 3. Item status at a glance

| **Item** | **Status** | **Phase** |
| --- | --- | --- |
| **Error monitoring (Sentry wiring)** | **PUBLISHED & live — DSN intentionally unset, safe no-op** | **Resolved** |
| **OwnerGuard access-control bug** | **PUBLISHED live (Aug 16, 07:50 UTC) — manual owner-login check still pending** | **Resolved** |
| **Sender identity (jane@jbj.ae bug)** | **Likely resolved via Aug 14 sync — needs final confirmation** | **Near-term** |
| **4 zero-policy RLS tables** | **NEW — needs urgent investigation, features may be silently broken** | **Near-term** |
| **Modal centering (owner-backend root cause)** | **Fixed & pushed to branch — needs PR opened + merged** | **Near-term** |
| **Custom-rolled modal audit (~45 components)** | **NEW — not started, needs approach sign-off** | **Near-term** |
| **Rate limiting on public functions** | **Corrected — flat limiter exists but doesn't differentiate gated vs. public** | **Near-term** |
| **Business-logic test coverage** | **MERGED & verified — 32/32 new tests pass** | **Resolved** |
| **index.css consolidation (32,721 lines)** | **PR #15 open — all six areas extracted (32,721 → 29,854 lines); see Section 7 for the !important-removal finding** | **Near / mid-term** |
| **Lockfile drift (3 lockfiles present)** | **MERGED & verified — clean install confirmed outside Lovable sandbox** | **Resolved** |
| **CI for contrast / a11y checks** | **Open — no workflow yet** | **Near-term** |
| **Storage & edge-function auth audit** | **Not started** | **Mid-term** |
| **Broker certification platform** | **Built — expand as wedge** | **Longer-term** |
| **CompanyHub relational network** | **Built — expand as moat** | **Longer-term** |
| **Usage-driven analytics** | **Not started** | **Longer-term** |


# 4. Featured differentiators

The four features flagged in the review as the real competitive edge, once the near-term stabilization work is out of the way.

## Broker education and certification — the wedge

Sequential unlock paths with generated certificates on completion — a full learning platform inside the CRM, not just static content. Already fully built and live.

## CompanyHub relational network — the moat

Maps relationships between companies, brokers, and clients. Most real estate CRMs are contact-centric; a relational network is structurally different — it captures who introduced whom, which relationships feed which listings. That's hard to copy because it's accumulated graph data, not a feature toggle.

**Ways to extend it:**

- Relationship strength scoring — surface warm vs. dormant connections based on recent activity and deal history
- Path-finding — "who at JBJ knows someone at Company X" as a queryable feature
- Referral-attribution layer — feeds directly into the existing HR/commissions system for automated referral splits
- Network effect — a broker who leaves loses their relationship map, which increases retention
- Aggregate market intelligence — anonymized insights only possible because of the graph structure
- Client-facing and developer/partner-facing views into relevant slices of the network
*Risk: a relational network doesn't look broken, so it's easy to under-invest in while fighting near-term fires like test coverage and CSS debt. Left untouched, the moat stays shallow.*

## Tiered points and loyalty

Gamifies broker engagement alongside certification — points and tiers give brokers a reason to stay active in the platform.

## Usage-driven roadmap

Once analytics has an explicit date range wired up, future feature decisions can be based on real usage data instead of guesswork.


# 5. Urgent — live, user-reported bugs (P0)

**Reported directly against the live site. These outrank the phased backlog below — fix first, verify with evidence, do not report done without proof.**

**OwnerGuard mode-gating bug — access-control failure, found and FULLY CLOSED (Aug 15–16)**

- What it was: OwnerGuard.tsx's check preventing owner-only content (/owner, /admin) from leaking while browsing in Broker/Developer/Investor mode used the inverse condition (!isRegisteredOwnerEmail instead of isRegisteredOwnerEmail) — dead code that could never fire for the population it was meant to protect against. Net effect: a registered owner switching to Broker/Developer/Investor mode fell through to owner-only content regardless of active mode.
- How it was found: surfaced incidentally during CI-check triage (PR #7, commit 0e4f807) — not part of the original CTO review scope. Two parallel Claude Code sessions were independently triaging failing CI checks (PR #6 and PR #7) without visibility into each other; this was one session's find, isolated and reviewed on its own once discovered.
- Fix: single-operator change, !isRegisteredOwnerEmail → isRegisteredOwnerEmail. Verified: 17/17 tests passing in the relevant suite (including two that specifically exercised this bug), clean build, and the surrounding guard logic manually read end-to-end by Jane to confirm no gap remains — every branch in both the pre-existing block and the new block ends in an unconditional return.
- STATUS: merged to main via PR #9 (3584a68, merged ab5f5115), synced to Lovable automatically, and PUBLISHED LIVE — confirmed via deployment id add2383a-365d-433e-b2f5-099f8f661996, updated_at 07:50:01 UTC (2026-08-16 ~11:50 AM Gulf time), live at commit ab5f5115. This item is now fully closed at the code/deploy level.
- Remaining, not yet done: the actual manual verification (log in as a registered owner, switch to Broker/Developer/Investor mode, confirm /owner and /admin content is unreachable) has NOT been performed — it requires real owner credentials that no Claude Code session has. The fix is confirmed present in the deployed code, but the live user-facing behavior hasn't been eyes-on verified. Given the severity of this bug, this manual pass is worth doing directly rather than treating the code-level confirmation as sufficient on its own.
- Process note, worth taking as a standing practice: this is the second time reported status diverged from actual live status in one day — first the Aug 14 rate-limiting item (claimed gap, actually already working — a traffic-confound false alarm, not a real bug), now two parallel Claude Code sessions producing overlapping-but-different PRs without either knowing about the other. When running more than one session against the same repo concurrently, either scope them to clearly non-overlapping work, or check in on both before either opens a PR.
*Verification note (Aug 14, via Claude Code direct repo inspection):*

- A Lovable sync to main (commit 3e57da5, merged as e1e6784) was confirmed real — bot-authored by gpt-engineer-app[bot]. It touched src/constants/stats.ts, src/components/careers/CareersContactBlock.tsx, and two edge functions (advisory-desk-request, chat-support-notify). Confirmed: this was a pure email-constant refactor (de-duplicating HELPDESK_EMAIL / CAREERS_EMAIL), unrelated to any roadmap item below — no rate-limiting or count logic was touched.
*Full-sync verification (Aug 14, 21:06 UTC) — GitHub confirmed up to date with Lovable:*

- Scale re-measured directly against origin/main and compared to the original audit baseline: 531 pages (was 512), 1,417 components (was 1,350), 1,154 migrations (was 1,149) — all higher, consistent with healthy ongoing sync, not data loss. Edge functions showed 506 vs. baseline 507, but full git history confirmed zero edge functions have ever been deleted on this branch — a counting-convention gap in the original baseline, not missing code.
- HEAD commit e1e6784 confirmed current (44 minutes old at time of check), working tree clean, full expected project structure present — no partial checkout or gaps.
- Independently confirmed from Lovable's own side: Settings → GitHub shows the repository connection status as "Connected" (green), repo janeaboujaoudemodel-cpu/jbjglobalrealestate, branch main — matching what GitHub shows from the other end.
- Together these confirm both directions: GitHub has everything that's been pushed, and Lovable's sync connection itself is healthy with no pending/error/disconnected state. This is as close to "fully verified in sync" as both sides allow — git alone can only ever show what has already been pushed, never what might still be unsaved inside the Lovable editor at any given moment.

***PR #1 MERGED and verified (Aug 14) — confirmed via Claude Code, not assumed:***

- Merged to main via GitHub API (merge_method: merge, no admin override needed — the 4 known pre-existing failing checks were not configured as required/blocking). New HEAD: commit fd66773. All 9 expected files confirmed present via git show --stat: src/lib/sentry.ts, both new test files, the CI workflow, and the lockfile fix.
- Lockfile fix confirmed working: npm install succeeded straight from the committed lockfile — 0 remaining references to Lovable's private mirror (down from 21). A developer or CI runner outside Lovable's sandbox can now install this repo cleanly for the first time.
- Tests confirmed: 280/290 passing overall; the 10 failures are in the exact 4 files the PR itself flagged as pre-existing and unrelated. The 32 new business-logic tests from this PR pass 32/32 in isolation.
- Build confirmed: exit code 0, full production build.
- Sentry wiring confirmed by reading the actual code, not the PR description: initSentry() is a true no-op with zero network egress when VITE_SENTRY_DSN is unset, and logClientError() — the single function all 5 error boundaries already call — now feeds it. Wiring is genuinely complete and safe.
- PUBLISHED to jbj.ae (Aug 14) — confirmed live via Lovable's "Your website was updated" deploy confirmation. VITE_SENTRY_DSN intentionally left unset for now (no Sentry/GlitchTip account set up yet) — Sentry wiring remains a genuine no-op with zero network calls until a DSN is added later; nothing else is blocked by that decision. This item is now fully closed: merged, verified, and live.

**Live-chat lead notification sender-identity — LIKELY ALREADY RESOLVED, needs final confirmation**

- Original finding (Aug 12 audit): the site emailed jane@jbj.ae when a visitor started live chat — a mailbox that doesn't exist. Correction after a subagent actually read the code: delivery itself was never broken (real delivery goes to infoo.jane@gmail.com), but any visitor replying, or any mail server doing sender-identity/DMARC checks, would fail — the FROM header, not the delivery address, was the bug. This was flagged as the single highest-priority fix in that audit, ahead of everything else in this doc.
- Cross-referenced against work already verified in this roadmap: the Aug 14 Lovable sync (commit 3e57da5/e1e6784, previously logged in this doc as an "unrelated email-constant cleanup") added HELPDESK_EMAIL and CAREERS_EMAIL to stats.ts and changed both advisory-desk-request's and chat-support-notify's FROM header to reference a shared CONTACT_EMAIL constant instead of a hardcoded string — matching this task's fix almost exactly (change FROM in both those exact files, centralize via a constants file).
- Correcting the record: that commit is very likely the actual resolution of this bug, not "unrelated" as this doc previously characterized it — the earlier characterization was made without visibility into this audit finding. Worth a final direct check to close the loop for certain: confirm the live FROM header value on both edge functions is now a real, reply-able address (not jane@jbj.ae), and that CAREERS_EMAIL / HELPDESK_EMAIL are being used consistently rather than just defined.
- Also likely resolved by the same commit: CareersContactBlock.tsx's mixed-case "careers@JBJ.ae" (should use the ALL-CAPS CAREERS_EMAIL constant per stats.ts's own "LOCKED" convention comment) — the earlier verification confirmed this exact file now imports CAREERS_EMAIL directly.

**4 tables with RLS enabled but ZERO policies — NEW, potentially silently broken features**

- jbj_booking_audit_log, jbj_booking_email_verifications, owner_calendar_api_clients, and webauthn_challenges all have RLS enabled but no policies defined at all — meaning ALL access (including from the app's own backend logic) is currently denied by default
- This means booking confirmations and passkey/WebAuthn login may be failing silently right now — the UI could show success while the actual write to these tables is being rejected by RLS with no visible error
- Needs immediate investigation: check whether the features that write to these tables are actually working end-to-end in production, or failing silently. Add the correct scoped policies if they're needed for the app to function.
- Flagged as urgent rather than routine backlog because — unlike most items in this doc — this isn't a code-quality or security-hardening issue, it's a plausible explanation for a currently-broken user-facing feature nobody may have noticed yet

**Modals / popups not centered**

- VERIFIED AND FIXED (Aug 14) — real root cause found via Playwright browser measurement, not guessed. The public /properties filter panel was already fixed by an earlier same-day commit (30f5023) — confirmed 0.0px drift in both sidebar states. The still-live bug was one level over: useModalViewportInset.ts tried to detect the docked sidebar via DOM selectors that matched nothing on the owner/admin backend (data-owner-rail is a dead attribute set nowhere in the codebase), so --jj-modal-inset-left stayed frozen at 0 on every owner-backend page regardless of sidebar state — the exact symptom reported.
- Fix: the hook now takes an explicit inset value from callers that already know it (OwnerDashboardShell.tsx now passes its own authoritative sidebar width) instead of guessing via fragile selectors. Also hardened Dialog/AlertDialog's style-prop spread order against a latent (not yet triggered) footgun that could have silently broken centering for any future caller.
- Verified: 3 screenshots taken (filter panel sidebar-expanded, filter panel sidebar-collapsed, a second unrelated Dialog instance to confirm the shared-wrapper fix propagates, not a per-instance patch). check:quality run — all failures confirmed byte-identical pre-existing via git stash comparison, zero regression from this change.
- NEW SCOPE FINDING: ~45 custom-rolled modal/popup implementations exist outside the Dialog/AlertDialog wrapper (GlobalSearchModal.tsx, LeadCapturePopup.tsx, ViewingRequestModal.tsx, DocumentStudio.tsx, GuidedTour.tsx, and ~40 others) — these do NOT participate in the fixed mechanism and would still center on the raw window if a sidebar is present. Explicitly flagged as out of scope for this pass — needs its own dedicated review and fix pass. Added to Section 7 backlog below.
- Could not be screenshot-verified: the owner-backend fix specifically, since /owner/* requires real Supabase auth unavailable in the sandbox — verified by direct code reading instead (the exact value now flowing into the hook), stated explicitly as a limitation rather than assumed.
- STATUS: committed and pushed to branch claude/lovable-edits-sync-check-4280ds (commit 7105547) — NOT on main yet, no PR opened. Needs a PR opened and merged, same as PR #1's flow, before this reaches Lovable/production.

**Inconsistent live project count across the site — VERIFIED PARTIALLY RESOLVED**

- Verified via direct repo inspection (Claude Code, Aug 14): only one place in the codebase displays a live-projects count to visitors — AdvancedFilterPanel.tsx line 358. It reads live from Supabase (paginated query over published projects), not a hardcoded constant. No project-count field exists anywhere in src/constants/stats.ts, and no count display was found in the homepage hero search bar components (HeroSearchBar.tsx / HeroPropertySearch.tsx) at all.
- This panel's undercount (the 1,000-vs-1,652 symptom) was a real bug — PostgREST's 1,000-row cap was truncating the query — and was already fixed in a separate commit (cce0fdd, Aug 14 05:17 UTC) earlier the same day, before the email-constant sync this task originally investigated.
- OPEN QUESTION, not yet resolved: the reported 1,398 hero-section number has no corresponding code found anywhere. Before closing this item, need a screenshot with URL and timestamp of exactly where that number was seen — it may be a stale cached page, a different build, or a misidentified element rather than an actual second source still live in the code.

# 6. Other open items

- Re-privatize the GitHub repo once the current review-access period is done
- Full portfolio review of the other 4 Lovable projects — not covered in this session
- Live browser QA of the public site — not covered in this session

# 7. Engineering task backlog (detailed)

*Specific, ready-to-execute tasks identified in follow-up review. These require real repo access — run via Claude Code (web or local CLI), per the dev workflow in Section 0, not this workspace.*

## Near-term — ready now

**Contrast fix: Sitemap.tsx "Get In Touch" section**

- The wrapping <section> (emerald gradient background) is missing data-surface="emerald"
- The <h2> and <p> still carry the allow-black class plus inline color / WebkitTextFillColor overrides forcing black text on the emerald background
- Fix: add data-surface="emerald" to the section; remove allow-black and the inline overrides from the <h2> and <p> so the contrast guard renders them white, matching the HubCard component two sections above
- Report back exactly what changed

**Docs fix: contrast-system.md Gold row**

- Section 1 table lists Gold's Foreground as #FFFFFF — contradicts the actual --gold-foreground: 0 0% 10% (black) that the code and contrast guard enforce
- Fix: correct the table to black (#1A1A1A / 0 0% 10%)

**Contrast fix: PaymentPlanEditor.tsx number inputs**

- inputBase sets background #F7F2EA (champagne) with color #FFFFFF (white) — white-on-light text on the pct/offsetMonths/startMonth/months inputs
- Each input is also marked data-no-contrast-guard, bypassing the guard entirely
- Fix: change inputBase's color to #1A1A1A, or replace the inline style with a data-surface="champagne" wrapper so the guard governs it automatically; remove the four data-no-contrast-guard attributes

**CSS token consolidation**

- Full audit (Aug 12) quantified the scale precisely: 9,029 !important declarations across 3,606 rule blocks (~2.5 per block on average) — a healthy Tailwind/shadcn project should have close to zero. 30 separate :root blocks (not ~29 as earlier estimated). Duplicate class selectors compounding the problem: .crm-scope defined 24×, .group 22×, .jj-hero-fullscreen 17×, .dark 17×, .jj-emerald-pill 13×, .icon-tile 11×, plus 20+ more repeated 5–10× each. 151 @media queries scattered non-adjacently rather than consolidated per component.
- Historical context worth knowing before starting: the project's own .lovable/plan/ history contains 20+ past attempts at fixing this same conflict (titled things like "full-site-css-conflict-sweep," "global-contrast-system-rebuild," "site-wide-css-contract-repair," dated across Aug 3 and Aug 12 alone) — each patched symptoms, none touched the root cause. A JS-based runtime "contrast repaint" was also tried and removed (per a code comment in App.tsx) because it caused a platform-wide hover/scroll flicker — confirms a patch-layer fix was already tried and made things worse, not better. This is why the fix has to be architectural (scoping + consolidation), not another targeted patch.
- src/index.css has 30 separate :root blocks with duplicate definitions (--background 5×, --card 5×, --foreground 5×, --muted-foreground 5×, --tw-ring-color 20×, and more)
- Consolidate into exactly one :root block at the top of the file, plus one .dark block for overrides
- For every duplicate, keep the definition matching the current live/rendered site and delete the rest — don't touch non-variable rules yet
- Show a diff before applying; re-run check:quality afterward to confirm nothing broke

**Freeze new CSS debt (do this first, zero risk)**

- Guardrail prompt, run before anything else in this section so nothing gets worse while the rest of this work is in progress: do not add any new !important declarations, new :root blocks, or new global class definitions to src/index.css from this point forward
- If a future task seems to require a new !important override, stop and flag it instead of adding it — new additions will conflict with the consolidation work below

**Full-codebase sweep of contrast-guard escape hatches (NEW)**

- allow-white, allow-black, data-no-contrast-guard, and the comment marker // contrast-ok are all real, legitimate escape hatches from the automated contrast guard — but the Sitemap.tsx bug above shows they can also get used to paper over a missing data-surface tag instead of fixing it
- Search the entire src/ tree for every usage of all four. For each, report: the file, the surrounding surface's actual background color, and whether the forced text/icon color is correct per the two absolute rules (gold/champagne/white/pearl backgrounds → black text always; emerald/dark-gradient backgrounds → white text always)
- Fix every instance that violates its own surface's rule, same pattern as the Sitemap.tsx fix — add the correct data-surface tag and remove the override, rather than just relisting them
- Do not touch instances that are already correct or that have a documented reason in scripts/contrast/allowlist.json

**Dependency cleanup — expanded scope (NEW)**

- Move @playwright/test, vitest, jsdom, @testing-library/dom, @testing-library/jest-dom, and @testing-library/react from dependencies to devDependencies
- Confirm whether xlsx and exceljs are actually imported anywhere in src/ — if neither is used, remove both from package.json entirely
- Broader check, not yet done: confirm every heavy library is actually lazy-loaded / route-split rather than pulled into the main entry chunk — @ffmpeg/ffmpeg, @ffmpeg/util, pdfjs-dist, jspdf, jspdf-autotable, docx, pptxgenjs, exceljs, xlsx, jszip, leaflet, react-leaflet, the full @tiptap suite, @elevenlabs/react. Route-level code-splitting is already implemented correctly per-page, but shared/top-level imports of any of these would still bloat the main chunk even so — this needs explicit verification, not assumption.

**Bundle size analysis**

- rollup-plugin-visualizer is already installed as a dev dependency — run a production build with it enabled
- Report the 15 largest chunks by size to identify the next size-reduction targets

**Custom-rolled modal audit (discovered fixing modal centering)**

- ~45 modal/popup components exist outside the shared Dialog/AlertDialog wrapper (GlobalSearchModal.tsx, LeadCapturePopup.tsx, ViewingRequestModal.tsx, DocumentStudio.tsx, GuidedTour.tsx, and ~40 others), each rolling its own fixed inset-0 ... items-center justify-center overlay
- None of these participate in the centering fix applied to the shared wrapper — they would still center on the raw window rather than the visible content area if a sidebar is present
- Needs a dedicated pass: either migrate them onto the shared Dialog/AlertDialog wrapper (preferred — single source of truth going forward), or apply the same explicit-inset pattern individually if migration isn't practical for all of them
- Report the proposed approach before starting, given the scope (45 components)

**Duplicate RLS policy on project_documents**

- Two overlapping policies both grant public SELECT access to all rows ("Project documents are viewable by everyone" and "Anyone can read project documents")
- Confirm what the table actually stores first — if it's only public marketing brochures, remove the duplicate and keep one policy
- If it ever holds anything owner/client-specific, scope the policy down to the correct role/ownership check immediately instead

**XSS hardening — expanded to a full sweep (NEW)**

- src/i18n/HtmlT.tsx sets innerHTML directly with no sanitization, relying entirely on callers to pre-sanitize; today's only caller (DeveloperDetail.tsx) happens to pass safe content, but the component itself is unguarded. Fix: add a DOMPurify.sanitize() call inside HtmlT itself, so it's safe by default regardless of future callers.
- Broader than previously scoped: search the entire src/ tree for every usage of dangerouslySetInnerHTML and any other place raw HTML strings render (rich-text editor output, CMS/admin-authored content, imported brochure copy). For each, confirm the content passes through DOMPurify (already a project dependency) before rendering. Fix any that don't. Report the full list found and what changed.

**Bot protection & rate limiting — expanded scope (NEW)**

- Contact, valuation, callback, and newsletter forms already have server-side IP/email rate limiting in their edge functions — add an invisible honeypot field to each as an additional layer with zero visible friction
- Broader audit needed: confirm every public-facing lead-intake form/endpoint (not just the four already known) has both rate limiting AND basic bot protection at the edge-function layer — this is specifically to prevent lead-list scraping and spam-form flooding, not just individual-form abuse

**Cap unbounded queries — reframed as a scraping-prevention issue (NEW context)**

- useDevelopers() queries the developers table with no .limit() at all — add a reasonable page-size cap
- useProjectsListing()'s direct client-side Supabase queries against the public projects table have no rate limiting at the PostgREST layer (only edge functions are rate-limited in this codebase)
- Broader framing: check whether property/listing data is exposed anywhere else through a public Supabase table or edge function that returns full result sets without pagination or rate limits — i.e. whether someone could pull the entire listings database in one API call instead of browsing the site. Add pagination caps and rate limiting to any other open route found, not just these two hooks.
- Evaluate moving bulk listing reads behind a rate-limited edge function instead of direct client-side table queries, or add row-level response caps via RLS/RPC if a full move isn't practical right now
- Report which approach is being taken before implementing

**Security fix: advisory-desk-request rate limiting — CORRECTED after direct verification**

- Verified via direct repo inspection (Claude Code, Aug 14): the earlier framing of this task was wrong. advisory-desk-request already HAS rate limiting — a flat 5 requests / 10 minutes per-IP limit, applied once at the very top of the handler, before the gated-vs-public branch is even evaluated
- The actual problem: this limiter applies uniformly to BOTH the gated/portal path (already JWT-authenticated) and the public/guest path — it does not differentiate, which contradicts the intent of the "PASS 299 — GATED VS PUBLIC ESCALATION, LOCKED" comment in that file, which treats the gated path's identity as already verified and not meant to be throttled the same way as anonymous guests
- Corrected fix: split the limiter so it applies ONLY to the public/guest path (visitor_kind = 'guest', no session); the gated/portal path should bypass this guest-specific limit entirely, consistent with how its identity is already verified
- Confirm whether the existing limiter hashes IPs before storing them (chat-support-notify's approach does this) — this was not confirmed either way during verification and needs an explicit check
- On exceeding the limit, confirm the response already returns HTTP 429 with a Retry-After header matching ai-chat-support / ai-chat-stream's shape — or add it if missing
- After implementing: confirm the chosen limit for the public path, and provide screenshot proof of a 429 after exceeding it, plus confirmation the gated path is unaffected by the guest-specific limit

## Mid-term — larger, phased efforts

**Map the CSS file BEFORE touching it (NEW — prerequisite step)**

- Before any scoping work begins: analyze all ~3,606 rule blocks in src/index.css and group them by the component/feature area they belong to (CRM, hero sections, buttons/CTAs, scrollbars, market-intelligence pages, broker portal, forms, etc.)
- For each group, report how many separate non-adjacent locations in the file define rules for it, and how many use !important — output the report only, no code changes yet
- This report is what determines the actual priority order for the scoping pass below, rather than guessing at which six areas matter most

**Scope global CSS by feature area — DONE, PR #15 open (not yet merged)**

- All six areas extracted, in the planned order: (1) Sidebar → (2) Cards → (3) Buttons/CTAs → (4) Hero/video → (5) Modals → (6) Forms, into `src/styles/{sidebar,cards,buttons-ctas,hero-video,modals,forms}.css`. `src/index.css` goes from 32,721 → 29,854 lines.
- Each area's rule list was verified byte-exact against the pre-extraction file (every original chunk accounted for in exactly one output file — nothing lost, duplicated, or reordered) and confirmed with a screenshot pixel-diff plus real CI (`Contrast Regression Check`) after every commit, not just local checks.
- Three real selector-classifier bugs were found and fixed while building the six areas' scoping rules (not just line-moving) — see PR #15's description for the full detail: a naive comma-splitting bug that let shared rules leak into the wrong area (Cards), a `:not()`-exclusion bug that mistook an exclusion clause for a target (caught building Buttons/CTAs, retroactively re-verified against the already-shipped Sidebar/Cards), and a trailing `:is()` ancestor-scoping gap that rejected legitimately-pure rules (Modals) which then needed an explicit cross-area-contamination guard once Forms reused the same pattern with looser tokens.
- The tailwind.config.ts raw-px-value drift check mentioned above was not done in this pass — still open, folded into the "still open" list below.

**Remove !important once each area is scoped — STARTED, STOPPED after Sidebar (see new backlog item below)**

- Ran the full process on Sidebar only: real cascade math (a spec-correct specificity calculator, shorthand/longhand-aware property-conflict detection, cross-referenced against the actual resolved load order — not just a visual diff) on all 445 `!important` declarations across Sidebar's 130 rules. Only 2 were provably safe to remove; both removed and verified. Result and why it doesn't extrapolate into a fast mechanical pass: see the new backlog item immediately below.
- Cards/Buttons-CTAs/Hero-video/Modals/Forms were not attempted — the Sidebar result made clear this needs a different-shaped task first.

**Pass-file !important audit (NEW — split out of the per-area removal attempt above)**

- The Sidebar removal pass found 992 of 994 `!important` declarations (445 raw, expanded per selector-alternative) have a real, later, equal-or-higher-specificity competitor somewhere in the cascade — meaning the flag is genuinely load-bearing, not leftover caution. Only 2 were dead weight. That 2/445 yield means per-area removal is not a viable strategy on its own: the real `!important` debt does not live in the six area files, it lives downstream of them.
- Where it actually lives: the 54 `pass-NNN-*.css` override files (loaded after all six area files, before nothing) contain 1,962 more `!important` declarations between them — many explicitly written to beat an earlier rail/card/CTA/etc. rule, which is exactly why removing the earlier rule's own flag is safe in isolation but doesn't reduce total `!important` usage; the override just keeps winning either way. `src/styles/private-surfaces.css` (owner/CRM/admin-only, dynamically imported) adds another 926 on top of that.
- A real fix here has to target the pass-file layer directly, not the area files: for each pass-NNN file, identify which earlier rule (in index.css or an area file) it was written to override, check whether that earlier rule has since been fixed/removed/consolidated (many of these pass files stack chronologically — a later pass may have already made an earlier one's specific override redundant), and only then evaluate whether the override's own `!important` is still load-bearing. This is a different, larger task than "remove !important area by area" — closer in shape to the CSS token consolidation item above (which already flags the same 54-pass-file sprawl as a duplicate-definition problem) than to the scoping pass that just finished.
- Two real, previously-unknown cascade participants surfaced while building the analysis tooling, worth carrying into whoever picks this up: `src/styles/private-surfaces.css` and `src/styles/route-surfaces.css` are live, currently-shipping stylesheets that never appear in `main.tsx`'s static imports — they're injected via `dynamic import()` from `<PrivateSurfaceStyles>`/`<RouteSurfaceStyles>` (mounted in `App.tsx`), landing after the entire synchronous bundle on the routes where they apply (private-surfaces.css on `/owner`, `/admin`, `/crm`, etc.; route-surfaces.css on `/insights`, `/guides`, `/compare`). Any cascade/specificity analysis built only from `main.tsx`'s import list will silently miss both.
- Not started. Report the pass-file override map before removing anything, same discipline as the area-by-area pass.

**Report Pill Snapshot: PDF export hangs in CI (NEW — found triaging PR #15's checks)**

- Symptom: the `Report Pill Snapshot` workflow's test script clicks the harness's PDF-export button, then polls a status element for text starting with `"pdf ready"` every 500ms for 30s. It never arrives — status stays frozen at `"rendering…"` forever, on all three tested viewports (desktop/tablet/mobile), every time. Deterministic, not a flaky intermittent failure.
- Confirmed pre-existing, not a PR #15 regression: all 5 runs of this workflow, ever, show the identical failure text (`PDF export never completed (status='rendering…')`, `Total breaches: 3`) — including the run triggered right after Step 4's own fix landed (commit `93c86e6`, Aug 14), two days and eight commits before PR #15 existed. Step 4's fix (serving the harness via `vite dev` instead of a prod build) was real and necessary — the report page genuinely couldn't render at all before it (the earlier failure mode was a 15s timeout just waiting for `[data-report-page]` to appear) — but it was never designed to prove PDF export itself completes, and it doesn't, in this environment, and never has since the workflow could get that far.
- Leading hypothesis, not yet confirmed: `src/utils/renderReportToPdf.ts` bounds every other async step explicitly — `waitForFonts()` is wrapped in try/catch, `waitForImages()` is hard-capped at 1800ms, html2canvas's own `imageTimeout` is set to 1800ms for per-image loads — but the actual capture call itself, `const canvas = await html2canvas(reportRoot, {...})`, has no timeout or bound of any kind. If html2canvas hangs or simply runs long capturing the full offscreen multi-page report tree at 2× scale in this specific headless-Chromium-on-a-constrained-CI-runner environment, that's an unresolvable await with nothing to time it out — which would produce exactly this symptom, deterministically, on every viewport, since the same code path runs each time.
- What confirming this would actually take (not yet done): either add real instrumentation to the workflow (e.g. wrap the html2canvas call with its own timeout + explicit error/timing log so a hang shows up distinctly from a genuine JS error), or reproduce locally in a comparably resource-constrained headless-Chromium environment and profile where time actually goes. Without one of those, this is a well-supported hypothesis, not a proven root cause — don't jump straight to changing `renderReportToPdf.ts` without confirming first.
- Not started. This is application-code behavior (PDF export), not a CI config issue — treat as its own task, not something to fold into a CSS-focused PR.

**Diagnose prerendering before fixing it (NEW — split from the fix)**

- Confirmed directly (Aug 12): fetching the live homepage returns only the empty <noscript> fallback — the entire page, including all text, is blank until the JS bundle downloads, parses, and executes. This hurts both perceived load speed and SEO (a crawler that doesn't execute JS sees nothing but the title and phone number).
- Before implementing a fix: investigate why vite-plugin-prerender (already a listed dependency) isn't producing output — is it configured in vite.config, does it run as part of the build script, is its output actually being deployed? Report findings before making changes.

**Implement the prerendering fix, once diagnosed**

- Based on the diagnosis above: either (a) properly configure and wire vite-plugin-prerender into vite.config.ts's plugins array and the build script so all public, non-authenticated routes (home, properties, areas, developers, guides, services, about, contact) get real prerendered HTML, or (b) if impractical with this plugin, explain why and propose an alternative before implementing anything
- Verify by fetching the built homepage HTML directly and confirming visible text is present without JavaScript running
- Authenticated/private routes don't need this

**Audit legacy redirect chains (NEW)**

- 30+ routes in PublicRoutes.tsx are redirect-only (/resale, /distress, /buy, /rent, /golden-visa, /rental-yield, /dubai-rental-yield, /education-hub, /books-library, and more)
- For each, check whether it redirects directly to the canonical destination or through more than one hop — a redirect-to-a-redirect adds latency and confuses analytics attribution
- Flag any multi-hop chains for cleanup; also worth confirming none of these are the actual target of a live marketing link, ad, or QR code (there's a dedicated /qr-generator tool in the app) pointing at a stale chain

## Needs a product decision before starting

**Consolidate overlapping guide pages**

- Merge /rent-guide, /tenant-guide, /landlord-guide, and the routes redirecting to /dubai-rental-yield (/rental-yield, /dubai-rental-yield) into fewer, richer pages with clear on-page sections per audience
- Every merged-away URL must 301-redirect to its new canonical destination — none may 404, since some carry backlinks or ad traffic
- Show the proposed consolidated structure before merging any content or removing any routes
