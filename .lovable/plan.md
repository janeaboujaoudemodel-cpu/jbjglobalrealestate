
## Objectives (what will be fixed)
1. **Why Dubai video**: Replace the Burj Khalifa scene with a true **drone/aerial motion** shot (same “moving” feel as Palm).
2. **SectionDivider alignment**: Make the dividers **perfectly centered** (especially around the Why Dubai section) with smooth behavior at **tablet breakpoints (768–1024px)**.
3. **Support tickets – confirmation email not received**: Ensure the user **always receives a confirmation email** with the ticket number, and we **store delivery status in the backend** for auditing and follow-up.
4. **Support Ticket Hub**: Build a **staff-only ticket hub** to view tickets, open details, and post replies (with email notifications to the ticket owner).
5. **Homepage mortgage compact card overflow**: Fix “Total Interest” (and any other compact card text) so content **fits inside cards cleanly**.
6. **Explore Services slideshow**: Remove the **dots** and keep only arrows; make arrows **more noticeable (3D + stronger border)**.
7. **Homepage hero search bar**: Re-check and fully fix responsive/interaction issues that are still present.
8. **Header nav pill on scroll**: When header becomes fixed/solid, **expand the navigation pill width** without touching logo (left) or search/utility icons (right).

---

## Key findings from the code (current state)
### A) Why Dubai videos
- `src/components/home/WhyDubaiCapitalSection.tsx` cycles videos:
  - `why-dubai-burj-khalifa.mp4` is currently used for Burj Khalifa.
- Your repo already contains another Burj Khalifa video asset:
  - `src/assets/videos/burj-khalifa-day-to-night.mp4` (likely more “moving/drone-like”).

### B) Divider component
- `src/components/ui/section-divider.tsx` has `fullWidth` mode:
  - `w-full px-6 md:px-12 lg:px-16`
- Homepage uses `SectionDivider fullWidth` before WhyDubai (and again before podcast), but you still see centering issues on real devices.

### C) Support ticket emails
- Backend function: `supabase/functions/submit-support-ticket/index.ts`
- It sends:
  - Support-team email from `NOREPLY@JBJGLOBALREALESTATE.COM` (good)
  - **Customer confirmation email from `onboarding@resend.dev` (bad for deliverability / inconsistent with verified sender)**
- Also: customer email failure is swallowed (logged only), and the frontend still shows success, so we can’t know if the email actually sent.

### D) Tickets backend storage
- Tickets are saved in `public.support_tickets` (already exists).
- There is **no messages/replies table** (no `support_ticket_messages` found), so staff cannot respond in a structured way yet.

### E) Explore Services dots + arrows
- `src/components/home/ExploreServicesCard.tsx` includes:
  - Bottom dots navigation (must be removed)
  - Arrow buttons exist but need stronger 3D + border emphasis

### F) Mortgage calculator compact overflow
- `src/components/MortgageCalculator.tsx` compact mode “Total Interest” card shows a full currency string and multiple lines; it can overflow on smaller widths.

### G) Header nav pill expansion on scroll
- `src/components/GlobalHeader.tsx` pill is centered but remains “content-sized”; you want it wider when `isSolid === true`.

---

## Implementation plan (sequenced, with exact files)

### Phase 1 — Fix support ticket confirmation email + store delivery status (highest priority)
**Goal:** User always receives confirmation email; system stores if email sent/failed.

1) **Change customer email sender to the verified sender**
   - File: `supabase/functions/submit-support-ticket/index.ts`
   - Update customer email `from` to:
     - `JBJ Support <NOREPLY@JBJGLOBALREALESTATE.COM>`
   - Keep support-team email as-is.

2) **Return email delivery status to the frontend**
   - In the function:
     - Capture result for both “support team email” and “customer email”
     - Return fields like:
       - `customerEmailSent: boolean`
       - `customerEmailError?: string` (sanitized)
       - `customerEmailMessageId?: string` (if available)

3) **Persist delivery metadata in the backend**
   - Add columns to `public.support_tickets` via migration:
     - `customer_confirmation_sent_at timestamptz null`
     - `customer_confirmation_status text null` (e.g., sent|failed)
     - `customer_confirmation_error text null` (short, capped)
     - (optional) `customer_confirmation_message_id text null`
   - The function updates these fields after attempting send.

