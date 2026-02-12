

## Enrich All 540 Developers with Real, Accurate Information

### Current State
- **540 developers** in the database
- Only **16** have `founded_year` filled
- Only **26** have `completed_projects` filled  
- Most have descriptions but many are generic or AI-generated without research
- Missing key fields: website, CEO/chairman, contractor info, total units delivered, upcoming pipeline

### What We Will Do

**Step 1: Add new columns to the developers table**

New columns to capture richer developer profiles:
- `website_url` (text) -- official website
- `ceo_name` (text) -- CEO or Chairman name
- `total_units_delivered` (integer) -- lifetime units handed over
- `upcoming_units` (integer) -- units in pipeline / under construction
- `expected_completion_year` (integer) -- next major handover year
- `notable_projects` (text) -- comma-separated list of signature projects
- `parent_company` (text) -- parent group if applicable (e.g., Dubai Holding for Meraas)
- `license_number` (text) -- RERA or DED license if known
- `specialization` (text) -- e.g., "Luxury", "Affordable", "Mixed-use", "Waterfront"

**Step 2: Create a new edge function `enrich-developer-data`**

This function will:
1. Fetch developers with missing data (batch by batch, 5 at a time)
2. For each developer, use AI (Gemini 2.5 Flash) to research and return structured JSON with all the fields above
3. The AI prompt will explicitly instruct: "Only return information you are confident is factually accurate. If unsure, leave the field null."
4. Update the database row with the researched data
5. Return progress so it can be called repeatedly until all 540 are processed

The function uses the already-configured `LOVABLE_API_KEY` -- no new secrets needed.

**Step 3: Update the DeveloperInfoCard UI**

Show the new data points in the developer profile card:
- Website link
- CEO/Chairman name
- Total units delivered stat
- Upcoming units / expected completion
- Notable projects list
- Specialization badge

**Step 4: Update the developer detail page**

Ensure the developer profile page also displays the enriched fields.

### Technical Details

**Database Migration SQL:**
```sql
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS ceo_name text,
  ADD COLUMN IF NOT EXISTS total_units_delivered integer,
  ADD COLUMN IF NOT EXISTS upcoming_units integer,
  ADD COLUMN IF NOT EXISTS expected_completion_year integer,
  ADD COLUMN IF NOT EXISTS notable_projects text,
  ADD COLUMN IF NOT EXISTS parent_company text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS specialization text;
```

**Edge Function: `enrich-developer-data`**
- Processes 5 developers per call (to stay within timeout limits)
- Uses `google/gemini-2.5-flash` for balanced accuracy and speed
- AI prompt asks for structured JSON response with all fields
- Only updates fields that are currently null (preserves existing accurate data)
- Supports `mode=check` to preview which developers need enrichment
- Returns `next_offset` for sequential batch processing

**AI Prompt Strategy:**
The prompt will include the developer name, their known projects from the `projects` table, and current partial data. It will ask for real, verifiable facts only -- no fabrication. Fields the AI is uncertain about will be left null rather than guessed.

**Files to create/modify:**
- `supabase/functions/enrich-developer-data/index.ts` (new)
- `src/components/project-detail/DeveloperInfoCard.tsx` (update UI)
- Database migration (new columns)

### Important Notes
- This will need to be called multiple times (540 developers / 5 per batch = ~108 calls) to process all developers
- Each call takes ~30-60 seconds due to AI processing
- Existing accurate data (like the 16 developers with founded_year) will NOT be overwritten
- The AI may not find information for very small/obscure developers -- those fields will remain null, which is better than fake data

