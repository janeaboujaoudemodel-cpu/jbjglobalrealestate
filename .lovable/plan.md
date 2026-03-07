

# Founder Assistant - Comprehensive UI & Functionality Fix Plan

This plan addresses all reported issues across the Founder Assistant's sections. Due to the volume (~15+ distinct fixes across 12+ files), work is organized into priority batches.

---

## Batch 1: Layout, Spacing, Icons & Navigation Fixes

### 1.1 Fix Tab Icons (Video Meet, Escalations, Collaboration) — `FoundersAssistant.tsx`
- **Video Meet** uses `Video` (h-3.5 w-3.5) — too small. Increase to `h-4 w-4` consistently.
- **Escalations** uses `Zap` — same sizing fix.
- **Collaboration** uses `Network` — already has icon but same sizing fix.
- All tab trigger icons standardized to `h-4 w-4`.

### 1.2 Split tabs into two header rows — `FoundersAssistant.tsx`
Currently all 14 tabs are in a single `TabsList`. Split into:
- **Row 1 (Primary):** Assistant, Tasks, Team, Drafts, AI Tools, Hot Leads, Activity
- **Row 2 (Secondary):** Video Meet, Escalations, Analytics, Collaboration, AI Insights, Notes, Decisions

Each row styled as a distinct pill-shaped header bar with `mb-4` spacing between them and `mb-8` before the content area. This resolves the "midsection too close" issue.

### 1.3 Push Amanda Clarke card down — `FoundersAssistant.tsx`
Add `mt-4` to the `TabsContent` wrapper for assistant tab to increase gap.

### 1.4 Sidebar label fix — `OwnerSidebarNav.tsx`
Change `"AI Assistant"` label to `"Founder Assistant"` and replace `Bot` icon with a non-AI icon (e.g., `MessageSquare` or keep `Bot` but remove the word "AI").

### 1.5 Active tab button styling — `FoundersAssistant.tsx`
The active state currently uses `from-[#C9A84C] to-[#B8973F]` which is correct gold. Ensure the active tab trigger fills its container flush (no white border gap) by removing any internal padding mismatch and using `rounded-lg` consistently.

---

## Batch 2: Task Stats, Team Directory & AI Tools Fixes

### 2.1 Task stat cards clickable + wired — `FoundersAssistant.tsx`
Cards already have `onClick={() => setActiveTab('tasks')}`. The issue is they need to also filter the tasks view. Pass a `filterStatus` prop to `FoundersTaskDashboard` so clicking "Completed" pre-filters to completed tasks, etc.

### 2.2 Team Directory — `FoundersTeamDirectory.tsx`
- **Department filter buttons cropped**: Line 138 shows `departments.slice(0, 8)` — this cuts off departments after the 8th. Remove the `.slice(0, 8)` and wrap in a horizontally scrollable container with proper `overflow-x-auto`.
- **Search input hidden**: The search input exists (line 127-134) but the `ScrollArea` on the department buttons may be overlapping it on some viewports. Fix by ensuring `flex-col` stacking and proper `z-index`.

### 2.3 AI Tools Panel — `FoundersAIToolsPanel.tsx`
- **Show ALL tools**: Currently only 14 tools in `AI_TOOLS` array. Add remaining tools from `AI_TOOLS_CONFIG` in `AIToolsProvider.tsx` (20+ tools like Virtual Staging, Price Predictor, Neighborhood Insights, Contract Reviewer, etc.).
- **Organize by category**: Group tools visually with category headers instead of flat grid.
- **Separate owner tools from professional tools**: Add a "My Tools" vs "Professional Tools" section divider.
- **Smart Calendar bug**: The `calendar-ai` tool invokes `ai-followup-scheduler` edge function with `action: 'initialize'`. If this function doesn't handle that action, it errors. Fix by ensuring the edge function handles the initialize action gracefully.
- **Categories list**: Expand from 8 to include all: Documents, Integration, Administration, etc.

---

## Batch 3: Theme Fixes (Black → Champagne Gold) for All Sections

### 3.1 Video Meet Panel — `FoundersVideoMeetPanel.tsx`
Replace all `bg-[#0E0E0E]`, `bg-[#1A1A1A]`, `text-white`, `text-gray-400` with Champagne theme:
- Cards: `bg-white border-2 border-gold/30`
- Text: `text-black`, `text-zinc-600`
- Inputs: `bg-white border-gold/30 text-black`

