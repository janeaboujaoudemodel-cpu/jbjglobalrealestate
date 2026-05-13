## Goal

Fix two truth/UX issues in the "Use template → Create Envelope" dialog (and downstream PDF):

1. The helper line claims we "pre-place client + JBJ signature, stamp and date fields." We cannot pre-place a client signature, and PropertyFinder-style agreements don't actually require the JBJ company signature/stamp block. The copy is wrong.
2. There is no way for the user to choose whether the JBJ company signature & stamp block is included. By default it should be **OFF** — the agreement only carries landlord signature / name / date.

## Changes

### 1. New "Company signature & stamp" toggle in the create-template dialog
File: `src/pages/owner/DocumentsFormsHub.tsx`

- Add local state `includeJbjBlock: boolean`, default `false`.
- Render a small toggle row above the helper text:
  - Label: **"Add JBJ company signature & stamp"**
  - Sub-label: *"Off by default — only the landlord signs. Turn on if your client requires our company signature & stamp on the agreement."*
- Replace the misleading sentence on line 575-577 with:
  *"We'll generate the agreement, place name and date fields for the landlord, and open the envelope so you can review before sending. The client signs directly when they open the link."*
- Reset the toggle on dialog close (alongside `extraValues` / `showDetails`).

### 2. Pass the toggle through envelope creation
File: `src/hooks/useEsignTemplates.ts` (`useCreateEnvelopeFromTemplate`)

- Accept new optional input: `hiddenFields?: string[]`.
- When `includeJbjBlock` is `false`, the dialog passes `hiddenFields: ["jbj_signature_name", "jbj_signature_date"]` (these are the only JBJ-block keys present in `PAA_FIELD_GROUPS` and the selling template).
- Use `hiddenFields` in three places inside the mutation:
  1. `renderTemplateHtml(... { hiddenFields, ... })` so the rendered PDF omits the JBJ signatory row (the templates already accept this option — `jbjPropertyAdvertisingAgreement.ts` line 337/369).
  2. Skip any `field_schema` entries whose `key` is in `hiddenFields` when building `fieldInserts`, so no signing field is created against the owner for that block.
  3. Persist `metadata.hidden_fields` on the envelope insert so `EnvelopeDetail` (which already reads `meta.hidden_fields`, line 128) keeps the same layout when re-rendering.

### 3. Wire the dialog
File: `src/pages/owner/DocumentsFormsHub.tsx` (`handleUseTemplate`)

```ts
const hiddenFields = includeJbjBlock
  ? []
  : ["jbj_signature_name", "jbj_signature_date"];
await createFromTpl.mutateAsync({ template: picker, client, values: extraValues, hiddenFields });
```

### 4. EnvelopeDetail consistency
File: `src/pages/e-signature/EnvelopeDetail.tsx`

- Already supports `hiddenFields` end-to-end (state, render, regenerate, restore). Verified — no code change needed; the toggle just primes the same flag the detail page already understands, so the user can later flip it back on from the envelope's existing "removed fields" controls.

## What this does NOT touch

- Templates themselves, the signing UI, the recipients table, and the regenerate flow stay as-is.
- Existing envelopes with the JBJ block continue to render unchanged.
- The "client signature" field-schema entry still applies — the client signs in their portal, we just stop pretending we pre-fill it.

## Files

- `src/pages/owner/DocumentsFormsHub.tsx` — toggle UI, helper-copy fix, `hiddenFields` wiring.
- `src/hooks/useEsignTemplates.ts` — accept + apply `hiddenFields` during creation.
