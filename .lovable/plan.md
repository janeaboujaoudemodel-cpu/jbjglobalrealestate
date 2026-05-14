## Goal

Make `Documents & Forms` one premium, self-contained workspace. Fix template names, the letterhead studio layout, the manage menus, the e-signature integration, and "New Envelope" so nothing leaves the page anymore.

---

## 1. Templates — clean up names and remove duplicates

Rename and consolidate the 4 template rows in `esign_templates`:

| Current name | New name | Notes |
|---|---|---|
| JBJ Letterhead — Blank (fillable) | **Standard JBJ Letterhead** | only blank letterhead kept |
| JBJ Letterhead — Leasing | **JBJ PAA Leasing** | merged with the PAA leasing row below |
| JBJ Property Advertising Agreement — Leasing | _delete (duplicate)_ | content folded into JBJ PAA Leasing |
| JBJ Listing Authorisation — Selling | **JBJ PAA Selling** | renamed |

Migration: rename rows, delete the duplicate, keep only these 3 visible templates: `Standard JBJ Letterhead`, `JBJ PAA Leasing`, `JBJ PAA Selling`.

In the Templates grid (`DocumentsFormsHub.tsx`):
- Remove the "5 prefilled fields / Client signs first / You counter-sign" meta lines and any `OK` chip next to the smart-fill upload.
- Each card becomes a clean tile: icon + title + one-line description + single primary action ("Use template").
- AI Smart Fill stays as one drop zone above the grid (not per-card multi-file), with no "OK" labels.

---

## 2. Standard JBJ Letterhead studio — premium framed layout

Rework `BlankLetterStudio.tsx` so the **A4 preview is the hero**, fully visible without scrolling.

```text
┌──────────────────────────────────────────────────────────┐
│  ← Back to Documents & Forms              [Save] [Send]  │  ← top bar
├──────────────────────────────────────────────────────────┤
│  Doc # JBJ-LETTERHEAD-0001 · Date [editable]             │  ← thin header strip
├──────────────────────────────────────────────────────────┤
│                                                          │
│         ┌────────────────────────────────────┐           │
│         │                                    │           │
│         │        A4 PREVIEW (centered,       │           │
│         │        scaled to fit viewport)     │           │
│         │                                    │           │
│         └────────────────────────────────────┘           │
│                                                          │
│   [Brand assets strip: signatures · stamps · upload]     │  ← thin footer rail
└──────────────────────────────────────────────────────────┘
```

- A4 page is `794×1123` scaled with `transform: scale(min(viewportW/820, viewportH/1180))` so it always fits — no horizontal/vertical scrollbars.
- All editing controls (recipient, subject, body, signature line position, stamp position) live in **one collapsible top toolbar** or in floating popovers triggered from the preview (click signature box → popover).
- The right-hand recipient/details rail is removed (already partly done) — apply the same treatment here.
- Body stays plain text; greeting/body/closing spacing preserved.
- No inner sub-tabs inside the studio — only the back arrow.

---

## 3. Saved Signatures & Stamps — Manage = inline menu, not new route

In `DocumentsFormsHub.tsx`, the `Manage` button currently navigates away. Replace with a `DropdownMenu` on each asset card with:
- Set as default
- Replace image (file picker)
- Rename
- Archive
- Delete

The top-level `Manage` button next to "Saved Signatures" / "Saved Stamps" opens an inline drawer (Sheet) listing all assets with the same per-row actions and an "Upload new" button. No route change.

---

## 4. New Envelope — template picker, not Upload & Sign

Currently the `+ New Envelope` CTA opens `/e-signature/upload`. Change it to open a `Dialog` with:

- A grid of the 3 templates (Standard JBJ Letterhead, JBJ PAA Leasing, JBJ PAA Selling).
- A separator.
- A small secondary tile "Upload PDF / image to sign" (the old upload-and-send flow stays available but demoted).

