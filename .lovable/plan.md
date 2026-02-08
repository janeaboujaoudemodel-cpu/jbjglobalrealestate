

# Meet The Team & Developers Page Fixes

## Issues Identified

### 1. Meet The Team Page - Layout Issues

**Problem A: Title & Contact Us Button Position**
- The title "A World-Class Team" and "Contact Us" button are in the hero section above the team photo collage
- User wants: Title and Contact Us pushed DOWN below the employee photo collage

**Problem B: Employee Photos Cropped**
- TeamHeroCollage shows circular avatars with `objectPosition: "center 25%"`
- The bottom photos in collage may be cut off due to overflow handling
- `TeamMemberCard` uses `aspect-[4/5]` with `objectPosition: "center 15%"` which crops from bottom

**Current Layout:**
```
Hero Section
├── Badge "Our Team"
├── Title "Meet the Experts"
├── Description "A world-class team..."
├── Contact Us Button
└── TeamHeroCollage (photos)
```

**Required Layout:**
```
Hero Section
├── Badge "Our Team" 
├── TeamHeroCollage (photos) ← MOVE UP
├── Title "Meet the Experts" ← MOVE BELOW COLLAGE
├── Description "A world-class team..."
└── Contact Us Button ← AFTER DESCRIPTION
```

---

### 2. Developers Page - Multiple Issues

**Problem A: Card Layout (Horizontal with Photo Overlay)**
- Current: Cards are 280px tall with description overlaying the photo
- User wants: **VERTICAL cards** where description is in a separate section below the photo, not overlapping

**Problem B: Logo Styling (Not Premium)**
- Current: Logo sits in a white box but may have colored backgrounds from source
- User wants: Logo with transparent background on pristine white box, like Provident's style
- Need CSS filter to ensure logo backgrounds appear transparent/white

**Problem C: Missing Feature Images (153 developers missing)**
- Database shows 554 developers, only 401 have feature images
- User specifically mentioned: Botanica, Laurent Boiro, Beyond Development, ALDAR
- Solution: Fallback to project cover images OR use a quality placeholder

**Problem D: Inconsistent Data Display**
- Description, project count, etc. should be synchronized and consistent across all cards
- Project counts come from `projectCounts` computed in `Developers.tsx`

**Problem E: Cross-Developer Photo Usage (CRITICAL)**
- NEVER use Damac's project photo for Emaar's card
- Each developer must only use photos from THEIR OWN projects
- Need to add validation/fallback from Reelly API sync

---

## Implementation Plan

### Phase 1: Fix Meet The Team Page Layout

**File: `src/pages/MeetTheTeam.tsx`**

1. **Restructure Hero Section** (lines 276-370):
   - Move `<TeamHeroCollage />` ABOVE the title/description
   - Push title, description, and Contact Us button BELOW the collage
   - Adjust z-index and spacing

2. **Fix TeamHeroCollage Cropping**:
   - File: `src/components/TeamHeroCollage.tsx`
   - Increase bottom padding: `py-8` → `py-8 pb-16`
   - Ensure all 4 rows are fully visible
   - Adjust gradient overlays if they're cutting off photos

3. **Fix TeamMemberCard Photo Cropping**:
   - Current: `aspect-[4/5]` may crop too aggressively
   - Solution: Ensure `objectPosition: "center 20%"` preserves full face and shoulders

**New Hero Structure:**
```tsx
<section className="jj-hero-fullscreen relative flex flex-col items-center justify-center overflow-hidden">
  {/* Video Background (unchanged) */}
  
  <div className="container mx-auto px-4 relative z-10 py-24">
    {/* Badge at top */}
    <motion.div variants={fadeInUp} className="mb-6 text-center">
      <Badge>Our Team</Badge>
    </motion.div>

    {/* PHOTO COLLAGE FIRST */}
    <motion.div className="mb-12">
      <TeamHeroCollage />
    </motion.div>

    {/* THEN Title + Description + CTA */}
    <motion.div className="text-center max-w-4xl mx-auto">
      <h1>Meet the <span className="text-gold">Experts</span></h1>
      <p>A world-class team of professionals...</p>
      <Button>Contact Us</Button>
    </motion.div>
  </div>
</section>
```

