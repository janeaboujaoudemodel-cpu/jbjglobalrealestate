

# Fix CRM Shortcut Not Visible in Header

## Problem
The CRM shortcut (lines 416-431) is nested inside the `{user && (...)}` block (line 413). Since `showCRM` already includes a `!!user` check, the outer `{user && (...)}` gate is redundant but causes the CRM to not render when `user` hasn't resolved yet from the auth context.

More importantly, the CRM block needs to be moved **outside** the `{user && (...)}` wrapper so it renders independently based on its own `showCRM` condition.

## Fix

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

Move the CRM shortcut block **before** the `{user && (...)}` block so it's independently gated by `showCRM`:

```tsx
{/* CRM shortcut (owner/broker only) — outside user gate since showCRM already checks user */}
{showCRM && (
  <>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/owner/crm" className={`${cellBase} hover:bg-emerald-500/10`}>
          <BarChart3 className="w-4 h-4 text-emerald-600 ..." />
          <span className="...">CRM</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent ...>...</TooltipContent>
    </Tooltip>
    {railDivider}
  </>
)}

{user && (
  <>
    {/* Tasks, Notifications, Inbox stay here */}
  </>
)}
```

Lines 413-432 restructured: extract the CRM `{showCRM && (...)}` block (lines 416-431) to sit before line 413's `{user && (`, and remove the now-empty leading position inside the user block.

## What stays the same
- All other buttons (Tasks, Notifications, Inbox, Dashboard, ModeSwitcher, Settings)
- All icons, tooltips, badges, links, conditional logic
- `showCRM` definition unchanged — already includes `!!user` check

