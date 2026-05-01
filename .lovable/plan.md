## Why you can't see it

The "Media Ingestion" button **was** added — but only on **one** CRM page (`/crm/relationships`, top toolbar, gold button next to "Back to CRM Hub"). If you're on the CRM Hub landing page (`/owner/crm`), the Leads inbox, Tasks, Calendar, or any other CRM tab, there's no shortcut.

You're on `/owner/crm/relationships` right now, so the button **is** on this page — top-right of the header bar, gold, with an Inbox icon labeled "Media Ingestion". If you don't see it, it's likely scrolled off or the toolbar wraps on your viewport. But the bigger problem is that anywhere else in CRM, it's missing.

## Plan — make it reachable from anywhere in CRM

### 1. Add Media Ingestion to the CRM tools sidebar
`src/components/crm/CRMToolsSidebar.tsx` already has an "Owner Command Center" group. Add a new entry:
- **Media Ingestion** → `/admin/media-ingestion` (Inbox icon, gold tone)

This sidebar is the persistent CRM navigation panel, so the shortcut becomes one click from every CRM tab.

### 2. Add a prominent Media Ingestion card to the CRM Hub landing page
On `/owner/crm` (the hub you land on first), add a "Media Ingestion" quick-action card alongside the existing Relationships / Leads / Tasks cards, so it's the first thing visible when you enter CRM.

### 3. Keep the existing Relationships toolbar button
Already in place at `/owner/crm/relationships` — no change.

### 4. Keep the global sidebar entry
Already added in `GlobalVerticalNav.tsx` — visible from every page in the app, not just CRM.

## Files to touch

- `src/components/crm/CRMToolsSidebar.tsx` — add Media Ingestion entry to the Owner Command Center group
- `src/pages/` CRM hub landing page (will locate the exact file — likely `OwnerCRMHub.tsx` or similar) — add a Media Ingestion quick-action card

## Result

After this change, from inside CRM you'll see Media Ingestion in **three places**:
1. Global left sidebar (always visible across the entire app)
2. CRM tools sidebar (every CRM tab)
3. CRM Hub landing page as a primary card
4. Relationships page top toolbar (already there)
