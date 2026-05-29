# Broker Portal cleanup + Document Studio template merge

## 1. Broker Portal sidebar (`src/components/broker-portal/BrokerPortalSidebar.tsx`)

- **Remove "Request a Form" item entirely** from broker sidebar — this surface is owner-only going forward. Owners reach it from `/owner/forms` in their own backend.
- Confirm every remaining item routes somewhere real and is clickable: Dashboard, CRM, Listings, Calendar, Tasks, Deals & Commissions, JBJ Academy, AI Sales Assistant, Notifications, Settings.
- Block the `/broker/forms` route for non-owner brokers (redirect to `/broker/portal`) so deep links can't reach the form-request page.

## 2. AI Sales Assistant page (`src/pages/AIBrokerWorkspace.tsx` + helpers)

The page the user sees at `/broker/ai` is rendering a dark "AI Broker Workspace" panel with a wrong broker profile (JAJ / `janeaboujaoudenails@gmail.com`, Daily Capacity 0/200, no chat). Issues to fix:

- **Profile identity must come from the signed-in user** (`useAuth` + `useBrokerProfile`), never from a different broker row. Avatar initials = first 2 letters of the signed-in user's display name / email local-part (e.g. `JA` for Jane).
- **Remove the "Daily Capacity 0/200" card** — that's the admin AI-broker capacity widget, not relevant on a broker's own assistant page.
- **Restore the chat panel as the default view**: when no lead is selected, show a general assistant chat box (not a blank right-pane). The chat must accept input and post to the broker AI edge function.
- Strip the dark-themed "JBJ GLOBAL REAL ESTATE / AI Broker Workspace" hero card (the page already has a champagne header in the new design — the dark card is a leftover and overlaps).
- Make sure auth + role resolves once (no re-blink loop) — already done in last turn, just verify the page renders content for owners impersonating broker mode too.

## 3. Marketing Toolkit entry for brokers

- The broker sidebar currently has **no** Marketing Toolkit item (the `/broker/marketing` route redirects to `/broker/portal`). Keep it that way — there is no broken "Open Royal Tools" item to remove from the sidebar.
- Inside `BrokerDashboardLanding`, the "Smart next action" / quick-action area gets a small **"Broker tools"** strip listing only the broker-relevant utilities that actually work today (Caption + translate, Photo enhancer, Background AI, Property suite, Voice suite) as direct in-page links — no redirect to the Royal Tools hub.

## 4. RERA templates → Document Studio (single source of truth)

Today some of these live on a separate forms page. Move/duplicate them into the Document Studio template registry so the Document Studio is the single portal:

- Memorandum of Understanding (MOU)
- Form of Tenancy (Ejari)
- Form A — Listing Agreement (Seller)
- Form B — Buyer Agency Agreement
- Form F — Sales & Purchase Agreement (SPA)
- Form I — Viewing Form
- Form U — Cancellation
- No Objection Certificate (NOC)
- Property Reservation Form

For each, register a template in the Document Studio template list with the existing locked letterhead chrome, multi-page signature rule, and the standard footer/signature lock. Reuse the existing composers in `src/components/document-studio/templates/` where present; for any missing ones, add minimal composer files following the locked signature + gold divider standard so they slot into the existing renderer.

The owner-only `/owner/forms` page stays — it's the request inbox brokers file into. Generation now happens **only** in Document Studio.

## Out of scope for this pass

- Rebuilding the AI assistant's backend logic (we'll just wire the UI to the existing edge function).
- Repointing every external link to the new Document Studio templates — done in a follow-up.

## Technical notes

- Sidebar: edit `ITEMS` array in `BrokerPortalSidebar.tsx`, delete the `/broker/forms` row.
- Route guard: in `BrokerPortalRoutes.tsx`, wrap `/broker/forms` with an `isOwner`-only guard (or replace with `<Navigate to="/broker/portal" />` when not owner).
- AI workspace: replace the dark JAJ card section with a thin header bound to `useAuth()` user; delete the capacity card; mount `AssistantChat` in the right pane unconditionally (with `hasLead={false}` when none selected).
- Document Studio templates: extend the template manifest used by `<DocumentStudio>` to include the 9 RERA templates; each composer wraps content in explicit `page(n, ...)` sections and uses `LockedLetterhead` / `LockedFooter` per the Signature+Gold Divider Lock memory.
