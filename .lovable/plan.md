## Goal

Four user-reported gaps on `/owner/crm/relationships` → Developer Registry:

1. Only 93 developers listed — need a comprehensive UAE developer directory (200+) with office address, phone, website, and a primary contact person per developer.
2. The contact person (name / role / phone / email) added to a developer must be visible directly on the registry card — without opening edit.
3. The "Send Registration" dialog is too narrow; the email column is cut off and requires scrolling right. Widen it and let the email body render fully.
4. The "Open Pack" / Google Drive button currently shows a JBJ "JavaScript required" splash because it's pointing to the app instead of the actual Drive folder. Make it open the real Drive URL in a new tab.

---

## What changes

### 1. Massive developer directory expansion

Replace the hardcoded 93-row `seed_crm_developer_registry()` SQL function with a fuller, researched UAE developer dataset (~220 rows) covering Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, UAQ. Each row carries:

- `developer_name`
- `developer_email` (broker/channel-partner inbox)
- `phone` (HQ switchboard)
- `website`
- `emirate`
- `developer_contact` JSONB → `{ name, role, phone, email }` for the published broker-relations contact where publicly known; left empty `{}` where unknown so the user can fill it in.

Sources for the new list: existing `developers` table (633 slugs already in the project), `uae_developers` table, public broker-relations directories (Dubai Land Department developer registry, Abu Dhabi DMT registry, public LinkedIn/company-website "Brokers" pages). Add common Dubai names currently missing such as Iman Developers, AYS, Sankari, Five, Wellington, Q Properties, Vincitore, Mered, Mira, Refine, Crown, ORO24, Beyond by Omniyat, GFH, Lootah, Modon, Aldar, etc., plus Northern-Emirate developers (Arada, Alef Group, Tilal Properties, Manazel, RAK Properties, Al Hamra, Eagle Hills Sharjah, Imkan, Ajmal Makan, Shurooq, Arabian Hills, Al Marjan Island, etc.).

The seed function will be `INSERT … ON CONFLICT (owner_id, developer_slug) DO UPDATE` — running "Pre-fill" on an account that already has rows will **enrich** existing entries (fill in missing phone/website/contact) rather than skipping them, without overwriting the user's manual edits to `notes`, `agency_code`, `status`, etc.

### 2. Contact person visible on the registry card

In `CRMRelationships.tsx` registry list (around line 713), add a second row under the email/phone/emirate strip:

```text
👤 Mohammed Khan · Broker Relations Manager · +971 50 ••• ••••  ✉ m.khan@developer.ae
```

- Pulls from `r.developer_contact?.name / role / phone / email`.
- Renders only when at least one field is present.
- Phone & email are clickable (`tel:` / `mailto:`).
- Falls back to a small grey "+ Add contact person" button that opens the existing edit dialog focused on the contact section.

### 3. Wider Send Registration dialog with readable email preview

In `BulkSendDialog.tsx`:

- Change `DialogContent` from `max-w-3xl` to `max-w-6xl w-[95vw]` so on desktop the dialog uses ~1200 px instead of ~768 px.
- Re-flow the body into a 2-column grid (`lg:grid-cols-[360px_1fr]`):
  - **Left column**: variant picker, test field, skip-recent toggle, recipient list with live status.
  - **Right column**: full-height iframe email preview (`min-h-[520px]`), subject line, From/To, locked badge — no horizontal scroll, full text visible.
- The preview iframe gets `width: 100%` and `min-height: 520px` so the email renders at its natural width.
- Mobile collapses back to a single column automatically.

### 4. Fix the "Open Pack" / Google Drive link

The blank "JBJ Global Real Estate — JavaScript required" page happens because the button is rendering with a relative href (or a `<button>` with no real navigation) and the SPA catches the click. Fix in `DocumentPackPanel`:

- Render the open-pack button as a real `<a href={settings.drive_doc_pack_url} target="_blank" rel="noopener noreferrer">` styled like a button.
- Validate the stored URL: if it doesn't start with `http`, show a red helper line "Paste a full https://drive.google.com/… link". 
- Add a small "Test link" inline action that does `window.open(url, "_blank")` so the user can verify before sending.

The same fix is applied wherever the doc-pack link is surfaced (the Send dialog footer note, the per-developer Send button tooltip).

---

## Files touched

- `supabase/migrations/<new>.sql` — replace `seed_crm_developer_registry()` with the expanded ON-CONFLICT-DO-UPDATE version covering ~220 UAE developers + contact metadata. No schema changes (all columns already exist).
- `src/pages/CRMRelationships.tsx` — add inline contact-person row on each registry card; fix Open Pack button to be a real anchor; minor "Add contact person" empty-state link.
- `src/components/crm/BulkSendDialog.tsx` — widen dialog, switch to 2-column layout, enlarge iframe preview.

No changes needed to the edge function, RLS policies, or the email template itself.

---

## Out of scope

- Live scraping of every developer's website to auto-fill the broker-relations contact. We seed what is publicly known and clearly leave the rest blank for the user to enrich (matches how the registry already works).
- Building a separate "Address book" table for multiple contacts per developer — for now we keep one primary contact in the existing `developer_contact` JSONB; multi-contact support can follow if needed.
- Pulling delivery webhooks from Resend into `email_send_log` (already noted as future work in the previous plan).
