I will fix this as a hard correction, not a style tweak.

## Plan

1. **Lock the correct identity and wording**
   - Add/update project memory so these errors do not come back:
     - Jane Bou Jaoude spelling only.
     - Correct CC email: `infoo.jane@gmail.com`.
     - Brokerage outreach brand: `Citi Developer` singular, not `Citi Developers`.
     - Never generate `Citi Bou Jaoude` or mix developer name with Jane’s family name.
     - Test and bulk brokerage emails address the agency name, not the first word of the recipient email.

2. **Fix the real sent email logic**
   - Update `crm-send-brokerage-outreach` so test sends use the selected agency/sample agency name as the greeting target.
   - Remove the `Dear Info` behavior by preventing email-local-part guessing from becoming the salutation when a brokerage name is provided.
   - Update the registration paragraph to first ask, in premium wording, whether the agency is already registered with Citi Developer; only if not, ask them to send the best email/contact to the Channel Partner Department.
   - Replace `CITI DEVELOPERS` / `City Developer` / `Citi Developers` with locked `Citi Developer` in the sent template variables and fallback copy.
   - Remove any footer wording that can create `Citi Bou Jaoude`; signature will keep Jane’s full name separate from Citi Developer.

3. **Fix subject line**
   - Replace the current subject format (`City Developers and ABC Brokerage Real Estate Partnership for Amra`) with a cleaner premium subject, for example:
     - `Private Citi Developer Briefing for ABC Real Estate | AMRA`
   - Use no underscores and no awkward “and … partnership for …” wording.
   - Ensure the preview and the live sent subject use the same format.

4. **Fix sender behavior explanation in code/UI**
   - Keep `jane@citideveloper.com` as `Reply-To` / visible header value from the Primary Sender field.
   - Add clear UI copy where the primary sender is edited: because the message is sent through the connected Gmail account, Gmail may show the connected account as the technical sender unless that address is configured as a Gmail sending alias. The reply-to still routes replies to `jane@citideveloper.com`.
   - Do not overwrite the saved sender email.

5. **Auto-save test agency names**
   - Extend owner settings with a saved test brokerage-name list.
   - In `TestSendDialog`, when you type/select `ABC Real Estate` for a brokerage test, save it automatically.
   - Show saved agency-name chips with delete support, same pattern as saved test recipient emails.
   - Allow adding/replacing/deleting saved test agency names without fake defaults like “Sample Brokerage Group”.

6. **Fix email layout and footer cards**
   - Update the stored brokerage email template HTML:
     - Remove “In partnership with Citi Developer”.
     - Keep the four footer action cards (website, office, phone, WhatsApp), but make them small, equal-size, and one-line aligned on desktop.
     - Use responsive email CSS so on mobile the “Before we lock your seats” card loses the extra outer border/padding and becomes wider, avoiding the stacked triple-border look.
     - Remove any third decorative border around that card.

7. **Deploy and verify**
   - Deploy the updated brokerage outreach function.
   - Run a project-wide search to verify banned strings are gone from active code/templates:
     - `Citi Bou`
     - `City Developers`
     - `CITI DEVELOPERS` in brokerage outreach
     - one-O wrong Jane email
   - Test the deployed edge function with a brokerage test payload using `ABC Real Estate` and confirm the returned/send path uses the corrected subject/greeting/footer rules.