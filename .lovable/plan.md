

# Ticket Support Hub - AI Intelligence, Bulk Actions & Performance Overhaul

## Executive Summary

This plan transforms the "Support Ticket Hub" into a fully intelligent "Ticket Support Hub" with AI-powered reply suggestions, bulk operations, direct email integration, and significant performance improvements. It also addresses critical storage issues and UI polish.

---

## Issues Identified

### A) Missing AI Intelligence Integration
- No AI-generated response suggestions when replying to tickets
- No smart categorization or auto-triage beyond basic keyword detection
- No sentiment analysis or urgency scoring visible in the UI

### B) Attachment Storage - "Bucket Not Found" Error
**Root cause confirmed**: The `support-attachments` bucket exists (private bucket) and contains files. However, the attachment URLs are being generated with `getPublicUrl()` which requires the bucket to be **public**. Since `support-attachments` is a **private** bucket (`public: false`), the generated public URLs return 404 errors.

Files ARE being uploaded successfully (confirmed 5 files in storage), but the public URL pattern doesn't work for private buckets.

### C) UI Issues in Ticket Detail Panel
- Close button (X) styling is faded/black - needs white or styled box
- Email link exists but doesn't trigger a composed email with AI-generated content
- No AI-generated response recommendations visible

### D) Domain Verification Error Message
Old error message still shows: "The jbjglobalrealestate.com domain is not verified" despite domain being verified now as `jbj.ae`

### E) Missing Bulk Actions
- No checkbox selection for multiple tickets
- No "Select All" functionality
- No bulk status changes (Mark All Resolved)
- No bulk delete capability
- No date-based sorting control visible

### F) Priority Dropdown Colors
Priority options in filter dropdown are plain text - should show colored labels like the ticket list badges

### G) Page Title
Currently "Support Ticket Hub" - should be "Ticket Support Hub"

### H) Performance Issues
- Ticket detail loading has noticeable delay
- Full website is slow (reported across multiple sections)
- No data prefetching or caching optimization

---

## Implementation Plan

### Phase 1 - Fix Critical Storage Issue (Attachments)

**Problem**: Private bucket + public URL = 404

**Solution**: Create signed URLs for private bucket access

**Files to modify**:
- `src/components/support/TicketDetailPanel.tsx`
- `src/hooks/useSupportTickets.ts`

**Changes**:
1. Create a new hook `useSignedAttachmentUrl` that generates time-limited signed URLs for private bucket files
2. Replace direct URL links in `TicketDetailPanel` with signed URL generator
3. Add inline image preview for image attachments (instead of just linking)
4. Handle URL generation errors gracefully

**Technical approach**:
```typescript
// Generate signed URL for private storage access
const { data } = await supabase.storage
  .from('support-attachments')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

### Phase 2 - AI-Powered Reply Suggestions

**Goal**: When owner clicks to reply, AI analyzes the ticket and suggests a contextual response

**New Edge Function**: `supabase/functions/ai-ticket-reply-suggest/index.ts`

**Functionality**:
1. Takes ticket details (subject, description, category, priority)
2. Uses Lovable AI (google/gemini-2.5-flash) to generate professional response draft
3. Considers ticket history/context
4. Provides 2-3 response variations (quick resolution, needs more info, escalation)
5. Owner can select, edit, and send

**Files to create/modify**:
- `supabase/functions/ai-ticket-reply-suggest/index.ts` (new)
- `src/components/support/TicketDetailPanel.tsx` (add AI suggestion UI)
- `src/hooks/useSupportTickets.ts` (add AI suggest mutation)

**AI Response UI in TicketDetailPanel**:
- "Suggest AI Reply" button next to the compose textarea
- Shows loading state with shimmer effect
- Displays suggested responses in cards user can click to populate
- User can edit before sending

### Phase 3 - Direct Email Compose

**Goal**: Click on customer email opens pre-filled compose with AI-generated content

**Implementation**:
1. Replace simple `mailto:` link with smart compose button
2. On click:
   - Generate AI response suggestion (if not already done)
   - Open email compose modal OR populate reply textarea
3. Add "Send as Email" vs "Save as Reply" options

**Alternative approach**: Integrate directly with the existing `useSendTicketReply` hook but add an AI-generated draft step first.

### Phase 4 - Remove Domain Verification Error

**Files to modify**:
- `src/components/SupportTicketBox.tsx` (remove/update error display logic)
- `src/components/support/TicketDetailPanel.tsx` (update confirmation status display)

**Changes**:
1. Remove hardcoded domain verification error message
2. Only show email errors if they're genuine failures (not domain-specific)
3. Since domain is now verified (`jbj.ae`), clean up legacy error references

### Phase 5 - Bulk Actions & Selection

**UI Additions to `SupportTicketHub.tsx`**:

1. **Checkbox column** in ticket table (leftmost)
2. **Header checkbox** for "Select All"
3. **Bulk action toolbar** (appears when items selected):
   - "X selected" count
   - "Mark Selected as Resolved" button
   - "Mark Selected as In Progress" button
   - "Delete Selected" button (with confirmation dialog)
   - "Clear Selection" button

4. **Date sorting control**:
   - Add sort toggle next to "Created" column header
   - Shows ascending/descending arrow
   - Default: descending (newest first)

**New hooks in `useSupportTickets.ts`**:
- `useBulkUpdateTicketStatus` - batch update multiple tickets
- `useBulkDeleteTickets` - batch delete with confirmation

**Database considerations**:
- Bulk operations will use `in()` filter: `.in('id', selectedIds)`
- Add proper error handling for partial failures

### Phase 6 - Priority Dropdown with Colors

**Modify `SupportTicketHub.tsx` filter dropdowns**:

Current:
```tsx
<SelectItem value="critical">Critical</SelectItem>
```

Updated:
```tsx
<SelectItem value="critical" className="flex items-center gap-2">
  <span className="w-2 h-2 rounded-full bg-red-500" />
  <span className="text-red-400">Critical</span>
