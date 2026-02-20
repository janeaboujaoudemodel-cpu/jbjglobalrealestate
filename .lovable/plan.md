
# Company Profile Builder — Full Rebuild Plan

## Current State Assessment

The `CompanyProfileBuilder.tsx` already exists (550 lines) at the correct route `/toolkit/corporate-suite/company-profile`. However, it has **5 critical problems** that need to be fixed alongside delivering the requested features:

**Existing Bugs:**
1. **AI calls invoke `"gemini-chat"`** — this function does not exist in `supabase/functions/`. Every "AI Expand" button for About Us and service descriptions silently fails.
2. **No Document Extractor** — the shared `DocumentExtractorUpload` component is imported nowhere in the company profile tool, so users can't pre-fill from an existing document.
3. **Logo is captured but never rendered** — `logoUrl` state exists and the `BrandAssetLibrary` panel is wired up, but the `ProfilePreview` component and PDF export both completely ignore it.
4. **PDF is only 2 pages with no overflow protection** — long content silently clips at the bottom of page 2. A truly multi-page export needs automatic page-break logic.
5. **No `company_profile` extraction type** in `document-extractor` edge function — only `business_card`, `cv`, and `cover_letter` are supported currently.

---

## What Will Be Built / Fixed

### 1. New Edge Function: `supabase/functions/company-profile-ai/index.ts`

Replaces the broken `"gemini-chat"` call. Handles **two action types** in one function:

- **`expand_about`** — takes `companyName`, `tagline`, `draft` → returns a polished 3-paragraph About Us (≤200 words)
- **`expand_service`** — takes `companyName`, `serviceTitle` → returns a 1–2 sentence professional service description

Uses `google/gemini-3-flash-preview` via the Lovable AI gateway (same pattern as `cv-summary-generator`). Returns `{ content: string }`. Handles 429/402 rate-limit errors.

Register in `supabase/config.toml` with `verify_jwt = false`.

### 2. Add `company_profile` Extraction Schema to `document-extractor`

Add a new `company_profile` extraction type to the existing `document-extractor/index.ts`. The schema extracts:

```json
{
  "companyName": "company name",
  "tagline": "tagline or slogan",
  "aboutUs": "about us / company overview text",
  "services": [{"title": "service name", "description": "service description"}],
  "team": [{"name": "person name", "role": "role/title"}],
  "phone": "phone number",
  "email": "email address",
  "website": "website URL",
  "address": "physical address",
  "linkedin": "LinkedIn URL",
  "instagram": "Instagram handle"
}
```

### 3. Full Rewrite of `CompanyProfileBuilder.tsx`

#### A — Fix AI calls
Replace both `supabase.functions.invoke("gemini-chat", ...)` calls with `supabase.functions.invoke("company-profile-ai", { body: { action: "expand_about", ... } })` and `"expand_service"`.

#### B — Add Document Extractor panel
Import `DocumentExtractorUpload` and add it as a collapsible panel **above the Template picker** (same position as the other three tools). Wire the `onExtracted` handler:

```typescript
const handleExtracted = (extracted: Record<string, unknown>) => {
  setData(prev => ({
    ...prev,
    companyName: String(extracted.companyName ?? prev.companyName),
    tagline:     String(extracted.tagline     ?? prev.tagline),
    aboutUs:     String(extracted.aboutUs     ?? prev.aboutUs),
    phone:       String(extracted.phone       ?? prev.phone),
    email:       String(extracted.email       ?? prev.email),
    website:     String(extracted.website     ?? prev.website),
    address:     String(extracted.address     ?? prev.address),
    linkedin:    String(extracted.linkedin    ?? prev.linkedin),
    instagram:   String(extracted.instagram   ?? prev.instagram),
    services: Array.isArray(extracted.services) && extracted.services.length
      ? (extracted.services as any[]).map(s => ({
          title:       String(s.title       ?? ""),
          description: String(s.description ?? ""),
        }))
      : prev.services,
    team: Array.isArray(extracted.team) && extracted.team.length
      ? (extracted.team as any[]).map(m => ({
          name: String(m.name ?? ""),
          role: String(m.role ?? ""),
        }))
      : prev.team,
  }));
  toast.success("Company profile fields pre-filled from uploaded document!");
};
```

