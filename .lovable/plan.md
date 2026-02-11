

# Fix Search Dropdown Style, Search Bar UI, and Remove All Black Backgrounds

## Overview
Three issues to fix: (1) the Search mega menu dropdown doesn't match the Language dropdown style, (2) the search input inside has a double-border/square appearance, and (3) black backgrounds appear in the chat widget and agent joining screen.

## Changes

### 1. Match Search Dropdown to Language Dropdown Style
The Search dropdown currently uses `MegaMenuShell` (full-width fixed panel). The Language dropdown uses a compact, self-contained container with the champagne gradient and gold border. The Search dropdown will be updated to use the same visual treatment -- the champagne gradient background with `border-2 border-gold/40`, rounded corners, and the bottom gold accent bar removed.

**File:** `src/components/header/MegaMenuSearch.tsx`
- Replace `MegaMenuShell` wrapper with a styled `div` matching the Language dropdown pattern (same champagne gradient background via inline style, `border-2 border-gold/40`, `rounded-xl`, `shadow`, `z-[9999]`)
- Keep the content layout (3-column grid with services, quick links, contact) but wrap it in the new container style

### 2. Fix Search Bar Double-Border Issue
The `Input` component has built-in champagne gradient background and gold borders. When placed inside the already-champagne dropdown, it creates a visible nested border effect (square inside square).

**File:** `src/components/header/MegaMenuSearch.tsx`
- Override the Input's default styling: use a white/lighter background (`bg-white/80`), single clean border (`border border-gold/30`), and remove the double gradient effect so it looks like a clean inset field

### 3. Remove Black Backgrounds from Chat Widget
Multiple chat components use dark/black backgrounds that conflict with the premium champagne design language.

**File:** `src/components/chat/ChatMessages.tsx`
- Change `bg-[#0E0E0E]` (messages scroll area) to champagne gradient (`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`)
- Change `bg-[#0A0A0A]` (action buttons bar) to champagne (`bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`)
- Change `bg-[#0A0A0A]` (input bar) to same champagne
- Update the input field inside from `bg-zinc-900 text-white placeholder:text-zinc-500` to `bg-white/80 text-black placeholder:text-black/40 border-gold/30`

**File:** `src/components/chat/ChatAgentJoining.tsx`
- Change `text-zinc-400` and `text-zinc-300` text colors to `text-black/60` and `text-black/70`
- Change `border-zinc-600` to `border-gold/30` and `border-zinc-900` to `border-gold/40`
- Change `bg-zinc-700` to `bg-gold/20`
- Change `text-white` (agent name) to `text-black`

## Technical Details

| File | Changes |
|------|---------|
| `src/components/header/MegaMenuSearch.tsx` | Replace `MegaMenuShell` with Language-dropdown-style container; fix Input double-border with clean override styling |
| `src/components/chat/ChatMessages.tsx` | Replace `bg-[#0E0E0E]` and `bg-[#0A0A0A]` with champagne gradients; fix input styling from dark to light |
| `src/components/chat/ChatAgentJoining.tsx` | Replace all zinc/dark colors with champagne-compatible light colors (black text, gold borders) |

