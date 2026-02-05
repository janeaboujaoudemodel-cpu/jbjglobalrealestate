
## What I found (so we fix the real causes)

### 1) Some links truly are broken (not “you doing it wrong”)
- **`/studio/editor/new` is currently broken by design**: the route exists in the browser, but `StudioEditor` expects a real `:projectId` in the database. When you go to `/studio/editor/new`, it tries to load a project with id `"new"` → **“Project not found / Failed to load project”** (I reproduced this in the preview).
- **Many Footer “Professional Tools” links point to routes that do not exist** in `src/App.tsx` → these will 404 / feel like “links not working.”

### 2) Footer / CTA / Newsletter duplication is real (and currently inevitable)
- `MainLayout.tsx` renders global:
  - `<CombinedContactNewsletter />`
  - `<Footer />`
- But **many pages also still render `<Footer />` and/or `<DirectContactCTA />`** (I found matches in **116 files**), which creates duplication.
- Additionally, **Footer itself also contains newsletter UI**, while `CombinedContactNewsletter` includes “Stay in the Loop” too → this can produce **two “Stay in the Loop” blocks** even when a page is “correct.”

### 3) Mode switcher “not working” has at least one clear bug
- `ModeSwitcher.tsx` only allows broker mode when role is `broker` or `broker_partner`
- Your system uses `broker_jbj` too, but it’s **not included**, so the broker mode option can be disabled incorrectly.

---

## Implementation Plan (grouped, minimal surprises, fixes first)

### Phase A — Fix navigation so links actually work everywhere (Header + Footer + Hub)

#### A1) Create a single source of truth for tools (prevents future broken links)
- Create a config file (e.g. `src/config/royalToolsRegistry.ts`) that defines:
  - Toolkit tools (the 9 `/toolkit/*`)
  - Creative Suite (Studio)
  - “Professional tools” (only those that exist, or explicitly marked “Coming Soon”)
- Update **Header Toolkit menu** + **Footer Creative Toolkit section** to render from this registry.
- Update Footer “Professional Tools” to:
  - show only implemented routes OR
  - route missing items to a **single** “Coming Soon” page (not 404).

#### A2) Fix Studio “New” link properly
- Add a real route handler so **`/studio/editor/new` works**:
  - Option 1 (best UX): create a new project automatically and redirect to `/studio/editor/:id`
  - Option 2: redirect to `/studio` and auto-open “New Project” modal
- Ensure this flow works logged-in and logged-out (Studio already supports a session_id fallback).

#### A3) Build the “JBJ Royal Tools Hub” page (one page with everything)
- Create a new page (or repurpose `/toolkit`) as:
  - Title: **JBJ Royal Tools Hub**
  - Includes BOTH:
    - Toolkit tools (media tools)
    - Professional tools / AI tools / calculators / CRM tools (as categories)
  - Features:
    - Search
    - Category filters
    - “Working / Coming soon” badge per tool
    - Each tool card: champagne background, gold border, black titles, outline icons (no filled black squares)

**Routing decision (implementation):**
- Keep `/toolkit` but rename it visually and functionally to **JBJ Royal Tools Hub**, and keep existing tool routes (`/toolkit/video-resize-pack`, etc.).
- Add alias route `/royal-tools` → redirects to `/toolkit` (optional, but nice for branding).

**Acceptance checks**
- Every Header/Footer link either:
  - opens a real working page, OR
  - opens the hub section for that tool, OR
  - opens a “Coming Soon” page with explanation (no 404s)

---

### Phase B — Remove duplication (Footer + “Ready to Get Started” + Newsletter) across the whole website

#### B1) Make the global layout the only place that renders footer/cta blocks
- Keep this pattern:
  - `MainLayout.tsx` renders:
    - one global **CombinedContactNewsletter** (the “Ready to Get Started” + “Stay in the Loop” block)
    - one global **Footer**
- Then remove duplicates by:
  1) Removing `<Footer />`, `<NewsletterBand />`, `<DirectContactCTA />`, `<CTABand />` usage from **all page components** under `src/pages/**` (except explicitly excluded back-office routes if needed).
  2) Ensure Toolkit pages do NOT add their own contact/newsletter blocks.
  3) Remove newsletter signup UI from `Footer.tsx` so footer becomes navigation/legal only (since the newsletter will be above it globally).

#### B2) Fix “some pages duplicated, some not”
- Do a repo-wide pass (mechanical refactor) targeting the 116 offending files found via search:
  - Remove `import Footer from "@/components/Footer";`
  - Remove `<Footer />` in JSX
  - Same for DirectContactCTA/NewsletterBand/CTABand where present
- Special note: `MarketReport.tsx` currently imports and renders `Footer` → must be removed.

**Acceptance checks**
- On any public page you only ever see:
  1) page content
  2) one CombinedContactNewsletter section
  3) one Footer navigation section

---

### Phase C — Mode system overhaul (Investor / Broker / Investor+Broker) and dashboards

