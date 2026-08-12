# JBJ Verification, Email, Theme, Navigation, and Performance Release

## Goal
Complete the open work as one release: fix gated-chat verification, route confidential owner alerts only to `infoo.jane@gmail.com`, replace legacy black/gold email branding, finish the Moon/Sun navigation system, align the developer marquee, remove remaining champagne-on-emerald contrast failures, and verify every affected surface visually and end to end.

## Confirmed current-state findings
- The chat gate writes verification through its own `useConciergeVerification` instance, while the parent chat drawer reads a separate instance. The browser `storage` event does not fire in the same tab, so successful verification can leave the gate visible instead of revealing chat.
- The OTP sender currently uses the old black/gold shared email shell, a large 40px code treatment, and gold-bordered content blocks.
- The OTP sender can return success even when the email provider returns an error, which hides delivery failures.
- Lead notifications currently derive recipients from every profile with an owner role. Other alert functions also contain the old owner email, so confidential notifications are not governed by one destination.
- The verified CRM lead for `infoo.jane@gmail.com` exists, but its stored phone is an obsolete number and must be refreshed by the corrected verified submission flow.
- The sidebar header still renders a champagne surface, a dark-on-light monogram, black wordmark text, and gold divider effects.
- The developer marquee has a heading but no clean divider, and individual logo geometry is still delegated to a general logo component rather than a marquee-specific baseline.
- Moon theme tokens exist, but public dropdown/popover/menu surfaces do not yet have a complete emerald-background/pure-white-content contract.

## Release work

### 1. Make verification open chat reliably
- Give the concierge drawer one authoritative verification state and pass its save/refresh action into the gate.
- Dispatch and listen for a same-tab verification event so every open chat/support surface updates immediately.
- After a valid code, replace the OTP form with the ready chat composer without reload, route change, or an empty intermediate state.
- Preserve verified identity for the allowed 30-day window and clear it correctly on logout/history reset.
- Improve function error handling so provider, verification, rate-limit, and backend errors display their real safe message instead of a generic Edge Function failure.

### 2. Lock confidential owner alerts to one inbox
- Introduce one server-only owner-alert recipient constant containing only `infoo.jane@gmail.com`.
- Apply it to public lead, chat-support, advisory, booking, meeting, logo/media, enrichment, and reminder notifications that contain private visitor or operational data.
- Remove `janeaboujaoudenails@gmail.com` from confidential notification destinations and eliminate role-derived fan-out for these alerts.
- Keep user confirmations addressed only to the submitting user; do not redirect visitor OTP or acknowledgement emails to the owner inbox.
- Keep connected mailbox/calendar identities separate from notification delivery rules so integrations continue to work without receiving confidential alerts unintentionally.

### 3. Rebuild verification and shared email branding
- Replace the black/gold header with the locked emerald-to-black ombré and pure-white JBJ monogram/wordmark/divider.
- Use pearl/white body surfaces, graphite text, emerald accents, and no gold/champagne content on emerald.
- Make the verification email shorter and mobile-first: compact greeting, compact six-digit code field, expiry/security note, and concise footer.
- Keep the code readable without oversized tracking or horizontal overflow on narrow phones.
- Update shared components used by lead acknowledgement and owner-alert emails so new sends have one consistent identity.
- Preserve bilingual content where it already exists, but remove the visually heavy duplicate-card treatment.
- Treat provider non-2xx responses as failures and log/send status accurately.

### 4. Finish the developer partner marquee
- Keep the title above the moving marks: “Partners with Dubai’s Leading Developers.”
- Add one restrained clean divider under the title; no shimmer, boxed plates, or gold animation.
- Give every logo an identical-height slot, optical center, baseline, and white knockout treatment so all marks run on one horizontal line.
- Preserve the top-20 priority order, continuous motion, pause-on-hover, reduced-motion behavior, and valid developer links.
- Prevent remote or unusually shaped marks from changing the strip height or alignment.

