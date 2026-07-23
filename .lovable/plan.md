## Plan

1. **Brokerage Portal visibility + contrast**
   - Make the Brokerage Portal open on the “Emails sent + replies” tab by default so the Branded Emails launcher is immediately visible.
   - Lock active tab styling and the “Today” toggle to the approved emerald gradient with white text/icons.
   - Keep DLD sync history collapsed by default.

2. **Brokerage cards cleanup**
   - Remove visible “None” badges from cards.
   - Replace unclear `none/null` values in dropdown display with meaningful placeholders such as “Registration status”, “Developer group status”, and “Briefing status”.
   - Remove phone/WhatsApp fields from agency contact editing so cards stay clean.
   - Improve agency logo fallback by using website/email domains for logo lookup and only falling back to an emerald icon when no domain logo resolves.
   - Ensure card action icons, including add/delete/more controls, have strong contrast.

3. **Inbox routing**
   - Change Brokerage Portal inbox links away from the old backend route and into the Emerald JBJ CRM inbox route.

4. **Developer Branded Email sender/signature**
   - Remove personal names from visible From/signature for developer registration sends.
   - Use **JBJ Team** and **JBJ GLOBAL REAL ESTATE** only in the UI preview, send confirmation, and backend send path.
   - Keep Jane Bou Jaoude only where explicitly requested: as the name attached to the WhatsApp admin number.

5. **Developer registration template content**
   - Update the stored `developer_registration` template to say:
     - share the broker registration form and requirements;
     - create a WhatsApp group with their sales and operations team;
     - add **+971 54 716 7107** as admin under **Jane Bou Jaoude**;
     - place the developer logo on the WhatsApp group;
     - share one **Google Drive** master marketing-material link only;
     - share company profile and contact-directory documents;
     - sign off as **JBJ Team** / **JBJ GLOBAL REAL ESTATE** only.
   - Remove SharePoint/Dropbox wording and personal-name signature wording.

6. **Blocked Drive preview behavior**
   - In email preview, intercept Google Drive/Calendar links so they open in a new top-level browser tab/window instead of trying to render inside the preview iframe.
   - Keep links visibly clickable in preview without causing the “drive.google.com is blocked” iframe page.

7. **Deploy + validate**
   - Deploy the updated developer-registration email function after backend code changes.
   - Validate with Playwright screenshots for:
     - Brokerage Portal default tab and contrast;
     - Branded Emails card visible;
     - card labels without `None/null` clutter;
     - email preview centered header and company-only From/signature;
     - Drive link no longer navigating the iframe to a blocked page.