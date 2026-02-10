

# Fix Long Descriptions Across All Pages -- Proper Formatting and Layout

## Problem

Descriptions on project detail, area detail, developer detail, and developer info card pages are rendered as single blocks of text with no visual structure. Some descriptions are 5000+ characters long, creating walls of text that look unprofessional.

## Changes

### 1. Project Detail Description -- Add Expand/Collapse

**File: `src/components/project-detail/ProjectDetailLayout.tsx`** (lines 675-692)

The description section already uses `renderMarkdownToHtml(formatReellyDescription(...))` for formatting, but it shows the entire content at once. Add an expand/collapse mechanism:
- Show first ~500 characters by default with a fade-out gradient overlay
- "Read More" button to expand full content
- "Show Less" button to collapse back
- Use a `useState` to toggle between truncated/full view
- The fade gradient gives a premium feel instead of a hard cut

### 2. Area About Section -- Structure Long Descriptions into Paragraphs

**File: `src/components/area-detail/AreaAboutSection.tsx`** (lines 35-52)

Currently splits on `\n` only for descriptions > 300 chars, but many long descriptions have no newlines, resulting in one massive paragraph. Fix:
- For descriptions > 400 characters, add expand/collapse with a "Read More" / "Show Less" toggle
- Show first ~300 characters by default
- Use `formatReellyDescription` + `renderMarkdownToHtml` from markdownUtils to properly structure the text into paragraphs and sections (same as project detail)
- Render via `dangerouslySetInnerHTML` with prose styling for proper paragraph spacing

### 3. Developer Detail Page -- Format and Truncate Description

**File: `src/pages/DeveloperDetail.tsx`** (lines 174-178)

Currently renders `developer.description` as a single `<p>` tag with no formatting. Fix:
- Use `formatReellyDescription` + `renderMarkdownToHtml` to structure the text
- Add expand/collapse for descriptions > 400 characters
- Show a preview with fade-out, then "Read More" to see full text
- Also fix `object-fill` on line 160 to `object-contain p-2` (same logo fix as DeveloperInfoCard)

### 4. DeveloperInfoCard -- Use Proper Formatting

**File: `src/components/project-detail/DeveloperInfoCard.tsx`** (lines 128-130)

Currently shows `displayDescription` as plain text in a single `<p>` tag. For descriptions with structure (bullet points, sections), this loses all formatting. Fix:
- Use `renderMarkdownToHtml(formatReellyDescription(...))` to render properly formatted HTML
- Keep the existing expand/collapse logic (already implemented)
- Change from `<p>` to `<div>` with `dangerouslySetInnerHTML` and add prose styling for proper paragraph/list rendering

---

## Expand/Collapse Pattern (Consistent Across All Pages)

All description sections will use the same premium pattern:
- Default: Show preview (~300-500 chars) with a subtle fade-out gradient at the bottom
- "Read More" button with gold styling and ChevronDown icon
- Expanded: Full formatted content
- "Show Less" button with ChevronUp icon
- Smooth transition for premium feel

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add expand/collapse to project description |
| `src/components/area-detail/AreaAboutSection.tsx` | Format descriptions with markdown utils, add expand/collapse |
| `src/pages/DeveloperDetail.tsx` | Format + truncate description, fix logo `object-fill` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Use `renderMarkdownToHtml` for proper formatting |
