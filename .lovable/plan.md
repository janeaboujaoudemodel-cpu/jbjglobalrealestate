# Fix CRM page padding and contrast

## Problems observed
1. Large empty band above the "Founder & CEO — Jane Bou Jaoude" title.
   - Root cause: the page wrapper has `pt-20 lg:pt-24` (88–96px) to clear the global fixed header, AND the sticky CRM sub-header adds another `py-3` plus a 2px gold border. Stacked, this looks like a dead gap.
2. The page background uses a dark champagne gradient `from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]` (lines 531, 547, 618). On the rest of the champagne-light UI, this reads as a gray/silver/dark band, especially behind translucent cards, hurting contrast of body text.
3. A few child cards rely on the dark page behind them for contrast; once the page becomes champagne, those need to switch to ink-on-champagne so text stays legible.

## Changes

### 1. Remove the gap above "Founder & CEO"
In `src/pages/CRM.tsx` line 618:
- Drop the extra page top padding (`pt-20 lg:pt-24`). The sticky header already pins itself to `top-20 lg:top-24`, so the page itself does not need to reserve that space — content flows under the global header naturally and the sub-header sits flush below it.
- Tighten the sub-header inner padding from `py-3` to `py-2` on line 639 so the role line ("Founder & CEO — …") starts immediately under the global header instead of floating in a thick band.

### 2. Replace dark gradient with champagne page surface
Replace the three dark gradients (lines 531, 547, 618) with the standard champagne page treatment used elsewhere in the app:
```
bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]
```
This matches the header and the design-system Core rule (Page #FDFBF7, surface #F7F2EA, raised #EFE6D6).

### 3. Re-audit child surfaces for contrast on champagne
After flipping the page to champagne, sweep the CRM children that previously sat on dark and fix any that now look washed out. Specifically check and, where needed, switch to ink-on-champagne (`text-[#1A1A1A]`, gold accents, `--price-orange` for money):
- `CRMEnhancedDashboard` — KPI tiles (Pipeline / Forecast / Conversion / Won, Pipeline by Stage, Calls Today, WhatsApp Messages, Total Leads, Conversion Rate, Weekly Activity, Pipeline Distribution).
- `DealValueTracker`.
- The AI Insights / Smart Reminders / Smart Automations row (already champagne — verify).
- `CRMCommunicationPanel` (Team Communication / Channels / Meetings / Files panel) — the channel list and message bubbles must use ink text on champagne, not white-on-light.
- Loading and unauthorized states at lines 531 and 547 — text colors stay readable on the new light background (switch any white text to `text-[#1A1A1A]` and any `text-white/70` style helpers to `text-[#1A1A1A]/70`).

For each, the rule applied is the project's Core memory: champagne surfaces, ink #1A1A1A text, gold #B89555 accents, `--price-orange` for prices, no raw grays, no faded gold text, no white-on-light.

### 4. Guardrails
- Strict "No Removal": no features, tabs, cards, or copy are removed — only background, padding, and text colors change.
- IconTile usage and existing gold/emerald/red/blue/amber semantic tones are preserved.
- No changes to data, RLS, hooks, or the Relationship Hub work from earlier.

## Files touched
- `src/pages/CRM.tsx` — page wrapper background (3 spots), top padding, sub-header `py-3` → `py-2`.
- `src/components/crm/CRMEnhancedDashboard.tsx` — verify/repair contrast on champagne.
- `src/components/crm/DealValueTracker.tsx` — verify/repair contrast on champagne.
- `src/components/crm/CRMCommunicationPanel.tsx` — verify/repair contrast on champagne.

## Verification
- Visual check at the CRM route: no empty band above "Founder & CEO"; the sub-header sits flush under the global header.
- No dark gray/silver band visible behind the dashboard.
- All KPI numbers, labels, channel names, and message text are clearly legible (ink on champagne, gold accents, orange for prices).
- No regression in Relationships, Automations, Tasks, Calendar, Team, or Media Ingestion entry points.
