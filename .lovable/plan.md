## Goal

Fix three broker-portal issues you flagged:

1. Always-visible **"Back to Owner Backend"** button while you're inside the broker portal.
2. Brokers must NEVER see JBJ forms/agreements directly — replace with a **"Request a Form"** workflow (broker requests → owner approves → owner sends the document back).
3. **Broker Academy is visually broken** (overlapping headers, contrast issues, video hero leaking into the portal frame, mis-aligned columns). Rebuild it as a single clean champagne page.

---

## 1. Back-to-owner button (always visible)

Today the owner-preview banner shows on top, but it disappears when scrolled and is easy to miss. We keep the top banner AND add:

- A pinned **"← Owner Backend"** pill at the very top of the broker-portal sidebar (owner-only, gated by `useUserRole().isOwner`).
- Same pill mirrored into the mobile broker shell.
- Both clear the `jbj_broker_portal_preview` session flag and route back to `/owner/crm`.

No change for actual brokers — they will not see the pill, only the rest of the sidebar.

## 2. Forms & Agreements → "Request a Form"

Brokers will no longer see Forms Hub, Document Studio, or any JBJ RERA template directly.

Sidebar changes
- Rename `/broker/forms` from **Forms & Agreements** → **Request a Form**.
- Remove the **Documents** entry that links into Document Studio (brokers go through requests now).

New page `/broker/forms` (BrokerFormRequests)
- Header: "Request a Form from JBJ" + one-line explainer that JBJ owner reviews and sends back.
- Top action: **+ New request** opens a dialog with:
  - Form type (Form A, Form B, Form F, Form I, Form U, NDA, MOU, Tenancy Contract, Other) — broker-relevant templates only.
  - Related lead (optional, pulled from `crm_leads` where `assigned_broker_id = me`).
  - Notes / context (textarea).
  - Submit → inserts into `broker_form_requests` with status `pending`.
- Table of the broker's own requests with status pills: `pending`, `approved`, `rejected`, `delivered`. When `delivered`, broker can download the file owner attached.
- Read-only: brokers never see JBJ templates list or Document Studio.

Owner-side approval (inside existing `/owner/crm`)
- New tab item in the CRM hub subheader: **Form Requests** (count badge for pending).
- Owner sees all requests with broker name, form type, lead, notes, submitted-at.
- Actions per row: **Open in Document Studio** (prefills template + lead) → on save, owner clicks **Send to broker** which uploads the rendered PDF to storage and marks request `delivered`. Also **Reject** with reason.
- Broker receives in-app notification.

Database (one new table)
- `broker_form_requests` — broker_user_id, form_type, lead_id (nullable), notes, status, owner_user_id, response_notes, delivered_file_url, created_at, updated_at.
- RLS: broker can `SELECT/INSERT` only their own rows; owner can `SELECT/UPDATE` all.
- Realtime enabled so the badge counter updates live.

## 3. Rebuild Broker Academy (`/broker/learning`)

Root cause of the visual mess: `BrokerLearning` mounts `BrokerEducation` (a full-bleed marketing page with a video hero + dark gradient) inside the portal shell that already has its own padding and sidebar — the absolute-positioned hero and `min-h-screen` of the nested page collide with the BrokerLearning header and the BrokerTraining sections, causing the overlapping text you see.

Fix by replacing `BrokerLearning.tsx` with a **single, portal-native academy page** (no nested marketing page, no video hero, no tabs that swap full pages):

```text
┌──────────────────────────────────────────────────┐
│  Eyebrow: Broker Learning  ·  Internal use only │
│  H1: JBJ Broker Academy                         │
│  Sub: One home for the book library, training,  │
│       certification and compliance reference.   │
│  Progress strip: Library  •  Training  •  Cert  │
├──────────────────────────────────────────────────┤
│  Section 1 — Training Modules                    │
│  2-col grid (lg), 1-col (md/sm) of 4 module     │
│  cards (Reading the Market, RENT Conversations,  │
│  BUY vs RENT, Compliance & Guardrails). Cards   │
│  reuse champagne tokens, gold hairline, ink txt. │
├──────────────────────────────────────────────────┤
│  Section 2 — Internal Book Library               │
│  Groups by learning_path, 3-col card grid.       │
│  Uses existing useBrokerEducation hook + the     │
│  Book3DCard component, but WITHOUT the marketing │
│  page's video hero / dark gradient.              │
├──────────────────────────────────────────────────┤
│  Section 3 — Compliance Quick Reference          │
│  2-col: NEVER Say / ALWAYS Use (lists).          │
├──────────────────────────────────────────────────┤
│  Section 4 — Golden Rules (3-col)                │
├──────────────────────────────────────────────────┤
│  Section 5 — Certification CTA                   │
│  Card linking into existing CertificationSection │
└──────────────────────────────────────────────────┘
```

Implementation details
- Delete the lazy-load of `BrokerEducation` from `BrokerLearning`. Instead consume `useBrokerEducation()` directly and render the book grid inline, scoped to the portal width.
- Drop the `library | training` tab switcher — both live on the same page in clearly separated sections (matches the rest of the portal where each route is a single coherent surface).
- Move all chrome to the same champagne tokens already used in the portal (`bg-[#FDFBF7]`, surface `#F7F2EA`, raised `#EFE6D6`, ink `#1A1A1A`, gold hairlines `#B89555/30`). No black gradients, no white text on champagne.
- Container `max-w-[1200px] mx-auto px-4 lg:px-6`, vertical rhythm `space-y-12`. Use `grid lg:grid-cols-2`, `grid lg:grid-cols-3` for the three grids.
- Module cards: fixed min-height, icon tile, title, badge + duration + lessons row, description (2-line clamp), 2 topic chips + "+N more", `Start` button on the right — no overlap with sibling cards.
- Keep the gating: if user is not signed in or not in broker mode, show the existing "Training is for verified brokers" empty state in place of the Training section only (Library + Compliance still render).
- Route `/broker/academy` keeps redirecting to `/broker/learning`.

## Technical section

Files to change
- `src/components/broker-portal/BrokerPortalSidebar.tsx` — add owner-only "← Owner Backend" pill at top; rename forms item; remove `/broker/documents` item.
- `src/components/broker-portal/BrokerPortalLayout.tsx` — leave existing top banner; ensure it does not double-render with the new sidebar pill.
- `src/routes/BrokerPortalRoutes.tsx` — swap `/broker/forms` element to the new `BrokerFormRequests` page; remove `/broker/documents` route (or keep as a redirect to `/broker/forms`).
- `src/pages/broker/BrokerFormRequests.tsx` (new) — list + new-request dialog.
- `src/components/broker-portal/NewFormRequestDialog.tsx` (new).
- `src/pages/owner/OwnerFormRequests.tsx` (new) + wire into the existing `UnifiedCRM` subheader.
- `src/hooks/useBrokerFormRequests.ts` (new) — broker + owner queries with realtime.
- `src/pages/broker/BrokerLearning.tsx` — full rewrite per layout above; drop nested `BrokerEducation`.
- Migration: create `public.broker_form_requests` with GRANTs + RLS (broker self-only insert/select; owner full via `has_role(auth.uid(),'owner')`); enable realtime.

Out of scope (not touched in this change)
- Lead-visibility scoping (already restricted to `assigned_broker_id = me`).
- Database-import visibility (already attributed to owner).
- Owner dashboard restoration (already in place behind the "Preview Broker Portal" toggle).
