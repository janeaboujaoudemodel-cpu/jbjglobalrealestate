I found the breakages:

1. The CRM brokerage send is hidden inside the **Outreach** dropdown, so it is not obvious enough.
2. The backend outreach function still hard-appends the wrong CC email: `infoo.jane@gmail.com`.
3. The booking confirmation function also uses the wrong CC email.
4. The internal implementation note file still contains the wrong email, which is why it keeps resurfacing in chat summaries.
5. Some preview/test copy still uses generic wording like “Your Brokerage”, which can look like fake data.

Plan:

- Add a clear top-level CRM button on the Brokerage tab: **Send Selected Agencies** next to the current Outreach menu, using the same existing selected-agency send flow.
- Keep the Outreach dropdown, but make it secondary so the send action is visible immediately.
- Replace every wrong `infoo.jane@gmail.com` reference with the correct `infoo.jane@gmail.com` in:
  - `supabase/functions/crm-send-brokerage-outreach/index.ts`
  - `supabase/functions/breakfast-booking-confirm/index.ts`
  - `.lovable/plan.md`
- Update comments/copy so the app never reintroduces the one-O email in generated template text.
- Remove fake-looking preview fallback wording for brokerage email previews and use neutral labels like `[Brokerage Name]` instead of “Your Brokerage”.
- Deploy the changed email functions after editing so the live sending code matches the files.
- Verify with a search that no `infoo.jane@gmail.com` remains anywhere in the project.