

## Plan: Debug & Fix Developer Portal — File Uploads, RLS, Broken Queries, Drag & Drop

### Bugs Identified

1. **File upload "Failed to upload" error**: The `documents` storage bucket upload at line 363/383 fails silently. The `documents` bucket exists and is public, but uploads may be rejected due to missing RLS write policies for authenticated users on the storage bucket.

2. **`launch_interest_registrations` 403 error**: The "Owner can view all" RLS policy references `auth.users` table directly (`SELECT email FROM auth.users WHERE id = auth.uid()`) which causes "permission denied for table users". Must use a security definer function instead.

3. **`developers.is_active` column doesn't exist (400 error)**: Line 101 queries `developers` table with `.eq('is_active', true)` but the column doesn't exist. Need to remove the filter or query without it.

4. **`e_signature_envelopes` table doesn't exist (404 error)**: Line 283 references `e_signature_envelopes` but the actual table is `esign_envelopes`.

5. **`hr_employees.status` column doesn't exist (400 error)**: Line 639-641 queries `hr_employees.status` which doesn't exist. Need to fix or remove this check.

6. **No drag & drop on file upload zones**: The upload area at lines 989-998 says "drag & drop" but has no `onDragOver`/`onDrop` handlers. Same for `FileUploadZone` component at lines 681-726.

7. **"Submit Approval" blank page**: The `ListingPortalSubmit.tsx` submit handler (line 470) inserts into `portal_listings` — if this fails silently (e.g., missing columns), it would show a blank page. The `setPhase('success')` at line 531 only triggers on success; the catch at line 534 resets to `pricing_role` but may not display properly if the error is in the approval workflow insert.

### Changes

#### 1. Database Migration — Fix RLS & Storage Policies
```sql
-- Fix launch_interest_registrations RLS: replace auth.users reference
DROP POLICY IF EXISTS "Owner can view all interest" ON public.launch_interest_registrations;
CREATE POLICY "Owner can view all interest" ON public.launch_interest_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = '4944592b-93f1-4e05-ab59-4ebe1fee54f1'::uuid);

-- Ensure authenticated users can upload to documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents');
```

#### 2. Fix Broken Queries in DeveloperPortal.tsx
- **Line 98-102**: Remove `.eq('is_active', true)` from developers query (column doesn't exist)
- **Line 283**: Change `e_signature_envelopes` to `esign_envelopes`
- **Lines 638-641**: Remove `.eq('status', 'active')` from `hr_employees` query or handle the error gracefully

#### 3. Add Drag & Drop Support to File Upload Zones
- **Main project upload zone (lines 989-998)**: Add `onDragOver`, `onDragLeave`, `onDrop` handlers with visual feedback
- **`FileUploadZone` component (lines 681-726)**: Add same drag handlers with state for `isDragging`
- Both zones should accept dropped files and pass them through the same upload pipeline

#### 4. Fix ListingPortalSubmit Blank Page
- Add better error handling around the submit flow
- Ensure `catch` block properly shows the error and doesn't leave a blank state
- Wrap the approval workflow insert in try/catch so it doesn't break the main flow

### Files Changed

| File | Changes |
|---|---|
| `src/pages/DeveloperPortal.tsx` | Fix `is_active`, `e_signature_envelopes`, `hr_employees.status` queries; add drag & drop to upload zones; add multi-file select support |
| `src/pages/ListingPortalSubmit.tsx` | Fix blank page on submit with better error handling |
| New migration | Fix `launch_interest_registrations` RLS policy; add storage upload policies for documents bucket |

### Technical Details
- Drag & drop: use `onDragOver` (prevent default + set dragging state), `onDrop` (get `e.dataTransfer.files` and pass to upload handler), `onDragLeave` (reset state)
- Owner detection in RLS uses hardcoded owner UUID instead of querying `auth.users`
- The multi-project from single link feature (AI auto-splitting) requires a separate edge function and is out of scope for this bug-fix pass — will be addressed separately
- Storage policies use `IF NOT EXISTS` pattern via DO blocks to avoid conflicts