</SelectItem>
```

Apply consistent color coding:
- Critical: red
- High: orange
- Normal: blue
- Low: zinc/gray

### Phase 7 - Close Button (X) UI Fix

**Current state** in `TicketDetailPanel.tsx`:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={onClose}
  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
>
  <X className="w-5 h-5" />
</Button>
```

**Fix**: Style to match other action buttons (gold border, visible icon)
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={onClose}
  className="bg-zinc-800 border border-gold/30 text-white hover:bg-gold/20 hover:border-gold"
>
  <X className="w-5 h-5" />
</Button>
```

### Phase 8 - Rename Hub

**Files to modify**:
- `src/pages/SupportTicketHub.tsx` - Change page title and header text
- Any navigation/menu references (MegaMenuAccount, GlobalHeader, etc.)

**Changes**:
- "Support Ticket Hub" → "Ticket Support Hub"
- Update page meta title
- Update any sidebar/menu labels

### Phase 9 - Performance Optimization

**A) Ticket List Optimization**:
1. **Select fewer columns** for list view (defer full description to detail panel)
2. **Add staleTime** to React Query configuration to reduce refetches
3. **Prefetch ticket details** on row hover

**B) Ticket Detail Loading**:
1. **Parallel queries** - fetch ticket and messages simultaneously (already done, verify)
2. **Skeleton loading states** - already implemented, verify they're optimized
3. **Optimistic updates** for status changes

**C) Global Performance (broader scope)**:
1. Add `staleTime` and `cacheTime` to key queries
2. Ensure image lazy loading across homepage sections
3. Consider route-based code splitting for heavy pages

**React Query optimization example**:
```typescript
useQuery({
  queryKey: ["support-tickets", filters],
  queryFn: async () => { ... },
  staleTime: 30 * 1000, // 30 seconds
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Files to Create

1. `supabase/functions/ai-ticket-reply-suggest/index.ts`
   - AI-powered reply suggestion generator

---

## Files to Modify

### Frontend
1. `src/pages/SupportTicketHub.tsx`
   - Rename to "Ticket Support Hub"
   - Add checkbox column and selection state
   - Add bulk action toolbar
   - Add date sorting
   - Add colored priority labels in dropdown
   - Performance optimizations (prefetch on hover)

2. `src/components/support/TicketDetailPanel.tsx`
   - Fix X button styling
   - Add "Suggest AI Reply" button
   - Add AI suggestion display cards
   - Fix attachment links (signed URLs)
   - Remove domain verification error
   - Add direct email compose flow

3. `src/hooks/useSupportTickets.ts`
   - Add signed URL generation for attachments
   - Add `useAIReplySuggestion` hook
   - Add `useBulkUpdateTicketStatus` hook
   - Add `useBulkDeleteTickets` hook
   - Add staleTime/cacheTime optimization

4. `src/components/SupportTicketBox.tsx`
   - Remove domain verification error message display

### Backend
5. `supabase/functions/ai-ticket-reply-suggest/index.ts` (new)
   - AI reply suggestion endpoint

### Navigation (if needed)
6. `src/components/header/MegaMenuAccount.tsx`
   - Update "Support Ticket Hub" → "Ticket Support Hub" label

7. `src/components/GlobalHeader.tsx`
   - Update mobile menu label if present

---

## Technical Details

### AI Reply Suggestion Prompt Design

```
System: You are a professional customer support assistant for JBJ Global Real Estate. 
Generate helpful, empathetic responses to support tickets.

User: [Ticket details]
- Subject: {subject}
- Category: {category}
- Priority: {priority}
- Issue Description: {description}
- Previous conversation: {messages}

Generate 3 response options:
1. Quick Resolution (if issue seems simple)
2. Needs More Information (ask clarifying questions)
3. Escalation Notice (for complex issues requiring specialist)

Each response should be professional, warm, and action-oriented.
```

### Bulk Delete Safety

- Require confirmation dialog with ticket count
- Show warning: "This action cannot be undone"
- Log deletions in audit trail (if available)
- Consider soft delete (status: 'deleted') vs hard delete

### Signed URL Caching

- Generate signed URLs on-demand when user opens ticket
- Cache signed URLs in component state for 30 minutes
- Regenerate if expired
- Handle errors gracefully (show "Attachment unavailable" if generation fails)

---

## Verification Checklist

After implementation, verify:

1. **Attachments work**: Click attachment in ticket detail - file opens/downloads without 404
2. **AI suggestions load**: Click "Suggest AI Reply" - see 2-3 response options
3. **Email compose works**: Click email address - pre-populated compose appears
4. **Bulk select works**: Check multiple tickets - bulk toolbar appears
5. **Bulk actions work**: Mark 3 tickets resolved at once - all update
6. **Delete works**: Delete test ticket - removes from list
7. **Priority colors show**: Open priority dropdown - see colored labels
8. **X button visible**: Close button is styled and clearly visible
9. **Name changed**: Page header says "Ticket Support Hub"
10. **No domain error**: Create ticket - no "domain not verified" message
11. **Faster loading**: Click ticket - detail loads within 500ms
12. **Date sorting**: Toggle sort - tickets reorder correctly

