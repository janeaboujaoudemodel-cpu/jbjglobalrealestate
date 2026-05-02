
## What's wrong today
1. **Tabs (Brokerages / Developer Registry) glue together** — `TabsList` uses `inline-flex` with no gap and no divider, so the trigger labels visually butt up against each other. Active tab is `bg-[#B89555]` (gold fill) which violates our **No Gold Fills** rule, and on hover the inactive tab loses its label color contrast.
2. **Only 138 brokerages** — the seed function caps at `target_per_emirate: 200`, only a few emirates have data (UAQ 46, Fujairah 25, Dubai 34) and Perplexity returns very few real RERA firms per pass. There's no Google Maps / Instagram / website enrichment, so most rows are missing phone, email, location, social.
3. **"UAE Directory" label is confusing** — it appears 5 times (badge, sub-tab, summary chip, tooltip, big pill). User wants it gone.
4. **Agents vs Brokers KPIs are duplicated** — `estimated_agent_count` and `active_broker_count` mean the same thing in UAE context. No "top active agents" list.
5. **No clickable contact links** — `email`, `phone`, `office_address`, `website`, `instagram_url` are rendered as plain text (and Instagram column doesn't exist on the table).
6. **Sender identity wrong for brokerages** — outreach goes from "JBJ Global Real Estate <contact@jbj.ae>". User wants each brokerage email to come from the **represented developer** (e.g. "Emaar Channel Partner Activation"), not JBJ. Developer-registration emails stay JBJ as today.
7. **No live test email yet** — user wants a real outreach email to land in `infoo.jane@gmail.com` so she can review the template.

---

## Plan

### 1. Tab + sub-tab UI repair (`src/pages/CRMRelationships.tsx`, `BrokeragesTab`)
- Add `gap-2` and a 1px gold hairline divider (`divide-x divide-[#B89555]/30`) between the two main tabs; replace gold-fill active state with **cream + ink + 1px gold border** per `mem://constraints/no-gold-fills`.
- Same fix on the sub-tabs row (All / UAE Directory / My Additions / Existing Matches): change active from `bg-[#B89555] text-white` to `bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60`. Inactive tabs keep their label always visible (no hover-only color).
- Strip the wording "UAE Directory" everywhere it appears in this tab (badge → "RERA-Licensed", sub-tab label → "Licensed Directory", summary chip → "Licensed", tooltip rewritten plainly: *"Licensed = pre-loaded RERA / DMT brokerages. My Additions = ones you added. Existing Matches = your additions that match a licensed firm."*) Keep the tooltip help button.

### 2. Brokerage card rework
- **Remove the duplicate "Brokers" KPI tile.** Keep one tile labelled **"Agents"** (`estimated_agent_count`), and add three new tiles: **"Top Closer"** (free-text name from the new column), **"Open Inquiries"**, **"Deals"**.
- Render contact data as clickable links with `<IconTile>` icons:
  - Email → `mailto:`
  - Phone → `tel:` (with WhatsApp shortcut if `whatsapp_e164` set)
  - Office address → `https://www.google.com/maps/search/?api=1&query=…` (or `office_map_url` when present)
  - Website → external link
  - Instagram → external link
- All links open in a new tab with `rel="noopener"`, gold hairline underline only.

### 3. Schema additions (single migration)
Add to `crm_brokerages`:
- `instagram_url text`
- `top_active_agents jsonb default '[]'` — array of `{ name, role, deals_count }`
- `office_map_url text` (already exists in places, ensure column is present and reused)

Backfill `office_map_url` from `office_address` via Google Maps search URL on next enrichment pass. Keep existing curated data untouched (only fill blanks). Update `src/integrations/supabase/types.ts` is auto-regenerated.

### 4. Edit dialog + AddBrokerage form
Add inputs for Instagram URL and "Top active agents" (repeatable rows: Name + role + closed-deals count). Existing Agents number remains; remove the separate Brokers field from the form. Wire to upsert hook.

### 5. Full-UAE brokerage scale-up
Two-stage edge-function refactor:
- **`seed-uae-brokerage-directory`**: raise cap (`target_per_emirate` default 600, max 1500), broaden authority hints to also include Google Maps / Justlandia / Bayut / Property Finder broker pages as cross-references, and request `instagram_url` + `office_map_url` in the JSON schema. Stays Perplexity Sonar Pro grounded; never invents license numbers.
- **`enrich-uae-brokerage-directory`**: extend to also fetch `instagram_url`, `office_map_url`, `estimated_agent_count`, and `top_active_agents` for any row missing them, using a Perplexity prompt scoped to the firm's licensed name + emirate. Continues to **only fill blanks** (curated data preserved). Run in batches of 5.

After deploy, run "Sync UAE brokerage directory" for **all emirates** with `target_per_emirate: 600`, then run "Enrich brokerages" several times until the queue is empty. Expected ~2000+ verified firms.

### 6. Sender identity = represented developer (brokerages only)
- Add `crm_brokerages.represented_developer_id uuid` (FK → `crm_developer_registry.id`) and `represented_developer_name text` cached.
- In `crm-send-brokerage-outreach`:
  - Resolve represented developer (per-row override → owner default if set in `crm_owner_settings.default_brokerage_sender_developer_id` → fallback to "Channel Partner Activation").
  - Build From header as `${developer_name} Channel Partner Activation <contact@jbj.ae>` (Gmail still sends; Reply-To = `contact@jbj.ae`).
  - Subject template tokens add `{{represented_developer_name}}`; default subject becomes `"Private Briefing — ${represented_developer_name} × ${brokerage_name}"`.
  - Body intro becomes *"This is Jane from the Sales & Channel Partner Activation team at ${represented_developer_name}, in partnership with JBJ Global Real Estate…"* — invitation to private breakfast briefing + check-our-registration prompt. Templates updated in `crm_email_templates` for `brokerage_partnership_intro` and `brokerage_breakfast_invite` only.
  - Developer-registration emails (`developer_registration`, `developer_confirm_registered`) stay branded as JBJ — unchanged.
- Add a "Represented Developer" picker in `BulkSendDialog` and on each brokerage card so user can override per-row.

### 7. Live test email to infoo.jane@gmail.com
After steps 1-6 deploy:
- Run `crm-send-brokerage-outreach` with `variant=brokerage_partnership_intro`, `testRecipient=infoo.jane@gmail.com`, `testBrokerageName="Sample Brokerage Group"`, `personalization={ contactName:"Sample Manager", groupStatus:"prospective" }`, and a representative developer (Emaar) picked for the From header.
- Verify Gmail send returned 200, capture `messageId`, post a confirmation in the chat.

### 8. Memory + tests
- Add `mem://features/crm/uae-brokerage-directory-and-channel-outreach` documenting: no "UAE Directory" wording, cream-bordered tabs, per-brokerage represented-developer sender, single Agents KPI + Top Closer.
- Update `mem://features/listing-admin/provident-portal-and-enrichment-standard-v1-locked` to cite the new enrichment fields.
- Vitest snapshot: `BrokeragesTab` renders no "UAE Directory" string and no `bg-[#B89555]` on tabs.

---

## Technical details (for reference)

```text
Files touched
─────────────
src/pages/CRMRelationships.tsx          — tabs, sub-tabs, KPI strip, contact link row, edit dialog
src/components/crm/BulkSendDialog.tsx   — represented-developer picker, send-test panel
src/components/crm/DirectoryToolsPanel.tsx — copy update ("UAE Directory" → "Licensed Directory")
src/hooks/useCRMRelationships.ts        — types: instagram_url, top_active_agents, represented_developer_*
supabase/migrations/<new>.sql            — add columns + index
supabase/functions/seed-uae-brokerage-directory/index.ts        — schema + cap raise
supabase/functions/enrich-uae-brokerage-directory/index.ts      — IG, maps, agents, top-closers
supabase/functions/crm-send-brokerage-outreach/index.ts         — sender = represented developer
crm_email_templates rows                 — updated HTML + subject (insert tool, not migration)
__tests__/BrokeragesTab.test.tsx        — guard test
mem://features/crm/uae-brokerage-directory-and-channel-outreach — new memory
```

```text
Sender header example (after change)
────────────────────────────────────
From:     Emaar Channel Partner Activation <contact@jbj.ae>
Reply-To: contact@jbj.ae
Cc:       infoo.jane@gmail.com (when CC enabled)
Subject:  Private Briefing — Emaar × Sample Brokerage Group
```

```text
KPI strip (after change)
────────────────────────
[ Rating ] [ Agents ] [ Top Closer ] [ Inquiries ] [ Deals ] [ Last Deal ]
```

No data is deleted; the existing 138 brokerage rows stay and get enriched in place.