4) **Update UI copy to be truthful**
   - File: `src/components/SupportTicketBox.tsx`
   - If `customerEmailSent=false`:
     - Show a clear message:
       - “Ticket created. Email could not be delivered right now. Your ticket number is shown here.”
     - Provide a “Resend confirmation” button (see below).

5) **Add “Resend confirmation email” capability**
   - New backend function (server-side) e.g. `resend-support-ticket-confirmation`
     - Input: `ticketNumber` + `email`
     - Validates ticket exists and matches email (and/or user_id when authenticated)
     - Sends confirmation again
     - Updates `customer_confirmation_*` columns
   - UI: button on success screen to trigger resend.

**Why this fixes your problem:** Right now the confirmation email uses a sender that is not your verified domain, which is a common reason for emails not arriving. Additionally, you currently have no persisted visibility of whether it was actually sent.

---

### Phase 2 — Build a Support Ticket Hub (staff answers + user can track)
**Goal:** You can follow up and resolve tickets inside the platform; users can see ticket details and replies.

1) **Database tables**
   - Create `public.support_ticket_messages`:
     - `id uuid pk`
     - `ticket_id uuid` (FK to support_tickets)
     - `sender_type text` (user|staff)
     - `sender_user_id uuid null` (when authenticated)
     - `message text not null`
     - `attachment_urls text[] default '{}'`
     - `created_at timestamptz default now()`
   - (Optional) `public.support_ticket_status_events` for audit trail (open → in_review → resolved).

2) **RLS policies**
   - Tickets:
     - Ticket owner (user_id or matching email) can read their own tickets
     - Staff/admin/owner can read all tickets (match your existing staff models)
   - Messages:
     - Ticket owner can read messages for their tickets
     - Staff can read/write messages
   - Keep guest support possible (email-based ownership for read-only where appropriate).

3) **Staff UI (Support Ticket Hub)**
   - New page (owner/staff protected), e.g.:
     - `/customer-happiness/tickets` (or placed inside an owner/admin section)
   - Features:
     - Ticket list with filters (status, priority, created_at)
     - Ticket detail panel (customer info, description, attachments)
     - Reply composer
     - Status update actions (open/in_review/resolved)
   - When staff replies:
     - Insert into `support_ticket_messages`
     - Send email notification to ticket owner with the reply + ticket number

4) **User-facing “My Tickets” view**
   - Show for logged-in users:
     - list of their tickets + detail page with thread
   - For guests:
     - simple “Track ticket” input: email + ticket number → show thread if matches.

**Files likely added/modified (in implementation mode):**
- New pages/components for hub UI
- Update routing in `src/App.tsx` to add staff hub route (protected)
- Add hooks for querying tickets/messages with React Query

---

### Phase 3 — Why Dubai: replace Burj Khalifa scene with drone-like video
**Goal:** Burj Khalifa scene looks like a real moving aerial/drone shot.

1) **Swap the Burj Khalifa video import**
   - File: `src/components/home/WhyDubaiCapitalSection.tsx`
   - Replace `why-dubai-burj-khalifa.mp4` with existing asset:
     - `burj-khalifa-day-to-night.mp4`
   - Keep the rest of the crossfade logic the same.

2) **Video playback polish**
   - Ensure consistent look between scenes:
     - confirm `object-cover`, consistent overlay, consistent `preload`
   - If needed, slightly raise video contrast/brightness to match Palm scene.

---

### Phase 4 — Fix divider centering around Why Dubai (tablet-perfect)
**Goal:** Dividers are mathematically centered and visually aligned at 768–1024px.

1) **Harden SectionDivider fullWidth layout**
   - File: `src/components/ui/section-divider.tsx`
   - Keep full-width padding, but add a centered inner wrapper:
     - `max-w-[1600px] mx-auto w-full`
   - This prevents any “off-center” feel on large/tablet viewports and ensures symmetry.

2) **Audit usage around full-bleed sections**
   - File: `src/pages/Index.tsx`
   - Confirm:
     - divider before WhyDubai uses `fullWidth`
     - divider after WhyDubai uses `fullWidth` (and that it’s truly “after WhyDubai”, not visually grouped with next section)
   - If needed, add small spacing normalization (avoid double-padding when two adjacent sections both have big top/bottom padding).

