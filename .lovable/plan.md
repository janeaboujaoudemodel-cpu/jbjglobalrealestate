
# Instagram Grid Planner — Two-Mode Upgrade + Direct Instagram Publishing

## Current State Analysis

The Grid Planner currently lives inside `BeautyFilters.tsx` as a single tab (value="grid"). It has:
- Basic photo upload and a 3-column Instagram-style grid preview
- Drag-to-reorder between slots
- Placeholder "Schedule Posts" and "Connect Instagram" buttons that just show toast messages
- No real Instagram connection, no post captions per photo, no publish flow

This plan adds **two distinct modes** and a real **Instagram publish flow**.

---

## Two Modes to Build

### Mode 1 — Visual Grid Preview (No Instagram Required)
The user uploads their own photos, arranges them in a 3-column Instagram-style grid, adds captions, and can download or copy everything locally. This is a pure front-end planning tool — zero authentication needed.

### Mode 2 — Live Instagram Publishing
The user connects their Instagram Business account. Each photo sits in a "Draft" state until they click "Post Now" or "Schedule". Upon publish, the app sends the photo + caption to Instagram via the Instagram Graph API.

---

## Technical Architecture

### Instagram API Requirements
Instagram publishing requires the **Instagram Graph API**, which requires:
1. A Facebook Developer App with `instagram_content_publish` and `pages_read_engagement` permissions
2. An Instagram **Business** or **Creator** account
3. A **long-lived access token** stored securely

Since there is no native Instagram connector available in the workspace connectors list (only ElevenLabs and Firecrawl), we will:
- Store the Instagram Access Token and Instagram Business Account ID as backend secrets (the user provides them from their Facebook Developer App)
- Create a new backend edge function (`instagram-publish`) that calls the Instagram Graph API
- Build the UI mode toggle and publish flow in the component

### Backend Edge Function: `instagram-publish`
- **Endpoint**: POST `/instagram-publish`
- **Accepts**: `{ imageUrl, caption, instagramAccountId, scheduledTime? }`
- **Flow**:
  1. Upload the image to a Container via `POST /{ig-user-id}/media` (Instagram requires a publicly accessible URL)
  2. Publish the container via `POST /{ig-user-id}/media_publish`
  3. Return the new media ID
- **Secrets needed**: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`

Since images uploaded locally (via `URL.createObjectURL`) are not publicly accessible, we also need to **upload the file to backend storage** first to get a public URL, then pass that URL to Instagram.

### Storage
Use the existing Lovable Cloud file storage — create a public bucket `instagram-grid-photos` for temporary image hosting before publishing.

---

## UI Design

### Mode Toggle (Top of Grid Tab)
```text
┌─────────────────────────────────────────────────────────────┐
│  [📱 Preview Mode]  [📸 Instagram Connect]                  │
│   Plan your grid    Post directly to Instagram              │
└─────────────────────────────────────────────────────────────┘
```

### Preview Mode Layout
```text
┌─────────────────────────────────────────────┐
│ 📤 Add Photos   [Select All] [Clear]        │
├─────────────────────────────────────────────┤
│ 📱 Instagram Feed Preview                   │
│ ┌──┬──┬──┐  ← 3-column grid               │
│ │  │  │  │  ← drag to rearrange            │
│ │  │  │  │  ← hover shows caption          │
│ ├──┼──┼──┤                                 │
│ │  │  │  │                                 │
│ └──┴──┴──┘                                 │
│ [Click any photo to add caption]            │
├─────────────────────────────────────────────┤
│ [Apply Preset to All] [Export Grid]         │
└─────────────────────────────────────────────┘
```

### Instagram Connect Mode Layout
```text
┌─────────────────────────────────────────────┐
│ ✅ Connected: @youraccount  [Disconnect]    │
│ — OR —                                      │
│ [Connect Instagram Business Account]        │
│ Instructions + token entry form             │
├─────────────────────────────────────────────┤
│ Queue (each photo shows as a card):         │
│ ┌─────────────────────────────────────────┐ │
│ │ [thumbnail] Caption: "Type caption..."  │ │
│ │ Status: DRAFT                           │ │
│ │ [Post Now] [Schedule ▾] [Remove]        │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ [thumbnail] Caption: "..."              │ │
│ │ Status: ✅ POSTED — Jun 15, 2:00 PM    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [Post All Drafts] [Schedule All]            │
└─────────────────────────────────────────────┘
```

---

## Implementation Details

### Files to Change

**1. `src/pages/toolkit/BeautyFilters.tsx` — Grid tab section (lines 827–924)**

Replace the current grid tab content with a new `InstagramGridPlanner` component (extracted inline or as a separate import) that includes:

- **Mode toggle**: Two styled buttons at top — "Preview Mode" and "Instagram Mode"
- **Preview Mode**: Keep existing 3×N grid with drag-to-reorder. Enhance with:
  - Per-photo caption input (slide-up on click)
  - Hover overlay showing caption preview
  - "Apply Preset to All" and "Export Grid" batch actions
- **Instagram Mode**: 
  - Connection status section (shows token input form if not connected, or account name if connected)
  - Photo queue displayed as vertical list of cards instead of grid
  - Each card: thumbnail + caption textarea + status badge (DRAFT / POSTED / SCHEDULED) + action buttons
  - "Post Now" button triggers upload + publish
  - Loading/spinner state per photo during publishing
  - Success state: shows Instagram post URL

**2. `supabase/functions/instagram-publish/index.ts` — New edge function**

```typescript
// Flow:
// 1. Receive { imageDataUrl, caption, accountId }
// 2. Upload image data to storage bucket → get public URL
// 3. POST to https://graph.facebook.com/v19.0/{accountId}/media
//    with { image_url: publicUrl, caption }
// 4. POST to https://graph.facebook.com/v19.0/{accountId}/media_publish
//    with { creation_id: containerId }
// 5. Return { success: true, postId, postUrl }
```

**3. Database storage bucket migration**

Create a public storage bucket `instagram-grid-photos` for temporarily hosting images before they are published to Instagram (Instagram requires a publicly accessible image URL).

**4. `supabase/config.toml`** — Register the new edge function.

---

## Secrets Required

The user will need to provide:
- `INSTAGRAM_ACCESS_TOKEN` — Long-lived token from Facebook Developer App (valid 60 days, refreshable)
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` — The Instagram Business User ID (numeric)

We will prompt the user for these via the `add_secret` tool after explaining the setup. We will NOT block the Preview Mode on these secrets — it works with zero configuration.

---

## Implementation Order

1. Create storage bucket `instagram-grid-photos` via SQL migration
2. Create `supabase/functions/instagram-publish/index.ts` edge function
3. Request secrets `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_BUSINESS_ACCOUNT_ID` from user
4. Update the Grid tab in `BeautyFilters.tsx` with mode toggle + full Instagram mode UI
5. Wire "Post Now" buttons to the edge function

---

## What Works Without Instagram Connection (Preview Mode)
- Upload unlimited photos
- Drag to reorder in 3-column grid
- Add captions per photo (stored in component state)
- Apply preset filters to all
- Export/download the grid layout

## What Requires Instagram Connection (Instagram Mode)
- Viewing the publish queue
- "Post Now" (immediate publishing)
- "Schedule" (posts at a chosen time)
- Seeing post status (DRAFT / POSTED / SCHEDULED)
- Direct link to the published Instagram post

---

## Important Note on Instagram API
Instagram's Graph API only supports **Business** and **Creator** accounts (not personal accounts). The user must have a Facebook Developer App with the `instagram_content_publish` permission approved. We will include clear step-by-step instructions in the UI for how to get the access token — this is a one-time setup.