### 5. Rebuild sidebar and horizontal header branding
- Sidebar brand block: emerald ombré surface, pure-white monogram and full wordmark, white internal JBJ divider, no gold letters, no champagne plate, no highlighted rectangle around groups.
- Keep every backend chrome bar exactly 56px and restore consistent padding/alignment across the vertical rail and workspace header.
- Remove decorative gold callout dividers from emerald surfaces and use pearl/graphite treatment only on Sun surfaces.
- Public header over photo/video hero: transparent/overlay-safe with pure-white brand, labels, and controls.
- Once the hero is passed: transition to the correct solid theme header without a flash, overlap, or layout shift.
- Owner backend keeps its dedicated stable skin and does not inherit public theme switching.

### 6. Complete Sun/Moon component contracts
- Moon public mode: emerald-to-black dropdowns, popovers, command menus, select lists, active rows, and multi-select panels with pure-white text/icons/checks and accessible white/emerald focus treatment.
- Sun public mode: pearl/champagne dropdown surfaces with graphite text and emerald active states.
- Remove residual blue, gold-on-emerald, black-on-emerald, and pale inherited hover/focus states.
- Cover native selects, Radix menus, popovers, command lists, search filters, developer/tier pickers, account menus, and mobile sheets.
- Keep active labels readable and never clipped, split, or ellipsized.

### 7. Performance and partial-loading repair
- Profile the homepage, filter menus, marquee, header, and chat drawer in the live preview before changing performance-sensitive code.
- Remove remaining render-blocking work and repeated state/measurement loops in the affected components.
- Ensure above-fold sections and controls render immediately; defer only genuinely below-fold media.
- Stabilize image and section dimensions to prevent partial cards, gaps, or layout shifts.
- Verify dropdown open/close responsiveness, route navigation, cold reload, and repeated navigation without blank-screen or forced-reload loops.

## Data and security guardrails
- Do not weaken route protection, role checks, or row-level access controls.
- Do not expose confidential lead alerts on public routes.
- Do not alter connected Google/Outlook account ownership while changing email notification recipients.
- Do not change the official phone number: `+971 54 15 15 015` remains the only published call/WhatsApp number.
- Use JBJ Global Real Estate in all visible branding.

## Validation and proof

### Functional E2E
1. Submit gated chat details with a controlled test identity.
2. Confirm the code arrives at the submitted visitor email with the new emerald template.
3. Enter the code and confirm the chat composer appears immediately in the same drawer.
4. Send a chat message and confirm it remains associated with the verified name, email, and phone.
5. Confirm exactly one confidential owner alert is delivered to `infoo.jane@gmail.com` and no alert is delivered to the retired address.
6. Confirm the backend lead/ticket opens from the alert and shows the same identity and inquiry.
7. Exercise resend, invalid code, expired code, provider failure, close/reopen, logout, and mobile keyboard states.

### Screenshot matrix
Capture proof only through the project QA screenshot helper, with real content loaded:
- Homepage developer marquee: desktop and mobile.
- Sidebar brand/header: expanded and collapsed backend states.
- Public header: over hero and after scroll, in Sun and Moon.
- Developer and tier dropdowns: open, selected, include/exclude, and hover/focus states in Sun and Moon.
- Gated chat: contact form, compact OTP form, verified chat composer, and sent-message state on desktop and mobile.
- Rendered verification email: desktop-width and narrow mobile-width HTML screenshots.
- Owner alert email and destination evidence with private content redacted from shared screenshots.

### Release gates
- No console errors, uncaught promise errors, failed required network requests, blank screenshots, clipped labels, horizontal overflow, or partially rendered sections.
- No black/gold legacy verification header.
- No champagne/gold content on emerald surfaces.
- No private owner alert destination other than `infoo.jane@gmail.com`.
- Deploy every changed backend function, run focused tests, then publish only after all visual and E2E gates pass.
