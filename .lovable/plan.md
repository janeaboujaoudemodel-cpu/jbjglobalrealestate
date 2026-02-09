

# AI Interior Design Studio - Complete Rebuild Plan

## Summary

This plan completely rebuilds the AI Interior Design Studio to become a **unified design hub** that includes:
- **Concept Render**: Describe your space and get a luxury design (no photo required)
- **Redesign from Photo**: Upload your current room and get a redesigned version
- **Virtual Staging**: Upload empty room and stage it with furniture
- **AI Chat Assistant**: Describe what you want in natural language
- **Property Measurement Integration**: Link to/from the AI Measurement tool
- **Project Naming**: Name and save projects with room identification
- **History Saving**: All results saved to "My AI History" via `ai_job_master` table

**Login + Form Required**: First-time users must complete the `ContactGatingModal` (collect name, email, phone, etc.) before generating - applies to all AI tools per your requirement.

---

## Technical Approach

### 1. Unified Mode Architecture

The new page will have **4 modes** accessible via tabs or cards:

| Mode | Description | Inputs |
|------|-------------|--------|
| **Concept Render** | AI generates from text description + preferences | Room type, style, size, colors, notes |
| **Redesign Photo** | Upload existing room, AI transforms it | Photo + style preferences |
| **Virtual Staging** | Upload empty room, AI adds furniture | Photo + room type + furniture style |
| **AI Assistant Chat** | Natural language: "design a modern 500sqft bedroom" | Free-form text + optional photos |

All modes call the same `interior-design-generate` edge function (already exists and working).

---

### 2. New Components Structure

```
src/pages/InteriorDesignAI.tsx (rewrite)
├── DesignModeSelector.tsx (new) - Mode selection cards
├── ConceptRenderForm.tsx (new) - Text-based generation
├── PhotoRedesignForm.tsx (new) - Upload + redesign
├── VirtualStagingForm.tsx (new) - Empty room + staging
├── DesignChatAssistant.tsx (new) - AI chat interface
├── DesignProjectHeader.tsx (new) - Project name + room labels
├── DesignResultsGallery.tsx (new) - View/download results
└── DesignHistoryList.tsx (new) - Previous generations
```

---

### 3. Flow Diagram

```
User lands on /interior-design-ai
          │
          ▼
┌──────────────────────────────────────┐
│  Check: Is contact gating complete?  │
│  (useContactGating hook)             │
└──────────────────────────────────────┘
          │
          ├── No → Show ContactGatingModal
          │         (collect name/email/phone)
          │
          └── Yes → Show Design Hub
                    │
                    ▼
          ┌───────────────────────┐
          │  4 Mode Cards:        │
          │  • Concept Render     │
          │  • Redesign Photo     │
          │  • Virtual Staging    │
          │  • AI Chat Assistant  │
          └───────────────────────┘
                    │
                    ▼
          ┌───────────────────────┐
          │  Step 1: Project Setup│
          │  • Name your project  │
          │  • Property type      │
          │  • Link measurement   │
          └───────────────────────┘
                    │
                    ▼
          ┌───────────────────────┐
          │  Step 2: Upload/Input │
          │  (varies by mode)     │
          └───────────────────────┘
                    │
                    ▼
          ┌───────────────────────┐
          │  Step 3: Style Prefs  │
          │  • Design style       │
          │  • Color palette      │
          │  • Purpose            │
          │  • Custom notes       │
          └───────────────────────┘
                    │
                    ▼
          ┌───────────────────────┐
          │  Generate (AI API)    │
          │  interior-design-     │
          │  generate             │
          └───────────────────────┘
                    │
                    ▼
          ┌───────────────────────┐
          │  Results Gallery      │
          │  • Download image     │
          │  • Download PDF       │
          │  • Request revision   │
          │  • Auto-saved to      │
          │    ai_job_master      │
          └───────────────────────┘
```

---

### 4. Contact Gating Integration

**Requirement**: Login and form submission required to collect user details for first-time use.

**Implementation**:
```tsx
// In InteriorDesignAI.tsx
const { requireGating, isGatingCompleted } = useContactGating();

const handleGenerate = () => {
  requireGating('interior_design', () => {
    // Only runs after gating is complete
    generateDesign();
  });
};
```

The existing `ContactGatingModal` and `useContactGating` hook already support `'interior_design'` as a gated action. If the user has already completed gating (stored in localStorage), they proceed directly.

---

### 5. History Saving to ai_job_master

Every generation will be saved:

```typescript
// After successful generation
const { data: jobRecord } = await supabase
  .from('ai_job_master')
  .insert({
    user_id: user?.id || sessionId,
    tool_name: 'interior-design-generate',
    status: 'completed',
    input_payload: {
      mode,
      project_name: projectName,
      room_name: roomName,
      property_type: propertyType,
      design_style: designStyle,
      color_palette: colorPalette,
      purpose,
      custom_notes: customNotes,
      // Photo stored as URL reference (not base64)
    },
    output_payload: {
      image_url: result.images[0], // URL from storage
      notes: result.notes,
    },
    intelligence_features: {
      style_detected: designStyle,
      color_scheme: colorPalette,
      room_type: roomName,
    },
    processing_time_ms: elapsedTime,
    completed_at: new Date().toISOString(),
  })
  .select()
  .single();
```

**Note**: Generated images are base64 from the AI. Per storage policy, we will:
1. Upload the base64 image to Supabase Storage bucket `interior-designs`
2. Store only the URL reference in `output_payload.image_url`

