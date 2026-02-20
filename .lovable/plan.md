
# Universal Document Extractor — Pre-fill Integration

## What This Does

The `document-extractor` edge function already exists and supports three extraction types: `business_card`, `cv`, and `cover_letter`. It accepts a base64 image/PDF, sends it to Gemini Vision, and returns a structured JSON of all fields found in the document.

Right now, **none of the three tools** use it. Users have to fill everything in manually.

This plan wires the extractor into all three tools with a single shared upload widget, letting users upload a photo or PDF of an existing document, have all fields pre-filled instantly, then switch templates and export.

---

## Architecture

The `document-extractor` edge function already handles the AI call correctly and supports all three extraction schemas. No backend changes are needed.

The only work is on the frontend: build a reusable upload+extract widget and drop it into each of the three tools.

---

## Shared Component: `DocumentExtractorUpload.tsx`

A new shared component at `src/components/corporate-suite/DocumentExtractorUpload.tsx`.

**Props:**
```typescript
interface Props {
  extractionType: "business_card" | "cv" | "cover_letter";
  onExtracted: (data: Record<string, unknown>) => void;
  label?: string;       // e.g. "Scan Existing Card"
  hint?: string;        // e.g. "Upload a photo or PDF"
}
```

**Behavior:**
1. Renders a compact collapsible card with an upload dropzone
2. Accepts: `image/*` and `application/pdf`
3. For PDF: reads only the first page — converts using `FileReader` → base64 and sends `application/pdf` as the `file_type`; Gemini Vision handles PDF directly
4. For images: converts to base64 via `FileReader`
5. Shows a file name + size preview after selection
6. "Extract with AI" button calls `supabase.functions.invoke("document-extractor", { body: { file_base64, file_type, extraction_type } })`
7. On success: calls `onExtracted(data)` with the parsed fields
8. Shows a loading spinner with "Extracting fields…" during the call
9. Shows a success badge "X fields filled" after extraction
10. Has a "Clear" button to dismiss the result and re-upload

**UI style:** matches the existing `BrandAssetLibrary` collapsible panel pattern used across all three tools — same white card, gold border highlight, `CollapsibleTrigger` header with a `ScanLine` icon (from lucide-react).

---

## Integration 1: Business Card Designer (`BusinessCardDesigner.tsx`)

**Where to add:** As a new collapsible panel in the left control column, **immediately above the Card Info fields section** (around line 1240, before the contact fields form begins).

**`extraction_type`:** `"business_card"`

**`onExtracted` handler:**
```typescript
const handleExtracted = (extracted: Record<string, unknown>) => {
  setData(prev => ({
    ...prev,
    name:    String(extracted.name    ?? prev.name),
    title:   String(extracted.title   ?? prev.title),
    company: String(extracted.company ?? prev.company),
    phone:   String(extracted.phone   ?? prev.phone),
    email:   String(extracted.email   ?? prev.email),
    website: String(extracted.website ?? prev.website),
    address: String(extracted.address ?? prev.address),
  }));
  toast.success("Card fields pre-filled from scanned document!");
};
```

The fields map 1-to-1 with `CardData` — all 7 fields (`name`, `title`, `company`, `phone`, `email`, `website`, `address`).

---

## Integration 2: CV/Resume Builder (`CVResumeBuilder.tsx`)

**Where to add:** Collapsible panel in the left column, **above the Template picker** and **below Brand Assets** (around line 815).

**`extraction_type`:** `"cv"`

**`onExtracted` handler:**
```typescript
const handleExtracted = (extracted: Record<string, unknown>) => {
  setData(prev => ({
    ...prev,
    name:      String(extracted.name      ?? prev.name),
    title:     String(extracted.title     ?? prev.title),
    email:     String(extracted.email     ?? prev.email),
    phone:     String(extracted.phone     ?? prev.phone),
    location:  String(extracted.location  ?? prev.location),
    linkedin:  String(extracted.linkedin  ?? prev.linkedin),
    website:   String(extracted.website   ?? prev.website),
    summary:   String(extracted.summary   ?? prev.summary),
    skills:    String(extracted.skills    ?? prev.skills),
    languages: String(extracted.languages ?? prev.languages),
    experience: Array.isArray(extracted.experience) && extracted.experience.length
      ? (extracted.experience as any[]).map(e => ({
          title:       String(e.title       ?? ""),
          company:     String(e.company     ?? ""),
          period:      String(e.period      ?? ""),
          description: String(e.description ?? ""),
        }))
      : prev.experience,
    education: Array.isArray(extracted.education) && extracted.education.length
      ? (extracted.education as any[]).map(e => ({
          degree:      String(e.degree      ?? ""),
          institution: String(e.institution ?? ""),
          year:        String(e.year        ?? ""),
        }))
      : prev.education,
  }));
  toast.success("CV fields pre-filled from uploaded document!");
};
```

The extractor schema fully covers all `CVData` fields including nested arrays.

---

## Integration 3: Cover Letter Generator (`CoverLetterGenerator.tsx`)

**Where to add:** Collapsible panel in the left column, **above "Your Information"** section (around line 585).

**`extraction_type`:** `"cover_letter"`

**`onExtracted` handler:**
```typescript
const handleExtracted = (extracted: Record<string, unknown>) => {
  setForm(prev => ({
    ...prev,
    yourName:    String(extracted.yourName    ?? prev.yourName),
    yourTitle:   String(extracted.yourTitle   ?? prev.yourTitle),
    jobTitle:    String(extracted.jobTitle    ?? prev.jobTitle),
    companyName: String(extracted.companyName ?? prev.companyName),
    skills:      String(extracted.skills      ?? prev.skills),
    experience:  String(extracted.experience  ?? prev.experience),
  }));
  toast.success("Cover letter fields pre-filled from uploaded document!");
};
```

The extractor schema exactly matches the `FormData` interface in `CoverLetterGenerator`.

---

## Edge Function Note: PDF Support

The current edge function sends the file as an `image_url` message. Gemini Vision **does** support PDF files sent as base64 data URIs with `application/pdf` MIME type — no backend changes needed.

For PDFs, the client converts the full file to base64 (since the file is typically small — a resume or business card scan). This is safe for files under 10MB.

---

## Files to Create/Edit

| File | Action | Scope |
|---|---|---|
| `src/components/corporate-suite/DocumentExtractorUpload.tsx` | **Create** | ~100 lines — shared upload+extract widget |
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | **Edit** | +~20 lines — import component, add panel, add handler |
| `src/components/corporate-suite/CVResumeBuilder.tsx` | **Edit** | +~30 lines — import component, add panel, add handler |
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | **Edit** | +~20 lines — import component, add panel, add handler |

No edge function changes. No database changes. No new dependencies needed.

---

## User Flow After Implementation

1. User opens Business Card Designer (or CV Builder / Cover Letter)
2. Sees new "**Scan Existing Document**" collapsible panel in the left column
3. Clicks to expand → drag-and-drop zone for image or PDF
4. Selects/drops a file → file name appears with a "**Extract with AI**" button
5. Clicks Extract → spinner shows "Extracting fields with Gemini Vision…"
6. All matching fields auto-populate in the form (1–2 seconds)
7. Toast: "12 fields filled from uploaded CV"
8. User can switch templates immediately in the Template picker and see the pre-filled data in the live preview
9. Exports as PDF when ready
