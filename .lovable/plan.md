## Goal

Fix the PAA document so the **Exclusivity** choice (Exclusive / Non‑Exclusive) renders correctly, the AI Co‑Pilot is fast and its Apply actually shows up in the document preview, and Save & re‑render isn't slow or silently failing.

## Root causes

1. **Chip matcher bug — both chips highlighted, wrong word printed.**
   In `src/templates/jbjPropertyAdvertisingAgreement.ts` line 618 the matcher is:
   ```ts
   chipRow("exclusivity", "Appointment Type",
     ["EXCLUSIVE", "NON EXCLUSIVE"],
     (o, v) => v.toLowerCase().includes(o.toLowerCase().split(" ")[0]))
   ```
   For value `"NON EXCLUSIVE"`:
   - option `"EXCLUSIVE"` → checks `"non exclusive".includes("exclusive")` → **true**
   - option `"NON EXCLUSIVE"` → checks `"non exclusive".includes("non")` → **true**

   Both chips get the selected state, and in **final** render mode `options.find(...)` returns the **first** match (`"EXCLUSIVE"`) — so the doc prints "EXCLUSIVE" even when the field clearly says "NON EXCLUSIVE". This is exactly what the user is seeing.

2. **AI Co‑Pilot slow.**
   `supabase/functions/paa-ai-copilot/index.ts` calls `google/gemini-2.5-pro`. Pro is the slowest/most expensive tier and overkill for short field‑edit confirmations.

3. **AI Apply seems "not applied".**
   `applyAIUpdates` sets `editing=true` and merges into `editValues`, and `previewHtml` reads `editValues` when editing. That's correct. The visible reason it looked wrong was bug #1 (any AI value containing "exclusive" still rendered "EXCLUSIVE"). Plus the copilot system prompt doesn't list `exclusivity` as a known key, so the AI sometimes invents values like `"non-exclusive"` / `"Non Exclusive"` that aren't normalized.

4. **Save & re‑render slow.**
   `handleSaveEdits` runs `regenerate` (PDF render) AND fires `paa-sync-listing` synchronously inside the same UI flow before showing success. The sync‑listing call is best‑effort and shouldn't block the toast / exit from edit mode.

## Fixes

### 1. `src/templates/jbjPropertyAdvertisingAgreement.ts`

Replace the exclusivity chip row with a strict, mutually‑exclusive matcher that always prefers `"NON …"` when the value starts with `non`:

```ts
const isNonExclusive = (s: string) => /^\s*non[\s_-]*exclusive/i.test(s || "");
${chipRow(
  "exclusivity",
  "Appointment Type",
  ["EXCLUSIVE", "NON EXCLUSIVE"],
  (o, v) => o === "NON EXCLUSIVE" ? isNonExclusive(v) : (!!v && !isNonExclusive(v) && /exclusive/i.test(v)),
)}
```

This guarantees:
- `"NON EXCLUSIVE"`, `"non-exclusive"`, `"non_exclusive"`, `"Non Exclusive"` → only the **NON EXCLUSIVE** chip selected and the final render prints **NON EXCLUSIVE**.
- `"EXCLUSIVE"`, `"exclusive"` → only the **EXCLUSIVE** chip.
- Empty value → no chip selected (final render shows nothing, edit render shows both unselected).

Also normalize the value at write time in `handleSaveEdits` (`src/pages/e-signature/EnvelopeDetail.tsx`) so persisted data is always one of `"EXCLUSIVE"` / `"NON EXCLUSIVE"`:

```ts
if (cleaned.exclusivity) {
  cleaned.exclusivity = isNonExclusive(cleaned.exclusivity) ? "NON EXCLUSIVE" : "EXCLUSIVE";
}
```

### 2. `supabase/functions/paa-ai-copilot/index.ts` — make it fast and exclusivity‑aware

- Change model to `google/gemini-2.5-flash` (sub‑second responses, same JSON contract).
- Add to the field key list and add a normalization rule:
  > `exclusivity` must be exactly `"EXCLUSIVE"` or `"NON EXCLUSIVE"` (uppercase, space, no hyphen).
- Trim `current_values` payload to the editable subset (drop signatures / PII) to keep prompt short.

### 3. `src/pages/e-signature/EnvelopeDetail.tsx` — snappier Save

- Detach the `paa-sync-listing` call into a fire‑and‑forget (`void fetch(...)`), don't `await` it before `toast.success`/`setEditing(false)`/`refetch()`.
- Keep the existing `regenerate.mutateAsync` await — that's the actual PDF and must finish before the preview swaps.

### 4. Sanity touches

- Ensure the field editor's select for `exclusivity` already uses the canonical `["EXCLUSIVE", "NON EXCLUSIVE"]` (it does — line 748).
- No DB migration needed; values are stored in `template_field_values` JSON.

## Verification

1. Open `/owner/documents/forms/<id>` (current envelope).
2. In **Edit fields** set Exclusivity → **NON EXCLUSIVE** → Save & re‑render.
   - Toast appears within ~2s.
   - In the rendered doc only the **NON EXCLUSIVE** chip is selected; the final/print copy prints "NON EXCLUSIVE".
3. Switch to **EXCLUSIVE** → Save → final copy prints "EXCLUSIVE".
4. Open **AI Co‑Pilot**, type "make it non exclusive" → response returns within ~2s with `updates: { exclusivity: "NON EXCLUSIVE" }`. Click **Apply to document** → preview updates immediately in edit mode → Save → persisted.
5. Click anywhere on the chip row in the preview → still routes to the field editor (existing behavior preserved).