---

### 6. Property Measurement Integration

**Linking from Measurement to Design**:
The existing flow already works (line 308-311 in PropertyMeasurement.tsx):
```tsx
sessionStorage.setItem("propertyMeasurement", JSON.stringify({
  totalArea,
  rooms,
  propertyType,
  propertyName,
}));
navigate("/interior-design-ai");
```

**Linking from Design to Measurement**:
Add a "Measure My Space" button that navigates to `/property-measurement` with a return flag:
```tsx
sessionStorage.setItem("return_to_interior_design", "true");
navigate("/property-measurement");
```

---

### 7. Image Storage Strategy

**Problem**: AI returns base64 images which cannot be stored in database.

**Solution**:
1. Create storage bucket `interior-designs` (public)
2. After generation, upload base64 to storage:
```typescript
const blob = base64ToBlob(imageBase64);
const filePath = `${userId}/${projectName}/${Date.now()}.png`;
const { data } = await supabase.storage
  .from('interior-designs')
  .upload(filePath, blob);
const publicUrl = supabase.storage
  .from('interior-designs')
  .getPublicUrl(filePath);
```
3. Store only `publicUrl` in `ai_job_master.output_payload`

---

### 8. AI Chat Assistant Mode

The chat mode uses the existing `AIDesignAssistant.tsx` component pattern:

```tsx
// Example conversation
User: "Design a luxury modern bedroom, 400 sqft, 
       with gold accents and floor-to-ceiling windows"

AI: Analyzing your requirements...
    - Room: Bedroom
    - Size: 400 sqft
    - Style: Luxury Modern
    - Colors: Gold accents
    - Features: Floor-to-ceiling windows
    
    [Generate Design] button

AI: ✨ Your design is ready!
    [Shows generated image]
    [Download] [Save to Project] [Try Another Style]
```

The chat will parse user input using the existing `interior-design-generate` edge function prompt.

---

## Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/interior-design/DesignModeSelector.tsx` | 4-card mode selection UI |
| `src/components/interior-design/ConceptRenderForm.tsx` | Text-based generation form |
| `src/components/interior-design/PhotoRedesignForm.tsx` | Photo upload + redesign form |
| `src/components/interior-design/VirtualStagingForm.tsx` | Empty room staging form |
| `src/components/interior-design/DesignChatAssistant.tsx` | Chat-based design interface |
| `src/components/interior-design/DesignProjectHeader.tsx` | Project name + room label inputs |
| `src/components/interior-design/DesignResultsGallery.tsx` | Results display with actions |
| `src/components/interior-design/DesignHistoryList.tsx` | Previous generations list |
| `src/hooks/useInteriorDesignHistory.ts` | Hook for fetching/saving to ai_job_master |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/InteriorDesignAI.tsx` | Complete rewrite to use new component architecture |
| `supabase/functions/interior-design-generate/index.ts` | Add mode handling (concept/redesign/staging) |

### Database Changes

| Change | Details |
|--------|---------|
| Create storage bucket `interior-designs` | Public bucket for generated images |
| Add RLS policy | Allow authenticated users to upload/read their own files |

---

## SQL Migration

```sql
-- Create storage bucket for interior design outputs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interior-designs',
  'interior-designs',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- RLS: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own interior designs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'interior-designs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Anyone can view interior designs (public bucket)
CREATE POLICY "Anyone can view interior designs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'interior-designs');

-- RLS: Users can delete their own designs
CREATE POLICY "Users can delete their own interior designs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'interior-designs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## UI/UX Design

### Hero Section (unchanged)
Keep the existing fuchsia/purple gradient hero with "AI Interior Design Studio" branding.

### Mode Selection Cards
4 large cards with icons:
- **Concept Render**: Sparkles icon, "Describe your dream space"
- **Redesign Photo**: Camera icon, "Transform your current room"
- **Virtual Staging**: Sofa icon, "Stage an empty room"
- **AI Chat**: MessageSquare icon, "Talk to design assistant"

### Project Setup Step
- Project Name input (required)
- Room/Area Name input
- Property Type selector (apartment/villa/office/etc)
- "Use Measurement Data" button (if available from PropertyMeasurement)
- "Measure My Space" link (navigates to /property-measurement)

### Generation Flow
- Progress indicator with steps
- Loading animation during generation
- Results gallery with download options
- "Generate Another" for variations
- Auto-save notification

### History Panel
- Collapsible sidebar or tab
- Shows previous generations with thumbnails
- Click to reopen results
- Delete option

---

## Acceptance Criteria

1. **All 4 modes work end-to-end**: Concept, Redesign, Staging, Chat
2. **Contact gating enforced**: First-time users must complete form
3. **Login required for saving**: Users must log in to save history
4. **History persists**: All generations saved to `ai_job_master`
5. **Images stored properly**: Base64 uploaded to storage, URL saved in DB
6. **Measurement integration**: Can link to/from PropertyMeasurement tool
7. **Project naming**: Users can name projects and rooms
8. **Download works**: PDF and image downloads function correctly
9. **Mobile responsive**: Works on phone, iPad, laptop
10. **Performance**: No slow loading or blocking

---

## Implementation Order

1. Database migration (storage bucket + policies)
2. Create `useInteriorDesignHistory` hook
3. Create component files (mode forms, results, history)
4. Rewrite `InteriorDesignAI.tsx` main page
5. Update edge function for mode handling
6. Add image upload to storage flow
7. Test all modes end-to-end
8. Test on mobile devices