---

### Phase 2: Redesign Developer Cards (Vertical Layout)

**File: `src/components/DeveloperCard.tsx`**

Current structure (280px fixed height, overlay design):
```
[Photo Background (full card)]
  [Gradient overlay]
  [Logo Plate - bottom]
  [Name - overlapping photo]
  [Description - overlapping photo]
  [Stats - overlapping photo]
```

**New VERTICAL structure (auto height):**
```
[Photo Section - 200px height]
  [Tier Badge - top right]
[Content Section - white/champagne bg]
  [Logo Plate - centered]
  [Developer Name]
  [Description - 2-3 lines]
  [Stats: Projects count, Delivered]
```

**New Card Component:**
```tsx
<Link to={`/developer/${developer.slug}`}>
  <motion.div className="group rounded-xl overflow-hidden" style={{ border: '3px solid hsl(42 45% 59%)' }}>
    
    {/* Photo Section - Fixed Height */}
    <div className="relative h-[200px]">
      {developer.feature_image_url || fallbackImage ? (
        <img src={developer.feature_image_url || fallbackImage} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <Building2 className="w-16 h-16 text-gold/30" />
        </div>
      )}
      {/* Tier Badge */}
      {tier && <Badge className="absolute top-3 right-3">{tier.label}</Badge>}
    </div>

    {/* Content Section - Champagne Background */}
    <div className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      
      {/* Logo Plate - Premium White Box */}
      <div className="w-full h-14 rounded-lg bg-white flex items-center justify-center mb-3 border-2 border-gold/30">
        {developer.logo_url ? (
          <img 
            src={developer.logo_url} 
            alt={`${developer.name} logo`}
            className="max-h-10 max-w-[80%] object-contain"
            style={{ filter: 'drop-shadow(0 0 0 white)' }}
          />
        ) : (
          <span className="font-semibold text-sm">{developer.name}</span>
        )}
      </div>

      {/* Developer Name */}
      <h3 className="text-black font-bold text-lg mb-2">{developer.name}</h3>

      {/* Description - Fixed 2 lines */}
      {developer.description && (
        <p className="text-zinc-600 text-xs line-clamp-2 mb-3">
          {developer.description}
        </p>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-3 text-zinc-700 text-xs">
        <div className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-gold" />
          <span>{projectCount} Projects</span>
        </div>
        {developer.completed_projects && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-gold" />
            <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
          </div>
        )}
      </div>
    </div>

  </motion.div>
</Link>
```

---

### Phase 3: Fix Logo Display (Premium White Background)

**Current Issue:** Some logos from Reelly have colored backgrounds that clash with the white box.

**Solution:** Apply CSS mix-blend-mode and ensure white background dominates:

```tsx
<div className="w-full h-14 rounded-lg flex items-center justify-center mb-3 overflow-hidden"
  style={{
    background: '#FFFFFF',
    border: '2px solid hsl(42 45% 59%)',
    boxShadow: '0 2px 8px rgba(200,167,102,0.2), inset 0 1px 2px rgba(255,255,255,0.9)'
  }}
>
  {developer.logo_url ? (
    <img 
      src={developer.logo_url} 
      alt={`${developer.name} logo`}
      className="max-h-10 max-w-[80%] object-contain"
      style={{ 
        mixBlendMode: 'multiply',  // Makes white backgrounds transparent
        backgroundColor: 'white'
      }}
    />
  ) : (
    <span className="font-semibold text-sm text-black">{developer.name}</span>
  )}
</div>
```

---

### Phase 4: Handle Missing Feature Images

**Strategy:** Fallback chain for developers without feature images:
1. Use `feature_image_url` if available
2. Fallback to first project's `cover_image_url` from that developer
3. Fallback to a premium placeholder gradient

