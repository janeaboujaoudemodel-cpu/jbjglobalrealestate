
## Goals (what you will see when this is done)
1. The **Support Ticket Hub shortcut** is visible in your account dropdown (desktop + mobile) and opens correctly.
2. **One Owner Dashboard + one Owner CRM experience** (no more “Owner dashboard → Admin dashboard” confusion).
3. **My Dashboard** stops showing duplicate mode labels, has working “View Full Progress/Activity” links, and quick actions aren’t broken.
4. Account dropdown polish: **JB initials style matches inside profile**, spacing is clean, and it shows **Jane bou Jaoude** (full name).
5. Dashboard cards polish: Activity Overview icons become readable (gold/black).
6. Homepage fixes: **Hero search actually filters results**, Mortgage card removed + layout fixed, Why Dubai scene replaced with Burj Khalifa day→night.
7. Outgoing emails use **NOREPLY@JBJ.AE** everywhere (and we show accurate status if provider domain isn’t verified yet).

---

## What I found (root causes)
### A) “Support Ticket Hub shortcut is missing”
The link **is present in code** in `src/components/header/MegaMenuAccount.tsx`, but it can still be invisible in the UI for two common reasons:
1) **Menu height / no-scroll**: the account mega menu is configured with `noScroll`, and the “Owner Shortcuts” list can overflow and hide lower items (your Support Ticket Hub link is near the bottom).
2) **Mobile menu path**: the **mobile account section** in `src/components/GlobalHeader.tsx` has an Owner Shortcuts list, but it currently **does not include** the Support Ticket Hub entry.

### B) “Two dashboards / two CRMs”
You currently have multiple parallel systems:
- New Owner Command Center: `/owner` (standalone shell) + `OwnerDashboardOverview` etc.
- Legacy owner dashboard: `/owner-dashboard` (old page: `src/pages/OwnerDashboard.tsx`, contains mock content and different UI)
- “Admin CRM” page: `/admin/crm` (shows “Admin Dashboard” header; `src/pages/AdminCRM.tsx`)
- Owner CRM: `/crm` + `/crm/*` (currently Owner-guarded and separate from `/owner`)

This causes the exact duplication you described.

### C) “My Dashboard shows two mode labels”
`src/pages/MyDashboard.tsx` renders:
- a **role badge** (e.g. “Investor”)
- plus an **extra combined-mode badge** (“Investor + Broker”)
So combined mode shows two badges.

### D) “View Full Progress” doesn’t open
In `src/components/dashboard/BadgesLevelCard.tsx`, “View Full Progress” links to `/my-dashboard` (the page you’re already on), so it looks like it does nothing.
Same for “View Full Activity” in `ActivityOverviewCard.tsx`.

### E) “Hero search broken”
`HeroSearchBar` sets URL params like `saleStatus=...`, but `src/pages/PropertiesReelly.tsx` currently reads `status` (different key), so the filter isn’t applied. Several other params the hero sets are also not parsed by the properties page.

### F) Mortgage compact card removal
The “Total Interest” compact card is in `src/components/MortgageCalculator.tsx` (compact grid). Removing it requires updating the grid columns and the Monthly Payment card span.

### G) Why Dubai “weird scene / repeated”
The homepage uses `src/components/home/WhyDubaiCapitalSection.tsx` which rotates through local mp4 scenes. We already have `burj-khalifa-day-to-night.mp4` in `src/assets/videos/` (perfect match for your request). We’ll remove the problematic scene and ensure no duplicates.

---

## Implementation approach (phased, to fix fast without breaking the site)

### Phase 1 — Make the Support Ticket Hub shortcut visible everywhere
**Files**
- `src/components/header/MegaMenuAccount.tsx`
- `src/components/GlobalHeader.tsx`

**Changes**
1) Move “Support Ticket Hub” **up** in the Owner shortcuts list so it’s directly under “CRM Dashboard” (as requested) and not pushed below fold.
2) Remove the dependency on “noScroll” hiding the item:
   - Either enable scrolling inside the right column section, or
   - Reduce vertical padding and convert the owner shortcuts list into a 2-column grid when it gets long.
3) Add the same shortcut to the **mobile Owner Shortcuts** section in `GlobalHeader.tsx` (it’s currently missing there).

**Result**
- You will see “Support Ticket Hub” reliably, desktop + mobile.

---

