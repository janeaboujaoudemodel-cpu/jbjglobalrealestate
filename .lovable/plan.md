
# Full-width "Before we lock your seats" card + restore toggle + DLD import blank-screen fix

## 1. Card restyle — both brokerage templates

Two locked DB templates contain the bordered card today:

- `brokerage_partnership_intro`
- `brokerage_breakfast_invite`

The shrunk look comes from this opening tag (paraphrased from DB):

```html
<div class="jbj-flat" style="margin:22px 0; padding:18px 20px;
  background:#FDFBF7; border:1px solid #B89555; border-radius:12px; …">
  <div>Before we lock your seats</div>
  …
</div>
```

**Change:** rewrite both rows so the card matches the surrounding sections —
no border, no inner background box, no rounded corners, full container width:

```html
<div class="jbj-flat" style="margin:24px 0 8px; padding:0;
  background:transparent; border:0; border-radius:0;
  font-size:13.5px; color:#1A1A1A; line-height:1.7">
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;
              font-weight:700;margin-bottom:10px">Before we lock your seats</div>
  …existing copy…
</div>
```

Class `jbj-flat` is preserved so the restore toggle (below) can re-style
the same node. Done via a single migration that `UPDATE`s `crm_email_templates`
for both variants. Templates remain "locked" (we are the owner editing).

## 2. Preview-only "Restore bordered card" toggle

Add a small toggle in `src/components/crm/BulkSendDialog.tsx` (right next to
the existing **Hide/Show preview** button):

```text
[ Hide preview ]  [ ◼ Bordered card ]
```

Implementation:
- New `useState<boolean>` `borderedCard`, default `false`.
- When `true`, the preview iframe injects a `<style>` block that
  re-applies the original look on `.jbj-flat`:
  ```css
  .jbj-flat{ padding:18px 20px !important;
             background:#FDFBF7 !important;
             border:1px solid #B89555 !important;
             border-radius:12px !important; }
  ```
- The toggle is **preview-only** — does NOT change the locked template
  or the bytes that get sent. The send path always uses the bare
  full-width version saved in the DB.

This satisfies "keep for me a toggle, restore card, so I can click on it
anytime in the preview and restore the border" without breaking the
preview-equals-sent contract.

## 3. Runtime error — `crm-import-dld-brokerages` blank screen

The reported error has `lineno:0, colno:0, stack:"not_applicable"`,
meaning the function failed to boot/import — Deno couldn't load the
module, so the page that calls it received nothing and rendered blank.

Investigate the import chain:
- `requireOwnerAuth` from `../_shared/owner-auth-middleware.ts`
- Verify the file exists, has no top-level throw, and exports the symbol.
- Verify the `serve` import (the file uses `Deno.serve` directly — fine)
  and that no other top-level statement throws during cold start.

Fix:
- If the middleware import is broken, switch to the standard pattern
  `import { serve } from "https://deno.land/std@0.177.0/http/server.ts"`
  and inline an explicit owner-email allowlist guard (same pattern as
  `crm-send-brokerage-outreach`).
- Wrap any top-level fetch / env reads in the request handler so a
  missing env var can't crash module load.
- Add a try/catch around the handler that always returns JSON 500
  with CORS headers — this prevents the caller from getting an empty
  response that triggers the blank screen.

Also harden the **caller** so a failed DLD import never produces a blank
screen: catch the `supabase.functions.invoke` rejection and toast the
error instead of letting it bubble into a render crash.

## Files touched

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | UPDATE both brokerage templates: bare full-width card |
| `src/components/crm/BulkSendDialog.tsx` | Add `borderedCard` toggle + style injection in preview iframe |
| `supabase/functions/crm-import-dld-brokerages/index.ts` | Harden boot path: safe imports, top-level try/catch, JSON-500 fallback |
| Caller of DLD import (likely `src/pages/CRMRelationships.tsx` or related) | Wrap invoke in try/catch + toast |

## Verification

1. Open a brokerage in CRM → Bulk Send → preview shows the "Before we
   lock your seats" copy flush with the surrounding sections, no
   border, no box.
2. Toggle **Bordered card** → border + champagne background reappear in
   the preview only.
3. Send a test email → received message has the **bare full-width**
   version (toggle has no effect on send).
4. Trigger DLD import → no blank screen; on success the toast shows the
   imported count, on failure a red toast shows the error message.
