Plan to fix the Business Card Scanner properly:

1. Visual + contrast rebuild
- Fix the privacy checkbox checked state so the checkbox fill stays light/rose and the tick is solid black/ink, never faded.
- Add a scanner-specific contrast lock so dark navy/rose Business Card Scanner surfaces always keep readable white text and rose/ink icons.
- Rebuild the main scanner screen spacing so the “JBJ AI Business Card Scanner” panel is not cropped from the top or inside the card.
- Replace all remaining beige/white/gold camera UI pieces with the scanner’s rose neon theme: camera icon, Open Camera button, guide borders, tips, status bar, captured-card previews, tab controls, and action buttons.
- Fix white borders that should be rose neon, and fix all broken “Ensure good lighting / Hold steady / Fill the frame” contrast.

2. Camera behavior fix
- Stop the camera from disappearing after permission is granted by stabilizing stream/video state and removing stale closure issues.
- Always show a visible live video area when the camera is active.
- Always show Stop Camera, Switch Camera, Capture, and Process controls while active.
- Stop all camera tracks on Stop, tab switch, unmount, and errors so the laptop camera indicator turns off reliably.
- Add a clear fallback state when the browser/device blocks camera access, while keeping upload/photo scanning available.

3. OCR, front/back, and QR handling
- Support one or multiple captures/uploads for front/back scans, then merge extracted fields into one contact when they appear to belong together.
- Update `business-card-ocr` to extract business-card text plus QR-code content when visible.
- If QR is a plain URL, store the URL.
- If QR points to a contact/landing page, fetch and extract only public contact information from that page, then merge it into the contact without fabricating missing data.
- Keep source metadata as `business_card_scanner` / `business_card_scan` consistently for CRM filtering.

4. Access rules for brokers/developers/owner/investors
- Update the gated tool access matrix:
  - Owner/admin: visible and always unlocked.
  - Approved brokers/developers: visible and unlocked.
  - Unapproved brokers/developers: visible but locked behind Request Access.
  - Investors: hidden from hubs/navigation and redirected away from the route.
- Extend the current gated tool system so developer mode is treated like broker mode for restricted professional tools, but still requires approval.
- Replace the current request-only CRM lead fallback with a real approval-backed access record so “Request Access” can actually unlock the tool after approval.

5. CRM save + scanned-card history
- Persist each scan into saved scanned-card history for the current user, including original card image(s), extracted fields, category/contact type, source, status, and CRM lead id when saved.
- Add actions to select one/multiple cards, delete, restore, hide, clear/bulk delete, and keep scanned cards.
- Add category/contact-type assignment before saving to CRM.
- Save leads into CRM with source `business_card_scanner` so filters can show exactly which leads came from scanner.
- Keep duplicate detection and merge/update/append-note actions.

6. Export combined business card file
- Add PDF export that groups scanned cards by category/contact type.
- Each section includes the business-card photo(s) and extracted details.
- Keep CSV/Excel export, but make PDF the “copy to keep” option requested.

7. Backend deployment + validation
- Add required database migration(s) with RLS and grants for scanned-card history and tool access requests/grants.
- Redeploy the affected backend functions after code changes.
- Validate technically with targeted checks and function smoke tests.
- Validate visually using browser screenshots at desktop and mobile/tablet sizes.
- Validate E2E flow: privacy accept, open camera UI, stop camera, upload/scan image, OCR response, save to CRM, saved history, restore/delete, and export.
- I will only report complete after I have screenshot proof and the technical validation results.