

## Unified Intelligence, Market Data, and Contact Form Across All Detail Pages

### Current State

| Page | AI Analyzer | DLD Market Widget | Consultation Form | Gold Divider |
|------|-------------|-------------------|-------------------|--------------|
| Area Detail | Area analyzer | Yes | No | No |
| Developer Detail | Developer analyzer | Yes (touches listings) | No | No |
| Project Detail | Project analyzer only | No | Yes | N/A |

### What Will Change

#### 1. Project Detail Page -- Add DLD Widget + Area Analyzer + Developer Analyzer

Currently the project page only has the `ProjectAIAnalyzer`. We will add:
- **DLD Market Widget** after the AI section, with a premium gold divider above it
- **Area AI Analyzer** (reuse `AreaAIAnalyzer` component) analyzing the project's area
- **Developer AI Analyzer** (reuse `DeveloperAIAnalyzer` component) analyzing the project's developer

Section order: ... -> Project AI Analyzer -> Area AI Analyzer -> Developer AI Analyzer -> Gold Divider -> DLD Market Widget -> ... -> Consultation Form (already exists)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**
- Import `AreaAIAnalyzer`, `DeveloperAIAnalyzer`, `DLDMarketWidget`
- Render Area and Developer analyzers after the existing Project analyzer
- Render DLD widget with gold divider before the brochure section

#### 2. Developer Detail Page -- Add Gold Divider + Consultation Form

The DLD widget already exists but sits right against the project listings. We will:
- Add a **premium gold divider** between the projects grid and the DLD widget
- Add the **ConsultationRequestForm** after the DLD widget

**File: `src/pages/DeveloperDetail.tsx`**
- Import `ConsultationRequestForm`
- Add a gold divider element before `<DLDMarketWidget />`
- Add consultation form section after the DLD widget

#### 3. Area Detail Page -- Add Consultation Form + Gold Divider

The DLD widget and AI analyzer already exist. We will:
- Add a **premium gold divider** between the projects grid and the DLD widget
- Add the **ConsultationRequestForm** after the AI analyzer (before the CTA section)

**File: `src/pages/AreaDetail.tsx`**
- Import `ConsultationRequestForm`
- Add gold divider before `<DLDMarketWidget />`
- Add consultation form section after `<AreaAIAnalyzer />`

#### 4. Global Consultation Form via CombinedContactNewsletter

The `CombinedContactNewsletter` component already renders on every public page via `MainLayout`. We will enhance it by embedding the `ConsultationRequestForm` inside it, so every single page automatically has the detailed contact form (name, email, phone, nationality, language, preferred time, service selection).

**File: `src/components/CombinedContactNewsletter.tsx`**
- Import `ConsultationRequestForm`
- Add the form between the contact cards and the newsletter section
- This ensures ALL pages (not just detail pages) have the comprehensive contact form

#### 5. Premium Gold Divider Component

A reusable elegant gold divider to visually separate the listings from the market intelligence section.

**New file: `src/components/shared/GoldSectionDivider.tsx`**
- A simple, elegant component: horizontal gold gradient line with a centered diamond ornament
- Used before the DLD Market Widget on all detail pages

### Technical Details

- **DLD Data Source**: The data comes from `src/constants/dldMarketData.ts` -- these are static constants. Updating them requires a code change. The "As of" date shown is dynamically generated from the current browser date, so it always appears current. To make this truly live, a backend data source would be needed (future enhancement).
- **No backend changes** required for this update
- **No new dependencies** -- all components already exist, just need to be composed together
- **ConsultationRequestForm** accepts `title`, `subtitle`, `projectId`, and `projectName` props for context-aware headers

### Files Summary

| File | Action |
|------|--------|
| `src/components/shared/GoldSectionDivider.tsx` | New -- reusable gold divider |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add AreaAIAnalyzer, DeveloperAIAnalyzer, DLDMarketWidget, gold divider |
| `src/pages/DeveloperDetail.tsx` | Add gold divider, ConsultationRequestForm |
| `src/pages/AreaDetail.tsx` | Add gold divider, ConsultationRequestForm |
| `src/components/CombinedContactNewsletter.tsx` | Embed ConsultationRequestForm for global coverage |

