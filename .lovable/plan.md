## Goal

Fix `TemplateEditorDialog` (the "New registration request / Confirm we are already registered" email template editor) so that:

1. The dialog fills the screen — the email preview is fully readable in one view, with vertical scroll only.
2. The buttons (Save, Lock, Hide/Show Preview, variant toggles, Close) work correctly and have proper contrast.
3. A new **"Send test email"** panel lets the user fire off the live template to any address (prefilled with their own).

## File

`src/components/crm/TemplateEditorDialog.tsx` — full rewrite (existing component, ~140 lines).

No new edge functions, no new hooks, no DB changes. The infrastructure already exists:

- `useSendDeveloperRegistration` (in `src/hooks/useCRMRelationships.ts`) already supports `testRecipient` / `testDeveloperName` / `variant`.
- The edge function `crm-send-developer-registration` already handles test mode (prefixes subject with `[TEST]`, no DB logging, no CC).
- The send goes through the existing email pipeline (Resend, already connected).

## Layout changes

```text
DialogContent: w-[96vw], h-[94vh], flex column, overflow hidden
├── Header (sticky, bordered)
├── Variant toolbar row (sticky)
└── Body: flex-1 min-h-0
    ├── Editor column   (overflow-y-auto only)
    │   ├── Subject input
    │   ├── HTML textarea (rows=18)
    │   └── "Send test email" panel:
    │         • Send to (prefilled with auth.user.email)
    │         • Sample developer name
    │         • [Send test email] button
    └── Preview column  (iframe flex-1, fills remaining height)
        srcDoc = html with placeholders substituted
```

Result: no horizontal scrolling, preview iframe stretches to ~80vh tall, only the editor column scrolls vertically when content overflows.

## Button fixes

- Variant toggles, Close, Hide/Show Preview, Save changes, Lock template: explicit `text-black` / `bg-black text-white` to comply with the project's white-dominant monochrome rules and avoid faded-gold contrast issues.
- Save / Lock / Send-test buttons get loading states (spinner + disabled while pending).

## Send-test behavior

- Reuses existing `useSendDeveloperRegistration({ variant, testRecipient, testDeveloperName })`.
- On success the existing hook already toasts: *"Test email sent to {recipient}"*.
- Light client-side email regex guard before invoking; server is the source of truth.
- Prefills the email field once per dialog open from `supabase.auth.getUser()`.

## Out of scope

- No changes to the edge function, the registration table, the email template HTML, or any send wiring elsewhere in the CRM.
- No design-token or theme changes.

After approval I'll implement the rewrite in a single file edit.