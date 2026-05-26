# Premium Document Studio Rebuild

The current modal is broken — three narrow columns inside a small dialog crush the locked letterhead and AI panel into unreadable vertical text. Rebuild as a true full-screen workspace.

## Layout

Replace the `Dialog` shell with a **full-screen overlay** (fixed inset-0, champagne page bg, gold hairline frame). Three zones:

```text
┌─────────────────────────────────────────────────────────────┐
│  TopBar: ✦ Document Studio · Careers       [Save] [Close]  │
│  Stepper:  1 Template ─ 2 Details ─ 3 Review & Send         │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  LEFT 320px  │   CENTER (flex-1, max 880)   │  RIGHT 360px  │
│  Templates   │   Live A4 Preview            │  AI Assistant │
│  + Fields    │   (contentEditable body)     │  (chat)       │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

- Right AI panel is **collapsible** (toggle pinned right-edge tab) so preview can go full width.
- Left rail switches between **Template picker** (step 1) and **Details form** (step 2) via the stepper — no more cramped 3-up grid.

## Center Preview (the hero)

- Render at a fixed A4 width (`max-w-[816px]`) on a soft champagne canvas with paper drop-shadow.
- Locked premium header + footer rendered as real React (not raw HTML string) so they never wrap into vertical single-column text.
- Body is a single `contentEditable` region with a floating mini-toolbar (Bold / Italic / H2 / List / Link) appearing on text selection — true inline live editing.
- Click-to-edit field tokens: `{{recipient}}`, `{{salary}}` chips inline; clicking focuses the matching left-rail input.
- Zoom controls (75/100/125%) bottom-right.

## Left Rail

- Step 1: searchable template gallery grouped by department, each card with icon + 1-line description.
- Step 2: clean stacked form (label above input, generous spacing, champagne inputs, gold focus ring). Uses existing `documentCatalog.ts` schema unchanged.
- Sticky footer: `Generate with AI` primary button (gold-hairline navy CTA per project standard).

## Right AI Panel

- Header: avatar + "Document AI" + model chip.
- Scrollable message list (user right, AI left, both in champagne bubbles, no purple).
- Composer at bottom with quick-action chips: "Make more formal", "Shorten", "Add probation clause", "Translate to Arabic".
- Each AI reply applies as a **diff preview** in the center (insert/delete highlights) with Accept / Reject — not a blind overwrite.

## Send & Export (Step 3)

Collapses left rail into a recipient/send summary:
- To / CC / Subject (prefilled from template)
- Channel: Email (BrandedEmailComposer) · Download PDF · Send Test (→ `infoo.jane@gmail.com`)
- Final lock chrome reapplied before send/export.

## Technical

**New files**
- `src/components/document-studio/DocumentStudioShell.tsx` — full-screen frame, stepper, zone layout
- `src/components/document-studio/TemplateGallery.tsx`
- `src/components/document-studio/DetailsForm.tsx`
- `src/components/document-studio/LivePreview.tsx` — contentEditable + floating toolbar + zoom + field chips
- `src/components/document-studio/LockedLetterhead.tsx` / `LockedFooter.tsx` — replace raw HTML chrome
- `src/components/document-studio/AiAssistantPanel.tsx` — chat + quick actions + diff apply
- `src/components/document-studio/SendStep.tsx`
- `src/hooks/useDocumentDraft.ts` — single state store (template, fields, body, history for undo)

**Edited**
- `src/components/document-studio/DocumentStudio.tsx` → becomes thin wrapper rendering `DocumentStudioShell` (no more Dialog)
- `src/components/document-studio/DocumentStudioLauncher.tsx` → opens full-screen overlay instead of Dialog
- `src/templates/jbjLockedChrome.ts` → export structured React components alongside the existing HTML string (kept for PDF export)

**Reused as-is**
- `src/config/documentCatalog.ts` (schemas)
- `letter-ai-generate` + `ai-chat-stream` edge functions
- `BrandedEmailComposer` + `compose-branded-email`
- Existing PricePill / IconTile / champagne tokens; no new colors

## Constraints honored
- Champagne #FDFBF7 page, gold #B89555 hairlines only (no fills), Inter only, navy `#102540` CTAs with white text + gold hairline, no purple, no grays, no contrast-guard violations.
- Same engine drives Careers (staff) and ContractForms (client) — only catalog filter differs.
- Send Test always routes to `infoo.jane@gmail.com` per user preference.

Approve to build.