### Phase 2 — Merge “Owner Dashboard / Admin Dashboard / CRM” into one Owner Command Center
**Files**
- `src/App.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/StandardUserDashboard.tsx`
- `src/components/dashboard/QuickActions.tsx`
- `src/pages/OwnerDashboard.tsx` (legacy)
- `src/pages/AdminCRM.tsx`
- `src/pages/CRM.tsx`
- `src/pages/OwnerDashboardShell.tsx`
- `src/components/owner-dashboard/OwnerSidebarNav.tsx`

**Strategy**
- `/owner` becomes the single place for Owner operations (dashboard + CRM tools + broker oversight).
- Legacy routes become redirects to `/owner` to eliminate duplicates.

**Concrete changes**
1) Change all Owner redirects to **go to `/owner`**:
   - `Dashboard.tsx`: role `owner` → navigate to `/owner` (not `/owner-dashboard`)
   - `StandardUserDashboard.tsx`: owner role redirectPath → `/owner`
2) Deprecate legacy owner dashboard:
   - In `App.tsx`, change route `/owner-dashboard` to `<Navigate to="/owner" replace />`
   - Optionally keep `OwnerDashboard.tsx` but unreachable; or remove later.
3) Stop sending Owners to “AdminCRM”:
   - Remove/replace the “Owner Dashboard” button in `src/pages/CRM.tsx` that currently navigates to `/admin/crm`.
   - In `App.tsx`, change `/admin/crm` to redirect to `/owner` (or `/owner?tab=brokers` if we implement deep linking).
4) Consolidate CRM navigation under `/owner/*`:
   - Add nested routes like:
     - `/owner/leads`
     - `/owner/tasks`
     - `/owner/calendar`
     - `/owner/brokers`
     - `/owner/audit`
   - Update `OwnerSidebarNav.tsx` to point to these `/owner/*` routes (right now it points to `/crm/leads`, which breaks the “standalone owner shell” design and contributes to duplication).
   - Keep `/crm/*` as redirects to `/owner/*` for backward compatibility (so old links still work).
5) Clean up the account dropdown:
   - For Owner accounts, replace “My Dashboard” with “Owner Command Center” (or have “My Dashboard” route redirect owners to `/owner`).

**Result**
- One Owner dashboard and one Owner CRM flow; no “Owner dashboard → Admin dashboard” confusion.

---

### Phase 3 — Fix “My Dashboard” issues (badges, broken links, quick actions)
**Files**
- `src/pages/MyDashboard.tsx`
- `src/components/dashboard/BadgesLevelCard.tsx`
- `src/components/dashboard/ActivityOverviewCard.tsx`
- `src/components/dashboard/QuickActions.tsx`
- Create new pages:
  - `src/pages/MyDashboardProgress.tsx` (or `/my-dashboard/progress`)
  - `src/pages/MyDashboardActivity.tsx` (or `/my-dashboard/activity`)

**Changes**
1) **One label only**:
   - If `isCombinedMode`, show only the combined badge (purple) and do not also show “Investor”.
   - Also align colors with the mode standard (Investor = emerald, Broker = blue, Combined = purple).
2) Fix “View Full Progress”:
   - Create a dedicated progress page and route (e.g. `/my-dashboard/progress`).
   - Update `BadgesLevelCard` button to link there.
3) Fix “View Full Activity”:
   - Create `/my-dashboard/activity` and point ActivityOverview there.
4) Fix Owner quick actions:
   - Update Owner action URLs in `QuickActions.tsx` away from `/owner-dashboard/*` to the new `/owner/*` equivalents (otherwise owners hit dead routes and think the dashboard is broken).
5) Activity Overview icons visibility:
   - Change `Calendar/Flame/TrendingUp` from `text-primary` to `text-gold` (or `text-black` if you prefer) so they remain readable on the champagne/gold card backgrounds.

**Result**
- My Dashboard is coherent, clickable, and doesn’t show duplicate mode labels.

---

### Phase 4 — Account dropdown polish (avatar, spacing, full name)
**Files**
- `src/components/header/MegaMenuAccount.tsx`
- `src/pages/UserProfile.tsx` (optional enhancement)

**Changes**
1) Avatar initials style:
   - Update `AvatarFallback` in MegaMenuAccount to match your inside-profile style: black initials, light gray border, premium background.
2) Spacing:
   - Adjust layout so:
     - “Select your mode” is visually attached to the mode switcher (less gap),
     - “Edit Profile” sits a bit lower with clear separation.
3) Name correctness:
   - For Owner identity, display **Jane bou Jaoude** (locked casing) consistently.
   - Additionally, ensure profile updates propagate:
     - When you save name in `UserProfile.tsx`, also update the CRM profile record (so header/menus never show a shortened name).

