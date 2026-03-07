

# Fix: Listing Generator Timeout on Large File Batches

## Root Cause

When you upload 10+ heavy files (PDFs, images), the `generate-listing` edge function:
1. Stores ALL file base64 data in `ai_job_master.input_payload` (can be 50-100MB+ of JSON)
2. Sends ALL files as inline base64 `image_url` parts in a single AI gateway request
3. The AI gateway request times out on Gemini Pro with this payload size
4. The background self-call (`triggerBackgroundProcessing`) also dies because it re-reads and re-sends the same massive payload
5. The job stays stuck as "processing" forever, the frontend polls 15 min then resets

## Fix Strategy

### 1. Upload files to storage FIRST, pass URLs instead of base64
**File: `src/components/listing-admin/ListingGenerator.tsx`**
- Before calling `generate-listing`, upload each file to storage bucket `project-documents/staging/{userId}/{timestamp}-{filename}`
- Send only file metadata (name, mimeType, storageUrl) to the edge function instead of base64
- This reduces the payload from 50-100MB to a few KB

### 2. Process files in batches inside the edge function
**File: `supabase/functions/generate-listing/index.ts`**
- Split files into groups of max 3 per AI call
- For each batch, fetch the file from storage URL, convert to base64 for the AI call
- Merge extracted data from all batches into one result
- Update job progress between batches so the frontend shows real progress

### 3. Add file count/size limits with clear feedback
**File: `src/components/listing-admin/ListingGenerator.tsx`**
- Cap total upload size at 40MB with a warning
- Show per-file size in the upload list
- If over limit, show "Split into smaller batches" guidance

### 4. Fix the timeout message and progress feedback
**File: `src/components/listing-admin/ListingGenerator.tsx`**
- Show batch progress: "Analyzing batch 2 of 4..." during polling
- Read `ai_job_master.output_payload.progress` field for real-time status
- Extend timeout threshold from 120s to 300s before showing "taking longer"

### 5. Robust error recovery
**File: `supabase/functions/generate-listing/index.ts`**
- If AI call fails for a batch, continue with remaining batches
- Return partial results with a flag indicating incomplete extraction
- Frontend shows "X of Y documents processed successfully"

## Technical Details

**Storage upload flow (ListingGenerator.tsx):**
```
files → upload to storage → get public URLs → send URLs to edge function
```

**Edge function batch flow (generate-listing/index.ts):**
```
receive file URLs → chunk into groups of 3 → for each chunk:
  fetch files → base64 encode → AI extract → merge results
→ save final merged result to ai_job_master
```

**Progress tracking:**
- Edge function updates `ai_job_master.output_payload = { progress: "Batch 2/4..." }` between batches
- Frontend polls and reads progress field to show real status

## Files to Modify
1. `src/components/listing-admin/ListingGenerator.tsx` - Upload to storage first, show progress, file size limits
2. `supabase/functions/generate-listing/index.ts` - Batch processing, storage fetch, progress updates, partial results