**Implementation in `useDevelopers` hook or component:**

Option A - In DeveloperCard (simpler):
```tsx
// Pass projects data to compute fallback
const getFeatureImage = () => {
  if (developer.feature_image_url) return developer.feature_image_url;
  // Could add prop for first project image
  return null; // Shows gradient placeholder
};
```

Option B - Database-level fix (better long-term):
Create an edge function that backfills `feature_image_url` from project cover images where missing.

**For the card UI**, use a quality gradient placeholder when no image:
```tsx
{!developer.feature_image_url ? (
  <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 flex items-center justify-center">
    <div className="text-center">
      <Building2 className="w-12 h-12 text-gold/40 mx-auto mb-2" />
      <span className="text-gold/60 text-xs uppercase tracking-wider">Developer</span>
    </div>
  </div>
) : (
  <img src={developer.feature_image_url} ... />
)}
```

---

### Phase 5: Ensure Data Consistency

**Synchronize Developer Data Display:**

1. **Project Count**: Already computed from `useProjects` in Developers.tsx - pass to DeveloperCard
2. **Description**: Ensure all cards show description uniformly (line-clamp-2)
3. **Stats**: Show "N/A" or hide stats when data is missing, don't show "0 Projects"

```tsx
// Consistent stat display
<div className="flex items-center gap-3 text-zinc-700 text-xs">
  {projectCount > 0 && (
    <div className="flex items-center gap-1">
      <Building2 className="w-3.5 h-3.5 text-gold" />
      <span>{projectCount} Projects</span>
    </div>
  )}
  {developer.completed_projects && developer.completed_projects > 0 && (
    <div className="flex items-center gap-1">
      <TrendingUp className="w-3.5 h-3.5 text-gold" />
      <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
    </div>
  )}
  {!projectCount && !developer.completed_projects && (
    <span className="text-zinc-500 italic">Coming soon</span>
  )}
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/MeetTheTeam.tsx` | Restructure hero: collage above title/description |
| `src/components/TeamHeroCollage.tsx` | Increase bottom padding, fix overflow |
| `src/components/DeveloperCard.tsx` | Complete redesign to vertical layout with separate content section |

---

## Database/Backend Considerations

**Future enhancement** (not in this implementation):
- Create edge function to backfill `feature_image_url` from project `cover_image_url` for developers missing images
- Ensure Reelly sync correctly maps developer photos from their own projects only

---

## Visual Summary

**Before (DeveloperCard):**
```
┌─────────────────────┐
│  [Photo fills card] │
│  ┌─────────────────┐│
│  │     LOGO       ││
│  └─────────────────┘│
│  Developer Name     │
│  Description text...│ ← OVERLAPPING PHOTO
│  12 Projects        │
└─────────────────────┘
```

**After (DeveloperCard - VERTICAL):**
```
┌─────────────────────┐
│  [Photo - 200px]    │
│        [TIER]       │
├─────────────────────┤
│  ┌─────────────────┐│
│  │ LOGO (white bg) ││
│  └─────────────────┘│
│  Developer Name     │ ← SEPARATE SECTION
│  Description text   │ ← ON CHAMPAGNE BG
│  12 Projects | 50+  │
└─────────────────────┘
```

**Before (MeetTheTeam Hero):**
```
┌─────────────────────────┐
│  [Badge: Our Team]      │
│  Title: Meet Experts    │
│  Description...         │
│  [Contact Us Button]    │
│                         │
│  ○○○○○ ← Collage        │
│  ○○○○○○                 │
│  ○○○○○○○                │
└─────────────────────────┘
```

**After (MeetTheTeam Hero):**
```
┌─────────────────────────┐
│  [Badge: Our Team]      │
│                         │
│  ○○○○○ ← Collage FIRST  │
│  ○○○○○○                 │
│  ○○○○○○○                │
│                         │
│  Title: Meet Experts    │
│  Description...         │
│  [Contact Us Button]    │
└─────────────────────────┘
```

