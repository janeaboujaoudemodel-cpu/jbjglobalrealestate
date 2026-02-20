
# Company Profile Builder — Smart URL Extraction, Color Palette System, Completion Score & Placeholder Cleanup

## What We're Building

This is a major enhancement to the Company Profile Builder with 4 distinct feature groups, plus a new shared color palette system that feeds into all corporate suite tools.

---

## Feature 1: Smart URL / Website Extraction

### How It Works
The user pastes their website URL → clicks "Generate from Website" → the system:
1. Calls `firecrawl-scrape` with `formats: ["markdown", "branding"]` to get page content + brand colors
2. Sends the scraped markdown to `company-profile-ai` (new action: `extract_from_url`) to parse company name, tagline, about us, services, team, contact info
3. Extracts the brand color palette from Firecrawl's `branding.colors` response
4. Auto-fills all form fields instantly
5. Saves the extracted color palette to the `design_color_palettes` table for use across all tools

### New Action in `company-profile-ai/index.ts`
Add `action === "extract_from_url"`:
```typescript
// Takes: markdown (scraped content), url
// Prompt: "Extract company profile data from this website content..."
// Returns structured JSON: { companyName, tagline, aboutUs, services[], team[], phone, email, website, address, linkedin, instagram }
```

### UI: URL Input Panel (top of left column, above Document Extractor)
```
┌──────────────────────────────────────────────┐
│ 🌐  GENERATE FROM WEBSITE                    │
├──────────────────────────────────────────────┤
│  https://yourcompany.com              [→ Go] │
│  [Extracting your company details...   ████] │
└──────────────────────────────────────────────┘
```
- Input field + "Extract" button
- Progress: "Scanning website…" → "Extracting details…" → "Applying colors…" → Done toast
- On success: fills all fields + shows "Colors saved to your palette" badge

### Firecrawl Dependency
The existing `firecrawl-scrape` edge function is already deployed. We call it from the frontend via `supabase.functions.invoke("firecrawl-scrape", { body: { url, options: { formats: ["markdown", "branding"], onlyMainContent: true } } })`. If Firecrawl is not connected, we degrade gracefully — we only use the `company-profile-ai` AI extraction with a simpler fetch.

---

## Feature 2: Smart Color Palette System (Draggable, Full Color Wheel)

### Database
The `design_color_palettes` table already exists with the correct schema:
```
id, user_id, name, description, colors (jsonb), is_default, is_public, created_at, updated_at
```
The `colors` field stores an array of `{ hex: string, name: string }` objects, so we add a `role` field: `{ hex: string, name: string, role: "primary" | "secondary" | "accent" | "background" | "text" }`.

No migration needed — the `colors` JSONB column is flexible.

### New Component: `WebsitePalettePanel.tsx`
A self-contained panel embedded in `CompanyProfileBuilder` (also exportable for other tools) with:

**Drag-and-Drop Role Assignment:**
- 5 role slots displayed horizontally: Primary · Secondary · Accent · Background · Text
- Color swatches are draggable between slots
- Dragging a color to a different slot swaps the roles — the role labels stay fixed, only the color moves
- Uses HTML5 drag-and-drop (no new library needed, we already have framer-motion for smooth animations)

**Full Color Wheel (per swatch):**
- Clicking any swatch opens an inline popover with:
  - A native `<input type="color">` (full color wheel)
  - Hex input field
  - Opacity/alpha slider (0–100%)
  - Preview swatch
- Changes apply live to the preview

**Palette Actions:**
- "Save Palette" → upserts to `design_color_palettes` with name = "Website Palette — {companyName}"
- "Apply to Template" → updates the active template's accent/bg colors in the preview
- "Reset" → re-extracts from website or clears to defaults

**Integration Points:**
- When website is extracted → palette auto-populates
- Palette is also accessible from Business Card Designer and Logo Creator (they already use `design_color_palettes` via `ColorPaletteManager`)

```
┌──────────────────────────────────────────────────────────┐
│  BRAND COLOR PALETTE                    [Save] [Apply]   │
├──────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───┐  ┌───┐  │
│  │ #1A1A1A │  │ #C8A766 │  │ #F5F0E6 │  │   │  │   │  │
│  │ Primary │  │Secondary│  │ Accent  │  │Bg │  │Txt│  │
│  └─────────┘  └─────────┘  └─────────┘  └───┘  └───┘  │
│  ↑ Drag to swap roles                                    │
│                                                          │
│  [Click any swatch to open color wheel]                  │
└──────────────────────────────────────────────────────────┘
```

---

## Feature 3: Completion Score Panel

### Scoring Logic (100 points total)
The score is calculated in real time from `data` state:

| Field | Points |
|---|---|
| Company Name | 10 |
| Tagline | 8 |
| About Us (>50 words) | 15 |
| Logo uploaded | 10 |
| ≥1 Service with title | 8 |
| ≥1 Service with description | 7 |
| ≥3 Services | 5 |
| ≥1 Team member | 8 |
| Phone | 5 |
| Email | 7 |
| Website | 5 |
| Address | 5 |
| LinkedIn | 4 |
| Instagram | 3 |

**Strength / Weakness Analysis:**
Displayed below the score bar as two lists:

- **Strengths** (green check icons): fields that are complete and above minimum
- **Weaknesses** (orange warning icons): missing or thin fields with specific suggestions

Example weaknesses:
- "About Us is too short — click AI Expand for a professional paragraph"
- "No team members added — profiles build trust with clients"
- "Missing LinkedIn — add for professional credibility"

### UI Location
Placed in the **right column** above the Live Preview panel:

