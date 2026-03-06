

## Plan: Improve Listing Admin Chat — Drag & Drop UX, Attach Button Fix, and System Audit

### Issues Identified

1. **Attach button cursor** — The `Paperclip` button at line 1154 uses `Button variant="ghost"` which doesn't guarantee `cursor-pointer`. Need to explicitly add `cursor-pointer` class.

2. **Drag & drop overlay missing** — When dragging files from OS file manager, the current `isDragOver` state only shows a tiny text bar (line 1113-1117). Need a full-screen overlay like WhatsApp with a clear drop zone box.

3. **Files don't auto-show Submit** — When files are dropped, they queue but the user has to scroll down to find the "Process X files" button. The queued files panel + submit button should be more prominent and auto-visible.

4. **File input `accept="*/*"` is fine** but the button click can fail if `fileInputRef.current` is null on first render. Need a safety guard.

---

### Implementation

#### 1. Fix Attach Button Clickability
**File:** `src/components/listing-admin/ListingAdminChat.tsx` (line 1154)
- Add `cursor-pointer` class to the Paperclip button
- Ensure the hidden `<input>` element has proper `pointer-events` and the ref is reliably connected

#### 2. Full-Screen Drag & Drop Overlay (WhatsApp-style)
**File:** `src/components/listing-admin/ListingAdminChat.tsx`
- Replace the small `isDragOver` text bar (lines 1113-1117) with a full-overlay drop zone:
  - Absolutely positioned over the entire chat container
  - Semi-transparent backdrop with a dashed border box in the center
  - Icon (Upload cloud) + "Drop files here" text
  - Animated border pulse
  - `pointer-events-none` on children so drop events bubble to the container
- The overlay appears as soon as files are dragged over the listing admin section
- On drop → files queue immediately, overlay disappears, queued files panel shows with prominent "Submit" button

#### 3. Auto-Scroll to Queued Files & Prominent Submit
**File:** `src/components/listing-admin/ListingAdminChat.tsx`
- When `uploadedFiles` changes from 0 to >0, auto-focus the queued files panel
- Make the "Process X files" button larger and more prominent (full-width gold gradient, larger height)
- Add a file count badge that pulses briefly when new files are added

#### 4. System Audit Fixes
**File:** `src/components/listing-admin/ListingAdminChat.tsx`
- **Drag events**: The current `onDragOver`/`onDragEnter`/`onDragLeave` on the container div (lines 883-889) are correct but `onDragLeave` can fire prematurely. Use a `dragCounter` ref (increment on enter, decrement on leave) for reliable overlay toggle.
- **File input reset**: After `openMultiFilePicker` (line 660-665), add `fileInputRef.current.accept = "*/*"` to ensure it stays universal.
- **Memory**: Clear `URL.createObjectURL` references if any are created, to prevent memory leaks.
- **Performance**: Debounce the `saveMessages` effect (already done at 500ms — good). No changes needed.

---

### Files Modified
- `src/components/listing-admin/ListingAdminChat.tsx` — all changes in one file

