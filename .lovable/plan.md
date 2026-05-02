# Finish Contrast Fix + Visual Audit

## Why this is needed

The previous sweep replaced `text-[#5A4A2E]` and `text-[#3A2D1D]`, but missed the **third banned hex `#8A7556`** which is still used as a text/icon color in **124 places across 71 files**. The CI guard `check-faded-gold.mjs` confirms these violations.

Visual evidence (Owner Inbox screenshot just captured) shows the impact:
- **Pending Tasks popup**: ✕ icon, "View Tasks" label, "Later" label all invisible
- **Inbox header**: "Connect Channel" text invisible, "Refresh" icon faint
- **5 KPI tiles**: Numbers and icons barely legible (same-tone)
- **Tabs row**: WhatsApp / Website / Voice icons invisible
- **Sidebar**: Section headers (CORE, PROPERTIES, COMMUNICATION) and nav labels invisible
- **Empty states**: Chat bubble + checkmark icons faint

These are not isolated to one screen — the same pattern repeats across CRM, Studio, Welcome, Compare, Ticket Hub, E-Signature, Listing Portal, etc.

## What I'll do

### 1. Final muddy-gold sweep (124 occurrences, 71 files)

Run a targeted codemod replacing `text-[#8A7556]` with the proper accessible token, scoped by usage:

| Usage context | Replacement |
|---|---|
| Body text / labels / numbers / placeholders | `text-[#1A1A1A]/70` |
| Decorative icons on champagne | `text-[#1A1A1A]/60` |
| Brand wordmarks / large display "JBJ GLOBAL" / quote marks | `text-gold` (real `#B89555`) |
| Conditional hover states (`dragActive ? text-gold : text-[#8A7556]`) | inactive → `text-[#1A1A1A]/50` |

Files affected (top 15): `pages/CRMRelationships.tsx`, `pages/Compare.tsx`, `pages/Studio.tsx`, `pages/TicketHub.tsx`, `pages/Welcome.tsx`, `pages/OwnerInbox.tsx`, `pages/AcademyGraduates.tsx`, `pages/LandlordRentalPortal.tsx`, `pages/ListingPortalSubmit.tsx`, `pages/owner/GlobalRecommendationsHub.tsx`, `pages/e-signature/ESignatureDashboard.tsx`, `pages/toolkit/ImageResize.tsx`, `pages/toolkit/VideoResizePack.tsx`, `components/CEOLeadershipShowcase.tsx`, `components/BrandIntroSplash.tsx`, `components/video-meet/*` — plus 56 others.

Master-lock config (`src/config/master-lock.ts` line 408 + 425) and market-intelligence engine (line 401) currently treat `#8A7556` as their "muted text" floor. I'll bump those constants to `text-[#1A1A1A]/70` so the floor itself is accessible.

### 2. Owner Inbox specific fixes

The screenshot shows additional issues beyond muddy-gold:
- **Pending Tasks popup buttons**: confirm `BRAND_TERTIARY` / "Later" variant renders visible label (likely a separate variant regression)
- **Sidebar section headers and nav labels**: probable `text-foreground/40` or similar opacity issue — bump to `/70` minimum
- **KPI tile numbers**: bold text needs solid `text-[#1A1A1A]` not faded
- **Tab icons** in `<Tabs>`: ensure `text-[#1A1A1A]/70` default

I'll inspect `OwnerSidebarNav.tsx`, `OwnerDashboard*` KPI cards, and `UserTasksPopupAlert.tsx` button rendering, and patch concrete violations.

### 3. CI guard verification

Re-run all three guards to prove zero regressions:
- `scripts/contrast/check-faded-gold.mjs` → must report 0
- `scripts/contrast/check-white-on-light.mjs` → must report 0
- `scripts/contrast/check-low-opacity-text.mjs` → must report 0

### 4. Visual audit with before/after screenshots

Capture screenshots of these representative surfaces **after** the fix:

| # | Route | What I'm verifying |
|---|---|---|
| 1 | `/` (home) | Header, sidebar, filter bar, hero CTAs |
| 2 | `/owner/inbox` | Pending Tasks popup, KPI tiles, sidebar, tabs (the failing screen) |
| 3 | `/crm` | Tables, status badges, action icons |
| 4 | `/crm/relationships` | Search inputs, contact cards, "Company:" / "Office:" labels (heavy `#8A7556` user) |
| 5 | `/owner/dashboard` | Founder dashboard cards, "Pending Tasks" icon |
| 6 | `/studio` | Folder icons, empty states |
| 7 | `/welcome` | Sparkles, sub-text |
| 8 | `/compare` | Comparison sub-labels |
| 9 | `/listing-portal/submit` | Upload widgets |
| 10 | `/owner/global-recommendations` | CheckCircle icons |

Each screenshot will be paired with the **before** version (already captured for Owner Inbox; will capture before-state for the rest by running the build first, screenshotting, then applying the fix).

### 5. Deliverable: audit report

A single markdown file `mnt/documents/contrast-audit-final-2026-05-02.md` containing:
- Sweep summary (files touched, occurrences replaced, hex → token map)
- All 10 before/after screenshot pairs embedded
- CI guard pass evidence (script outputs)
- Remaining known limitations (e.g., decorative borders/backgrounds with `#8A7556` are kept — only text usage is forbidden)
- Updated `mem://constraints/faded-gold-prohibition` confirming `#8A7556` is now fully purged from text usage

## Acceptance criteria

- `rg "text-\[#(5A4A2E|3A2D1D|6B5A3E|7A6747|8A7556)\]" src/` returns **0**
- All 3 contrast CI guards exit 0
- The Owner Inbox screenshot at `/owner/inbox` shows visible: ✕ button, "View Tasks" / "Later" labels, "Connect Channel" / "Refresh", all 5 KPI tiles, all 6 tabs, all sidebar labels
- Audit markdown delivered at `/mnt/documents/contrast-audit-final-2026-05-02.md` with 10 before/after screenshot pairs

## Out of scope

- Decorative `#8A7556` used as `border-` or `bg-` (allowed by guard for non-text)
- Dark surfaces (rules differ; covered by white-on-light guard which already passes)
- New design tokens — using the existing approved palette only
