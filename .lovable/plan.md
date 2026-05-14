## Goal

Restore the previously-approved PAA / EnvelopeDetail document view (full body rendering, no clipped iframe) and finish the four pending hub items.

---

## 1. Restore EnvelopeDetail.tsx to the approved layout

The recent rewrite that removed the right rail and forced the iframe into a fixed `aspectRatio: "794 / 1123"` + `scrolling="no"` + `overflow:hidden` is what is producing the blank Document panel on `/owner/documents/forms/810df24a…`. The PAA template content itself is intact — only the preview shell breaks it.

Action: revert `src/pages/e-signature/EnvelopeDetail.tsx` to the last known-good revision (commit `702c90085`) which had:

- Right-side rail with Recipients · Send block · CC manager · Signed Doc · PAA listing draft card · Details · Activity log.
- Document preview iframe sized by **content height**, not aspect ratio:
  - `style={{ minHeight: "1123px", height: "auto", border: 0 }}`
  - **`scrolling="auto"`** on the iframe.
  - Wrapper: `<div className="overflow-auto max-h-[calc(100vh-220px)]">`.
- Body CSS for the iframe stops forcing `overflow:hidden` and `height:1123px` — keep `min-height:1123px` only, allow growth.

Then re-apply only the small additive features that came in after `702c90085` and are still wanted:

- "Upload signed PDF" handler + button (for completed envelopes).
- New envelope statuses `awaiting_signed_return` and `pending_owner_review` in `statusConfig` / `recipientStatusConfig`.
- The collapsible "Activity log" toggle.

PAA template files are NOT touched — `src/templates/jbjPropertyAdvertisingAgreement.ts` and `src/templates/letterheadChrome.ts` stay exactly as they are (this is the approved PAA, locked).

QA: open `/owner/documents/forms/810df24a-145b-48f2-8e5a-f18e44e0c576` — full PAA body renders below the champagne header, scrollable, no blank panel.

---

## 2. New Envelope — template picker dialog body

In `DocumentsFormsHub.tsx`, replace the `+ New Envelope` redirect with a real `<Dialog>` containing:

```text
┌──── New Envelope ─────────────────────────────┐
│  [Standard JBJ Letterhead]  [JBJ PAA Leasing] │
│  [JBJ PAA Selling]                            │
│  ───────────────────────────────────────────  │
│  Or upload a PDF / image to sign  →           │
└───────────────────────────────────────────────┘
```

- 3 primary tiles (icon + name + 1-line description) → route into the matching studio/wizard.
- One demoted secondary tile → opens the existing upload-and-send flow inline.
- Closes on selection. Never leaves `/owner/documents/forms`.

---

## 3. Manage Sheet + dropdown for Saved Signatures / Stamps

In `DocumentsFormsHub.tsx`:

- Each asset card gets a `DropdownMenu` trigger (⋯): Set as default · Replace image · Rename · Archive · Delete.
- The top-level `Manage` button next to "Saved Signatures" / "Saved Stamps" opens an inline `<Sheet>` listing every asset with the same per-row actions plus an "Upload new" button.
- No route change. Wire to the existing `useOwnerSignatureAssets` hook.

---

## 4. BlankLetterStudio framed centered A4 layout

Rework `src/pages/e-signature/BlankLetterStudio.tsx`:

```text
┌──────────────────────────────────────────────┐
│ ← Back              [Save]   [Send]          │
├──────────────────────────────────────────────┤
│ Doc # JBJ-LETTERHEAD-0001 · Date editable    │
├──────────────────────────────────────────────┤
│        ┌──────────────────────────┐          │
│        │   A4 PREVIEW (centered,  │          │
│        │   scaled to fit viewport)│          │
│        └──────────────────────────┘          │
│ [Brand assets: signatures · stamps · upload] │
└──────────────────────────────────────────────┘
```

- A4 page rendered at fixed `794×1123` and wrapped in a container that applies `transform: scale(min((vw-64)/820, (vh-260)/1180))` with `transform-origin: top center`.
- All recipient / subject / body / signature-position controls move into a single collapsible top toolbar (or popovers triggered from the preview).
- Right rail removed.
- No inner sub-tabs — only the back arrow.

---

## 5. EnvelopeDetail scroll fix

Already covered by the restore in §1: wrap the preview iframe in `overflow-auto max-h-[calc(100vh-220px)]`, drop the forced fixed height + `scrolling="no"`. Add horizontal scroll via the same wrapper for very wide content.

---

## 6. AI model bump

Update edge functions to use `google/gemini-2.5-pro`:

- `supabase/functions/paa-ai-copilot/index.ts`
- `supabase/functions/ai-contract-reviewer/index.ts`

Only swap the model identifier in the gateway call; redeploy. `letter-ai-generate` was already bumped in the previous round.

---

## Files to change

- `src/pages/e-signature/EnvelopeDetail.tsx` — restore to `702c90085` baseline + re-apply additive bits (upload signed PDF, new statuses, activity toggle), plus scroll wrapper.
- `src/pages/owner/DocumentsFormsHub.tsx` — New Envelope dialog body, Manage Sheet, asset-card dropdowns.
- `src/pages/e-signature/BlankLetterStudio.tsx` — framed scaled A4 layout.
- `supabase/functions/paa-ai-copilot/index.ts` — model → `google/gemini-2.5-pro`.
- `supabase/functions/ai-contract-reviewer/index.ts` — model → `google/gemini-2.5-pro`.

Not touched (locked / approved):
- `src/templates/jbjPropertyAdvertisingAgreement.ts`
- `src/templates/letterheadChrome.ts`
- `src/templates/jbjListingAuthorisation.ts`

---

## QA checklist

1. PAA envelope `810df24a…` opens and shows the full agreement body, scrollable.
2. Right-rail details (Doc No, Recipients, Activity, Listing Draft) are visible again.
3. `+ New Envelope` opens the picker dialog; never navigates away.
4. Signature/stamp `Manage` opens a Sheet and per-card ⋯ dropdown works.
5. Standard JBJ Letterhead studio: A4 fully visible, centered, no scrollbars.
6. PAA AI Copilot and AI Contract Review responses come from Gemini 2.5 Pro.