Selecting a template routes into that template's studio (letterhead studio or PAA wizard) — never leaves the hub shell.

---

## 5. E-signature & Document Editor — embed inside the hub

Right now clicking `Document Editor` and `E-signature` chips bounces the user out of `/owner/documents/forms`. Fix:

- The chip row (`Templates · Document Editor · E-signature · Drafts · …`) becomes a real `Tabs` control bound to `?tab=` only — no `<Link>` / `navigate()` to other routes.
- `Document Editor` tab renders the editor component **inline** inside the hub (import the editor page body as a component). Same hub frame stays visible.
- `E-signature` tab renders inline cards in a uniform 3-column grid with equal heights:
  - **Upload & Send for Signature**
  - **Signature Studio**
  - **AI Contract Review**
  Each opens its workflow inside a Sheet/Dialog over the hub, not a new page.
- `AI Contract Review` is the lawyer-grade flow: upload → AI extracts clauses → highlights high-risk fields → suggests responses. Wire it to the existing `ai-contract-reviewer` edge function and upgrade the model to `google/gemini-2.5-pro` for better legal reasoning.
- DocuSign remains the only real signing backend for E-signature envelopes.

---

## 6. Envelope detail (PAA review) — restore scrolling

In `EnvelopeDetail.tsx` the full-width A4 view currently clips at the bottom. Wrap the preview in:
```tsx
<div className="overflow-auto max-h-[calc(100vh-220px)]">
  <iframe className="w-full" style={{ minHeight: 1123 }} />
</div>
```
so vertical scroll works, and add horizontal scroll on overflow for very wide content. Keep the top action bar fixed.

---

## 7. Backend / edge function refresh

- `letter-ai-generate`, `paa-ai-copilot`, `ai-contract-reviewer`: bump model to `google/gemini-2.5-pro`, redeploy.
- Make sure category-aware doc numbering already added (`JBJ-LETTERHEAD-####`, `JBJ-PAA-LEASING-####`, `JBJ-PAA-SELLING-####`) — extend the prefix map after rename.

---

## 8. QA checklist (before screenshots)

1. `/owner/documents/forms` shows exactly 3 template cards with the new names, no "blank" wording, no "5 fields" meta.
2. Click `Standard JBJ Letterhead` → studio opens, A4 fully visible without scrolling, only a back arrow at top.
3. Manage on a stamp card → dropdown shows Set default / Replace / Rename / Archive / Delete; no route change.
4. `+ New Envelope` → template picker dialog (not Upload & Sign).
5. Inside the hub, click `Document Editor` then `E-signature` chips → URL stays `/owner/documents/forms?tab=…`, the hub frame never disappears.
6. The 3 cards in E-signature tab are perfectly aligned (same height, same padding).
7. Open an existing PAA envelope → page is full-width, scroll works top→bottom.
8. Upload a contract in AI Contract Review → risky clauses highlighted, suggestions shown.
9. Console / network: no 404s, no redirect chains.

---

## Files to change

- `src/pages/owner/DocumentsFormsHub.tsx` — template grid cleanup, tabs become real tabs, New Envelope dialog, Manage dropdown + Sheet, embed editor & e-sign tools inline.
- `src/pages/e-signature/BlankLetterStudio.tsx` — new framed layout, scaled A4 hero, top toolbar, popovers for signature/stamp.
- `src/pages/e-signature/EnvelopeDetail.tsx` — scrollable preview wrapper.
- `src/components/owner-dashboard/SavedAssetCard.tsx` (new) — dropdown manage menu.
- `src/hooks/useEsignTemplates.ts` — filter/normalize after rename.
- `supabase/functions/ai-contract-reviewer/index.ts`, `letter-ai-generate/index.ts`, `paa-ai-copilot/index.ts` — model bump, redeploy.
- Migration: rename templates, delete duplicate PAA-leasing row, extend `next_doc_number` prefix map.

No existing functionality removed — every old route still resolves into the unified hub.
