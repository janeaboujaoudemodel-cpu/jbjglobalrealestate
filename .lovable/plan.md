

## Plan: CRM & Owner Command Center — Performance, Bugs, and Leads Management

### Issues Identified

**1. Owner Command Center Performance (Slow/Dead)**
- The dashboard fires 7 parallel `useQuery` calls on mount (total leads, new leads, pending tasks, active conversations, newest leads, follow-up items, recent conversations). Each hits a different table.
- The `CRMLeadsTableV2` inside tabs also fetches all leads + states + assignments on mount, even when the tab isn't visible.
- "Return to Site" navigates to `/` which triggers full app re-render — feels slow.

**2. CRM Status Column — Blue divider & far arrow**
- `InlineStatusSelect` uses a Radix `Select` with `border-0 bg-transparent` on the trigger, but the `SelectTrigger` still renders the default chevron/arrow far to the right. The blue divider comes from the "New" status badge's blue dot + potential left border styling from category headers in the dropdown.
- Fix: Remove the chevron from `SelectTrigger`, ensure no left border/divider on status cells.

**3. Status Dropdown — Gold borders around dots**
- In `InlineStatusSelect`, the `SelectContent` has `border-2 border-gold/30`. The category headers have `border-b border-gold/20`. The user wants: no gold border around the dropdown content, just the dots centered.
- Fix: Remove `border-2 border-gold/30` from `SelectContent`, keep minimal styling.

**4. Assign Broker — Shows "No broker found"**
- `LeadAssignModal` on step "list" fetches `crm_users_profile` and filters by `crm_role`. For "brokers" it filters `crm_role === "broker_member"`. The DB only has `owner_admin` and `sales_director` roles — no `broker_member` exists, hence "No broker found".
- Fix: Include `sales_director` and other relevant roles in the broker filter. Also show all active CRM users when "Employees" is chosen.

**5. Assign Broker — No visual confirmation**
- After assignment via `LeadAssignModal`, it calls `onSuccess` which triggers `fetchLeads()`. The `assignedNames` map should update. But the broker name display in the table cell shows "Unassigned" if the assignment RPC doesn't insert into `crm_lead_assignments` properly, or the follow-up query doesn't pick it up.
- Fix: After assignment success, force refetch and show the assigned name immediately. Also send a notification to the assigned user.

**6. Message button — "No phone number available"**
- `handleWhatsApp` in `CRMLeadsTableV2` checks `lead.phone_e164`. If the lead has a phone number stored but the field name differs, it won't find it. The phone is visible on screen but the `phone_e164` field might be null while `phone` has the value.
- Fix: Also check fallback phone fields.

**7. Email button — Doesn't open email client**
- `handleEmail` uses `window.location.href = mailto:...` which should work. But if `email_lower` is null while `email` field has a value, it won't trigger.
- Fix: Check both `email_lower` and `email` fields.

**8. Date column — Missing time**
- `formatDisplayDate` only outputs "02 Jan 2026" without time. The user wants to see the time leads were received.
- Fix: Update to include time: "02 Jan 2026 14:30".

**9. Missing "Leads Management" tab next to VIP Leads**
- User wants a dedicated tab for leads management with recently deleted leads, restore capability, etc.
- Fix: Add a "Leads Management" tab in the CRM page tabs (next to VIP Leads) with Recently Deleted section.

### Implementation Steps

**A. Fix Performance — Owner Command Center**
- Add `staleTime: 5 * 60 * 1000` and `refetchOnWindowFocus: false` to ALL queries (some already have it, ensure consistency).
- Lazy-render `TabsContent` for leads/flagged/vip/employees tabs — only mount the heavy `CRMLeadsTableV2` when the tab is active using conditional rendering.
- This prevents 3+ heavy table components from mounting and fetching data simultaneously.

**B. Fix InlineStatusSelect UI**
- In `InlineStatusSelect.tsx`:
  - Remove default chevron from `SelectTrigger` by adding a custom trigger without the arrow icon.
  - Remove `border-2 border-gold/30` from `SelectContent`.
  - Keep category dot indicators but remove bordered section headers' gold borders.

**C. Fix LeadAssignModal — Broker filtering**
- In `LeadAssignModal.tsx` line 106: Change broker filter from `crm_role === "broker_member"` to include `sales_director`, `broker_member`, and any non-admin roles.
- For employees: include `admin`, `founder`, `owner_admin`, `sales_director`.

**D. Fix Contact Actions (Phone/Email)**
- In `CRMLeadsTableV2.tsx`:
  - `handleWhatsApp`: Also check `(lead as any).phone` as fallback.
  - `handleEmail`: Also check `(lead as any).email` as fallback.
  - Same for `handleCall`.

**E. Fix Date Format — Include Time**
- In `formatDate.ts`: Update `formatDisplayDate` to include time (HH:mm) when the input has time information.
- In `CRMLeadsTableV2.tsx` line 443: The `created_at` ISO string contains time, so `formatDisplayDate` should output "02 Jan 2026 14:30".

**F. Add "Leads Management" Tab**
- In `CRM.tsx` and `OwnerDashboardOverview.tsx`: Add a new tab "Leads Management" next to "VIP Leads".
- Include a "Recently Deleted" section showing soft-deleted leads with a "Restore" button.
- Include status filters for managing lead lifecycle.

**G. Add Notification on Assignment**
- After successful assignment in `LeadAssignModal`, insert a notification into `user_notifications` for the assigned user.

### Files to Modify
- `src/components/crm/InlineStatusSelect.tsx` — Remove blue divider, gold borders, fix arrow
- `src/components/crm/CRMLeadsTableV2.tsx` — Fix phone/email fallbacks, date with time
- `src/components/crm/LeadAssignModal.tsx` — Fix broker role filter, add notification
- `src/utils/formatDate.ts` — Add time to date format
- `src/pages/OwnerDashboardOverview.tsx` — Lazy-render tabs, performance
- `src/pages/CRM.tsx` — Add Leads Management tab
- New: `src/components/crm/RecentlyDeletedLeads.tsx` — Recently deleted leads section