#### C1) Expand “mode” from 2 states to 3 states
- Current: `UserMode = 'client' | 'broker'`
- New: `UserMode = 'investor' | 'broker' | 'investor_broker'`
- Update:
  - `src/hooks/useUserMode.ts`
  - `src/contexts/UserModeContext.tsx`
  - `user_preferences.selected_mode` usage (it’s a text field; we’ll migrate behavior safely without schema change if possible)

#### C2) Fix ModeSwitcher so it works for all broker roles (and new combined mode)
- Update `ModeSwitcher.tsx`:
  - Broker access check must include:
    - `broker`, `broker_partner`, **`broker_jbj`**
  - Add 3 menu items:
    - Investor
    - Broker
    - Investor + Broker
- Ensure ModeSwitcher appears:
  - In the header account dropdown (already present)
  - On **My Dashboard**
  - On **My Profile** page (so you can change anytime)

#### C3) Merge “Professional Control Center” (BrokerDashboard) into the broker view of the dashboard
- Create a unified dashboard shell so it stays in one place:
  - `/my-dashboard` becomes the main entry point
  - When mode = broker → show broker control center sections + existing MyDashboard cards
  - When mode = investor → show investor dashboard experience
  - When mode = investor_broker → show both, grouped by category (Broker section + Investor section)
- Preserve:
  - Broker hero video and hero section (“Your Professional Control Center”)
- Apply your design rules:
  - No white background pages
  - Use active layer background (`jj-layer-2`)
  - Cards: champagne gradient with gold borders
  - Icons: outline/transparent container, black stroke icons
  - Titles: black

**Acceptance checks**
- Switching mode immediately changes:
  - Dashboard content
  - Visible hubs/shortcuts where applicable
- Mode persists after refresh (DB + localStorage)
- ModeSwitcher never shows disabled incorrectly for JBJ brokers

---

### Phase D — Homepage + Market Report UI fixes you listed

#### D1) Home: AI Home Finder spacing + divider + purple title
- In `Index.tsx`:
  - Remove the `SectionDivider` directly under the AI Home Finder block
  - Adjust vertical spacing to match the global spacing spec
  - Make “AI Home Finder” label fully purple (currently it’s white)

#### D2) Market Report: unify the “book + unlock + welcome back + what you’ll receive + created by” into one continuous layer
- In `MarketReport.tsx`:
  - Remove Footer rendering (Phase B)
  - Change the layout so:
    - The form card + the sidebar cards sit inside **one shared champagne container**
    - No “separate edge-to-edge card” behind the sidebar
  - Ensure titles like “Unlock Your …” in the *internal form section* are black and readable (avoid faded/low-contrast text)
  - The global CombinedContactNewsletter (“Ready to Get Started”) will naturally appear after these sections once footer duplication is removed

**Acceptance checks**
- The whole unlock area looks like one connected premium card system
- Text contrast is strong and readable

---

### Phase E — Reelly sync/extraction not working (admin listing)
This will be handled as a focused repair after the UI/duplication fixes (so we can trust navigation + reduce noise).

Steps:
1) Add a diagnostic “Connection & Permissions” box in `ReellyImportPanel.tsx` that shows:
   - API test success/failure
   - last error message (if any)
   - whether a sync job record can be created
2) Verify backend function calls from the panel:
   - `reelly-api-sync` “test”
   - `reelly-api-sync` “sync”
   - `reelly-areas-sync`
   - `reelly-developers-sync`
3) Confirm database permissions (RLS) allow the authenticated admin/broker to:
   - insert/update into `pending_project_imports`
   - create/update `sync_jobs`

**Acceptance checks**
- “Test API Connection” shows a real result (not silent fail)
- “Sync Projects” creates pending queue items and the approval queue updates

---

### Phase F — Fix the “Bundle generation timed out” edge function deployment issue
This error is a deployment/bundling issue, not a UI issue.

Actions:
1) Refactor `supabase/functions/ai-background-remove/index.ts` to minimize bundling work:
   - Remove the remote std `serve` import and use `Deno.serve(...)` directly
   - Keep code in a single file
   - Ensure CORS headers match the platform-required header list
2) Reduce payload sizes:
   - Validate image input size and reject huge base64 payloads with a clear error
3) Add simple, deterministic response parsing and logging
4) Re-test Background AI end-to-end from the UI

**Acceptance checks**
- Function deploys without timeout
- BackgroundAI tool processes images successfully and returns output reliably

---

## High-confidence “why links don’t work” summary
- `/studio/editor/new` is currently guaranteed to fail (loads a non-existent project id).
- A large number of Footer links point to routes that don’t exist.
- Footer/contact/newsletter duplication is caused by global rendering + local page rendering + footer newsletter content.

---

## Execution order (fastest path to “everything feels fixed”)
1) Phase A2 (fix `/studio/editor/new`) + Phase A1/A3 (registry + Royal Tools Hub)
2) Phase B (remove all duplicates globally; make Footer nav-only)
3) Phase C (3-mode system + dashboard merge + styling compliance)
4) Phase D (Home AI Home Finder + Market Report layout)
5) Phase F (bundle timeout fix) + Phase E (Reelly diagnostics & repair)

