# Backend Contrast & Overflow — Full Audit & Fix

You're right — earlier passes only patched fragments. Below is the complete list of bugs I found by reading the actual components in the owner backend, plus the targeted fix for each. I verified each file before writing this.

## Bugs identified (auditor's list)

### A. Vertical sidebar shell — `src/pages/OwnerDashboardShell.tsx`
1. **"Return to Site" / "Sign Out" buttons** at the sidebar bottom rely on `text-[#1A1A1A]` but get hover-flipped to faded gold; on `data-surface="champagne"` the global guard can also dim them. Icons stay readable but text fades.
2. **Sidebar collapse/expand chevron** (`text-[#B89555]`) is faded gold on champagne — banned by the Faded Gold Prohibition memory.
3. **"Owner" badge** in the top header uses `text-[#B89555]` for the shield icon and weak `bg-[#B89555]/12` — the label "Owner" is fine but the icon is faded.
4. **"Verified Owner" caption** uses `text-[#1A1A1A]/70` — acceptable, kept.
5. The header has no `data-no-contrast-guard` so the guard re-touches it on theme switches.

### B. Sidebar nav — `src/components/owner-dashboard/OwnerSidebarNav.tsx`
6. Section labels (`CORE`, `PROPERTIES`, …) already ink — OK.
7. Inactive nav items already ink — OK.
8. **Missing overflow protection**: when collapsed (`w-16`) some labels still try to render via tooltips; not the issue user reports. Real issue: when expanded, long labels like "Founder & Podcast Control" and "AI Meeting Summarizer" are fine because `truncate` is set — verified. No change needed here.

### C. CRM page header & shortcut dock — `src/pages/CRM.tsx` (lines 660–735)
9. **"Sign Out" button** (line 662) — `text-[#1A1A1A]` OK, but hover `text-gold` fades on hover.
10. **"Tasks / Calendar / Team / Relationships" buttons** (lines 700–716) sit in a `gap-1` flex with no horizontal padding between groups — they visually touch the search bar and each other. User explicitly called this out.
11. **"Automations" button** (line 728) uses `text-gold` as the *resting* color — faded gold prohibition violation.
12. **"AI Insights" brain button** (line 687) uses `text-gold` resting color — same violation.
13. **Search bar placeholder** uses `text-[#1A1A1A]/70` and `⌘K` kbd uses `text-gold` — kbd is faded.
14. The shortcut row has no `flex-wrap`, so on narrow viewports the buttons overflow horizontally and clip. User mentioned "preview module gets smaller and content comes out of the box."

### D. Smart Automations card — `src/components/crm/AutomationRules.tsx`
15. **Trash/garbage icon** (line 232) is `text-red-400` (faded). User explicitly asked: "must always be solid black." Will switch to `text-[#1A1A1A]` with `hover:text-red-700`.
16. **Trigger / Action labels** ("Lead Created", "Send Email", etc.) on lines 220 & 224 use `Badge` with `px-2 text-[10px]` — text is fine but the **rule card** itself (line 200) sets `flex-wrap` only on the inner row, while the outer flex is `flex items-start gap-3` with no `min-w-0` on the parent. When the Smart Automations card is narrow (collapsed sidebar / live preview shrinks), the badge row + arrow + action badge wrap awkwardly and the **switch + trash buttons get pushed under the description**, making the layout look like content is escaping the card. Fix: add `min-w-0` to the row parent and `flex-shrink-0` is already on the action cluster — the wrap rule needs tightening.
17. **Inactive rule** uses `opacity-60` — combined with already-light champagne it makes the text look faded grey. Will keep opacity but force `text-[#1A1A1A]` (no opacity) on the title.
18. **"Create Custom Rule" outline button** uses `text-[#1A1A1A]/70` and faded border — fine, keeping.

### E. CRM Communication Panel chat — `src/components/crm/CRMCommunicationPanel.tsx`
19. The chat panel is full-width but message bubbles don't carry `min-w-0` / `overflow-wrap: anywhere`. When the desktop preview iframe shrinks, long URLs/AI replies push the bubble past the card edge. Fix at the message bubble container.

### F. KPI / dashboard cards — `src/components/crm/CRMEnhancedDashboard.tsx`
20. KPI label captions ("Lead Created", "Send Email", etc.) are not truncated and overflow when the column shrinks. Need `truncate` + `min-w-0` on the flex parent.

---

## Fixes (one round, all files)

**1. `src/pages/OwnerDashboardShell.tsx`**
- Add `data-no-contrast-guard` to header + sidebar bottom-actions container.
- Sidebar collapse chevron: change `text-[#B89555]` → `text-[#1A1A1A]` with `hover:text-[#B89555]` (gold only on hover, allowed).
- "Owner" badge shield icon: change `text-[#B89555]` → `text-[#1A1A1A]`.
- Bottom buttons: add explicit `style={{ color: '#1A1A1A' }}` to defeat any inherited dimming; keep hover gold.

**2. `src/pages/CRM.tsx`** (header + shortcut row)
- Wrap shortcut row in `flex-wrap gap-2` and split into two segments with `gap-3` separator so Search bar and quick-actions cluster never touch.
- Add `mx-2` separator between Search and the action group.
- Quick actions: change `gap-1` → `gap-2`, add `flex-wrap` for narrow viewports.
- "AI Insights" brain button: resting color `text-[#1A1A1A]`, hover gold.
- "Automations" button: resting `text-[#1A1A1A] font-semibold`, hover gold.
- Sign Out: keep ink, hover red.
- ⌘K kbd: `bg-[#1A1A1A]/8 text-[#1A1A1A]` instead of faded gold.

**3. `src/components/crm/AutomationRules.tsx`**
- Trash button: `text-[#1A1A1A] hover:text-red-700 hover:bg-red-50` (no more faded red-400).
- Rule row: add `min-w-0` to the inner `flex-1` div so badges wrap inside the card; ensure outer container has `overflow-hidden`.
- Inactive rule: keep `opacity-60` only on the description, force title to full `text-[#1A1A1A]`.
- Sync icon: change `text-[#1A1A1A]/70` → `text-[#1A1A1A]`.

**4. `src/components/crm/CRMCommunicationPanel.tsx`**
- Add `min-w-0` and `[overflow-wrap:anywhere]` to chat message bubble + parent flex track so the chat between the user and Lovable AI never breaks the card box at any preview width.

**5. `src/components/crm/CRMEnhancedDashboard.tsx`**
- Add `min-w-0 truncate` to KPI label spans so "Lead Created", "Send Email", etc. clip cleanly when the card narrows.

**6. `src/index.css`** (scoped backend additions)
- Add a rule banning `text-red-400` and `text-red-300` as a *resting* color inside the owner shell (`[data-surface="champagne"] .text-red-400 { color:#1A1A1A; }`) so any future regressions are auto-corrected.
- Add `[data-no-contrast-guard] *` exemption already exists; ensure header has it.

## Out of scope for this pass
- Sitewide AI tools page audit (user mentioned "AI tools also are not visible") — I'll handle owner-CRM in this pass and follow up with the AI Hub / Royal Tools pages next so this PR stays focused and reviewable.

After approval I'll implement all six file edits in one go and report back the exact lines changed so you can verify.
