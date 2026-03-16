

## Plan: Global UI Overhaul — Dark Brown Backgrounds, Footer Polish, Developer Center Redesign, Header Tooltips, Scroll & Performance Fixes

This is a large multi-area update covering 13+ distinct changes. Implementation will be done in batches.

---

### 1. Replace Remaining Black Backgrounds with Dark Luxury Brown

**Target color:** `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]`

Still using `bg-black` as section backgrounds (not overlays):
- `src/components/home/WhyChooseUs.tsx` (line 53) — section + icon containers (line 82: `bg-black` on icon boxes → dark brown)
- `src/components/home/HomepageBookMarquee.tsx` (line 72)
- `src/components/home/StartingPointSection.tsx` (line 59)
- `src/components/home/AreasWeCover.tsx` (line 32)
- `src/components/home/WhyDubaiCapitalSection.tsx` (line 53)
- `src/components/home/ResalePropertiesSection.tsx` (line 28)
- `src/components/StatsCounter.tsx` (line 167)
- `src/components/dashboard/StandardUserDashboard.tsx` (line 165)
- `src/pages/MyDashboardProgress.tsx` (line 52)
- `src/pages/Index.tsx` hero section (lines 161, 163) — keep gradient overlays but change base `bg-black` to dark brown
- Any other remaining `bg-black` section-level backgrounds found in components

Also fix accent `bg-black` on icon containers (e.g., WhyChooseUs line 82) → dark brown gradient.

**Between-section gaps:** The space between sections that shows `bg-black` from the parent page wrapper — these are already handled by the page-level `min-h-screen bg-gradient-to-br...` that was applied in the previous batch. If any are still showing black, it means the parent wrapper was missed.

---

### 2. AI Home Finder Card — Darker Background

`src/pages/Index.tsx` lines 396-397: Currently `from-zinc-900/95 via-black/95 to-zinc-800/95`. Change to champagne gold (`from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`) per user request. Adjust text colors for contrast (text-zinc-400 → text-zinc-600, etc.). Make the surrounding section background darker.

---

### 3. Header Tooltip Improvements

`src/components/navigation/HorizontalUtilityBar.tsx` — Update tooltip text for each item:
- Language: "Select your language" (line 220)
- Currency: "Select your currency" (line 230)
- Buy: Add tooltip "Explore properties for sale" (currently no tooltip)
- Rent: Add tooltip "Rent a property"
- Sell: Add tooltip "List your property for sale or rent"
- Tasks: "My Tasks" → already good (line 293)
- Notifications: Already shows count — update to "Notifications — View all alerts" (line 313-314)
- Inbox: "My Inbox — Messages & updates" (line 330)
- Dashboard: "My Dashboard & Profile" (line 348)
- Mode/Account: Add tooltip "Select your mode based on your role"
- Settings: "Profile & Settings" (line 371)
- Notification text color: change from default to gold where needed

Also fix notification badge count if showing incorrect (check `useUserAlerts` logic).

---

### 4. Developer Center Section Redesign

`src/components/home/DeveloperPortalCTA.tsx` — Major redesign:

**For non-registered/non-logged-in users (or users without developer registration):**
- Show benefits list with gold checkmark circles (Submit projects, Submit events, Close deals with brokers, Get publication with brokers, Direct connection with sales managers, Briefings & meetings)
- CTA button: "Register Now as Developer or Sales Representative"
- After registration submission: show application status (Pending/Under Review/Approved/Rejected)
- After approval: "Congratulations, approved! Start Now" button → opens full developer portal

**For registered & approved developers:**
- Show clickable shortcut cards (Submit Project, Submit Event, My Projects, Check Listings, Request Briefing, Agreements) that redirect to respective portal pages

**Visibility:** Show to ALL users (remove the `isDeveloperMode` gate) so anyone can see the benefits and register.

---

### 5. Hero Video Fallback Image

`src/pages/Index.tsx` line 12: Replace `luxuryVillaHero` import. Change the fallback poster image from the villa to something more welcoming — a Dubai skyline or real estate welcome screen. Use a Unsplash/public URL like the properties hero poster already uses, or a different real estate image.

---

### 6. Book Marquee Speed

