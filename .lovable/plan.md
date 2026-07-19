## Goal
Replace the current developer set with exactly the rows shown in `Agency_Registration_-_Developers_2027-6.xlsx`, in the same order as the sheet, so the Developer Portal count matches (621) and the row order mirrors the Excel.

## Root cause of the mismatch
The last import ingested every row in the sheet (1,648) including the unnumbered rows below the numbered list. You only want the numbered rows (the "Sr. No." column defines the real list, ending at 621). Ordering was also not preserved because rows were upserted without a sequence column.

## Plan

1. **Re-read the Excel exactly as-is**
   - Load `Agency_Registration_-_Developers_2027-6.xlsx`.
   - Keep only rows where `Sr. No.` is a real number (1..621). Drop everything else (blank rows, footer notes, unnumbered rows).
   - Verify the count is exactly 621 before touching the database. If it isn't, stop and report the actual number instead of guessing.

2. **Reset the developers table**
   - Delete all existing developers (Citi Developers included this time so ordering starts clean).
   - Clear dependent staging: `pending_developer_imports`, `pending_project_imports` links that reference removed developers.

3. **Insert in Excel order**
   - Store `Sr. No.` in `excel_serial` (already exists in custom_fields mapping).
   - Add an `excel_order` integer used purely for sorting = `Sr. No.`.
   - Insert rows sequentially so listing sorted by `excel_order ASC` reproduces the sheet exactly.
   - Map fields verbatim: name, registration status, website, Instagram, LinkedIn, Facebook (custom_fields), Google Drive (owner-only), office address (owner-only), admin contact, RM/CP, remarks, projects in UAE / outside UAE, global presence, WhatsApp group, registration link.
   - Re-add Citi Developers only if it appears in the numbered list; otherwise it's excluded.

4. **Developer Portal ordering**
   - Default sort in `DeveloperDirectory.tsx` becomes `excel_order ASC` so the UI matches the sheet order. Existing filters/search continue to work; user can switch sort if needed.

5. **Export parity check**
   - "Export to Excel" from the portal will output rows in `excel_order` so a round-trip matches the source sheet.

6. **Validation (screenshot proof before I claim done)**
   - Run a count query: expect exactly 621.
   - Playwright: open `/owner/developers`, capture the header count and the first 10 + last 10 rows, compare to Excel rows 1-10 and 612-621.
   - Only report success once both match.

## Technical notes
- New column: `developers.excel_order INTEGER` (nullable, indexed).
- Import runs through a fresh edge function `bulk-import-devs-2027-6-strict` that rejects any row missing `Sr. No.`.
- No project data is touched in this pass — only the developer directory.

## Open question
Do you want Citi Developers preserved even if it's not in the numbered list, or fully replaced by whatever the sheet says? Default in this plan: follow the sheet strictly (Citi only if numbered).
