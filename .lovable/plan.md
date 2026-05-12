## Plan

1. **CRM labels, DLD wording, and status colors**
   - Replace any visible incorrect `LD` label with `DLD` where it appears in CRM/relationship forms, tables, filters, and exports.
   - Correct the CRM status registry so labels match the requested wording:
     - Hot = orange
     - Interested = green
     - Deal Closed = green
     - No Response = dark red
     - Junk = red
     - Lost = red
     - Already Bought = blue/yellow-toned premium neutral
     - VIP = yellow/amber
   - Fix the current mismatch where quick chips use different status keys than the dropdown/table status values.
   - Make the status dropdown, chips, and table badges use the same single status source so filtering, saving, display, and counts stay wired together.

2. **Premium CRM table and action buttons**
   - Upgrade `CRMLeadsTableV2` table visuals: cleaner row spacing, stronger hierarchy, champagne surfaces, premium borders, better source cell layout, and organized filters.
   - Replace the current green/blue/purple action buttons with a restrained premium action cluster:
     - WhatsApp/message, call, email, agreement = champagne/ink with subtle icon treatment.
     - Delete/trash = red danger styling only.
   - Keep the table horizontally scrollable inside its own section instead of causing the page/body to scroll sideways.

3. **WhatsApp blocking fixed once across CRM/backend**
   - Replace remaining direct `window.open("https://wa.me...")` / WhatsApp URL callsites in CRM with the centralized `openWhatsApp()` helper.
   - Harden the helper/guard so old `api.whatsapp.com`, `apiwhatsapp.com`, `web.whatsapp.com`, and direct assignment patterns are normalized to safe `wa.me` links before navigation.
   - Avoid async work before opening WhatsApp links so browser blockers do not treat them as popups.

4. **CRM side workspace: Calendar, Notes, Tasks**
   - Upgrade the side rail so Calendar, Notes, and Tasks open as a premium in-page section/drawer without leaving CRM.
   - Improve the calendar visual design from the current basic card layout to a denser premium month/agenda view using the existing calendar data.
   - Fix side-rail navigation URLs so opening full calendar/notes/tasks preserves `entity=leads&view=...` correctly.

5. **Backend fullscreen mode**
   - Add a global owner backend fullscreen toggle in `OwnerDashboardShell`.
   - When fullscreen is active:
     - Hide the vertical sidebar.
     - Remove the left content offset.
     - Let backend sections use the full width.
   - Persist the fullscreen state locally and expose a clear exit button in the top bar.

6. **CRM header pills and horizontal scroll behavior**
   - Rework the CRM entity/subsection bars into one connected premium header section instead of disconnected pills.
   - Add left/right arrow controls for horizontal navigation.
   - Keep horizontal scroll confined to the nav strip, with champagne/gold scrollbar styling and no browser back/side-page scrolling side effects.

7. **Property Advertising Agreement: one source for preview/print/download/export**
   - Create a single agreement render path used by live preview, print iframe, download PDF, export dialog, blank download, and regenerated storage PDF.
   - Ensure saved edited fields are rendered immediately into the downloaded PDF instead of relying on stale envelope state/refetch timing.
   - Update file names to include both document number and client/landlord name.

8. **Agreement logo/header/footer/content fixes**
   - Replace the monogram/gold-border initials in PAA/letterhead with the correct transparent company logo asset everywhere: preview, print, and downloaded PDF.
   - Rebalance the header company name/location so it aligns with the logo and does not sit too low.
   - Use the correct trade-license legal company name and office location from the shared legal config, not “Private Office Dubai”.
   - Center the agreement title and remove “for real estate owners”.
   - Make the footer taller, premium, and include clickable phone, email, website, and office location.

9. **Agreement field and signature layout fixes**
   - Replace long gold underline styling with compact label-above-value fields.
   - Hide empty fields in final/download mode.
   - In final mode, show only selected options such as `Apartment`, not all property-type options.
   - Remove JBJ/company authorized representative/signature/stamp/date fields from the PAA final signature area.
   - Keep only landlord/client name, signature, and date aligned on one row, with labels and underlines not touching the date/signature.
   - Fit the final PAA on one A4 page as closely as the content allows.

10. **Validation after implementation**
   - Verify CRM status updates persist and filters reflect the same values.
   - Verify WhatsApp clicks generate only `wa.me` links and no `apiwhatsapp.com` / `api.whatsapp.com` blocker path.
   - Verify fullscreen hides the owner sidebar and restores normally.
   - Verify agreement preview, print, direct download, and export all show the same logo, same edited field values, same selected options, and filename with client name.