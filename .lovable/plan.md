

## Plan: Fix Critical Bugs + Horizontal Bar Enhancement + Global Section Padding

### Issues Identified

1. **Search modal z-index** — Already fixed in previous session (z-[10000]/z-[10001]). Confirmed.
2. **Developer Portal "Submit Event Invitation" button blocked** — The event form in the Events tab works but the submit button style may be visually hidden or overlapped. Need to verify the button rendering at line 413-415.
3. **Contact Us link not redirecting** — The sidebar links to `/contact` correctly (confirmed at lines 1061-1067 in GlobalVerticalNav.tsx). Need to check if something else is broken — possibly a button somewhere that's not wired.
4. **Horizontal bar too short / cramped** — Currently `h-[40px]`. Needs increase to `h-[48px]` with more breathable spacing.
5. **Owner shortcuts in horizontal bar need expansion** — Currently shows CRM, Admin, Listings, Properties, Areas, Developers, Assistant. Missing: HR Hub, CV Center, Owner Command Center, Inquiries/Messages, Customer Happiness.
6. **Global section padding** — The `SupportTicketBox` uses `jj-layer-2` which has `mx-1 sm:mx-2 md:mx-3 lg:mx-4`. The Contact page sections use `mx-0`. Need to standardize ALL sections across ALL pages to use consistent side margins (matching `jj-layer-2` pattern: small black gutters on sides).
7. **Developer Portal should detect developer mode** — Instead of "Are you a developer?" section, use `useUserMode()` to check if user selected `developer` mode and conditionally show the developer tools.

### Changes

**File 1: `src/components/navigation/HorizontalUtilityBar.tsx`**
- Increase bar height from `h-[40px]` to `h-[48px]` 
- Increase icon/text sizes slightly for readability
- Expand owner shortcuts to include: CRM, Admin Panel, Listing Admin, Owner Command Center, HR Hub, CV Center, Inquiries, Messages, Customer Happiness, Founder Assistant
- Add missing icon imports (Headphones, FileUser, Crown, MessageSquare, SmilePlus)

**File 2: `src/pages/DeveloperPortal.tsx`**
- Import `useUserMode` and detect developer mode
- Remove any "Are you a developer?" gating question — the user already selected developer mode in onboarding
- If user is NOT in developer mode, show a note suggesting they switch modes

**File 3: `src/index.css`**
- Standardize `jj-layer-2` margins to be the reference padding (currently `mx-1 sm:mx-2 md:mx-3 lg:mx-4`)
- Create a new utility class `jj-section-gutter` for consistent section-level padding: `px-1 sm:px-2 md:px-3 lg:px-4` applied to section containers

**File 4: `src/pages/Contact.tsx`**  
- Change all section `<div className="mx-0 ...">` to use `mx-1 sm:mx-2 md:mx-3 lg:mx-4` matching `jj-layer-2` gutters
- This creates the thin black border effect the user wants on all sides

**File 5: Multiple page files** (global audit)
- Apply the same `mx-1 sm:mx-2 md:mx-3 lg:mx-4` gutter pattern to all front-end page sections that currently use `mx-0` or have no margin, including: Homepage sections, Services, Guides, Properties page banners, Legal pages, Company pages, Insights/Tools pages
- Search for all `mx-0` champagne/gradient sections and update them

**File 6: `src/components/SupportTicketBox.tsx`**  
- Already uses `jj-layer-2` — confirmed correct. No changes needed.

### Summary Table

| File | Changes |
|------|---------|
| `HorizontalUtilityBar.tsx` | Taller bar (48px), more owner shortcuts, more breathable spacing |
| `DeveloperPortal.tsx` | Auto-detect developer mode, remove "are you a developer" question |
| `Contact.tsx` | Add consistent side gutters (mx-1 sm:mx-2 md:mx-3 lg:mx-4) to all sections |
| `src/index.css` | Add `jj-section-gutter` utility class for global reuse |
| Multiple pages | Apply consistent gutter padding globally |