#### C — Fix logo rendering in `ProfilePreview`

The `ProfilePreview` component needs a `logoUrl` and `logoSize` prop. When `logoUrl` is set, render it in the header area (top-left or centered below company name) as an `<img>` tag with `width = logoSize * scale`.

Each template styles the logo differently:
- **Premium Gold**: Logo on dark header background, positioned top-right, white outline circle border
- **Executive Blue**: Logo in colored header, left-aligned next to company name
- **Clean White**: Logo above company name, centered, no background

#### D — Truly multi-page PDF export with proper overflow handling

The current 2-page fixed layout clips content. The rebuild uses an **auto-pagination engine**:

```typescript
// Track Y position across pages
let currentPage = pdfDoc.addPage([W, H]);
let y = H - 60;

function ensureSpace(needed: number) {
  if (y - needed < 60) {
    currentPage = pdfDoc.addPage([W, H]);
    // Repeat header band on new page
    currentPage.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: ac });
    y = H - 50;
  }
}
```

This means:
- **Page 1** = Cover page (full-bleed dark with company name, tagline, gold accent line, logo if provided)
- **Page 2+** = Content pages created dynamically — About Us, Services, Team, Contact each check `ensureSpace()` before drawing, adding a new page when < 60px remain

For the **3 PDF templates**:
- **Premium Gold**: Black/dark cover + cream content pages, gold accent bars, Georgia serif font
- **Executive Blue**: Navy blue cover, white content, Helvetica Bold headers, structured 2-column services grid
- **Clean White**: All-white, minimal dividers, clean Helvetica, generous whitespace

#### E — Logo embedding in PDF

If `logoUrl` is a base64 data URI (from BrandAssetLibrary):
```typescript
if (logoUrl?.startsWith("data:image/png")) {
  const pngBytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
  const pngImage = await pdfDoc.embedPng(pngBytes);
  cover.drawImage(pngImage, { x: W - logoSize - 50, y: H - logoSize - 50, width: logoSize, height: logoSize });
}
```

If `logoUrl` is a remote URL (from Supabase Storage), fetch it as `arrayBuffer` first then embed. Handle both PNG and JPG via type detection.

---

## Template Design Specs

### Premium Gold (dark)
- Cover: `#0a0a0a` background, `#C8A766` gold 4px top bar, white company name at 36pt
- Content: `#f9f7f3` warm cream background, gold section headers, `Georgia` serif
- Services: 2-column grid with gold left-border cards

### Executive Blue (navy)
- Cover: `#1e3a8a` navy background, white text, thin white divider line
- Content: White background, dark navy section headers, `Helvetica` sans
- Services: Bulleted list with blue dot markers

### Clean White (minimal)
- Cover: White background, dark charcoal text, thin gray bottom rule
- Content: White background, small-caps section headers in `#374151`, ultra-clean
- Services: Simple numbered list, no background cards

---

## Files Changed

| File | Action | Details |
|---|---|---|
| `supabase/functions/company-profile-ai/index.ts` | **Create** | New edge function: `expand_about` + `expand_service` actions |
| `supabase/config.toml` | **Edit** | Register `company-profile-ai` with `verify_jwt = false` |
| `supabase/functions/document-extractor/index.ts` | **Edit** | Add `company_profile` extraction schema |
| `src/components/corporate-suite/CompanyProfileBuilder.tsx` | **Rewrite** | Fix all 5 bugs + full feature upgrade |

No database migrations needed. No new dependencies — `pdf-lib` is already installed.

---

## Key User Flow After Implementation

1. User opens `/toolkit/corporate-suite/company-profile`
2. **"Scan Existing Document"** panel at top — drop a brochure/PDF → all fields pre-fill instantly
3. Select **Premium Gold / Executive Blue / Clean White** template — live preview updates in real-time
4. Fill in Company name, Tagline, About Us → click **"AI Expand"** → 3-paragraph professional text generated (now actually works)
5. Add services → click **✨** per service → description auto-generated
6. Logo from Brand Asset Library appears in both the live preview and the exported PDF
7. Click **Export PDF** → auto-paginating multi-page PDF downloads with correct template styling
