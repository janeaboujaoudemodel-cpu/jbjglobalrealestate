# Developers + Brokerages Outreach Schema

This document describes the **shared outreach field set** added to both
`crm_developer_registry` and `crm_brokerages`, plus the supporting tables
`crm_outreach_touchpoints` and `crm_outreach_tags`.

Client-side parity lives in `src/lib/crm/outreachSchema.ts` (zod).

---

## Shared field set

| Column | Type | Notes |
|---|---|---|
| `outreach_stage` | enum `outreach_stage` | Default `not_contacted` |
| `outreach_channel_pref` | enum `outreach_channel` | Default `unknown` |
| `last_outreach_at` | timestamptz | Auto-bumped by touchpoint insert (outbound) |
| `last_response_at` | timestamptz | Auto-bumped by touchpoint insert (inbound) |
| `response_count` | int | Auto-incremented on inbound touchpoint, clamped ≥ 0 |
| `attempt_count` | int | Auto-incremented on outbound touchpoint, clamped ≥ 0 |
| `next_action_at` | timestamptz | Scheduled next touch |
| `next_action_note` | text(≤500) | |
| `assigned_to` | uuid | Rep owning the relationship |
| `do_not_contact` | bool | If true, `dnc_reason` required and stage forced to `blacklisted` |
| `dnc_reason` | text | |
| `nda_status` | enum `nda_status` | `signed` requires `nda_signed_at` (auto-set if missing) |
| `nda_signed_at` | timestamptz | Cleared whenever status ≠ `signed` |
| `linkedin_url` | text | Validated `https?://...` |
| `whatsapp_e164` | text | Validated E.164 (`+...`) |
| `source` | enum `outreach_source` | |
| `source_detail` | text | |
| `health_score` | int 0–100 | |

---

## Lifecycle state machine (`outreach_stage`)

```
not_contacted
   └─> attempted ─> engaged ─> meeting_booked
                                    └─> nda_pending ─> nda_signed ─> active_partner
                                                                          └─> dormant
                       any ─> declined
                       any ─> blacklisted   (only owner role can reactivate)
```

---

## Validation triggers

| Trigger | Function | Purpose |
|---|---|---|
| `trg_validate_outreach_dev` | `validate_outreach_fields()` | Shared rules on Developers |
| `trg_validate_outreach_brk` | `validate_outreach_fields()` | Shared rules on Brokerages |
| `trg_validate_developer_outreach` | `validate_developer_outreach()` | Email format on `developer_email` |
| `trg_validate_brokerage_outreach` | `validate_brokerage_outreach()` | URL format on `website` |
| `trg_validate_touchpoint` | `validate_outreach_touchpoint()` | Trims subject/body excerpts |
| `trg_bump_parent_on_touchpoint` | `bump_parent_on_touchpoint()` | Updates parent timing/counters |

All functions are `SET search_path = public` for safety.

---

## Tables

### `crm_outreach_touchpoints`

Unified timeline for both entity types. RLS: owner-scoped (`owner_id =
auth.uid()`) with admin role bypass via `has_role()`.

### `crm_outreach_tags`

Owner-scoped tag dictionary, unique on `(owner_id, label)`.

---

## Out of scope (next phases)

- UI for managing the outreach pipeline.
- Backfilling stages from heuristics.
- Email/WhatsApp delivery wiring (already exists separately).
