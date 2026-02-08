
# Add Loading States and Success/Error Feedback to Support Ticket Form

## Overview
Enhance the Support Ticket form UX with professional loading states, animated feedback, and clear error handling to give users confidence during submission.

## Current State Analysis

The form currently has:
- Basic `isSubmitting` boolean state
- Simple "Submitting..." text when loading
- Toast notifications via `sonner`
- Success view with ticket number after submission

**What's Missing:**
- Animated loading spinner during submission
- Upload progress indication for attachments
- Clear error state with retry option
- Field-level validation feedback
- Submission step indicator

---

## Implementation Plan

### 1. Enhanced Loading State During Submission

**File:** `src/components/SupportTicketBox.tsx`

Replace the simple "Submitting..." text with an animated multi-step indicator:

```text
Step 1: "Uploading attachments..." (if files exist)
Step 2: "Creating your ticket..."
Step 3: "Sending confirmation..."
```

Add a proper spinning loader icon (`Loader2` from lucide-react) with smooth animation.

**Changes:**
- Add new state: `submissionStep: 'idle' | 'uploading' | 'creating' | 'confirming'`
- Update the submit button to show the current step with icon
- Add subtle progress animation overlay on the form

---

### 2. Upload Progress Indicator

**File:** `src/components/SupportTicketBox.tsx`

When files are being uploaded, show:
- Individual file upload status (uploading/completed/failed)
- Visual checkmark when each file completes
- Overall attachment progress

**Changes:**
- Add `uploadProgress` state to track per-file status
- Update the file upload loop to set status for each file
- Modify attachment list UI to show upload state with icons

---

### 3. Error State with Retry Capability

**File:** `src/components/SupportTicketBox.tsx`

When submission fails, show:
- Clear error message explaining what went wrong
- "Retry" button that attempts resubmission
- Option to save draft locally (localStorage)

**Changes:**
- Add `submissionError: string | null` state
- Add error display component within the form
- Add retry handler that clears error and resubmits

---

### 4. Form Overlay During Submission

**File:** `src/components/SupportTicketBox.tsx`

Add a semi-transparent overlay on the form during submission to:
- Prevent accidental edits
- Show centered loading animation
- Display current step progress

**Changes:**
- Add overlay div with `pointer-events-none` when submitting
- Center the loading indicator with backdrop blur

---

### 5. Success State Enhancements

**File:** `src/components/SupportTicketBox.tsx`

Improve the existing success view with:
- Confetti or celebration animation (optional)
- Animated checkmark entrance
- Clearer next steps messaging

**Changes:**
- Add entrance animation with framer-motion scale + opacity
- Enhance the success icon with a pulsing glow effect

---

## Technical Details

### New State Variables
```typescript
const [submissionStep, setSubmissionStep] = useState<
  'idle' | 'uploading' | 'creating' | 'confirming'
>('idle');
const [submissionError, setSubmissionError] = useState<string | null>(null);
const [uploadStatuses, setUploadStatuses] = useState<Record<number, 'pending' | 'uploading' | 'done' | 'error'>>({});
```

### Updated handleSubmit Flow
```text
1. Set submissionStep = 'uploading' (if attachments exist)
2. Upload each file, updating uploadStatuses per file
3. Set submissionStep = 'creating'
4. Call edge function with retry logic
5. Set submissionStep = 'confirming'
6. On success: setIsSubmitted(true)
7. On error: setSubmissionError(message), reset step to 'idle'
```

### Loading Indicator Component
```text
- Loader2 icon with animate-spin
- Text showing current step
- Subtle pulsing glow effect matching gold theme
```

### Error Display Component
```text
- Red alert box with error icon
- Error message text
- "Retry" button and "Cancel" option
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SupportTicketBox.tsx` | Add loading states, error handling, upload progress, form overlay |

---

## Expected UX Flow

1. **User fills form** - Normal state
2. **User clicks "Create Ticket"** - Button shows spinner + "Uploading files..."
3. **Files upload** - Each file shows checkmark as it completes
4. **API call starts** - Button shows "Creating your ticket..."
5. **Success** - Animated success view with ticket number
6. **OR Error** - Error message with "Retry" button appears

---

## Visual Design

- **Loading Spinner:** Gold-colored `Loader2` with `animate-spin`
- **Progress Steps:** Subtle text change with fade transition
- **Error State:** Red border, red icon, clear message
- **Success Enhancement:** Green checkmark with scale animation
- **Form Overlay:** Semi-transparent white with blur during submission

This maintains the existing premium gold/pearl design language while adding professional UX feedback.
