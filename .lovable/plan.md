

## Fix: AI Tools Section Must Start with the Main Hub

### Problem
The "AI Tools Hub" link is placed in the **highlighted items** at the top of the sidebar (line 66), separate from the "AI TOOLS" collapsible section which starts with "AI Personal Shopper" (line 120). When the user expands the AI TOOLS section, it scrolls to show the section from "AI Personal Shopper" downward — the main hub link is not visible because it's in a completely different part of the nav.

### Fix

**File: `src/components/navigation/GlobalVerticalNav.tsx`**

1. **Add "AI Tools Hub" as the first item inside the AI TOOLS section** — Insert `{ label: "AI Tools Hub", href: "/ai-hub", icon: Cpu, section: "AI TOOLS" }` before "AI Personal Shopper" (line 120), so when the section expands, the hub is the first thing visible.

2. **Remove the duplicate from highlighted items** — Remove or keep the highlighted "AI Tools Hub" entry (line 66). Since the user wants it inside the section, remove it from highlights to avoid duplication. If other highlighted items should stay (Home Finder, List Property, Careers, Resale), those remain untouched.

This ensures when the AI TOOLS section expands (or is clicked in collapsed mode), the main hub is the first item shown, and the full list flows naturally below it.

