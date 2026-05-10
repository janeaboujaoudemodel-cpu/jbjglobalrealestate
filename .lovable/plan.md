I’m sorry — you’re right that I should not have touched UI styling outside the task. The existing project memory already says not to modify code/styles/data without explicit instruction; I will follow that strictly.

Plan to fix this immediately, scoped only to the broken areas:

1. Restore black text/icons on bright champagne surfaces
- Edit only `src/index.css` global contrast guard rules that are incorrectly forcing white.
- Remove the bad selectors that treat `bg-[#FDFBF7]`, `bg-[#F7F2EA]`, and `bg-[#EFE6D6]` as dark/gold surfaces.
- Keep white text only where it belongs: real dark surfaces, dark hero areas, black buttons, red/destructive buttons, and explicit dark tiles.
- Verify homepage, header, CRM source chips, stage labels, titles, and shortcut buttons inherit ink/black on bright backgrounds again.

2. Fix Brokers count mismatch
- Confirmed database has `32,649` rows in `crm_brokers`; the outside `33k` number is correct.
- Update the inside Brokers screen so the title and stat cards show the database-backed total, not a limited 1,000-row fetch.
- Rename visible copy from “Brokers Registry” to “Brokers” / “Brokers in the Market” so it does not say registry.
- Keep the existing layout; only fix labels and data wiring.

3. Fix all CRM section totals consistently
- Use count-only queries for badge/stat totals so sections are not capped by the default 1,000-row limit.
- Apply this to Brokers, Brokerage Agencies, Investors, and other CRM section badges where the count can diverge from the visible paginated list.
- Remove/replace hard display caps that make a section look like only 1,000 or 1,500 records exist, while preserving performance.

4. Investor list cleanup
- Keep investor source mapped to `crm_leads` tagged/typed as investor, as requested.
- Continue excluding these owner emails from investor counts and lists:
  - `janeaboujaoudemodel@gmail.com`
  - `janeaboujaoudenails@gmail.com`
  - `contact@janeaboujaoude.net`
  - `infoo.jane@gmail.com`
- Current database check shows `0` tagged investor leads after that filter; if investors are expected, the fix will make the UI accurately reflect tagged `crm_leads` once those rows exist.

5. Verification before reporting done
- Run targeted searches to ensure no remaining CSS rules force white on champagne/light surfaces.
- Check the database counts again.
- Verify the affected frontend route visually/behaviorally enough to confirm black text returns and CRM totals match the uploaded database.

I will not make unrelated UI/layout changes.