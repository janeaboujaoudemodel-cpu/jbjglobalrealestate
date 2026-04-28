## Goal

Replace the current one-by-one "Send Registration" flow with a complete bulk outreach console for the 93 developers, plus a locked branded ivory/champagne email template with two variants:
1. **New registration request** (default)
2. **Confirm already-registered** (for developers we're already on the books with)

Editable until you click **Lock template** — after that, every send uses the locked HTML; no further edits possible.

---

## What you'll see (UI flow)

On `/owner/crm/relationships` → **Developer Registry** tab, replace the current list with a new **Outreach Console**:

1. **Top bar**: search, status filter, emirate filter, "Email status" filter (Not sent / Sent / Confirmed registered).
2. **Bulk selection**: checkbox on every row + "Select all filtered" + "Select none". Counter shows `X of 93 selected`.
3. **Per-row badge**: 
   - `Email Sent · 2 days ago` (green) when `last_outreach_at` exists
   - `Confirmed` (gold) when status = `registered`
   - Nothing when never contacted
4. **Notes**: inline expandable note field per row, autosaves to `crm_developer_registry.notes`.
5. **Contact info**: each row shows email, phone, emirate/location (added via enrichment + manual edit).
6. **Action buttons** (top right):
   - **Edit Template** (disabled when locked)
   - **Send TEST to me** → sends the chosen variant to your own inbox (`infoo.jane@gmail.com`) so you verify look first
   - **Send to Selected (N)** → opens confirm modal showing variant + recipient count, then sends sequentially
7. **Variant toggle** at the top of the send modal: "New registration request" vs "Confirm we're already registered".

After a successful send for each developer:
- `last_outreach_at`, `outreach_count` update (already wired)
- Status auto-bumps `not_started → pending_application` (already wired)
- Row immediately shows the green **Email Sent** badge
- Toast: `Email sent to AAA Development (1 / 12)…`

You can manually flip any developer's status to `registered` from the inline status pill — it's already there.

---

## The locked email template

**Style** (ivory/champagne with gold accents on black text — exactly as you described):

```text
┌────────────────────────────────────────────┐
│  [JBJ monogram]                            │
│  ────────── gold hairline ──────────       │
│                                            │
│  JBJ GLOBAL REAL ESTATE                    │  ← gold, letterspaced
│  Broker Registration Request               │  ← black serif heading
│                                            │
│  Dear {Developer} Broker Relations Team,   │
│                                            │
│  [editable body — black on cream]          │
│                                            │
│  ┌──────────────────────────────────┐      │
│  │  Open Document Pack  →           │      │  ← black button, gold border
│  └──────────────────────────────────┘      │
│                                            │
│  Reply: contact@jbj.ae · CC: infoo.jane    │
│                                            │
│  Warm regards,                             │
│  JBJ Team                                  │  ← gold signature
│  ────────── gold hairline ──────────       │
│  RERA Licensed · Dubai, UAE                │
└────────────────────────────────────────────┘
```

Palette: background `#FAF5EA` (ivory cream), card `#FFFDF7`, text `#0a0a0a`, accent `#C9A86A` (champagne gold), divider `#E8D9B8`. Inter font.

**Variant 2** ("Confirm already-registered") replaces the body and CTA:
> "Could you kindly confirm that JBJ Global Real Estate is currently active and registered as a broker partner with {Developer}? If our agency code or commission tier needs renewal, please let us know what's required."
> CTA: `Reply to confirm` (mailto link).

**Lock workflow**: 
- Template stored in new table `crm_email_templates` (variant, subject, html, locked_at, locked_by). 
- `Edit Template` modal lets you tweak subject + body. 
- **Lock template** button writes `locked_at = now()`. After that, the edit modal is read-only with a "🔒 Template locked on {date}" banner. Unlock requires deleting the row from DB (intentional — matches your "cannot change later at all" requirement).

---

## Contact-data enrichment

You said: *"Add contact details, also the number of them, including their location for all developers."* All 93 currently have only the synthetic `brokers@<domain>` email and no phone/location. To populate:

- Add a one-shot **Enrich All** button that calls existing `enrich-developer-data` edge function (already in the project) which fills `phone`, `emirate`, `website` from the linked `uae_developers` and Reelly sources where available.
- Anything still empty stays editable inline (click the row's pencil to edit phone/emirate).
- Will not invent phone numbers — only fills from real sources. Empty cells render as `—` so you can fill them manually.

---

## Technical changes

**Database migration**:
- New table `crm_email_templates(variant text PK, subject text, html text, locked_at timestamptz, locked_by uuid, updated_at timestamptz)` with RLS owner-only.
- Seed two rows: `developer_registration` and `developer_confirm_registered` with the ivory/champagne HTML.

**Edge function** `crm-send-developer-registration/index.ts` updates:
- Accept `variant: "developer_registration" | "developer_confirm_registered"` and `testRecipient?: string`.
- Load HTML from `crm_email_templates` instead of hardcoded `buildHtml`. If `locked_at` is null, still allow sending but warn (`X-Template-Unlocked: true` header). If locked, use exactly the stored HTML with `{{developer_name}}` substitution.
- When `testRecipient` provided, send to that address only and skip the registry update / log insert.

**Frontend** (`src/pages/CRMRelationships.tsx` + `src/hooks/useCRMRelationships.ts`):
- Add `useEmailTemplate(variant)`, `useUpsertEmailTemplate`, `useLockEmailTemplate` hooks.
- New components: `<TemplateEditorDialog>`, `<BulkSendDialog>`, `<DeveloperRow>` (with checkbox, notes inline editor, sent badge, contact cells).
- Replace existing list section (lines ~600–638) with `<DeveloperOutreachConsole>`.
- Sequential send loop with 800ms throttle (already exists) — extend to update each row's badge in cache as it completes via `queryClient.setQueryData`.

**Bulk send safety**:
- Confirm dialog: shows count, variant, sample recipients, total cost (Gmail rate-limited at ~1/sec).
- "Skip already-sent in last 7 days" checkbox (default ON) — filters out anyone with `last_outreach_at > now() - 7 days`.

---

## Out of scope / honest caveats

- I cannot scrape or invent phone numbers / locations that aren't in the database. The enrichment button only pulls from existing `uae_developers` + Reelly. You'll need to fill the rest manually (the UI makes that easy).
- The "lock" is enforced in app logic + DB flag — a developer with DB access could technically override it. Hard immutability would require putting the HTML in code, which we explicitly don't want since you need to edit before locking.
- Test send goes to `infoo.jane@gmail.com` by default (from `cc_email`). Change in Document Pack panel if you want it elsewhere.

---

## Files touched

- `supabase/migrations/<new>_crm_email_templates.sql` (new table + seed)
- `supabase/functions/crm-send-developer-registration/index.ts` (variants, test mode, template loading)
- `src/hooks/useCRMRelationships.ts` (template hooks, bulk send helpers)
- `src/pages/CRMRelationships.tsx` (Developer Registry tab rewrite)
- `src/components/crm/TemplateEditorDialog.tsx` (new)
- `src/components/crm/BulkSendDialog.tsx` (new)
