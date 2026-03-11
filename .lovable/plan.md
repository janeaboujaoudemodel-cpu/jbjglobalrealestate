

## Plan: Enhance Ticket Hub Form — Categories, Priority, Attachments & Screen Recording

### What's Missing in `src/pages/TicketHub.tsx`

The Ticket Hub's "New Ticket" form currently has only 7 basic categories, no priority selector, no file upload, and no screen recording. Meanwhile `SupportTicketBox.tsx` already has 22 categories, priority levels, and file attachments — but no screen recording anywhere in the codebase.

### Changes

**1. Expand categories** (`src/pages/TicketHub.tsx`)
Replace the 7-item `SERVICE_CATEGORIES` with the full 22-item list from `SupportTicketBox.tsx`, plus additional ones like "Incorrect Data / Fake Information", "Project Report", "Feature Request", "Partnership Inquiry".

**2. Add priority selector** (`src/pages/TicketHub.tsx`)
Add a priority dropdown (Low, Normal, High, Critical) to the form — same as `SupportTicketBox`. Store `priority` in `newTicket` state and send it on submit instead of hardcoded `"medium"`.

**3. Add file upload section** (`src/pages/TicketHub.tsx`)
Add an attachment area (max 5 files) with drag-and-drop support for photos, videos, and screenshots. Upload to `support-attachments` bucket on submit, same pattern as `SupportTicketBox`.

**4. Add screen recording** (`src/pages/TicketHub.tsx`)
Add a "Screen Record" button that uses the browser's `navigator.mediaDevices.getDisplayMedia()` + `MediaRecorder` API to capture the screen. When stopped, the `.webm` file is added to attachments automatically. This is a new feature not yet in any file.

### File Changes

| File | Changes |
|------|---------|
| `src/pages/TicketHub.tsx` | Expand categories to 25+, add priority selector, add file upload area with drag-drop, add screen recording button using MediaRecorder API, update submit to upload files and send priority |

