

# Replace "Command Center" with "Developer Center" in Developer Mode

## Problem

When a user selects **developer mode**, they still see references to "Command Center" and "Listing Admin" (owner-only tools) in the home page and navigation. The user wants:

1. Developer mode should show **"Developer Center"** (linking to `/developer-hub`) instead of "Command Center"
2. Owner in developer mode should see the **same view as a regular developer** — not the owner Command Center
3. **Listing Admin** (the owner's full admin version at `/owner/listing-admin`) must NOT appear for developer mode users — only the owner gets it

## Files to Change

### 1. `src/components/home/DeveloperPortalCTA.tsx`
- Currently: When owner is NOT in developer mode, shows owner actions including links to `/developer-portal?tab=submit&mode=owner` with "Quick Upload", "Manage Launches", etc.
- **Change**: When `isDeveloperMode` is true (even for owner), show "Developer Center" as the title (not "Developer Portal"), and point the primary action to `/developer-hub` instead of `/developer-portal`
- Remove any owner-specific actions when in developer mode — owner sees exactly what a developer sees

### 2. `src/components/dashboard/QuickActions.tsx`
- Currently: `getActionsForRole()` gives owner actions (Command Center, Listing Admin) regardless of mode
- **Change**: Import `useUserModeContext`, and when `isDeveloperMode` is true, return a new `developerModeActions` array instead of `ownerActions` — even for verified owners
- `developerModeActions` will include: Developer Center (`/developer-hub`), Submit Project, My Projects, Events, Briefings, Agreements — NO Command Center, NO Listing Admin

### 3. `src/components/header/MegaMenuAccount.tsx`
- Currently: `adminLinks` shows "Command Center", "Listing Admin", etc. based on `isOwner` — does NOT check developer mode
- **Change**: Import `useUserModeContext`. When `isDeveloperMode` is true AND user is NOT the owner's primary identity check, hide owner-exclusive links. When owner IS in developer mode, swap "Command Center" → "Developer Center" (`/developer-hub`) and hide Listing Admin, CRM Dashboard, Admin Panel

### 4. `src/components/navigation/GlobalVerticalNav.tsx`
- Line 291: "Owner Command Center" label in ADMIN & OWNER section
- Line 472: "Owner Command Center" in shortcuts
- Line 476: "Listing Admin" in shortcuts
- **Change**: When developer mode is active, replace "Owner Command Center" with "Developer Center" (`/developer-hub`) and hide Listing Admin from the navigation shortcuts. This requires the component to consume `useUserModeContext`.

## What Will NOT Change
- Owner's actual Command Center at `/owner` — unchanged, still accessible directly
- Owner's Listing Admin at `/owner/listing-admin` — unchanged, still accessible via direct URL
- Developer Hub routes — already exist and work
- Non-developer modes (investor, broker) — unaffected
- No new components or UI layout changes

## Summary of Label Swaps

| Location | Current (developer mode) | After |
|----------|------------------------|-------|
| Home DeveloperPortalCTA title | "Developer Portal" | "Developer Center" |
| Home DeveloperPortalCTA primary link | `/developer-portal` | `/developer-hub` |
| QuickActions (owner in dev mode) | "Command Center" + "Listing Admin" | "Developer Center" + developer tools |
| MegaMenu shortcuts (owner in dev mode) | "Command Center" + "Listing Admin" | "Developer Center", no Listing Admin |
| GlobalVerticalNav shortcuts (dev mode) | "Owner Command Center" | "Developer Center" |

