I found the immediate failure: `/broker/email/setup` is not rendering the setup page because the owner-preview guard redirects the current owner session to `/owner` unless `?preview=1` or a session flag is present. The sidebar/setup links do not preserve this preview mode consistently, so the browser ends up outside the broker portal; in the user’s screenshot it then falls through to the public 404 experience.

Plan:

1. Fix the broker portal preview routing
- Update the broker portal sidebar links so owner-preview sessions preserve `?preview=1` when navigating inside `/broker/*`.
- Update the Smart Inbox “Email Setup” link and missing-credentials redirect to preserve preview mode reliably.
- Adjust the owner redirect guard so direct access to broker email setup during owner preview does not bounce to `/owner` or 404.

2. Clean the email setup route behavior
- Make `/broker/email/setup` a stable nested broker route that renders inside `BrokerPortalLayout`.
- Add safe redirects/aliases if any existing UI points to an older or malformed email setup path.
- Ensure the setup page works even when no OAuth credentials exist yet.

3. Validate credential save + connect gating
- Test the setup page loads with the Google/Microsoft instructions and redirect URI.
- Test saving dummy OAuth credentials reaches the backend table path correctly or returns a controlled validation/backend response, not a 404.
- Test Smart Inbox → Connect Gmail/Outlook:
  - no credentials: navigates to Email Setup, not a dead toast
  - saved credentials: calls OAuth start and returns a controlled provider/OAuth response

4. Verify the full user flow visually and technically
- Use the browser preview at the same viewport shown in the screenshot.
- Start from broker portal navigation, click Smart Inbox, click Email Setup, fill credential fields, return to Smart Inbox, try Connect Gmail/Outlook.
- Check browser URL, visible page heading, console errors, and network calls.
- If edge function code needs changes, deploy the updated email functions and re-test the function response.

5. Report only verified results
- I will not claim it works until the preview route renders and the tested navigation path no longer produces 404/owner redirect.
- I will list exactly what was tested and any remaining external dependency, such as real Google/Microsoft credentials needed for a live provider OAuth login.