### 3.2 Escalations Panel — `FoundersEscalationsPanel.tsx`
- Remove `demoEscalations` hardcoded data (lines 79-148) — show only real `escalationQueue`.
- Remove emoji usage from `getEmotionIcon` calls — use Lucide icons only.
- Fix color scheme: all cards/backgrounds to Champagne theme.
- Fix white text on bright backgrounds → black text.
- Fix faded buttons → proper contrast.

### 3.3 Analytics Panel — `FoundersEmotionAnalyticsPanel.tsx`
- Apply Champagne theme to all cards.
- Replace emoji-based emotion indicators with Lucide icons.

### 3.4 Collaboration Panel — `FoundersCollaborationPanel.tsx`
- `departmentColors` uses dark alpha colors (`text-purple-400` etc.) — change to proper contrast colors for light backgrounds.
- Add missing icon for Collaboration tab.

### 3.5 AI Insights Panel — `FoundersInsightsPanel.tsx`
- Uses generic shadcn theme variables (`bg-primary`, `text-muted-foreground`). Apply explicit Champagne Gold styling.
- Fix "Efficiency" and "Optimize" faded cards with proper contrast.
- Sub-tabs (`TabsList grid-cols-5`) — apply gold active styling.

### 3.6 Activity Center — `FoundersActivityCenter.tsx`
- `activityColors` use dark alpha colors (`text-blue-400` etc.) — fix for light backgrounds.
- Remove `/owner/` from any displayed route/slogan text.
- Apply Champagne premium styling.

### 3.7 Decisions Panel — `FoundersDecisionPanel.tsx`
- Line 127: `text-white` on header → change to `text-black`.
- Line 128-129: `text-zinc-400` → `text-zinc-600`.
- Sub-tabs: Apply gold active state.
- Fix "pending" badge to single line (add `whitespace-nowrap`).
- Recommendations: Ensure icons fit within their container boxes.

### 3.8 Notes Panel — `FoundersNotesPanel.tsx` / `AINoteCenter.tsx`
- Change white text to black for readability on light backgrounds.

---

## Batch 4: Additional Sections & Features

### 4.1 Add Customer Happiness Center to Escalations tab
Add a sub-section within `FoundersEscalationsPanel` that mirrors the Customer Happiness Center from the Owner Command Center.

### 4.2 Rebuild escalation workflow
Enhance the escalation system with proper scoring labels (no emojis), status tracking, and timing displays using clean professional formatting.

### 4.3 Decisions sub-tabs
- "Risks" tab needs proper risk cards (currently may be empty).
- "Recommendations" — fix icon overflow and badge layout.

---

## Batch 5: Edge Function Deployment

The following edge functions need verification/deployment:
- `ai-followup-scheduler` (Smart Calendar — currently erroring)
- `executive-assistant` (Amanda chat)
- Video Meet related functions
- All AI tool functions referenced in `TOOL_FUNCTION_MAP`

For tools that invoke edge functions, ensure each function handles the `action: 'initialize'` payload gracefully (return a success message instead of crashing).

---

## Technical Approach

All color/theme changes follow the locked standard:
- Background: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` or `bg-white`
- Borders: `border-2 border-gold/30` or `border-[#C9A84C]/30`
- Text: `text-black` (primary), `text-zinc-600` (secondary)
- Active buttons: `bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white`
- No emojis anywhere — Lucide icons only
- No `text-white` on light backgrounds

---

## Files to modify (estimated 12-15 files):
1. `src/pages/FoundersAssistant.tsx` — tabs split, spacing, icons, task filter state
2. `src/components/owner-dashboard/OwnerSidebarNav.tsx` — label rename
3. `src/components/founders-assistant/FoundersVideoMeetPanel.tsx` — theme fix
4. `src/components/founders-assistant/FoundersEscalationsPanel.tsx` — theme + remove demo data + rebuild UI
5. `src/components/founders-assistant/FoundersEmotionAnalyticsPanel.tsx` — theme fix
6. `src/components/founders-assistant/FoundersCollaborationPanel.tsx` — theme fix + icons
7. `src/components/founders-assistant/FoundersInsightsPanel.tsx` — theme fix
8. `src/components/founders-assistant/FoundersActivityCenter.tsx` — theme fix + slogan
9. `src/components/founders-assistant/FoundersDecisionPanel.tsx` — theme + text color + layout
10. `src/components/founders-assistant/FoundersTeamDirectory.tsx` — filter buttons fix
11. `src/components/founders-assistant/FoundersAIToolsPanel.tsx` — add all tools + categories
12. `src/components/founders-assistant/FoundersNotesPanel.tsx` or `AINoteCenter` — text color
13. `src/components/founders-assistant/FoundersTaskDashboard.tsx` — accept filter prop
14. Edge function fixes as needed

