

## Summary of Issues Found

### 1. Support Ticket Hub UI Issues

**Current Problems:**
- **Text visibility issues**: The Support Ticket Hub page uses a dark theme (`bg-black text-white`), but UI components like `Input`, `Textarea`, and `Select` have their own premium champagne styling with light backgrounds and `text-black`. When these components are used in the dark hub page with override classes like `bg-zinc-800 border-zinc-700 text-white`, the styling conflicts cause readability issues.
- **Dropdowns appear gray**: The `SelectTrigger` and `SelectContent` in `SupportTicketHub.tsx` apply dark-theme overrides (`bg-zinc-800 border-zinc-700 text-white`) that conflict with the base component styling.
- **Bottom section layout**: The refresh button and stats cards need more visual polish.

**Specific UI problems in the code:**
```typescript
// SupportTicketHub.tsx - Lines 119-142
// These override classes conflict with the base component:
<Input className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
<SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
<SelectContent className="bg-zinc-800 border-zinc-700">
```

### 2. Tickets Not Showing in Hub

**Finding:** The database query confirms **10 tickets exist** in `support_tickets`. The data fetching should work, but let me check for RLS policy issues:
- Tickets exist: `JBJ-20260208-8123`, `JBJ-20260208-5309`, `JBJ-20260208-9580`, etc.
- The hook `useSupportTickets` queries without user restrictions (for staff), so this should work for owners.

### 3. Email Confirmation Not Being Received

**Finding from logs:**
```
2026-02-08T14:58:33Z INFO Customer confirmation email sent: null
```

The log shows `null` for the message ID, which means the Resend API returned an unexpected response structure. Looking at the code:
```typescript
customerEmailMessageId = customerEmailResult?.data?.id || null;
```

The issue is that the Resend SDK v2+ changed its response structure. The result is `{ id: "...", ... }` directly, not `{ data: { id: "..." } }`.

**Evidence:** The database shows `customer_confirmation_status: sent` and `customer_confirmation_sent_at: 2026-02-08 14:58:33.902+00` for the latest ticket, meaning the email API call succeeded but the message ID extraction failed. However, if the status is "sent", the email should have been delivered.

**Potential email delivery issue:** The email might be going to spam, or there could be a Resend domain verification issue affecting actual delivery despite the API returning success.

---

## Implementation Plan

### Phase 1: Fix Support Ticket Hub UI (Premium Dark Theme)

**Goal:** Create a cohesive, premium dark-themed interface with proper text contrast.

**File: `src/pages/SupportTicketHub.tsx`**

Changes:
1. Replace inline dark-mode overrides on Input/Select with dedicated dark-theme variants
2. Add proper text colors for all form elements
3. Improve stats cards with premium gold accents
4. Add a "Back" button for navigation
5. Enhance the overall visual hierarchy

**Specific fixes:**
- Input: Use custom styling that properly overrides the base component
- Select dropdowns: Create inline dark-variant styling or use the existing dark background with proper text
- Table text: Ensure all table cells have readable text colors
- Cards: Add gold border accents for premium feel

### Phase 2: Fix Select/Dropdown Visibility

**File: `src/components/support/TicketDetailPanel.tsx`**

The detail panel also needs text contrast fixes:
- Reply textarea: Override the champagne background for dark context
- Ensure all text in the panel is readable

### Phase 3: Fix Email Message ID Extraction

**File: `supabase/functions/submit-support-ticket/index.ts`**

Fix the Resend API response handling:
```typescript
// Current (broken):
customerEmailMessageId = customerEmailResult?.data?.id || null;

// Fixed (Resend v2+ returns id directly):
customerEmailMessageId = customerEmailResult?.id || customerEmailResult?.data?.id || null;
```

Also add more detailed logging to diagnose delivery issues.

### Phase 4: Verify RLS Policies for Ticket Visibility

**Check:** Ensure the RLS policies on `support_tickets` allow Owner to read all tickets.

Current query in `useSupportTickets.ts`:
```typescript
let query = supabase
  .from("support_tickets")
  .select("*")
  .order("created_at", { ascending: false });
```

This should work, but if tickets aren't showing, we need to verify the Owner role has the correct SELECT policy.

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SupportTicketHub.tsx` | Complete UI overhaul - proper dark theme styling, gold accents, readable text, Back button |
| `src/components/support/TicketDetailPanel.tsx` | Fix textarea contrast, improve dark panel styling |
| `supabase/functions/submit-support-ticket/index.ts` | Fix Resend API response handling, add better logging |

### UI Changes Breakdown

**SupportTicketHub.tsx:**
1. Header section:
   - Add "Back" button with proper contrast
   - Keep gold accents on title
   - Improve refresh button visibility

2. Stats cards:
   - Add gold border/shadow accents
   - Ensure numbers are highly visible

3. Filter section:
   - Override Input to have dark background with WHITE text (not inherited black)
   - Override SelectTrigger/SelectContent for dark context with proper contrast
   - Use `!important` overrides if needed or inline style objects

4. Table:
   - Verify all text is visible against dark background
   - Keep gold accents for headers and ticket numbers

**TicketDetailPanel.tsx:**
1. Reply composer textarea:
   - Override champagne gradient with dark zinc background
   - Ensure placeholder and input text are white/light

2. Message thread:
   - Keep existing styling (already uses appropriate dark colors)

### Edge Function Fix

```typescript
// Line 496-497 - Fix for Resend v2+
const customerEmailResult = await resend.emails.send({...});
customerEmailSent = true;
// Resend v2+ returns { id: "...", from: "...", ... } directly
// Some versions return { data: { id: "..." } }
customerEmailMessageId = customerEmailResult?.id || customerEmailResult?.data?.id || null;
console.log("Customer confirmation email sent:", JSON.stringify(customerEmailResult));
```

---

## Testing Checklist

1. **UI Visibility:**
   - All text in Support Ticket Hub is readable (white/light on dark)
   - Dropdowns show gold/champagne styling with black text when open
   - Stats cards have visible numbers
   - Back/Refresh buttons are clearly visible

2. **Ticket Display:**
   - All submitted tickets appear in the list
   - Click on ticket opens detail panel correctly

3. **Email Delivery:**
   - Submit a new test ticket
   - Verify confirmation email is received
   - Check edge function logs for proper message ID

4. **Premium Aesthetic:**
   - Gold accents throughout
   - Consistent dark theme
   - Professional, clean appearance

