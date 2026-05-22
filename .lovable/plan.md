## Goal

One profile per user, no matter where they pick their role (mode picker, homepage "I am a…" card, or Join Our Community modal). Each pick is logged with a clear **source label** so you can see in the backend exactly where every lead came from, plus a live **counter per source**.

---

## Part 1 — Fix the Join Our Community modal (visual)

File: `src/components/InquiryFormModal.tsx`

- Constrain `DialogContent` properly: remove `overflow-visible` + inline `style={{overflow:'visible'}}` that lets the form bleed outside the card.
- Move scroll to the inner content (`overflow-y-auto`), keep dialog `overflow-hidden` with `rounded-2xl` so nothing escapes the rounded corners.
- Cap height at `max-h-[90vh]` and use `flex flex-col` so header is fixed, body scrolls inside.
- Standardize all pickers (Nationality, Language, Preferred Contact, Phone country) to use the existing `SearchableSelect` / `PhoneInput` styling per the Champagne-Gold standard — champagne surface, gold hairline border, ink text, no gold fills. Phone country picker shows flag + dial code in a unified pill (already supported by `PhoneInput` — just make sure the trigger height matches other inputs).

---

## Part 2 — Source label taxonomy (this is what you'll see in the backend)

Every role selection writes `signup_source` (machine code) + `signup_source_label` (human label) to the profile/lead and increments a counter row.

| Where the user picked their role | `signup_source` (code) | Label shown in your backend |
|---|---|---|
| Mode picker (header chip / one-time greeter) | `mode_picker` | **Mode Picker (Header)** |
| Homepage "I am a…" card (investor / broker / developer) | `homepage_role_card` | **Homepage Role Card** |
| Join Our Community modal — "I am a Buyer" | `join_community_buyer` | **Join Our Community — Buyer** |
| Join Our Community modal — "I am a Broker" | `join_community_broker` | **Join Our Community — Broker** |
| Join Our Community modal — "I am a Visitor" | `join_community_visitor` | **Join Our Community — Visitor** |
| Property inquiry modal (when opened from a listing) | `property_inquiry` | **Property Inquiry — {Property Name}** |
| Footer / generic "Contact us" CTA | `footer_cta` | **Footer CTA** |
| Auth signup (no role picked yet) | `auth_signup` | **Auth Signup** |

Each row also stores: `page_path` (e.g. `/projects/emaar-beachfront`), `referrer`, `picked_role` (investor / broker / developer / buyer / visitor), `picked_at` timestamp.

---

## Part 3 — Backend: one profile, no duplicates

New table **`signup_source_events`** (append-only log — one row per pick):
- `user_id` (nullable for anonymous picks) · `email` (nullable) · `signup_source` · `signup_source_label` · `picked_role` · `page_path` · `referrer` · `created_at`
- RLS: insert via edge function only; admin/owner can read.

Extend **`profiles`** with:
- `first_signup_source` (set once, never overwritten — your "true origin")
- `last_signup_source` (updated every time they re-pick)
- `signup_source_label` (human label of first source)
- `picked_role` (current selected role)

New materialized counter view **`vw_signup_source_counts`**:
- `signup_source`, `signup_source_label`, `total_picks`, `unique_users`, `last_picked_at`
- Auto-refreshed via trigger on `signup_source_events`.

New edge function **`register-role-pick`** (replaces / wraps `register-mode-lead`):
- Input: `{ source, role, email?, fullName?, pagePath?, referrer? }`
- Logic:
  1. Insert into `signup_source_events` (always — that's how counters grow).
  2. If user is authenticated → `upsert` into `profiles` by `user_id`. Set `first_signup_source` only if null. Always update `last_signup_source`, `picked_role`.
  3. If anonymous but `email` provided → upsert `crm_leads` by email (same dedupe rule).
  4. Never creates a 2nd profile/lead for the same `user_id` or `email`.

---

## Part 4 — Wire all 3 entry points to the new function

| Entry point | File | Change |
|---|---|---|
| Mode picker | `src/components/mode/*` (greeter + header chip) | On select → `invoke('register-role-pick', { source: 'mode_picker', role })`. Stop showing greeter once `profiles.picked_role` exists. |
| Homepage role card | `src/pages/Index.tsx` (or wherever the "I am a…" card lives) | On click → same call with `source: 'homepage_role_card'`. |
| Join Our Community modal | `src/components/InquiryFormModal.tsx` | On submit → call `register-role-pick` with `source: 'join_community_{role}'` BEFORE the existing `capture-lead` (which keeps doing the full lead capture). |

The "stop showing 3 times" fix: the mode greeter already checks session storage; we additionally check `profiles.picked_role` server-side so even on a new device the user isn't re-prompted.

---

## Part 5 — Owner-side insights (so you can see the numbers)

Small panel added to `/owner/crm` → Leads section header:

```
Lead Sources (last 30 days)
──────────────────────────────────────────
Mode Picker (Header)              112
Homepage Role Card                  47
Join Our Community — Buyer          88
Join Our Community — Broker         15
Join Our Community — Visitor         9
Property Inquiry                    34
Footer CTA                           6
```

Powered by `vw_signup_source_counts`. Each row clickable → filters the lead list to that source.

---

## Scope confirmation

This plan covers: modal layout fix, picker standardization, new table + view + edge function, profile dedupe, wiring of all 3 entry points, and the counter panel.

Approve and I'll ship it in this order: (1) migration, (2) edge function, (3) wire the 3 entry points, (4) modal/picker fixes, (5) counter panel.