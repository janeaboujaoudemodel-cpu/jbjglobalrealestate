

# Fix Dashboard Investor Mode Crash and Ensure All Sections Work

## Summary of Findings

After extensive exploration of the codebase and browser testing, I identified the following issues:

### Current Status
The dashboard pages (`/investor-dashboard`, `/my-dashboard`, `/dashboard`) are **loading correctly** - they are not crashing. However, there are several issues that need to be addressed:

### Issue 1: Visitor Session Tracking Fails with 400 Error
**Root Cause:** The `GlobalVisitorTracking.tsx` component sends session data with columns that don't exist in the `visitor_sessions` table.

**Code sends these fields (that don't exist):**
- `screen_resolution`
- `viewport_size`
- `timezone`
- `languages`

**Table only has:**
- `id`, `session_id`, `visitor_fingerprint`, `first_visit_at`, `last_activity_at`, `ip_address`, `user_agent`, `device_type`, `browser`, `os`, `country`, `city`, `referrer`, `landing_page`, `pages_visited`, `total_time_spent`, `scroll_depth_max`, `is_bounced`, `is_converted`, `user_id`, `contact_details`, `created_at`

**Impact:** Console shows recurring 400 errors, but doesn't crash the dashboard.

### Issue 2: Quick Actions Grid Text Overflow
**Location:** `src/components/dashboard/QuickActions.tsx`

**Problem:** The Quick Actions buttons in the My Dashboard page have text that overlaps/clips when displayed in the grid. The grid sizing doesn't provide enough room for the text content.

### Issue 3: Activity Overview Links to Wrong Dashboard
**Location:** `src/components/dashboard/ActivityOverviewCard.tsx` (line 112)

**Problem:** The "View Full Activity" link points to `/broker-dashboard` regardless of user role, which doesn't exist for investors.

### Issue 4: Badges Level Card Links to Wrong Dashboard
**Location:** `src/components/dashboard/BadgesLevelCard.tsx` (line 74)

**Problem:** The "View Full Progress" link points to `/broker-dashboard` regardless of user role.

---

## Technical Solution

### Phase 1: Fix Visitor Session Tracking (Silent Errors)

Modify `src/components/GlobalVisitorTracking.tsx` to only send columns that exist in the table:

```typescript
// Before (broken):
const sessionData = {
  session_id: sessionId,
  device_type: getDeviceType(),
  browser: getBrowserInfo(),
  os: getOS(),
  screen_resolution: getScreenResolution(), // Column doesn't exist
  viewport_size: getViewportSize(),         // Column doesn't exist
  timezone: getTimezone(),                   // Column doesn't exist
  languages: getLanguages(),                 // Column doesn't exist
  ...
};

// After (fixed):
const sessionData = {
  session_id: sessionId,
  device_type: getDeviceType(),
  browser: getBrowserInfo(),
  os: getOS(),
  referrer: document.referrer || null,
  landing_page: location.pathname,
  pages_visited: 1,
  user_id: user?.id || null,
  user_agent: navigator.userAgent,
};
```

### Phase 2: Fix Quick Actions Grid Layout

Modify `src/components/dashboard/QuickActions.tsx` to improve grid sizing and prevent text overflow:

```typescript
// In the grid container:
<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

// Each button needs minimum sizing:
<Button
  variant="outline"
  className="h-auto p-4 flex flex-col items-start gap-2 min-h-[100px] w-full"
>
  <div className="flex items-center gap-2 w-full">
    <action.icon className={`h-5 w-5 ${action.color} shrink-0`} />
    <span className="text-sm font-medium text-foreground truncate">{action.label}</span>
  </div>
  <span className="text-xs text-muted-foreground text-left line-clamp-2">{action.description}</span>
</Button>
```

### Phase 3: Fix Activity and Progress Links

**ActivityOverviewCard.tsx (line 112):**
```typescript
// Before:
<Link to="/broker-dashboard">

// After (role-aware):
<Link to="/my-dashboard">
```

**BadgesLevelCard.tsx (line 74):**
```typescript
// Before:
<Link to="/broker-dashboard">

// After (role-aware):
<Link to="/my-dashboard">
```

### Phase 4: Add Error Boundaries for Dashboard Components

Create a reusable error boundary wrapper for dashboard cards to prevent one failing component from crashing the entire page:

```typescript
// src/components/dashboard/DashboardCardErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

class DashboardCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard card error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border border-border">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackTitle || 'Unable to load this section'}
            </p>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default DashboardCardErrorBoundary;
```

Then wrap each dashboard card in MyDashboard:
```typescript
<DashboardCardErrorBoundary fallbackTitle="Profile unavailable">
  <ProfileSummaryCard />
</DashboardCardErrorBoundary>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/GlobalVisitorTracking.tsx` | Remove non-existent columns from session data |
| `src/components/dashboard/QuickActions.tsx` | Fix grid layout and prevent text overflow |
| `src/components/dashboard/ActivityOverviewCard.tsx` | Change link to `/my-dashboard` |
| `src/components/dashboard/BadgesLevelCard.tsx` | Change link to `/my-dashboard` |
| `src/components/dashboard/DashboardCardErrorBoundary.tsx` | Create new error boundary component |
| `src/pages/MyDashboard.tsx` | Wrap cards with error boundaries |

---

## Expected Results After Implementation

1. No more 400 errors in console from visitor session tracking
2. Quick Actions grid displays properly without text overflow
3. Activity and Progress links navigate to the correct dashboard
4. Individual card failures won't crash the entire dashboard
5. Better error visibility when a section fails to load

---

## Verification Checklist

After implementation:
- [ ] Navigate to `/my-dashboard` as investor - no crashes
- [ ] Navigate to `/investor-dashboard` - no crashes
- [ ] Quick Actions buttons display correctly with no text overlap
- [ ] "View Full Activity" and "View Full Progress" buttons navigate correctly
- [ ] Console shows no 400 errors on visitor_sessions
- [ ] All dashboard cards load their data correctly

