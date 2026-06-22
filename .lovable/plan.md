Implement a focused backend visual pass for the broker portal.

1. Sidebar and header cleanup
- Remove the “Broker Portal” subtitle under the JBJ watermark in the vertical sidebar.
- Center the company watermark/monogram area so it does not compete with the horizontal “Broker Workspace” header.
- Restyle active sidebar items to emerald fill with white text and white icons.
- Restyle sidebar hover states to emerald/champagne without black-on-emerald conflicts.
- Change “Back to JBJ Owner” from black to the approved emerald gradient on normal load and hover, with white text/icons plus a stronger hover glow/3D lift.
- Make the top-bar owner shortcut match the same emerald treatment.

2. Broker dashboard card styling
- Update the broker portal dashboard cards from mostly champagne/gold accents to emerald-on-champagne: emerald edge accents, emerald icon tiles where appropriate, emerald CTA fills.
- Keep champagne/gold as the surface system; use emerald for backend action/active/primary states.
- Keep secondary actions like “Return to Site”, “Log a call”, collapse, and non-primary controls champagne/ink unless they sit on emerald.

3. Broker academy and backend page elements
- Restyle broker academy KPI cards, training cards, request-access buttons, module dialog primary buttons, certificate progress bars, and active/locked action states to the same emerald system.
- Replace black primary buttons with emerald fill and white text/icons.
- Remove inconsistent blue/purple/rose training KPI icon tones where they are acting as backend chrome, replacing them with emerald/gold-champagne equivalents.

4. Global emerald contrast lock
- Strengthen the final global CSS emerald rule so every emerald-owning surface and its hover/focus/active/disabled states force white text, white SVG color, and white SVG stroke.
- Add backend-safe emerald utility selectors for portal CTAs/cards/sidebar states so no later black-text rule can win on emerald.

5. Visual validation only
- Use the live preview with restored auth session and navigate as a user through `/broker/portal`, `/broker/messages`, and `/broker/learning`.
- Capture screenshots showing: sidebar normal/active state, “Back to JBJ Owner” idle and hover, dashboard cards, academy request-access cards, and any visible modal/dialog triggered from academy.
- Inspect visible screenshots for black text/icons on emerald and correct emerald hover/glow behavior before reporting back.