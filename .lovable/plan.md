## Phase 1 Plan — Clean JBJ CRM Shell Reset

### Scope lock
- Rebuild **only the CRM application shell** now.
- Do **not** build CRM modules yet.
- Do **not** change the public site, owner backend, broker CRM, developer portal, or existing non-JBJ-CRM features.
- Reset only the current generated JBJ CRM implementation under `/owner/crm/jbj/*` and its supporting CRM shell files.

### Important boundary
To make this genuinely match Zoho’s UI, I need to work from a visible Zoho reference. I will treat Zoho screenshots/video captures as the source of truth, not my own interpretation. If no reference screenshots are available in the project, I will first create the shell structure to accept a reference-locked styling pass, then validate against provided screenshots when you upload them.

## What I will delete/reset

### Current JBJ CRM generated work
- Remove the current custom JBJ CRM shell/layout assumptions.
- Remove generated custom dashboard/card patterns.
- Remove generated module-page layout assumptions.
- Remove custom cache/mirror UI assumptions used for the previous “Zoho-inspired” implementation.
- Keep route access/security integration intact so `/owner/crm/jbj` remains protected and backend-ready.

### What I will not delete
- Existing owner backend.
- Existing CRM data tables.
- Existing Zoho connector/backend function foundation.
- Existing public website.
- Existing broker/developer/investor portals.
- Existing global brand tokens.

## Phase 1 rebuild target

Build a clean CRM shell with only these pieces:

```text
/owner/crm/jbj
  ├─ JBJ CRM App Shell
  │  ├─ Header
  │  ├─ Workspace switcher area
  │  ├─ Left vertical sidebar
  │  ├─ Expand/collapse interaction
  │  ├─ Footer/actions area
  │  └─ Responsive shell behavior
  └─ Empty module outlet placeholder
```

## Required shell behavior

### Header
- Match the Zoho CRM header structure from reference.
- Replace Zoho branding with the official JBJ Global Real Estate logo.
- Keep placement, scale, spacing, and alignment reference-locked.
- Add only two allowed JBJ actions:
  - **Owner** → `/owner/admin`
  - **Return to Site** → `/`
- No extra invented buttons or dashboard shortcuts.

### Left vertical sidebar
- One sidebar only.
- The JBJ CRM sidebar replaces the owner backend sidebar inside `/owner/crm/jbj/*`.
- Expand/collapse control appears at the bottom, not the top.
- Animation, spacing, icon placement, active states, hover states, and transitions follow the Zoho reference.
- No custom card/sidebar redesign.

### Workspace/navigation
- Build the shell navigation structure only.
- Modules may appear as navigation entries, but their pages will remain Phase 2 placeholders.
- No invented dashboards, analytics cards, fake stats, or custom CRM widgets.

### Responsive behavior
- Desktop: full CRM shell.
- Tablet/iPad: shell remains usable without compressed content.
- Mobile: reference-aligned adaptive shell behavior, no horizontal overflow.
- Validate no double sidebar and no content squeeze.

## JBJ design token replacement

Only replace Zoho colors with JBJ tokens:
- Primary: official JBJ emerald metallic.
- Backgrounds: JBJ champagne/white where the reference calls for light surfaces.
- Text: black on light/champagne, pure white on emerald.
- Gold only as approved hairline/accent, never as a fill.
- Remove all generic Tailwind green/lime/olive/forest classes from the JBJ CRM tree.

## Backend-ready architecture without building modules yet

Phase 1 will prepare the shell for future enterprise scale:
- Route structure supports module pages later.
- Module registry remains clean and declarative.
- API layer remains connector/function-ready.
- Future support for organizations, teams, roles, permissions, audit logs, subscriptions, API keys, OAuth, webhooks, and marketplace is accounted for in architecture boundaries, but not visually implemented in Phase 1.

## Files likely affected

- `src/routes/OwnerRoutes.tsx`
- `src/pages/owner/crm/jbj/*`
- Optional new shell-only structure:
  - `JbjCrmShell.tsx`
  - `JbjCrmHeader.tsx`
  - `JbjCrmSidebar.tsx`
  - `JbjCrmWorkspace.tsx`
  - `jbjCrmShell.css`

## Validation plan

After implementation I will validate:
- `/owner/crm/jbj` has only one vertical sidebar.
- Owner backend sidebar is not mounted inside JBJ CRM.
- Collapse button is bottom-positioned.
- Owner and Return to Site actions work without full-page layout breakage.
- No generic green classes remain in the JBJ CRM shell files.
- No horizontal overflow at desktop, iPad, and mobile widths.
- Screenshots captured before/after for the JBJ CRM shell.

## Phase 2 gate

I will not build Leads, Contacts, Deals, Forecast, Activities, Reports, Dashboards, Documents, Projects, Developers Portal, Listings, or any other module until you approve the Phase 1 shell visually.