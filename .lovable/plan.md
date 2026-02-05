
## Goal
Finish the “remaining updates” you approved, while also fixing the root cause of the duplicated footer problem (page-level Footer/MainLayout usage inside routes that are already wrapped by `MainLayoutWrapper`), and updating homepage ordering so “Ready to Get Started” comes after the Support Ticket block with “Stay in the Loop” connected inside it.

This work will **not redesign** anything. It will **connect/reorder** existing approved sections and **remove only duplicates** that are caused by pages rendering their own footer/layout inside the global layout.

---

## What’s actually causing “two footers”
Right now, almost all routes are wrapped by:

- `src/components/MainLayoutWrapper.tsx` → renders `<MainLayout><Outlet/></MainLayout>`

And `MainLayout.tsx` always renders the global pre-footer + footer:

- `<DirectContactCTA />`
- `<NewsletterBand />`
- `<Footer />`

But several pages (including the homepage) **also render `<Footer />`** themselves, and a few pages (including `/profile` and `/my-dashboard`) **wrap their content in `<MainLayout>` again**, creating nested layouts (double header/footer stacks).

So the only correct fix is:
1) Pages inside `MainLayoutWrapper` must not render `<Footer />` directly.
2) Pages inside `MainLayoutWrapper` must not wrap themselves in `<MainLayout>`.

---

## Implementation Phases (in the exact order I will execute)

### Phase 1 — Immediate fix: Homepage footer duplication + correct section order
**Files:**
- `src/pages/Index.tsx`

**Changes:**
1. Remove page-level `<Footer />` usage (and its import).  
   This instantly eliminates the “second footer” on `/`.
2. Ensure “Support Ticket” is the last content section of the homepage body (before the global pre-footer area rendered by `MainLayout`).
3. Remove/relocate the page-level `CTABand` so that “Ready to Get Started” is not appearing above Support Ticket anymore.
   - We will not “delete” the experience; we will move that CTA responsibility to the global area (Phase 2) so it renders **after** Support Ticket.

**Acceptance (Homepage):**
- Scrolling bottom shows:
  - Support Ticket block
  - Then the “Ready to Get Started” combined CTA (Contact + Newsletter as one block)
  - Then a single footer
- No duplicate footer remains.

**Screenshot proof to capture:**
- Bottom of homepage showing Support Ticket → combined CTA → one footer.

---

### Phase 2 — Create the “Connected” CTA block (Contact + Newsletter in one continuous card)
**Files (new + edits):**
- Create `src/components/CombinedContactNewsletter.tsx`
- Edit `src/components/MainLayout.tsx`

**Changes:**
1. Implement `CombinedContactNewsletter` as a **single premium container** that includes:
   - Contact cards (WhatsApp / Call / Email) in the **exact same visual system** as `DirectContactCTA`
   - A subtle internal divider
   - “Stay in the Loop” title + `NewsletterBrevo` compact form
2. Update `MainLayout.tsx` to render:
   - **On homepage (`/`)**: render `CombinedContactNewsletter` configured to show the headline **“Ready to Get Started?”** and flow “Contact → Subscribe”.
   - **On other public pages**: keep existing global behavior unless we explicitly opt-in later.
3. Prevent duplicate rendering:
   - When `CombinedContactNewsletter` is used, do not also render the separate `DirectContactCTA` + `NewsletterBand` underneath.

**Acceptance:**
- “Stay in the Loop” feels inside/connected to the CTA block (one container, one flow).
- No new colors/buttons are introduced.

**Screenshot proof to capture:**
- Homepage combined block visible and clearly “Contact → Subscribe”.

---

### Phase 3 — Stop nested layout duplication on My Dashboard + My Profile (major contributor to “double footer” across account pages)
**Files:**
- `src/pages/MyDashboard.tsx`
- `src/pages/UserProfile.tsx`

**Changes:**
1. Remove `<MainLayout>` wrappers from both pages.
   - These pages are already inside `MainLayoutWrapper`, so they must return their content directly.
2. Remove any page-level `<Footer />` usage/imports (UserProfile currently imports `Footer`).
3. Keep the same approved UI containers inside the page body (black base + champagne wrapper) so the look does not change—only the duplication disappears.

**Acceptance:**
- `/my-dashboard` shows one header and one footer.
- `/profile` shows one header and one footer.

**Screenshot proof to capture:**
- `/my-dashboard` bottom showing only one footer.
- `/profile` bottom showing only one footer.

---

### Phase 4 — Finish “Update user” work: initials badge + account menu details + dashboard shortcut
#### 4.1 Account icon must show 2 initials
**File:**
- `src/components/GlobalHeader.tsx`

**Changes:**
- Replace the current header “User” icon button with:
  - If logged in: avatar (photo if exists) or initials fallback (2 letters)
  - If logged out: keep the User icon
- Initials logic: first + family name initials (2 chars), matching the already-used pattern in `MegaMenuAccount`.

**Acceptance:**
- Header account badge shows “JB” style initials when no photo.

**Screenshot proof:**
- Header showing initials badge.

#### 4.2 Account dropdown must show: full name + role label + level label + “My Dashboard”
**File:**
- `src/components/header/MegaMenuAccount.tsx`

**Changes:**
- Add role label:
  - Use existing role data source (`user_role_selections` via `useUserRole()`).
  - Display as readable badge: Client / Partner Broker / JBJ Employee Broker (mapped from existing roles in your system).
- Add level label:
  - Use `useTierProgress()` and display current tier name (Starter/Rising/Performer/Elite/Legend).
