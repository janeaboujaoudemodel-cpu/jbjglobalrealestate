
Goal: fix the routing confusion, 404 cropping/overlap, owner/backend header stacking issues, right-edge icon cropping, and missing navigation links (public pages only, excluding /card).

What the earlier URL question meant (plain answer):
- “Canonical Video Hub URL” = the one official video page all old/alternate video links should redirect to.
- Recommended and already closest to your current setup: /toolkit/video-suite.
- We will make every legacy/typo variant route go there automatically.

Audit findings (current code):
1) Redirect gap still exists for a real user path:
- Your session shows page_view on /toolkit/ai-video-suite (this route does not exist).
- Existing redirects currently cover /ai-video-tour-script and /toolkit/video-studio, but not /toolkit/ai-video-suite.

2) Video Script merge is incomplete from a UX perspective:
- VideoScriptPanel exists, but it’s only wired in IntegratedToolsPanel.
- AIVideoStudio uses AIVideoStudioLayout directly and does not render IntegratedToolsPanel.
- So users won’t reliably see “Video Tour Script” where they expect it in Video Suite flow.

3) 404 layout is clipped/cropped:
- NotFound uses overflow-hidden + centered card + heavy top padding.
- This can clip bottom content (“Need Assistance”) and visually collide with fixed headers.

4) Header stack inconsistency in owner/backend:
- MainLayout hides horizontal utility bar on back-office routes (/admin, /listing-admin, /broker-dashboard).
- Owner shell is separate and currently has no horizontal utility bar, yet owner header is offset as if one exists (lg:top-[48px]).
- This causes spacing/overlap issues; child sticky headers/tabs in owner/admin pages can slide under Founder header.

5) Navigation/footer drift and broken links:
- Vertical nav/footer are manually curated and not synchronized from route definitions.
- Multiple stale/incorrect footer links exist (examples: /calculator/measurement, /services/leasing-advisory, /services/design-and-build, /services/referral-partner, /investor/join, /academy-graduates, /partner-governance, /toolkit/corporate-suite/qr-generator).
- You requested: include all public pages, exclude /card.

Implementation plan (immediate):
Phase 1 — Routing hardening (video + aliases)
- Add safety redirects for all video legacy/typo paths to /toolkit/video-suite:
  - /toolkit/ai-video-suite
  - /toolkit/video-studio (keep)
  - /toolkit/ai-video-studio (if you want single hub behavior)
  - /ai-video-tour-script (keep)
- Keep /toolkit/video-suite as canonical destination.

Phase 2 — Make Video Script discoverable in Video Hub
- Add a clear top-level “Script” entry in VideoSuite tabs (not hidden inside editor internals).
- Keep existing editor-side script support, but ensure users can reach script generation directly from /toolkit/video-suite in one click.

Phase 3 — 404 page safe-area and clipping fix
- Refactor NotFound container sizing:
  - remove overflow clipping behavior
  - use viewport-safe min-height with explicit top/bottom safe padding
  - prevent contact/action row from being cut on shorter heights
- Tune spacing to sit below persistent header stack on all breakpoints.

Phase 4 — Owner/backend header architecture fix
- Introduce a consistent horizontal utility bar in owner command center and backend contexts.
- Normalize sticky offsets with one shared header-height constant:
  - utility bar at top
  - Founder/CEO header below it
  - page tabs/sticky rows below both (no overlap)
- Update owner/admin sticky headers currently using top-0 to shared offset class so tabs never hide under Founder header.

Phase 5 — Right-edge search/shortcut cropping fix
- Rework utility bar internal layout to avoid right-side clipping:
  - stable inner container with min-width behavior
  - safe right padding and end spacer
  - prevent icon truncation in desktop/tablet/mobile widths.

Phase 6 — Full public navigation/footer synchronization (exclude /card)
- Build a single public route source from route files (Public + AI Tool + Toolkit public entries).
- Use that source to regenerate:
  - GlobalVerticalNav public sections
  - Footer public link groups
- Exclude:
  - /card and /card/:token
  - owner/admin/internal-only routes from public nav (per your answer: public pages only).
- Fix all stale public links and ensure every public page is discoverable from both vertical nav and footer.

Validation checklist after implementation
1) Any of these URLs must land on /toolkit/video-suite:
- /ai-video-tour-script
- /toolkit/video-studio
- /toolkit/ai-video-suite
2) On 404 pages, header/footer/contact actions are fully visible; no clipping at bottom.
3) In owner/backend, utility bar is visible, Founder header stacks correctly, no hidden tabs.
4) Search/shortcut icons are fully visible at right edge on desktop/tablet/mobile.
5) Public nav/footer contain all public routes and no /card entries.