**Result**
- The account dropdown looks like a premium “mini profile card” and always shows your correct name.

---

### Phase 5 — Homepage fixes
#### 5.1 Hero search works
**Files**
- `src/pages/PropertiesReelly.tsx`
- `src/components/home/HeroSearchBar.tsx`

**Fix**
- Align query param names:
  - Properties page currently reads `status`, but HeroSearchBar sets `saleStatus`.
  - Update `PropertiesReelly.tsx` to read `saleStatus` and `constructionStatus` (and apply them into filter state).
- Ensure the search term reliably maps:
  - Support both `q` and `search` as synonyms (already partly done).
  
**Result**
- Entering a query in the hero and pressing Search produces visible filtering changes.

#### 5.2 Remove “Total Interest” compact card + fix layout
**File**
- `src/components/MortgageCalculator.tsx`

**Fix**
- Remove the compact “Total Interest” tile.
- Update compact grid from 5 tiles to 4 tiles:
  - Adjust `lg:grid-cols-5` → `lg:grid-cols-4`
  - Rebalance Monthly Payment tile spans so it fits perfectly without awkward gaps.

#### 5.3 Replace the weird Why Dubai scene
**File**
- `src/components/home/WhyDubaiCapitalSection.tsx`

**Fix**
- Remove the problematic scene (likely the Dubai Frame clip causing the “V shape / mosque” confusion).
- Use the existing `burj-khalifa-day-to-night.mp4` as the centerpiece scene and ensure it appears once (no duplicate shots).

---

### Phase 6 — Set sender email to NOREPLY@JBJ.AE everywhere
**Files (backend functions)**
- `supabase/functions/submit-support-ticket/index.ts`
- `supabase/functions/send-ticket-reply-email/index.ts`
- `supabase/functions/resend-support-ticket-confirmation/index.ts`
- `supabase/functions/send-email-otp/index.ts`
- (and any other mail-sending functions that hardcode the old address)

**Changes**
- Replace all “from” addresses to `NOREPLY@JBJ.AE`.
- Update user-facing copy so it no longer references the wrong domain.

**Important note**
- Even with correct sender, emails will only arrive if the email provider has the `jbj.ae` domain verified. We’ll keep the UI truthful (sent vs failed with reason).

---

## End-to-end verification checklist (what you’ll test after implementation)
1) Open account menu (desktop): confirm you can see **Support Ticket Hub** under CRM Dashboard and it clicks through.
2) Open account menu (mobile): confirm the same shortcut exists.
3) Visit `/owner-dashboard` and `/admin/crm` and `/crm`: confirm they no longer create duplicate dashboards (they should redirect to `/owner`).
4) Open `/my-dashboard`:
   - Only one mode label shows (not two).
   - “View Full Progress” opens a dedicated page.
   - Quick actions go to valid pages (no dead ends).
5) Activity Overview icons are readable.
6) Homepage hero search:
   - Search for a known term, confirm results change on `/properties`.
7) Mortgage compact section: “Total Interest” card is gone and layout is clean.
8) Why Dubai: the weird repeated scene is replaced and the Burj day→night scene plays correctly.
9) Create a support ticket: confirmation sender displays as `NOREPLY@JBJ.AE` and delivery status is accurate.

---

## Files expected to change (summary)
- Routing & merge:
  - `src/App.tsx`, `src/pages/Dashboard.tsx`, `src/pages/CRM.tsx`, `src/pages/AdminCRM.tsx`,
  - `src/pages/OwnerDashboard.tsx` (legacy), `src/pages/OwnerDashboardShell.tsx`,
  - `src/components/owner-dashboard/OwnerSidebarNav.tsx`, `src/components/dashboard/StandardUserDashboard.tsx`
- My Dashboard fixes:
  - `src/pages/MyDashboard.tsx`, `src/components/dashboard/BadgesLevelCard.tsx`,
  - `src/components/dashboard/ActivityOverviewCard.tsx`, `src/components/dashboard/QuickActions.tsx`,
  - new: `src/pages/MyDashboardProgress.tsx`, `src/pages/MyDashboardActivity.tsx`
- Account menu:
  - `src/components/header/MegaMenuAccount.tsx`, `src/components/GlobalHeader.tsx`,
  - optional: `src/pages/UserProfile.tsx`
- Homepage:
  - `src/pages/PropertiesReelly.tsx`, `src/components/home/HeroSearchBar.tsx`,
  - `src/components/MortgageCalculator.tsx`, `src/components/home/WhyDubaiCapitalSection.tsx`
- Email sender:
  - `supabase/functions/*` mail-related functions listed above