3) **Visual QA on breakpoints**
   - Validate at:
     - 768×1024 (iPad portrait)
     - 834×1194 (iPad Air)
     - 1024×768 (iPad landscape)

---

### Phase 5 — Homepage mortgage compact: fix “Total Interest” card overflow
**Goal:** Text always fits the card.

1) **Compact number formatting for compact cards**
   - File: `src/components/MortgageCalculator.tsx` (compact mode)
   - Use an abbreviated display for large AED values (K/M) to avoid overflow.
   - Keep the full value in the tooltip (or a secondary line).

2) **Add `truncate` / `leading-tight` / `tabular-nums`**
   - Apply to key text lines inside compact cards to prevent wrapping/breaking.

3) **QA**
   - Test with:
     - high property prices (e.g., 50M AED)
     - long terms (30 years)
     - smaller tablet widths

---

### Phase 6 — Explore Services: remove dots + make arrows 3D and stronger border
**Goal:** No dots; arrows are obvious and premium.

1) **Remove dots navigation**
   - File: `src/components/home/ExploreServicesCard.tsx`
   - Delete the entire dots block.

2) **Upgrade arrow button styling**
   - Same file: enhance arrow buttons:
     - `border-2 border-gold/70`
     - 3D highlight/shadow layers
     - stronger hover glow + slight “lift”
     - ensure good contrast on video background

---

### Phase 7 — Hero search bar “still not fixed”: verify + resolve remaining issues
**Goal:** The hero search bar works flawlessly on mobile/tablet/desktop.

1) **Reproduce the exact failure**
   - Validate:
     - mobile stacking
     - keyboard “Enter” behavior
     - routing to `/properties?...`
     - filter dialog interaction + z-index

2) **Fix based on what’s actually failing**
   - File: `src/components/home/HeroSearchBar.tsx`
   - Common fixes we’ll apply if observed:
     - prevent horizontal overflow (`min-w-0` / `w-full` in the right places)
     - ensure the mobile button row is always visible and aligned
     - ensure popovers/dialogs do not block taps or close unexpectedly

---

### Phase 8 — Header: expand navigation pill on scroll (without touching logo/icons)
**Goal:** When header is solid/fixed, the pill becomes wider (premium), but maintains safe gaps.

1) **Add “expanded pill” state styling when `isSolid`**
   - File: `src/components/GlobalHeader.tsx`
   - On solid header:
     - pill wrapper becomes `w-full`
     - limit by `max-w-[900px]` (tunable)
     - keep nav container `justify-center` and preserve `mx-*` safety margins
   - On transparent header:
     - keep current minimal “floating” pill behavior.

2) **QA**
   - Confirm no collisions with:
     - logo left
     - search icon / utility icons right
   - Confirm smooth transition while scrolling (no jitter).

---

## Testing checklist (end-to-end)
1. Submit a support ticket (guest + logged in) and confirm:
   - ticket saved in backend
   - confirmation email received
   - UI shows truthful “email sent/failed” status
2. Staff hub:
   - staff can see ticket list + details
   - staff reply sends email to user and creates message thread
3. Why Dubai section:
   - Burj Khalifa scene is clearly a moving/drone shot
   - divider above/below is centered on tablets
4. Homepage:
   - mortgage compact cards never overflow
   - Explore Services has no dots, arrows are 3D and noticeable
   - hero search bar works across mobile/tablet/desktop
5. Header:
   - nav pill expands on scroll with no collisions

---

## Files that will be touched (implementation mode)
Frontend:
- `src/components/home/WhyDubaiCapitalSection.tsx`
- `src/components/ui/section-divider.tsx`
- `src/components/SupportTicketBox.tsx`
- `src/components/MortgageCalculator.tsx`
- `src/components/home/ExploreServicesCard.tsx`
- `src/components/home/HeroSearchBar.tsx`
- `src/components/GlobalHeader.tsx`
- `src/App.tsx` (routes for support hub)
- New pages/components for ticket hub + user ticket views

Backend:
- `supabase/functions/submit-support-ticket/index.ts`
- New backend function for resend confirmation
- New backend function for staff reply notification
- New DB migration(s) for:
  - ticket email status columns
  - `support_ticket_messages` table + RLS

