## Fixes for `/owner/drive-extractions`

### 1. Full edge-to-edge emerald background
In `DriveExtractionsHub.tsx` the outer wrapper `bg-[#FDFBF7]` and the header's `max-w-[1400px]` container create the "card inside cream page" look.
- Remove the cream wrapper background so the emerald hero spans the full viewport width (no side gutters).
- Keep inner content aligned via a max-width container but let the emerald gradient bleed edge-to-edge (`w-full` on the header, container only for inner content).
- Tighten padding inside `DriveDropPanel` card and align it to the same emerald-on-white rhythm.

### 2. False "Paste a Google Drive folder link" toast
`DriveDropPanel.submit()` shows that toast only when `url.trim()` is empty. In the screenshot the URL is already in Recent submissions but the input was cleared after last submit — the toast the user sees ("Paste a Google Drive folder link") in the bottom-right of screenshot 2 is a **passive placeholder-styled hint pill**, not an error. Fix: remove that persistent floating hint bubble (rendered outside the panel; likely a sonner-style toast lingering) and only surface it as inline validation next to the input.

Also: if a Recent Submission row is clicked, pre-fill the input from `s.folder_url` so "Analyze & Match" can be re-run without re-typing.

### 3. "Developer" label rendering as black text on emerald
The `Emaar Properties` row uses an emerald pill (`.inline-flex … bg-emerald…`) but the type label ("developer") inherits the Contrast Guard's black-text rule because the pill has no `data-no-contrast-guard` / `allow-white`. Add `data-no-contrast-guard` + `text-white` on the type badge (`row.type`) so it renders white on emerald.

### 4. "Ammar" fallback still appearing
The Emaar Properties row shows an "AR"-style nameplate. Root cause: `DeveloperLogo` fallback path is still triggered when `logo_url` is null in the row `s.summary` snapshot. Fix by:
- Not rendering the letter-nameplate for drive submissions where the developer isn't actually resolved (show a neutral folder icon instead).
- The Emaar entry specifically: ensure the AI-classified candidate does NOT reuse the last-loaded developer's logo/name badge — pass `name={row.name}` explicitly instead of a stale prop.

### 5. Drive folder link "blocked" / doesn't open
Screenshot 3 shows `drive.google.com` refusing to connect — the app is trying to **embed** Drive in an iframe (via preview/window frame), which Google blocks with `X-Frame-Options`. Fix:
- Never iframe `drive.google.com`. Replace any embed with a plain `<a target="_blank" rel="noreferrer">` "Open in Google Drive" button.
- Audit `DriveDropPanel` and Recent submissions row for any preview iframe; convert to link-only.
- If we want in-app preview later, that requires the Google Drive **App User Connector** (per-user OAuth) — call it out but do not add now.

### Files touched
- `src/pages/owner/DriveExtractionsHub.tsx` — full-bleed layout, container refactor.
- `src/pages/owner/DriveDropPanel.tsx` — type badge white on emerald, click-to-refill URL, remove stale toast, safe link-only Drive open, neutral fallback icon.

### Validation
Playwright screenshot of `/owner/drive-extractions` proving: emerald hero edge-to-edge, no cream gutter; Recent Submission `developer` badge white on emerald; no "AR" nameplate; no floating "Paste a Google Drive folder link" hint; clicking the Drive icon opens Drive in a new tab (not blocked iframe).
