
# Canvas-First Studio Layout — All Corporate Suite Tools

## What the User is Asking For

Every tool in the suite (Logo Creator, Business Card Designer, CV/Resume Builder, Cover Letter Generator, Company Profile Builder, Stamp Generator) needs a fundamentally new layout:

- **Live preview always centered**, taking up the majority of screen width
- **Feature panels orbit the preview** — a left sidebar for grouped controls (quick-access shortcuts), a right panel for detail settings of the currently selected control group, and a slim top/bottom action bar
- **Clicking a shortcut in the panel immediately updates the preview** — no manual "Generate" required for subsequent changes
- **Save and Export directly accessible from the top action bar**, always visible

This is a **Canva-style studio layout** — canvas center, tools surround it.

---

## Architecture Decision: Shared Studio Shell

Rather than rewriting each tool independently (which would take 7 separate rewrites and create diverging codebases), the most maintainable approach is to build one shared **`StudioShell`** component that every tool renders inside.

```text
┌──────────────────────────────────────────────────────────────────┐
│  Top Bar: [Back] [Tool Name]              [Save] [Export] [...]  │
├──────────┬────────────────────────────────────────┬─────────────┤
│          │                                        │             │
│  LEFT    │                                        │   RIGHT     │
│  NAV     │         LIVE PREVIEW (center)          │   DETAIL    │
│  (icon   │         — always scrollable —          │   PANEL     │
│   pills) │         — centered in space —          │  (for       │
│          │                                        │  selected   │
│          │                                        │  section)   │
│          │                                        │             │
└──────────┴────────────────────────────────────────┴─────────────┘
```

**Column widths:**
- Left nav: `64px` (icon-only pills on desktop, collapses to bottom tab bar on mobile)
- Right detail panel: `320px` (slides in when a section is selected)
- Center preview: `flex-1` — takes all remaining space, preview itself auto-scales

---

## New File: `src/components/ui/StudioShell.tsx`

This is the single reusable layout wrapper. It accepts:

```typescript
interface StudioShellProps {
  toolName: string;
  toolIcon: React.ReactNode;
  toolColor: string;                   // accent hex
  sections: StudioSection[];           // left nav items
  activeSection: string;
  onSectionChange: (id: string) => void;
  preview: React.ReactNode;            // the live preview element
  actionBar?: React.ReactNode;         // extra top-right actions
  onExport?: () => void;
  onSave?: () => void;
  exportLabel?: string;
  isExporting?: boolean;
  isSaving?: boolean;
  previewBg?: string;                  // preview area background
}

interface StudioSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  panel: React.ReactNode;              // the detail panel content
  badge?: string;                      // e.g. "AI"
}
```

### Left Nav Rail

64px wide on desktop. Each section rendered as:

```tsx
<button
  onClick={() => onSectionChange(section.id)}
  className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
    activeSection === section.id
      ? "bg-[accentColor]/15 text-[accentColor]"
      : "text-muted-foreground hover:bg-muted"
  }`}
>
  {section.icon}   {/* 18px lucide icon */}
  <span className="text-[8px] font-semibold uppercase tracking-wide">{section.label}</span>
  {section.badge && <span className="text-[7px] bg-[accentColor] text-white px-1 rounded">{section.badge}</span>}
