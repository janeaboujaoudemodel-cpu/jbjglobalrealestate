

## Plan: Full-Fit Active Tab Styling in Ticket Hub

### Problem
The tab triggers (New Ticket, My Tickets, Inbox) in `TicketHub.tsx` appear as small rounded rectangles that don't fill the full height/width of their grid cell when active. The active state needs to stretch edge-to-edge vertically and horizontally within the tab bar.

### Fix

**File: `src/pages/TicketHub.tsx` (line 272-289)**

Update the `TabsList` and each `TabsTrigger` styling:

- **TabsList (line 272):** Change `h-14` to `h-12 p-1` and add `gap-1` so triggers fill the container with minimal padding.
- **Each TabsTrigger (lines 273, 277, 281):** Replace `rounded-lg` with `rounded-lg h-full` to ensure full vertical fill. Add `data-[state=active]:rounded-lg` for clean active corners. Remove any implicit padding that constrains the trigger size.

The key CSS changes per trigger:
```
className="text-sm font-semibold h-full rounded-lg
  data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8]
  data-[state=active]:text-foreground data-[state=active]:shadow-md"
```

This ensures the active tab fills its entire grid cell from top to bottom and left to right, matching the full-fit expectation.

