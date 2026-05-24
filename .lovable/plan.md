I will make only a surgical correction to the collapsed sidebar expand/collapse control.

Plan:
1. Restore the collapse/expand button UI to the previous style before my last change:
   - No new `isolate` styling.
   - No extra inner border.
   - No changed icon color or button treatment.
   - Keep the original icon/button appearance.

2. Add only a lightweight pulse cue around the existing button:
   - The pulse will be a separate absolute overlay, not a redesign of the button.
   - Champagne/gold, thin, clean, and visible.
   - Slightly outside the 28px icon button but contained so it does not cover Sign Out.
   - No thick borders, no filled color changes.

3. Keep the behavior:
   - Sidebar stays collapsed by default.
   - Pulse appears while collapsed to teach the user the control exists.
   - Once the user clicks the expand/collapse control, the pulse stops for that browser session.

4. Verify in the preview:
   - The old UI style remains intact.
   - The pulse is visible.
   - The pulse does not overlap the Sign Out button.
   - The tooltip still appears immediately on hover.