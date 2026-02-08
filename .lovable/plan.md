

## Summary of Incomplete Tasks

Based on my audit, the following tasks from the approved plan were **NOT completed**:

### 1. Staff Support Ticket Hub (Phase 2) - NOT BUILT
The database infrastructure exists (`support_tickets` table with all columns, `support_ticket_messages` table), but **no UI or page was created** for staff to:
- View all tickets in a list with filters (status, priority, date)
- Open ticket detail panels with customer info
- Post replies (which insert into `support_ticket_messages`)
- Update ticket status (open/in_progress/resolved)
- Trigger email notifications to customers when replying

### 2. Resend Confirmation Email Capability (Phase 1.5) - NOT BUILT
The backend function `resend-support-ticket-confirmation` was **never created**. This function should:
- Accept `ticketNumber` + `email` as inputs
- Validate the ticket exists and matches the email
- Re-send the confirmation email
- Update the `customer_confirmation_*` columns

### 3. User-Facing "My Tickets" View (Phase 2.4) - NOT BUILT
No UI exists for:
- Logged-in users to see their ticket history + thread
- Guests to track tickets via email + ticket number lookup

### 4. Header Nav Pill Expansion on Scroll (Phase 8) - NOT IMPLEMENTED
The `GlobalHeader.tsx` nav pill does not expand when `isSolid` is true (scrolled state).

### 5. Hero Search Bar Fixes (Phase 7) - NOT VERIFIED/FIXED
No specific fixes were applied to `HeroSearchBar.tsx` for the reported responsive/interaction issues.

---

## Implementation Plan

### Phase A: Staff Support Ticket Hub (Priority 1)

**Goal**: Build an Owner-protected page where staff can manage all support tickets.

#### A.1 - Create Support Ticket Hub Page
- **New file**: `src/pages/SupportTicketHub.tsx`
- Features:
  - Ticket list table with columns: Ticket #, Customer, Subject, Category, Priority, Status, Created
  - Filters: Status dropdown, Priority dropdown, Search by ticket # or email
  - Sort by created date (newest first)
  - Click row to open detail panel

#### A.2 - Ticket Detail Panel Component
- **New file**: `src/components/support/TicketDetailPanel.tsx`
- Shows:
  - Full customer info (name, email, phone)
  - Ticket subject, category, description
  - Attachment links
  - Message thread (from `support_ticket_messages`)
  - Status badge + action buttons (Mark In Progress, Resolve, Reopen)
  - Reply composer textarea + send button

#### A.3 - Hooks for Data Fetching
- **New file**: `src/hooks/useSupportTickets.ts`
  - `useSupportTickets(filters)` - fetch ticket list with React Query
  - `useSupportTicketDetail(ticketId)` - fetch single ticket + messages
  - `useSendTicketReply()` - mutation to insert message + trigger email

#### A.4 - Backend: Staff Reply Email Notification
- **New file**: `supabase/functions/send-ticket-reply-email/index.ts`
- Triggered when staff posts a reply
- Sends email to ticket owner with the reply content

#### A.5 - Add Route to App.tsx
- Add `/customer-happiness/tickets` wrapped in `<OwnerGuard>`

---

### Phase B: Resend Confirmation Email Function

**Goal**: Allow users to resend their confirmation email if it failed.

#### B.1 - Create Edge Function
- **New file**: `supabase/functions/resend-support-ticket-confirmation/index.ts`
- Input: `{ ticketNumber: string, email: string }`
- Logic:
  1. Query `support_tickets` where `ticket_number = ticketNumber` AND `email = email`
  2. If not found, return 404
  3. Re-send confirmation email using Resend
  4. Update `customer_confirmation_*` columns
  5. Return success/failure

#### B.2 - Add Resend Button to Success Screen
- **Modify**: `src/components/SupportTicketBox.tsx`
- Show "Resend Confirmation" button if `customerEmailSent === false`
- Wire to new edge function

---

### Phase C: User "My Tickets" View

**Goal**: Let authenticated users see their ticket history and guests track by ticket number.

#### C.1 - My Tickets Page
- **New file**: `src/pages/client/MyTickets.tsx`
- For authenticated users:
  - List their tickets (filtered by `user_id` or `email`)
  - Click to view thread
- For guests:
  - "Track Ticket" form: email + ticket number
  - On match, show read-only ticket + thread

#### C.2 - Add Route
- Add `/my-tickets` or `/track-ticket` route

---

### Phase D: Header Nav Pill Expansion on Scroll

**Goal**: When header becomes solid (scrolled), expand the nav pill width.

#### D.1 - Modify GlobalHeader.tsx
- When `isSolid === true`:
  - Pill wrapper transitions from `w-auto` to `w-full max-w-[900px]`
  - Maintain `mx-auto` centering
  - Add `transition-all duration-300` for smooth animation
- When transparent:
  - Keep current minimal floating pill

---

### Phase E: Hero Search Bar Verification

**Goal**: Ensure the search bar works correctly on all viewports.

#### E.1 - Review Current Issues
- Check for:
  - Horizontal overflow on mobile
  - Button visibility and alignment
  - Filter dialog z-index issues
  - Enter key behavior for search submission

#### E.2 - Apply Fixes
- Add `min-w-0` and `overflow-hidden` where needed
- Ensure mobile button row is always visible
- Fix any z-index conflicts with dialogs/popovers

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/SupportTicketHub.tsx` | Staff ticket management dashboard |
| `src/components/support/TicketDetailPanel.tsx` | Single ticket detail + reply UI |
| `src/hooks/useSupportTickets.ts` | Data fetching hooks for tickets |
| `supabase/functions/send-ticket-reply-email/index.ts` | Email customer when staff replies |
| `supabase/functions/resend-support-ticket-confirmation/index.ts` | Resend confirmation email |
| `src/pages/client/MyTickets.tsx` | User ticket history / guest tracking |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for ticket hub + my tickets |
| `src/components/SupportTicketBox.tsx` | Add resend button on failure |
| `src/components/GlobalHeader.tsx` | Nav pill expansion on scroll |
| `src/components/home/HeroSearchBar.tsx` | Responsive fixes |

---

## Testing Checklist

1. **Staff Hub**: Owner can view all tickets, filter, open details, post replies
2. **Reply Email**: Customer receives email when staff replies
3. **Resend Confirmation**: User can resend confirmation email if it failed
4. **My Tickets**: Authenticated users see their tickets; guests can track by number
5. **Header**: Nav pill expands on scroll without touching logo/icons
6. **Search Bar**: Works on mobile/tablet/desktop without overflow or interaction bugs

