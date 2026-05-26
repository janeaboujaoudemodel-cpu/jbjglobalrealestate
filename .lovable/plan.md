## Document Studio — Job Offer & Live Editor Fixes

Scope: `src/components/document-studio/DocumentStudio.tsx`, `src/templates/composers/index.ts`, `src/templates/composers/standardBody.ts`, and the left rail (Step 2 form). No backend changes.

### 1. Live preview not reflecting field edits (recipient, position, etc.)

Root cause: once the user (or `EditableBody`'s contentEditable) touches the body, the saved HTML no longer equals `autoBodyRef.current` (DOMPurify + browser normalisation), so the auto-rerender effect skips every subsequent field change.

Fix:
- Re-render the standard body on every change of `templateId / fields / department / commissionRows / customFields` unconditionally, UNLESS the user has explicitly hand-edited (track a `userEditedRef` flag flipped on real keystrokes inside `EditableBody`, not on programmatic `setBodyHtml`).
- When `userEditedRef` is true, show a small "Reset to template" pill above the page so re-syncing is one click.

### 2. Subject line shows "Offer of Employment — Position" / "To: ___"

- In `composeJobOffer`, change the subject template to `Offer of Employment${jobTitle ? " — " + jobTitle : ""}` (no stray "Position" placeholder).
- In `recipientBlock`, render the recipient name inline (`Dear {name},`) instead of a `To` block when the template is `job_offer` — matches the UAE-style offer letter.

### 3. Duplicated date + non-clickable date

- Remove the static `dateLine()` from `composeJobOffer` (and other letter-style templates) so the only date on the page is the draggable one.
- Convert `DraggableMark` for the date into a **click-to-edit** field: clicking opens a small native `<input type="date">` popover; value is stored in `marks.dateValue` and rendered formatted (DD MMM YYYY). Keep the × to remove, drag handle on the chip body.

### 4. Department `<Select>` not clickable

The overlay uses `zIndex: 2147483000`. Radix `SelectContent` portals to `document.body` at a lower z-index, so it renders behind the overlay (and the page registers no clicks).
- Pass an explicit container to the Select (`SelectContent` with `position="popper"` and a portal targeted at the overlay root via a `ref`), OR raise the portalled content with `style={{ zIndex: 2147483647 }}`. Apply the same fix to the `Pages` `<select>` and all other Selects inside the overlay (template field selects).

### 5. Commission column "Payout Trigger" wording

- Rename column header `Payout Trigger` → `When Paid`.
- Replace default row trigger text `"On collected commission"` → `"Paid after the firm receives cleared commission"`.
- Add a small helper line under the table: "Commissions are released once the brokerage actually receives the funds."

### 6. Signature block — remove "For", add defaults, tighter spacing

In `signatureBlock`:
- Header label `For JBJ GLOBAL REAL ESTATE` → `JBJ GLOBAL REAL ESTATE` (per premium standard).
- Default Party A: Name `Jane Bou Jaude`, Title `Founder & CEO`, Date = today (auto-filled). Each value gets a × in the preview to clear it (mirrors how date works today via DraggableMark — we'll wrap the signature block cells in a thin client component `EditableSignatureCell` rendered as React DOM over the composed HTML).
- Party B (Accepted by Applicant):
  - Name auto-syncs from `fields.recipientName`.
  - `ID` line auto-syncs from `fields.idNumber`.
  - Date is intentionally LEFT BLANK (applicant fills on sign).
- Tighten cell spacing: reduce `margin-bottom:46px` to `28px` and bump top spacing between the signature block and the preceding paragraph so the cells breathe but don't overlap.

### 7. Left rail — new utilities

Add three new items above Custom Fields on Step 2 for `job_offer` (and re-usable for other letters):

a. **Applicant ID Number** input — bind to `fields.idNumber` (already used by `recipientBlock` + signature cell). Single text input.

b. **Paste applicant details → AI auto-fill** (new card):
   - Textarea: "Paste passport copy text, LinkedIn bio, or free-form notes…"
   - Button: `Auto-fill fields with AI`. Calls existing `letter-ai-generate` edge function with a new prompt instructing it to return a JSON object keyed by the template's field keys, then `setFields(prev => ({ ...prev, ...parsed }))`. No backend changes — same function, prompt-only.

c. **Attach a document → pre-fill** (new card):
   - File input (accept `image/*,application/pdf`).
   - Convert to base64 (8MB cap, mirrors AI chat panel), send to `letter-ai-generate` with attachment + same JSON-extraction prompt, then merge into `fields`.

### 8. Remove sections from the rail (Notes column)

- Add a × button on the Custom Fields card header, and on the Commission card header, to hide/remove the whole card (state: `hiddenSections: Set<string>`). Hidden cards reappear via a small "+ Restore sections" footer button.
- The existing per-row trash (Custom Fields & Commission rows) already removes individual rows — no change needed there.

### 9. UAE-law alignment for Job Offer body

In `standardBody.ts` → `intros.job_offer` and `closings.job_offer`:
- Intro: keep current phrasing; add reference to UAE Federal Decree-Law No. 33 of 2021 (Regulation of Labour Relations) governing the engagement.
- Closing: explicit mention that probation, working hours, leave, end-of-service gratuity and notice period follow UAE Labour Law and DIFC/onshore regulations as applicable.
- No structural change to the design — only the AI-free deterministic copy.

### Technical Notes

- All Select/Popover fixes funnel through a single helper `<OverlayPortalProps>` that returns `{ container, style: { zIndex } }`, applied to every Radix portal inside the studio so we never hit the z-index bug again.
- `EditableSignatureCell` is a React overlay positioned absolutely over the composed HTML signature table (using the same approach as `DraggableMark`). The underlying HTML stays the source of truth for export/print so PDF/DOCX continue to receive the rendered values.
- AI auto-fill prompt returns strict JSON; parse with a safe `JSON.parse(..)` inside a `try/catch` and only merge whitelisted keys present in `template.fields`.
- Out of scope: header monogram size, footer chrome, AI panel, mic, language selector (already shipped).

### Files Touched

- `src/components/document-studio/DocumentStudio.tsx` — rerender logic, Select z-index, new sidebar cards, EditableSignatureCell wiring, date-mark popover, hide-section ×.
- `src/templates/composers/index.ts` — `signatureBlock` labels/spacing, `composeJobOffer` (remove dateLine, subject wording, recipientBlock variant), commission column header.
- `src/templates/composers/standardBody.ts` — UAE-law copy in `intros.job_offer` / `closings.job_offer`, default commission trigger text.
- (new) `src/components/document-studio/EditableSignatureCell.tsx` — overlay editable cell with × clear.
- (new) `src/components/document-studio/AutoFillFromDetails.tsx` — paste-text + attach-doc card calling `letter-ai-generate`.