- Ensure “My Dashboard” exists as a single link label (already present) and routes to `/my-dashboard`.

**Acceptance:**
- Dropdown shows:
  - Full name (not just first name)
  - Role badge
  - Level badge
  - My Dashboard link

**Screenshot proof:**
- Account dropdown open showing “My Dashboard” + role + level.

---

### Phase 5 — Footer update: add “My Dashboard” link + prevent duplicate footers site-wide
#### 5.1 Add “My Dashboard” link into footer navigation
**File:**
- `src/components/Footer.tsx`

**Changes:**
- Add a single “My Dashboard” item in an appropriate column (recommendation: Broker Hub or Investor Hub block).
- Ensure no duplicate label appears elsewhere in footer.

**Acceptance:**
- Footer contains “My Dashboard” and routes to `/my-dashboard` without 404.

**Screenshot proof:**
- Footer navigation showing “My Dashboard”.

#### 5.2 Remove page-level `<Footer />` usage (system-wide cleanup)
**Files (bulk edits):**
- Many files under `src/pages/**` currently render `<Footer />` directly (112+ files found via search).

**Changes:**
- Remove `<Footer />` from page components across `src/pages/**` that are inside `MainLayoutWrapper`.
- Remove associated imports.

**Why this is necessary:**
- It is the only reliable way to guarantee “one footer” across all pages without fragile DOM hacks.

**Acceptance:**
- No route shows two footers.

**Screenshot proof:**
- Spot-check 3–5 major pages (Home, Services, Broker Education, Project detail, Profile) showing a single footer.

---

### Phase 6 — Connect Broker Education sections (continuous journey)
**File:**
- `src/pages/BrokerEducation.tsx`

**Changes:**
1. Insert a “bridge” connector between “About This Program” and “Education Library”:
   - 1–2 lines: “Program overview → library resources → training path”
   - Small arrow/visual cue
2. Adjust spacing so the scroll feels continuous:
   - Reduce the “end of section / start of next section” gap by tightening `py-*` around the transition.
3. Update headings minimally to communicate the journey (no redesign).

**Acceptance:**
- About → Library reads like one continuous experience.

**Screenshot proof:**
- One screenshot showing About + bridge + Library in one scroll view.

---

### Phase 7 — Newsletter UX: premium popup confirmation (no reload)
**Files:**
- `src/components/marketing/NewsletterBrevo.tsx`
- `src/components/marketing/SubscriptionSuccessModal.tsx` (already exists; will be wired in)

**Changes:**
1. Keep the same backend save flow (`capture-lead` + best-effort newsletter subscribe).
2. Replace success toast-only behavior with opening the premium modal:
   - Title: “You’re in.”
   - Message: “Thank you for subscribing to JBJ Global Real Estate updates.”
   - Include the “My Account → My Profile → Settings” path guidance
3. Confirm form submission never reloads (already uses `e.preventDefault()`; we will preserve this behavior).

**Acceptance:**
- Subscribe does not reload page.
- Modal appears on success.

**Screenshot proof:**
- Modal visible after subscribing.

---

### Phase 8 — Notification settings inside Profile (finish the approved scope)
**Files:**
- `src/pages/UserProfile.tsx`
- `src/hooks/useNotificationPreferences.ts` (already created; will be used)

**Changes:**
1. Make `My Profile` respect `?tab=settings` route navigation:
   - Read query param and open Settings tab.
2. Build notification toggles inside Settings tab using backend persistence:
   - Email notifications
   - In-app notifications (push_notifications)
   - Browser notifications (permission + saved flag)
   - Master “Turn off all”
3. Ensure the toggles reflect saved state after refresh (load from backend via the hook).

**Acceptance:**
- Toggle state persists after refresh.
- Clicking “Manage Notification Settings” from the subscription modal opens Profile directly on Settings.

**Screenshot proof:**
- Profile → Settings tab showing toggles.
- After refresh, same toggle state remains.

---

## Deliverables you requested (what I will provide during implementation)
1) A checklist of requested items marked Complete/Incomplete (as we finish them).
2) Screenshots after each phase:
   - Home bottom: Support Ticket → combined CTA → single footer
   - Account dropdown showing My Dashboard + role + level
   - Footer showing My Dashboard link
   - Broker Education bridge connector
   - Subscription success modal
   - Profile settings toggles + persistence
3) Confirmation that:
   - No new UI system was added
   - Only duplicates were removed; approved sections remain
   - Only one footer is rendered on public pages

---

## Files that will be edited/created (high-confidence list)
**Create:**
- `src/components/CombinedContactNewsletter.tsx`

**Edit (core):**
- `src/pages/Index.tsx`
- `src/components/MainLayout.tsx`
- `src/pages/UserProfile.tsx`
- `src/pages/MyDashboard.tsx`
- `src/components/GlobalHeader.tsx`
- `src/components/header/MegaMenuAccount.tsx`
- `src/components/Footer.tsx`
- `src/components/marketing/NewsletterBrevo.tsx`

**Edit (bulk cleanup):**
- Many `src/pages/**` files removing direct `<Footer />` usage (and any page-level `<MainLayout>` wrapping where applicable)

---

## Risk controls (so we don’t break approved UI)
- All changes are “wiring” and duplication removal; no palette/button system changes.
- Home page adjustments are done by removing duplicates and letting the global layout render the final CTA block after Support Ticket.
- We will keep the current spacing rhythm (`py-12 md:py-16`) and Layer 1/2/3 rules intact.
