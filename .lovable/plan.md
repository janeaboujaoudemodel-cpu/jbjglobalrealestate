## Implementation plan

### 1) First pass: capture proof before touching code
- Use Playwright on the current broken pages and forms to capture before screenshots:
  - Project Register Interest / Expert Consultation form
  - Header account dropdown
  - Project Location map controls
  - Payment Plan section
  - Mortgage Calculator / JBJ Mortgage Assistant
  - Brochure / document cards
  - Generate Presentation controls
  - Career/CV, contact, chat/support, broker/developer lead forms where reachable
- Run a computed-style audit that flags:
  - white text/icon on champagne, pearl, white, or gold surfaces
  - black/dark text/icon on emerald, black, or dark surfaces
  - form children touching borders
  - checkbox rows showing duplicate/blue/weak checks
  - non-square/non-circle icon controls

### 2) Root CSS contrast repair, not one-by-one patching
- Identify the winning global CSS rules in `src/index.css` that override foreground color after component styles.
- Replace the conflicting terminal rules with a clear surface contract:
  - emerald/dark/black surfaces and all descendants: pure white text/icons, unless inside a nested light surface
  - champagne/pearl/white/gold/light surfaces and all descendants: ink-black text/icons, unless inside a nested emerald CTA/pill/control
  - dropdown/menu/select/popover content on champagne must never force white text
  - emerald CTAs, pills, map buttons, mortgage assistant buttons, payment labels, document buttons, and project-location controls must always remain white-on-emerald
- Add regression checks for the exact reported cases: account dropdown, project location controls, payment plan percentages, mortgage assistant buttons, document pills, “View Developer Projects”, “View More”, pros/intelligence cards.

### 3) Global form spacing and premium gold border system
- Add a global form shell/field contract so content cannot touch a form border:
  - form panels/dialogs/cards get consistent inner padding on desktop and mobile
  - field groups and multi-select pill groups get minimum internal padding
  - form inputs/selects/textarea use a thinner premium gold hairline, not the thick gold border
  - hover/focus transitions are instant enough to feel responsive and do not lag between fields
- Apply this globally to all form containers, then make small component edits only where a form has local classes fighting the global system.
- Specifically fix the Expert Consultation form shown in the screenshots: thinner border, better inner spacing, smaller pill content, balanced lower checkbox row, and no touching edges.

### 4) Checkbox/tick repair everywhere
- Fix the shared checkbox primitive and native checkbox fallback globally:
  - no browser-blue checkbox or duplicate tick
  - checked state is emerald fill with one thick pure-white tick
  - unchecked state is pearl/champagne with thin gold border
  - no emerald highlight bar behind the label when checking
  - no text-selection highlight on checkbox labels/rows during click
  - checkbox stays inside the form and aligns with its label
- Audit all checkbox usages: terms/privacy, content terms, broker forms, career/CV forms, document/signature forms, filters, notification toggles.

### 5) Lead/CRM integration for every lead entry point
- Inventory every real lead-submission route/component, including:
  - register interest / expert consultation
  - contact/inquiry/lead popups
  - meeting booking
  - mortgage introduction
  - AI chat/support lead forms
  - career portal CV/contact submissions
  - broker/developer registration and visit/deal request forms
  - document/signature/public fill submissions that collect contact details
- Route all lead submissions through one backend capture function so every entry creates/updates a CRM contact with:
  - source, page URL, service/project context, contact details, message/details
  - pipeline stage, health score/status, lead status
  - next follow-up task/reminder
  - AI-prepared first response / suggested outreach based on submitted data
- Keep sensitive contact details handled server-side; do not expose internal CRM IDs to anonymous visitors.

### 6) Owner notifications for new leads
- Extend the lead capture backend so each new/updated lead can trigger:
  - CRM notification record for real-time owner pop-up
  - browser/website notification sound in owner CRM/header when signed in
  - owner email with direct contact details and safe internal CRM link
  - suggested response text to start WhatsApp/email follow-up
- Add a CRM notification listener in the owner CRM shell/header.
- Use the existing email backend path where possible; if a missing secret/connector blocks email delivery, I will wire the function and surface the required backend configuration without exposing secrets.

### 7) Project-page UI fixes requested after the root pass
- Payment Plan:
  - fix percentage/icon contrast to pure white on emerald
  - remove the duplicate three cards for down payment / during construction / on handover
  - keep the timeline strap and make it balanced
  - move edit/AI controls so they do not cover section headers; pencil-only where applicable
- Developer logo:
  - center developer name inside the existing card
  - lift pencil above the card at the top-right; do not alter card size/color/edges/animation
- Owner photos/gallery:
  - default Owner Photos collapsed/minimized until expanded
  - improve rendered image quality where the current thumbnails are using low-quality sizing/cropping
- Icon/button shapes:
  - enforce true circle for icon-only controls and true square where square tiles are intended
  - fix compressed arrows and vertical pills in brochure/generate presentation/market intelligence/filters
- Mortgage Calculator:
  - restyle into a more balanced phased layout while preserving all information
  - shrink oversized mortgage icon
  - use emerald-filled premium controls matching the mortgage AI tool style
  - fix long broken buttons such as Request Mortgage Introduction and Amortization
- Market/Project Intelligence:
  - convert ugly pale green blocks to rich emerald surfaces
  - force pure white content in cash vs mortgage, off-plan vs secondary, buyer metrics, top areas/nationalities, pros, supply/demand, developer landscape
  - fix vertical centering of numbers inside pills
- More Projects / Notice Incorrect:
  - add clean section containment and padding so pills/buttons do not touch or cross neighboring content.

### 8) Project page sticky header/filter behavior
- On project detail pages only:
  - avoid stacking three horizontal bars at once
  - hide the main horizontal header when the section navigation/filter stack is active during project scrolling
  - keep search, sq ft/sq m, currency, favorite, and filter controls in the project filter bar where appropriate
  - section tabs scroll to their target sections cleanly
- Lock this as the reusable project-page rule without changing unrelated pages.

### 9) Performance pass
- Profile the slow loading and dropdown lag with Playwright/network timing.
- Optimize the country/phone picker and heavy dropdown lists by memoizing lists, reducing unnecessary animations/transitions, and avoiding expensive hover repaint rules.
- Check project detail loading path for unnecessary waits/refetches causing “Loading project” to last too long.

### 10) Validation and proof package
- After each step, run the technical audit again and capture after screenshots before moving to the next step.
- Deliver screenshot proof paths and a short before/after matrix for every fixed class of issue:
  - forms/padding
  - checkbox/ticks
  - contrast light-on-light and dark-on-dark
  - CRM lead creation/notification path
  - project payment/mortgage/intelligence/document/icon sections
  - sticky header/filter behavior
- I will not mark a step complete unless the computed-style checks and screenshots confirm it.