`src/components/home/HomepageBookMarquee.tsx` line 25: Increase `speed` from `0.4` to `0.8` or `1.0` for faster scrolling.

---

### 7. Scroll Performance

`src/index.css` or global styles — Add CSS `scroll-behavior: smooth` with optimizations. In `src/lib/scroll.ts`, the scroll utility already uses `smooth` behavior. The poor scroll feel is likely due to heavy paint on scroll. Add `will-change: scroll-position` to the main scrollable container and ensure `transform: translateZ(0)` on fixed elements for GPU compositing.

---

### 8. Section Padding — Explore Services

`src/pages/Index.tsx` line 356-362: The "Explore Our Services" section uses `jj-layer-2` class. Need to add vertical padding (`py-8 md:py-12`) to the wrapping `<section>` so it doesn't touch adjacent sections.

---

### 9. Toolkit Showcase Cards — Full Theme Match

`src/components/home/ToolkitShowcaseCard.tsx` — Currently cards have champagne gold background with only colored borders. Redesign each card to have its theme color more prominently: gradient background tint matching the tool's color, darker card backgrounds, premium styling on icons, CTA buttons matching tool color instead of generic gold.

---

### 10. Footer Fixes

**a) Licensed/UAE text readability (lines 594-619):**
- Change "Licensed" and "UAE" gold gradient text to use the same style as "Stay in the Loop" title — darker, more readable gradient with black base.
- Change the `✦` stars from `text-gold/60` to match "Stay in the Loop" star color.

**b) Company name section (lines 490-500):**
- Make the company name slightly darker/more premium — deepen the gradient.

**c) Edge-to-edge footer:**
- Remove `px-1 sm:px-2 md:px-3 lg:px-4` from the footer content wrapper (line 450) and `max-w-7xl` constraints to make it truly edge-to-edge.
- The monogram section and 3D card should span full width.

**d) Stay in the Loop card border:**
- Add stronger 3D border effect — thicker border, more prominent box-shadow.

**e) Footer mode/currency/unit fields contrast:**
- Ensure footer sections for "Your Mode", "Connect With Us", currency, unit fields have better contrast and readability.

---

### 11. Notification Alert Count Fix

Check `src/hooks/useUserAlerts.ts` — the hook queries 4 tables. The "showing 6" vs "hover shows 11" discrepancy may be because the badge shows `totalNotificationAlerts` (3 tables) but excludes `pendingTasks`, while the popup shows `totalAlerts` (all 4). Need to make the badge consistent — show `totalAlerts` everywhere.

The notification title text showing in black instead of gold — fix in the tooltip content styling (line 313-314 in HorizontalUtilityBar).

---

### 12. Footer Connected Design

Make the footer flow as one continuous premium block from monogram → 3D card → legal section, removing gaps between sections and using consistent edge-to-edge styling.

---

### 13. Company Profile Section Padding

The "View Company Profile" link near the book marquee — add slight downward spacing so it sits properly below the JBJ Global section.

---

### Implementation Batches

1. **Batch 1:** Remaining `bg-black` → dark brown in all homepage components + AI Home Finder card + section padding fixes
2. **Batch 2:** Header tooltips + notification fixes + scroll performance
3. **Batch 3:** Developer Center section redesign
4. **Batch 4:** Footer polish (Licensed text, edge-to-edge, 3D borders, connected design)
5. **Batch 5:** Toolkit cards premium redesign + book marquee speed + hero fallback image

### Files Modified (estimated ~25 files)
- `src/components/home/WhyChooseUs.tsx`
- `src/components/home/HomepageBookMarquee.tsx`
- `src/components/home/StartingPointSection.tsx`
- `src/components/home/AreasWeCover.tsx`
- `src/components/home/WhyDubaiCapitalSection.tsx`
- `src/components/home/ResalePropertiesSection.tsx`
- `src/components/home/ToolkitShowcaseCard.tsx`
- `src/components/home/DeveloperPortalCTA.tsx`
- `src/components/StatsCounter.tsx`
- `src/components/Footer.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/dashboard/StandardUserDashboard.tsx`
- `src/pages/Index.tsx`
- `src/pages/MyDashboardProgress.tsx`
- `src/lib/scroll.ts` or `src/index.css`
- `src/hooks/useUserAlerts.ts` (if badge count logic needs fixing)

