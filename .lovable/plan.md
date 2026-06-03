Plan:

1. Remove the privacy gate entirely
- Delete the conditional `BusinessCardPrivacyNotice` render from `BusinessCardScanner` so `/business-card-scanner` opens directly into the scanner.
- Remove the `showPrivacyNotice` / `consentGiven` state and the “View Privacy Policy” button that reopens the broken privacy screen.
- Remove unused imports related to that screen.

2. Fix the broken checkbox regression by eliminating the screen that contains it
- Since you asked not to show “Privacy & Data Protection” for this tool anymore, the checkbox will no longer render at all.
- This prevents the white filled checkbox / faded tick issue from appearing in the Business Card Scanner flow.

3. Make Upload match Camera height
- Set a shared stable scanner-panel height for both tab contents.
- Keep the Camera tab’s current visual size as the reference.
- Expand the Upload drop zone vertically so switching between Camera and Upload does not shrink the left card or move the lower actions/results layout.

4. Lock remaining scanner controls away from champagne/white-on-white states
- Keep Upload, Select Images, process, clear, and export controls in the scanner rose/dark palette.
- Ensure inactive tab hover states stay dark/rose instead of champagne.

5. Validate after implementation
- Reopen `/business-card-scanner` directly and confirm the privacy screen is gone.
- Capture Camera and Upload screenshots at the current viewport and compare heights.
- Confirm no visible broken privacy checkbox remains.