```
┌─────────────────────────────────────────────┐
│ Profile Score                          72%  │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░   │
│                                             │
│ ✓ Company name & tagline                    │
│ ✓ About Us section complete                 │
│ ⚠ Add at least 3 services for a full profile│
│ ⚠ Missing logo — upload in Brand Assets     │
└─────────────────────────────────────────────┘
```

---

## Feature 4: Remove Placeholder Text

### Current Problem
Inputs show `placeholder="JBJ Global Real Estate"` and `placeholder="Excellence in UAE Real Estate"` — the user's company name is hardcoded as example text.

### Fix
Replace all placeholder text across the Company tab with neutral, generic examples:
- Company Name: `"e.g. Acme Corporation"` → or empty placeholder `"Your company name"`
- Tagline: `"e.g. Building trust since 2010"` 
- About Us: `"Describe your company, mission, and values…"`
- Services: `"e.g. Property Consulting"`
- Website: `"https://www.yourcompany.com"`
- Address: `"City, Country"`

---

## Auto-Detect from Website on First Load

When the user has previously extracted a website and saved it (via `ai_tool_projects` or localStorage), or if their profile already has a `website` field set, we pre-fill the URL input field automatically so they can re-extract with one click.

For **new sessions**: the URL input field is empty — no auto-population (the user must provide a URL).

---

## Files Changed

| File | Action | Details |
|---|---|---|
| `supabase/functions/company-profile-ai/index.ts` | **Edit** | Add `extract_from_url` action that takes scraped markdown and returns structured profile JSON |
| `src/components/corporate-suite/CompanyProfileBuilder.tsx` | **Rewrite** | Add URL input panel, color palette panel, completion score panel, fix placeholders, wire all new state |

No new database migrations needed — `design_color_palettes` table already exists with JSONB `colors` column.

---

## Implementation Details

### `company-profile-ai` — New Action: `extract_from_url`

```typescript
} else if (action === "extract_from_url") {
  systemPrompt = `You are a company profile extractor. Extract structured business information from website content. Return ONLY valid JSON, no explanation.`;
  userPrompt = `Extract company profile information from this website content and return ONLY valid JSON:
{
  "companyName": "company name",
  "tagline": "company tagline or slogan",
  "aboutUs": "about us paragraph extracted from the page",
  "services": [{"title": "service name", "description": "description"}],
  "team": [{"name": "person name", "role": "title"}],
  "phone": "phone number",
  "email": "email address",
  "website": "${url}",
  "address": "physical address",
  "linkedin": "linkedin URL",
  "instagram": "instagram handle"
}
Website content:
${markdown.slice(0, 8000)}
Use empty string "" or [] for fields not found.`;
```

### Color Extraction from Firecrawl Branding

```typescript
// From firecrawl branding response:
const brandColors = scrapedData?.data?.branding?.colors;
if (brandColors) {
  const palette = [
    { hex: brandColors.primary || "#000000",    name: "Primary",    role: "primary" },
    { hex: brandColors.secondary || "#666666",   name: "Secondary",  role: "secondary" },
    { hex: brandColors.accent || "#C8A766",      name: "Accent",     role: "accent" },
    { hex: brandColors.background || "#ffffff",  name: "Background", role: "background" },
    { hex: brandColors.textPrimary || "#111111", name: "Text",       role: "text" },
  ];
  setWebsitePalette(palette);
}
```

### Drag-and-Drop Color Role Swap

```typescript
// State: array of 5 colors in role order [primary, secondary, accent, bg, text]
// On dragStart: store dragged index
// On drop: swap colors[draggedIdx] with colors[droppedIdx]
// Role labels never move — only the hex values swap
```

### Completion Score Calculation

```typescript
function calcScore(data: ProfileData, logoUrl: string): number {
  let score = 0;
  if (data.companyName)                     score += 10;
  if (data.tagline)                         score += 8;
  const wordCount = data.aboutUs.trim().split(/\s+/).length;
  if (wordCount > 10)                       score += 8;
  if (wordCount > 50)                       score += 7;
  if (logoUrl)                              score += 10;
  if (data.services.some(s => s.title))     score += 8;
  if (data.services.some(s => s.description)) score += 7;
  if (data.services.filter(s => s.title).length >= 3) score += 5;
  if (data.team.some(m => m.name))          score += 8;
  if (data.phone)                           score += 5;
  if (data.email)                           score += 7;
  if (data.website)                         score += 5;
  if (data.address)                         score += 5;
  if (data.linkedin)                        score += 4;
  if (data.instagram)                       score += 3;
  return score; // max 100
}
```

---

## User Flow After Implementation

1. User opens `/toolkit/corporate-suite/company-profile`
2. **URL panel** appears at top — user pastes `https://jbjglobalrealestate.com` and clicks "Extract"
3. System scrapes the site, extracts colors and text via AI
4. All fields auto-fill: company name, tagline, about us, services, contact info
5. **Color palette panel** appears with 5 brand swatches — user can drag "Gold" from Accent to Primary if preferred
6. **Completion score** shows instantly, e.g. 74% with specific next-step suggestions
7. User fixes gaps (adds LinkedIn, more services), score climbs to 91%
8. Exports PDF — template uses extracted brand colors
9. Palette is saved and available in Business Card Designer and Logo Creator

---

## Graceful Degradation (No Firecrawl)

If Firecrawl is not connected, the URL extraction falls back to:
1. Using the AI gateway directly with a `fetch` of the URL (basic HTML) — less reliable but functional
2. Color palette is skipped — user manually picks colors
3. A banner shows: "For richer extraction including brand colors, connect Firecrawl in Settings"

