

## Plan: Enhanced Ticket Form — Priority, Attachments & Screen Recording

### What Changes

**File: `src/pages/TicketHub.tsx`**

The "New Ticket" form currently only has: Name, Email, Subject, Category, Description. It needs:

1. **Priority selector** — Add a row with a `Select` for priority (Low, Medium, High, Urgent). Save to `user_selected_priority` column (already exists in DB).

2. **More issue categories** — Expand `SERVICE_CATEGORIES` to include: "Incorrect Price", "Incorrect Availability", "Incorrect Information", "Website Bug", "Slow Performance", "Login/Access Issue", "Project Data Issue", "Feature Request" (in addition to existing ones).

3. **File upload section** — Add a drop zone / file input for uploading screenshots, photos, videos, or screen recordings. Files upload to the existing `support-attachments` storage bucket. Save URLs to `attachment_urls` column (already exists in DB).

4. **Screen Record button** — Add a "Record Screen" button that uses the browser's `navigator.mediaDevices.getDisplayMedia()` API to capture a screen recording. When the user stops recording, the video blob is uploaded to storage alongside other attachments.

### Layout Changes (form area, lines 303-349)

The form grid becomes:
- Row 1: Full Name | Email
- Row 2: Subject | Category  
- Row 3: Priority (full width or half with placeholder)
- Row 4: Description with voice input
- Row 5: Attachments area — drag/drop zone with "Upload File" + "Record Screen" buttons, showing thumbnails of attached files
- Row 6: Submit button

### Implementation Details

- **Screen recording**: Uses `getDisplayMedia()` → `MediaRecorder` → on stop, create blob → upload to `support-attachments/{userId}/{timestamp}-recording.webm`
- **File uploads**: Reuse pattern from `useFileUpload.ts` but target `support-attachments` bucket
- **State additions**: `attachmentUrls: string[]`, `isRecording: boolean`, `mediaRecorder: MediaRecorder | null`
- **On submit**: Include `attachment_urls` and `user_selected_priority` in the insert call

### Files

| File | Action |
|------|--------|
| `src/pages/TicketHub.tsx` | Edit — add priority, expanded categories, file upload zone, screen record |

No database migration needed — `attachment_urls`, `user_selected_priority`, and `service_category` columns already exist.

