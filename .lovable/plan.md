## Document Studio — premium template engine + live editor upgrade

### 1. Standard locked template bodies (auto-render on click)
- Extend `DocumentTemplate` in `src/config/documentCatalog.ts` with a new `standardBody(ctx)` function returning the locked HTML body for that template, using `{{tokens}}` for every dynamic field (recipient, position, start date, salary, etc.) plus standard clauses.
- Author one premium body per template (job offer, employment contract, NDA, warning letter, partnership, commission agreement, listing authorisation, etc.) — fixed structure, terms table, locked clauses, signature block — so styles are uniform.
- In `DocumentStudio.tsx`, when a template is selected (and on every field change), call `renderStandardBody(template, fields, department, commissionRows, customFields)` and push the result into `bodyHtml` automatically. Result: the live A4 preview shows the standard template the moment a template is clicked, and updates token-by-token as the user types — no AI call required to see the document.
- AI generation becomes an *optional enhancement* invoked only from the right-side editor ("Rewrite", "Translate", "Make warmer", etc.). It never replaces the locked structure — it only fills/edits the AI-tagged paragraphs inside `<section data-ai-zone>` blocks.

### 2. Locked template style
- Move all body CSS (font, headings, table, signature block) into a single `documentStyles.ts` file injected once at the top of every preview/PDF/Docx/print output.
- `data-locked="true"` on every structural block — the editor and AI sanitizer strip any inline style or class that tries to override it (already partially done via `stripChromeArtifacts`, extend to body).

### 3. LLC · SOC font fix
- In `LockedLetterhead.tsx` line 41 (and matching HTML in `jbjLockedChrome.ts`): remove the `uppercase` modification & extra letter-spacing so it inherits the same Inter weight as the wordmark. Render as `L.L.C · S.O.C` at the same font-family / weight 500 / size 12 directly under the wordmark.

### 4. Remove white block under footer (completely)
- In `DocumentStudio.tsx` preview wrapper, replace the `minHeight` math with `height: auto` and let the A4 page grow only to fit its content + footer. The page card uses `display:flex; flex-direction:column` and the footer is the last child, so there is no trailing white strip.
- For fixed page counts, keep the page-break behaviour via `break-after:page` inside the body — not via padded heights.

### 5. Live Document Editor (right side, every page that hosts it)
Upgrade `AiEditChatPanel.tsx`:
- **Microphone with live transcription**: integrate ElevenLabs Realtime STT via `@elevenlabs/react`'s `useScribe` (model `scribe_v2_realtime`, VAD). Token endpoint: new edge function `elevenlabs-scribe-token` (server-side `xi-api-key`, single-use token).
- **Language selector**: dropdown with English (default), Arabic, French, Spanish, Hindi, Urdu, Russian, German, Italian, Portuguese, Chinese. The selected language is passed to (a) the STT `language_code`, (b) the AI rewrite prompt ("Reply in <Language>"), and (c) the document template — re-rendering the standard body in that language via Lovable AI translate.
- **Attach files**: paperclip button → file picker → attachments appear as chips above the input and are sent to the AI request as base64 (images via Gemini vision, PDFs via the existing parse path).
- **Attach stamp / signature**: dedicated buttons that open the existing `AssetLibraryDialog`. Tell the AI *"place stamp here"* / *"place signature here"* and it inserts the appropriate `<DraggableMark>` into the preview at default coords.
- The same upgraded panel is reused everywhere it is mounted (CV builder, cover letter, contracts, presentations — all import the same component).

### 6. Save stamp & signature defaults — auto-attach
- Already partially in place via `useOwnerAssets().defaultSignature / defaultStamp`. Ensure every new document boot auto-places them (current effect already does this — keep). Add a small "Saved by default" toggle in `AssetLibraryDialog` so the owner explicitly chooses which uploaded asset becomes the default. Persists via existing assets table.

### 7. Editable preview
- `EditableBody` in `DocumentStudio.tsx` is already `contentEditable`. Add `data-locked="true"` guards around the signature block, terms table, and any AI-zone to prevent accidental destruction. The owner can still freely edit narrative paragraphs.
- All draggable marks (signature/stamp/date) remain freely positionable with × remove (already shipped).

### 8. Header layout / Signature & Stamp upload clickability
- Refactor the topbar in `DocumentStudio.tsx` so the right cluster is `shrink-0` and the Stepper is `min-w-0 flex-1`. At <1280px the Pages / Signature / Stamp / Fullscreen / Hide-AI buttons collapse to **icon-only** with tooltips (no labels), guaranteeing all 5 buttons stay visible and clickable next to the close (×).
- Add `z-index: 30` to the topbar container, `z-index: 10` to the right AI panel, so the topbar always wins pointer events.

### Files to touch
- `src/config/documentCatalog.ts` — add `standardBody(ctx)` per template
- `src/templates/composers/index.ts` — extend to merge tokens into `standardBody`
- `src/components/document-studio/DocumentStudio.tsx` — auto-render on template select + on field change, topbar layout fix, drop forced page height
- `src/components/document-studio/LockedLetterhead.tsx` + `src/templates/jbjLockedChrome.ts` — LLC · SOC font normalization
- `src/components/document-studio/AiEditChatPanel.tsx` — microphone (ElevenLabs), language dropdown, attach files, attach stamp/signature, asset library hook
- `src/components/document-studio/assets/AssetLibraryDialog.tsx` — default-asset toggle
- **NEW** `supabase/functions/elevenlabs-scribe-token/index.ts` — single-use realtime STT token (uses `ELEVENLABS_API_KEY` secret)
- `supabase/config.toml` — register the new function with `verify_jwt = true`
- `bun add @elevenlabs/react`

### Secret required
- `ELEVENLABS_API_KEY` (will request via `add_secret` if not already present after checking `fetch_secrets`).

### Out of scope
- Wordmark text/colors/position
- Footer content (only the empty white *gap* is removed; the gold footer stays)
- Template catalog list (no new templates added)
