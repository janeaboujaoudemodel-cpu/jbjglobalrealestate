

# Competitor Source Sanitization & HTML Stripping Plan

## Problem
Project descriptions from external sources contain raw HTML with competitor URLs (e.g., `<a href="https://providentestate.com/...">`) that leak onto frontend cards and detail pages as visible markup text.

Two distinct issues:
1. **Raw HTML in descriptions** — card components strip markdown but not HTML tags, so `<p>`, `<a>` tags render as visible text
2. **Competitor references** — competitor names/URLs appear in descriptions, admin UI text, and data fields

## Solution

### 1. Create a centralized sanitization utility (`src/utils/contentSanitizer.ts`)

A single utility that:
- Strips all HTML tags from text, preserving inner text content
- Removes competitor URLs and domains (providentestate.com, reelly.io, etc.)
- Removes competitor name mentions (Provident, Reelly)
- Strips source attribution patterns ("Source:", "Extracted from", "via")
- Can be called as `sanitizeForDisplay(text)` for plain-text contexts (cards) and `sanitizeHtml(html)` for rich HTML contexts (detail pages)

### 2. Fix card description rendering

**`ReellyProjectCard.tsx`** and **`ProjectCard.tsx`** — update `getTruncatedDescription()` to call `sanitizeForDisplay()` which strips HTML tags and competitor references before truncation.

### 3. Fix rich HTML rendering pipeline

**`markdownUtils.ts`**:
- In `formatReellyDescription()`: strip embedded HTML tags and competitor references from source text before markdown processing
- In `renderMarkdownToHtml()`: filter out `<a>` tags pointing to blocked domains, converting them to plain text

### 4. Clean admin-facing UI text

Remove visible "Provident" references from:
- `DeveloperApprovalQueue.tsx` — button text "Extract from Provident"
- `SarahTestPanel.tsx` — suggested URLs and description text
- `ProvidentSyncButton.tsx` — component name stays but visible labels change
- `AdminDevelopers.tsx` — section label

These are admin-only pages (owner-locked), but per policy they should still not show competitor names. Labels will be changed to generic terms like "External Source" or "Import Source".

### 5. Clean type definitions

Remove "Provident" mentions from code comments in:
- `unifiedProject.ts` — comment references
- `ApprovalConfirmDialog.tsx` — comment references

These are non-functional but maintain code hygiene.

### Files to create
- `src/utils/contentSanitizer.ts`

### Files to modify
- `src/components/ReellyProjectCard.tsx` — use sanitizer in `getTruncatedDescription()`
- `src/components/ProjectCard.tsx` — use sanitizer in `getTruncatedDescription()`
- `src/lib/markdownUtils.ts` — add HTML stripping and competitor URL filtering
- `src/components/listing-admin/DeveloperApprovalQueue.tsx` — rename visible labels
- `src/components/listing-admin/SarahTestPanel.tsx` — rename visible labels
- `src/components/admin/ProvidentSyncButton.tsx` — rename visible labels
- `src/pages/AdminDevelopers.tsx` — rename visible label
- `src/types/unifiedProject.ts` — clean comments
- `src/components/project-detail/ProjectDetailTabs.tsx` — use sanitizer
- `src/components/area-detail/AreaAboutSection.tsx` — benefits from markdownUtils fix

