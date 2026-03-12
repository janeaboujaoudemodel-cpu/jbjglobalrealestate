
Goal: fix “My Shortcuts” so they actually show the right hubs by role, open the correct pages when clicked, and provide visual proof with screenshots.

1) Root-cause fixes (from current code)
- `AIChatWidget.tsx`: many new shortcut IDs (`owner_command`, `crm_dashboard`, `admin_panel`, etc.) are mapped to `"general"` chat service, so clicking does not open those hubs.
- `useUserRole.ts`: role loading exits early from `localStorage`, so role/permission changes in backend can stay stale.
- `QuickActions.tsx`: owner shortcut visibility depends only on selected role, not server-verified owner status; one route is invalid (`/owner/cv-center` does not exist).
- `MegaMenuAccount.tsx`: owner shortcut column is still incomplete vs your requested main hubs.

2) Implementation plan
- Update role/access resolution in `useUserRole.ts`
  - Keep localStorage only as fast initial fallback.
  - Always refresh from backend when authenticated.
  - Expose explicit flags for shortcut eligibility (owner-verified + CRM-assigned access).
- Upgrade all shortcut surfaces (not just one)
  - `ChatShortcuts.tsx`: enforce full role-based shortcut sets:
    - Owner: Owner Command Center, CRM, Admin Panel, Listing Admin, Inbox/Enquiries, Customer Happiness, CV Center, Email Client, Team Chat, Automations.
    - JBJ broker with CRM assigned: CRM + broker shortcuts.
    - JBJ broker without CRM assignment: only normal user shortcuts (tasks/favorites/shortlist/books/notifications/dashboard).
    - Non-owner users: no owner hubs.
  - `QuickActions.tsx`: align with same access rules; fix invalid CV link to existing route (`/hr-dashboard?tab=cv-center`).
  - `MegaMenuAccount.tsx`: expand Owner Shortcuts column to include all requested main hubs consistently.
- Make shortcuts open actual hubs
  - `AIChatWidget.tsx`: split shortcut behavior into:
    - Navigation shortcuts -> route immediately.
    - Chat intent shortcuts (buy/rent/sell/etc.) -> continue chat flow.
  - Ensure owner/admin hub shortcuts navigate directly to their pages.
- Responsive/layout hardening
  - Ensure shortcut cards remain readable (no clipping/compression) on phone/iPad/laptop by tightening spacing rules and overflow behavior where needed.

3) Files to update
- `src/hooks/useUserRole.ts`
- `src/components/chat/ChatShortcuts.tsx`
- `src/components/AIChatWidget.tsx`
- `src/components/dashboard/QuickActions.tsx`
- `src/components/header/MegaMenuAccount.tsx`

4) Proof plan (screenshots after implementation)
I will capture and send screenshots for:
- Desktop (current viewport): Owner shortcuts showing all requested hubs.
- iPad viewport: same shortcuts visible and readable.
- Mobile viewport: same shortcuts visible and usable.
- Click proof: at least these opens confirmed from shortcut taps:
  - Owner Command Center
  - CRM Dashboard
  - Admin Panel
  - Listing Admin
  - Inbox/Enquiries
  - Customer Happiness
  - CV Center
  - Email Client

5) Success criteria
- Owner sees all requested hubs in shortcuts.
- Non-owner never sees owner-only hubs.
- JBJ broker only sees CRM shortcut after CRM assignment.
- Shortcut clicks open the intended page (not generic chat).
- Screenshots provided across devices as proof.
