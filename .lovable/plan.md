I found the problem areas: the brokerage preview/editor, the live send function, the bulk-send preview, and the stored brokerage templates are not using the same rendering rules or the same brand defaults. The brokerage template currently still contains JBJ wording in several paths, and the sender falls back to a Gmail/owner identity when the brokerage sender is not explicitly configured.

Plan:

1. Make brokerage outreach strictly CITI Developer branded
- Replace all brokerage-facing copy that says “introduce JBJ Global Real Estate” with CITI Developer wording.
- Use “CITI Developer” consistently for the brokerage workflow.
- Keep JBJ Global Real Estate only in the developer-registration workflow.
- Brokerage signature/footer will become:
  - Jane
  - CITI Developer
  - Sales & Training
  - Channel Partner Activation
  - jane@citideveloper.com
- Remove contact@jbj.ae and JBJ footer text from brokerage emails.

2. Rebuild the brokerage email template into a premium card
- Update the brokerage partnership/breakfast template to a polished email-safe layout:
  - champagne outer background
  - white/champagne premium card
  - thin gold hairline borders only
  - black premium CTA buttons, not blue links
  - premium “Open AMRA e-catalogue” button
  - premium “Reserve / pick your slot” button
  - dedicated card sections for featured project, offer, breakfast invitation, registration check, WhatsApp group / breakfast invitation
- Correct the “Umbra” wording to “AMRA” based on the existing CITI project configuration.
- Ensure conditional blocks like “We’d love to introduce…” and project offer sections display correctly in the editor preview and test email.

3. Make the editor preview match the live email exactly
- Add one shared brokerage preview renderer in the frontend so the template editor and bulk-send preview use the same sample variables.
- Update sample brokerage preview variables to CITI defaults:
  - represented developer: CITI Developer
  - reply-to: jane@citideveloper.com
  - footer: CITI Developer / Sales & Training
  - group line: “We’d love to introduce CITI Developer...”
- Fix the left-side visual editor mismatch by ensuring the editor reloads content when the selected template changes and preserves full HTML rather than stripping important sections unexpectedly.
- Add an “HTML source” fallback remains available for precise editing.

4. Fix locked template handling
- Add an owner-only “Unlock template” action in the template editor so you can edit a locked template when needed.
- Keep the lock feature available, but it will no longer trap you permanently in read-only mode.
- For the immediate correction, update the database template via a migration and leave it editable/unlocked unless you lock it again.

5. Fix sender identity rules
- Brokerage emails will default to:
  - From name: CITI Developer
  - Reply-to / displayed sender: jane@citideveloper.com
  - Saved brokerage sender list includes jane@citideveloper.com
- Developer registration emails will remain:
  - From name: JBJ Global Real Estate
  - Reply-to: contact@jbj.ae
- Remove fallback from brokerage to developer settings so brokerage emails do not accidentally use contact@jbj.ae or JBJ branding.
- Update the test-send dialog to show the sender identity clearly before sending.

6. Update backend send function behavior
- Update the brokerage send function so live emails, test emails, and fallback template generation all use the CITI Developer brand.
- Prefix test email subjects with [TEST] for brokerage as well, so test emails are clearly marked.
- Deploy the updated brokerage send function after changes.

7. Database migration
- Update existing `crm_email_templates` rows for:
  - `brokerage_partnership_intro`
  - `brokerage_breakfast_invite`
- Update existing `crm_owner_settings` brokerage defaults to CITI Developer / jane@citideveloper.com, without changing developer email settings.

Technical files expected to change:
- `src/components/crm/TemplateEditorDialog.tsx`
- `src/components/crm/VisualEditor.tsx`
- `src/components/crm/BulkSendDialog.tsx`
- `src/components/crm/TestSendDialog.tsx`
- `src/hooks/useCRMRelationships.ts`
- `supabase/functions/crm-send-brokerage-outreach/index.ts`
- a new Supabase migration for template/default-setting updates

After approval, I’ll implement this immediately and deploy the updated brokerage email backend function.