</button>
```

### Right Detail Panel

320px wide panel showing the currently-selected section's `panel` content. When no section is selected it shows a "Get started" hint. Slides in with a `framer-motion` `x` animation.

### Center Preview Zone

- Full remaining width, min-height fills viewport minus top bar
- Preview element is centered with `flex items-center justify-center`
- Background is configurable (white, dark, grid pattern)
- A subtle "click to fullscreen" hint overlay on hover

### Top Action Bar

```
[← Back] [breadcrumb]                     [Save ●] [Export ↓] [Fullscreen ⊞]
```

- Back button left
- Tool name + breadcrumb center-left
- Save (with unsaved indicator dot) right
- Export dropdown right
- Fullscreen button right

---

## Per-Tool: Left Nav Sections

### Logo Creator — 6 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| Type | Brand Name | Company name input, tagline, voice input |
| Building2 | Industry | 9-industry icon grid |
| Palette | Style | 6 visual style cards |
| Brush | Colors | 12 preset swatches + 3 custom color wheels |
| Type | Typography | 6 font family cards |
| Archive | Export | SVG / PNG / Full Kit buttons + Save to Assets + license code |

### Business Card Designer — 7 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| CreditCard | Template | 7 template thumbnails |
| Layout | Shape | 8 card shape options |
| Palette | Colors | Front/back independent color pickers |
| Type | Information | All contact fields (name, title, company, phone, email, website, address) |
| ImageIcon | Brand Assets | Logo upload + size slider |
| QrCode | QR Code | QR toggle, content type, custom content, side selector (Front/Back/Both) |
| Sparkles | AI Design | Tone, industry, pattern style, generate button |

### CV/Resume Builder — 7 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| FileText | Template | 12 templates with category filter |
| User | Personal | Name, title, email, phone, location, LinkedIn, website |
| Camera | Photo | Photo upload + AI BG removal |
| AlignLeft | Summary | Summary textarea + AI generate button |
| Briefcase | Experience | Experience entries |
| GraduationCap | Education | Education entries |
| Wrench | Skills | Skills, languages, certifications |

### Cover Letter Generator — 5 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| FileEdit | Template | 4 template + tone pickers |
| User | Your Info | Name, title, email, phone |
| Briefcase | Job Details | Job title, company, skills, experience |
| AlignLeft | Letter Text | Generated text + inline editing |
| ImageIcon | Brand Assets | Logo for letterhead |

### Company Profile Builder — 6 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| Building2 | Template | 9 template choices |
| FileText | Company Info | Company name, tagline, about us, AI expand button |
| Layers | Services | Service list + add/remove |
| Users | Team | Team member list |
| Phone | Contact | Phone, email, address, website, LinkedIn, Instagram |
| ImageIcon | Brand Assets | Logo + palette |

### Stamp Generator — 6 sections:
| Icon | Section | What's in the right panel |
|---|---|---|
| Upload | Upload License | License uploader (auto-fills fields) |
| FileText | Company Info | Company name, trade name, reg number, city |
| Stamp | Shape & Style | Shape (Round/Oval/Rect/Square), theme, border, density |
| Type | Typography | Font, bold/italic, size slider |
| Globe | Language | EN/AR/Bilingual + Arabic city name |
| ImageIcon | Logo/Monogram | Icon style, monogram letter |

---

## Preview Scaling — How Each Tool Centers Its Output

Each tool's live preview is an existing component. What changes is only how it is **centered and sized** within the available canvas area. Each tool's preview component receives a `scale` prop or uses CSS transforms:

- **Logo**: existing `LogoPreview` SVG at 280px centered in the canvas
- **Business Card**: existing `CardCanvas` scaled to `max-width: 480px`, centered
- **CV**: existing CV preview at 595px A4 width, `transform: scale(canvasScale)` to fit screen
- **Cover Letter**: existing letter preview at A4 width, same scaling
- **Company Profile**: existing A4 page stack, same scaling
- **Stamp**: existing `LiveStampPreview`, centered at 360px

For A4 documents (CV, Cover Letter, Company Profile), the canvas area auto-calculates a `scale` factor:
```typescript
const scale = Math.min(1, (canvasWidth - 64) / 595);
```

---

## Auto-Update Behavior

Each tool already has reactive state — changing `template`, `color`, `fontFamily` etc. already updates the preview in real-time via React state. The key change is that clicking a section shortcut in the left nav **immediately shows the panel and any related parameter change is reflected in the live preview without a separate "apply" step**.

For tools that currently require a button click to generate (Logo Creator's "Generate Logo", Cover Letter's "Generate with AI"):
- **First generation**: Still requires the explicit action button inside the panel (since the AI call is async)
- **Subsequent parameter changes**: The 800ms debounce auto-regenerate already implemented for Logo Creator is extended to all AI-generation tools

---

## Mobile Adaptation

On screens < 1024px:
- Left nav becomes a **horizontal scrollable tab bar at the top** (below the main top bar)
- Right detail panel becomes a **bottom sheet** that slides up when a tab is selected
- Center preview takes full viewport width
- Save/Export buttons move into the top bar right side (icon-only on mobile, label on desktop)

---

## Files Changed

| File | Action | Details |
|---|---|---|
| `src/components/ui/StudioShell.tsx` | **Create** | Shared Canva-style layout shell |
| `src/components/corporate-suite/LogoCreator.tsx` | **Rewrite layout** | Adopt `StudioShell`, reorganize 6 sections into left nav panels |
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | **Rewrite layout** | Adopt `StudioShell`, 7 sections |
| `src/components/corporate-suite/CVResumeBuilder.tsx` | **Rewrite layout** | Adopt `StudioShell`, 7 sections |
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | **Rewrite layout** | Adopt `StudioShell`, 5 sections |
| `src/components/corporate-suite/CompanyProfileBuilder.tsx` | **Rewrite layout** | Adopt `StudioShell`, 6 sections |
| `src/components/stamp-generator/StampProjectWizard.tsx` | **Rewrite layout** | Adopt `StudioShell`, 6 sections |

No new dependencies. No database changes. No edge function changes. Only layout restructuring.

---

## What Does NOT Change

- All existing business logic, state management, PDF export functions, AI calls — none of this changes
- The preview components themselves (CardCanvas, LiveStampPreview, CV preview JSX) remain identical
- Routes, navigation, auth — unchanged
- All existing features already implemented (QR, auto-regenerate, fullscreen modal, license system) — all preserved

---

## Implementation Order

1. Build `StudioShell.tsx` (the layout shell) — this is the foundation
2. Apply to `LogoCreator.tsx` first (smallest / simplest to verify the shell)
3. Apply to `BusinessCardDesigner.tsx`
4. Apply to `CVResumeBuilder.tsx`
5. Apply to `CoverLetterGenerator.tsx`
6. Apply to `CompanyProfileBuilder.tsx`
7. Apply to `StampProjectWizard.tsx`
