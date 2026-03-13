

## Strategy: Freemium Browse with Action Gating

### Current State
`MainLayoutWrapper` wraps **all** public routes with `AuthGate`, which hard-redirects every unauthenticated visitor to `/auth`. This means nobody can see any page without logging in first.

### New Model
Split the platform into two tiers:

**Tier 1 — Browse Freely (no login required):**
- Home page, Properties listing, Project details, Communities, Developers, Areas
- Guides (buyer, seller, visa, rent, tenant, landlord)
- Services pages, About, Founder, Awards, Team, News, FAQ, Legal pages
- Market Intelligence, Education Hub, Pricing, Sitemap
- Contact, Reviews, Partners

**Tier 2 — Action-Gated (login required to interact):**
- Dashboards (My Dashboard, Investor, Broker)
- Favorites, Compare, Documents, Spreadsheet
- Portals (Client, Broker, Developer, Listing)
- AI tools, AI Hub, Broker Workspace
- Profile, Account, Onboarding
- All Owner/Admin routes (already separately guarded)
- Any **action** on a browsable page (e.g. "Save to Favorites", "Request Callback", "Book Consultation", "Download Report")

### Implementation Plan

**1. Replace hard AuthGate with soft ActionGate system**
- Remove `AuthGate` from `MainLayoutWrapper` so all main layout pages render for everyone
- Create a new `ActionGateProvider` context that provides a `requireAuth(reason)` function
- When an unauthenticated user triggers a gated action, show a premium signup modal instead of redirecting
- The modal explains benefits: personalized recommendations, loyalty points, premium tools, tailored marketing, account safety

**2. Create `ActionGateModal` — the premium signup prompt**
- Luxurious branded modal (matching existing black/gold design language)
- Headline: "Unlock the Full JBJ Global Experience"
- Benefits list: Loyalty points on every activity (redeemable on purchases/subscriptions), personalized project recommendations, portfolio tracking, exclusive market reports, priority access to launches
- Two CTAs: "Create Free Account" and "Sign In"
- Non-dismissible for action routes; dismissible (with "Continue Browsing") for inline actions

**3. Create `AuthRequiredRoute` wrapper for Tier 2 routes**
- A lighter gate that redirects to `/auth` with returnTo for dashboard/portal routes
- Applied only to the specific routes that are fully behind login (dashboards, portals, tools)

**4. Protect inline actions across browsable pages**
- Wrap action buttons (Save, Compare, Download, Book, Request) with `requireAuth()` check
- Common pattern: `onClick={() => user ? doAction() : requireAuth('save_favorite')}`
- Create a `useActionGate()` hook that returns a `gatedAction(callback, reason)` wrapper

**5. Session persistence (already implemented)**
- Supabase client already has `persistSession: true` and `autoRefreshToken: true`
- Returning users with valid session tokens are automatically logged in — no re-prompt
- Session survives browser close, tab switch, and next-day return

**6. Update WelcomeModal for browse mode**
- Instead of only offering "Sign In", show a softer welcome that lets the user "Explore the Platform" or "Sign In for Full Access"
- First-time visitors see the welcome, then browse freely
- The action gate triggers naturally when they try to do something

**7. Update memory rule**
- The mandatory-authentication-standard memory will be updated to reflect the new "browse-free, action-gated" model

### Security Model
- All sensitive data remains behind RLS policies tied to `auth.uid()` — unauthenticated users cannot read private data
- Browsable pages only show public project/listing data (already `is_published = true`)
- No credentials are exposed; session tokens are handled entirely by the auth SDK
- Owner/Admin routes remain fully guarded by `OwnerGuard` (unchanged)
- Action gate is enforced both client-side (UX) and server-side (RLS blocks unauthorized writes)

### Files to Create/Modify
- **Create** `src/contexts/ActionGateContext.tsx` — provider + `useActionGate` hook
- **Create** `src/components/ActionGateModal.tsx` — premium signup modal
- **Create** `src/components/AuthRequiredRoute.tsx` — route-level gate for Tier 2
- **Modify** `src/components/MainLayoutWrapper.tsx` — remove `AuthGate`, add `ActionGateProvider`
- **Modify** `src/components/WelcomeModal.tsx` — add "Explore" option alongside "Sign In"
- **Modify** `src/routes/PublicRoutes.tsx` — wrap Tier 2 routes with `AuthRequiredRoute`
- **Modify** key action components across browsable pages to use `gatedAction()` for buttons like Save, Compare, Download, Book

