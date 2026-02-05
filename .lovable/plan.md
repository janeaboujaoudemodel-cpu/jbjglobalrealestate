
# Fix Support Ticket System, Microphone, and Scroll Issues

## Problems Identified

### 1. Support Ticket Submission Fails (404 Error)
The `submit-support-ticket` edge function is **not deployed**. When users try to submit a ticket, the function returns a 404 "NOT_FOUND" error because the bundler failed during deployment due to problematic `esm.sh` imports.

**Root Cause:** The function uses `https://esm.sh/@supabase/supabase-js@2.49.1` and `https://esm.sh/resend@2.0.0` imports that cause the Supabase bundler to timeout.

### 2. Microphone/Voice Not Working
The `voice-to-text` edge function may also be undeployed or failing silently. Users cannot use voice notes in the ticket form.

### 3. Scroll Getting Stuck in Dialog
The ticket form dialog has CSS that may prevent smooth scrolling on some devices.

---

## Technical Solution

### Phase 1: Fix Edge Function Imports

Update `submit-support-ticket` to use npm specifiers instead of esm.sh:

```text
Current (broken):
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

Fixed:
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
```

### Phase 2: Update Import Map

Add Resend to the `deno.json` import map:

```json
{
  "imports": {
    "https://esm.sh/@supabase/supabase-js@2": "npm:@supabase/supabase-js@2",
    "https://esm.sh/@supabase/supabase-js@2.49.1": "npm:@supabase/supabase-js@2",
    "https://esm.sh/resend@2.0.0": "npm:resend@2.0.0"
  }
}
```

### Phase 3: Fix Dialog Scroll

Update the DialogContent in `SupportTicketBox.tsx`:
- Remove `overflow-hidden` from parent
- Add proper scroll container with padding
- Ensure touch scrolling works on mobile

```text
Current:
<DialogContent className="... overflow-hidden flex flex-col">
  <div className="overflow-y-auto flex-1 pr-2">

Fixed:
<DialogContent className="... flex flex-col overflow-y-auto">
  <div className="flex-1 pr-2 pb-4">
```

### Phase 4: Deploy and Verify

1. Deploy `submit-support-ticket` function
2. Deploy `voice-to-text` function
3. Test both with curl calls
4. Verify frontend can submit tickets

---

## Premium Email Improvements

Enhance the confirmation email sent to customers:

### Current State
- Basic HTML email with ticket info
- Simple layout

### Enhancements
1. **Add animated ticket number display** (CSS-based)
2. **Include QR code** for quick access to status check
3. **Add WhatsApp quick reply link** for urgent follow-ups
4. **Add estimated response time** based on priority
5. **Include helpful tips** while waiting
6. **Add unsubscribe footer** for email compliance

### Email Template Improvements

```html
Key additions:
- Premium header with JBJ branding
- Ticket number in large, copy-able format
- Visual priority indicator (color-coded badge)
- Progress tracker showing "Received → In Review → Resolved"
- Quick action buttons (WhatsApp, Call, Email)
- Social proof section ("Rated 4.9/5 by clients")
- Working hours reminder
- Mobile-optimized layout
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/submit-support-ticket/index.ts` | Change esm.sh to npm imports |
| `supabase/functions/deno.json` | Add resend import mapping |
| `src/components/SupportTicketBox.tsx` | Fix scroll CSS, improve UX |

---

## Expected Results

After implementation:
- Ticket submission works with 200 OK response
- User receives premium confirmation email
- Voice notes work for hands-free input
- Dialog scrolls smoothly on all devices
- Error handling with clear user feedback
