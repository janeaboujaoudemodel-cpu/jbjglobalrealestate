
Diagnosis and explanation (why this happened)
- The Owner sidebar item “Royal Tools Hub” is currently hardwired to `/owner/toolkit` in `OwnerSidebarNav.tsx`.
- In `OwnerRoutes.tsx`, `/owner/toolkit` renders `RoyalToolsHub` (`src/pages/toolkit/RoyalToolsHub.tsx`), which is the champagne/gold page you said you do not want.
- Your colorful categorized page is `AIHub` at direct link: `/ai-hub` (`src/pages/AIHub.tsx`).
- So this is a route wiring mismatch, not a missing page.

Direct links
- Legacy page currently shown from owner sidebar: `/owner/toolkit`
- Main colorful hub you want as canonical: `/ai-hub`

Approved decisions captured
- Owner sidebar should open AI Hub only.
- Legacy `/owner/toolkit` should redirect to `/ai-hub`.
- “Marketing Department” sender should stay a department label (not person name).
- Personal mailbox should use normal send until personal API key is connected.

Implementation plan (global fix, end-to-end)

1) AI Hub consolidation + owner navigation correction
- Update owner sidebar “Royal Tools Hub” path from `/owner/toolkit` to `/ai-hub`.
- Convert `/owner/toolkit` route to redirect -> `/ai-hub` (backward-compatible).
- Keep one canonical tools directory only (AI Hub), remove duplicate owner entry points.
- Add/verify redirects from any old toolkit hubs into `/ai-hub` where appropriate.

2) Merge tool registries (no duplicates)
- Build one shared source of truth for AI Hub tool cards (merge current `AIHub.tsx` data with `royalToolsRegistry`).
- Deduplicate by normalized slug/link.
- Keep existing tools in AI Hub; only add missing tools from legacy registry.
- Preserve colorful categorized UI/search/filter as canonical presentation.
- Keep role visibility rules (broker/developer-only tools stay restricted).

3) Owner shell header/layout fixes for Team Chat + Email Client
- Owner shell currently has Founder bar, but not the same horizontal utility bar behavior as front-end.
- Add the same utility bar experience above owner content where needed (no empty strip above Founder & CEO).
- Normalize offsets:
  - top spacing = utility bar 48px + owner header
  - content containers use consistent non-overlapping height calculations.
- Apply same correction to `/owner/team-chat` and `/owner/email-client` so neither touches/collides with header.

4) Email system architecture: connect Email Client to real backend inbox flow
- Replace demo-only `EmailClient.tsx` behavior with backend-backed inbox channels.
- Reuse existing owner communication backbone (threads/messages/AI reply) so Email Client and Inbox share data instead of split systems.
- Add “Personal / Company” segmented inbox switch with unified “All”.
- Add “Send as” selector with role labels (Owner, Amanda, HR, Admin, Front Desk, Help Desk, Marketing Department, Personal).
- Add final “Approve and Send” confirmation modal with large preview and selected sender signature block.

5) Company vs personal sending logic (as requested)
- Company account:
  - Default send method = Resend API ON.
  - Manual toggle available: “Send via Resend” vs “Send normally”.
- Personal account:
  - Default = normal send now.
  - Add “Connect personal API key” settings section with submit flow.
  - Once personal key is connected, personal account can switch to API mode without code changes.
- Add clear send-path badges in composer and sent logs (Normal/API).

6) Assistant automation layer (Amanda)
- Add “Pending emails / Alerts / Tasks to do / Suggested replies” panel inside email workflow.
- For each selected thread:
  - bilingual summary (English + Arabic),
  - suggested professional draft,
  - follow-up recommendation.
- One-click actions:
  - create task,
  - create reminder,
  - add calendar follow-up,
  - set thread status (needs reply/follow-up/waiting/closed).
- Keep this in both company and personal views.

7) Chat/email cross-notification rules (global logic update)
- In Chat:
  - default: chat-only send.
  - optional toggle: also notify by email.
- In Email:
  - default: email-only send.
  - conditional toggle appears only if recipient maps to an internal registered user/contact -> “also notify in chat”.
- Internal users (known employee/account match) can be notified both ways.
- External unknown contacts remain email-only unless mapped later.

8) Signatures, stamp, and document attachments integration
- Add compose-side quick inserts:
  - email signature block,
  - personal/company signature variants,
  - company stamp,
  - e-signature card,
  - letterhead/contract/form attachments from existing tools.
- Add “Send to chat too” for internal recipients.
- In team chat, add “also send by email” toggle for selected internal contact.

9) Security hardening before feature expansion (critical)
- Fix permissive RLS introduced in recent migration:
  - `meeting_requests` and `email_signatures` currently allow broad authenticated access (`USING true`), which is unsafe.
- Replace with owner-scoped policies using role checks (`has_role(auth.uid(),'admin')` or equivalent owner checks) and strict row ownership where needed.
- Harden `employee_chat_messages` identity model:
  - stop using literal `sender_id='current-user'` pattern;
  - use authenticated user IDs and policy-safe joins/mapping.
- Ensure API keys are never exposed client-side; outbound providers are called only from backend functions.

10) Delivery sequence
- Phase 1: Route/header fixes + AI hub consolidation (visible fix first).
- Phase 2: Email client backend wiring + send-as + approve/send preview.
- Phase 3: Amanda bilingual summaries + task/calendar automation.
- Phase 4: Chat/email bridge toggles + signature/stamp/doc integrations.
- Phase 5: Personal API key onboarding flow + security hardening + regression pass.

Acceptance criteria
- Clicking Owner “Royal Tools Hub” opens the colorful `/ai-hub` only.
- `/owner/toolkit` redirects to `/ai-hub`.
- No duplicate hub pages in owner navigation.
- Email and Team Chat no longer touch Founder header; utility bar appears correctly.
- Company emails default to API mode with override; personal remains normal until key connected.
- “Approve and Send” preview shows selected sender identity/signature.
- Amanda provides EN+AR summaries and suggested replies.
- Chat/email dual-delivery toggles follow internal-vs-external rules.
- RLS policies are tightened (no permissive true policies for sensitive owner data).
