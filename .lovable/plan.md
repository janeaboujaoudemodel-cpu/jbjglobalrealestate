
# Customer Happiness System Overhaul + Admin Panel Integration

## Summary of Requested Changes

Based on my investigation, you've requested:

1. **Navigation Changes**: Add Customer Happiness to Insights mega menu; Replace "Customer Happiness" shortcut in Account dropdown with "Ticket Support Hub"
2. **Review System**: Proper backend storage with approval workflow, loyalty points, email confirmation, and ability to edit reviews
3. **UI Improvements**: Premium color-coded KPI cards for "Need Immediate Assistance", background card for form sections
4. **Report Issue Form**: Fix the confusing "Steps to Reproduce" placeholder
5. **Admin Panel Integration**: Add tabs for managing Reviews, Issue Reports, and Ideas alongside the existing Support Tickets

---

## Technical Implementation Plan

### A) Database Schema - Create `customer_reviews` Table

A new table is needed since reviews are currently not saved (the FeedbackForm just shows a toast but doesn't persist data).

```sql
CREATE TABLE public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  service_type TEXT NOT NULL,
  review_text TEXT NOT NULL,
  would_recommend TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  loyalty_points_awarded INTEGER DEFAULT 0,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
```

**Loyalty Points System**:
- **50 points** per approved review (industry standard for reviews)
- **Maximum 3 reviews** per user (to prevent spam while allowing updates over time)
- Users can edit their review within 30 days of submission

---

### B) Navigation Changes

**File: `src/components/header/MegaMenuInsights.tsx`**

Add "Customer Happiness Center" to the Services column or create a new "Support" section:
- Position it under Services or Business Suites column
- Link: `/customer-happiness`
- Icon: `Headphones` or `Heart`

**File: `src/components/header/MegaMenuAccount.tsx`**

Replace the existing "Customer Happiness" shortcut (lines 340-358):
- Change label from "Customer Happiness" to "Ticket Support Hub"
- Change description from "Ticket Support Hub" to "Manage customer tickets"
- Keep the same route `/customer-happiness` or change to `/admin` with `tab=support-tickets` if preferred

---

### C) Review Form Improvements

**File: `src/pages/CustomerHappiness.tsx`**

1. **Update "Would you recommend us?" options** (lines 428-434):
   - Change from: "Definitely Yes!", "Probably", "Maybe", "No"
   - Change to: "Absolutely, 100%!", "Definitely!", "Most Likely", "Possibly", "Not Sure"

2. **Connect FeedbackForm to database** (lines 328-345):
   - Save review to `customer_reviews` table with `status: 'pending_approval'`
   - Award loyalty points upon approval (not immediately)
   - Send confirmation email via edge function

3. **Email confirmation**: Create edge function `send-review-confirmation` that sends:
   - "Thank you for submitting a review. You have received 50 loyalty points (pending approval)."

4. **Review editing capability**:
   - Add a "My Reviews" section in user dashboard
   - Allow editing within 30 days of submission

---

### D) Report Issue Form - Fix Placeholder

**File: `src/pages/CustomerHappiness.tsx`** (line 623-624)

The placeholder text "1. Go to page X → 2. Click on Y → 3. Error appears" is confusing. Replace with:

```
placeholder="Optional: List the steps you took when the issue occurred"
```

Also update the label from "Steps to Reproduce" to "Steps Taken (Optional)" to make it clearer this is optional context, not a requirement.

---

### E) Premium UI Improvements

**File: `src/pages/CustomerHappiness.tsx`**

1. **Add background card wrapper** around the tabs section (lines 907-1015):
   - Wrap the entire tabs container in a Card with dark/premium styling
   - Add subtle gradient overlay

2. **Premium color-coded KPI cards** for "Need Immediate Assistance" section (lines 1029-1055):

| Card | Current Border | New Border | Icon Color |
|------|---------------|------------|------------|
| Call Us | `border-blue-500/40` | `border-2 border-blue-500` | `text-blue-500` |
| Email Us | `border-black/40` | `border-2 border-purple-500` | `text-purple-500` |
| Office Hours | `border-gold/40` | `border-2 border-gold` | `text-gold` |

Add hover shadows and premium transitions:
- `hover:shadow-lg hover:shadow-{color}/20`
- `transition-all duration-300`

---

### F) Admin Panel - Customer Happiness Hub Tab

**File: `src/pages/Admin.tsx`**

Add a new comprehensive "Customer Happiness" tab that consolidates:
1. Support Tickets (already exists as separate tab)
2. Reviews (new - pending approval queue)
3. Issue Reports (from `jbj_issue_reports` table)
4. Ideas (from `best_idea_submissions` table)

**New Components to Create**:

1. **`src/components/admin/EmbeddedCustomerHappinessHub.tsx`**
   - Sub-tabs: Tickets | Reviews | Issues | Ideas
   - Stats overview for each category
   - Approval workflow for reviews
   - Status management for issues and ideas

2. **`src/components/admin/ReviewsManagement.tsx`**
   - Table of pending reviews
   - Approve/Reject buttons with notes
   - View published reviews
   - Edit loyalty points awarded

3. **`src/components/admin/IssueReportsManagement.tsx`**
   - Table from `jbj_issue_reports`
   - Status: open, in_progress, resolved
   - Assign to tech team option

4. **`src/components/admin/IdeasManagement.tsx`**
   - Table from `best_idea_submissions`
   - Status management
   - Draw winner selection

---

### G) Issue Report Form - Save to Database

Currently the IssueReportForm (lines 459-661) only shows a toast. Connect it to:
- Save to `jbj_issue_reports` table (already exists)
- Send notification to admin

---

### H) Idea Box Form - Already Connected

Check if `IdeaBoxForm` saves to `best_idea_submissions` - if not, connect it.

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/pages/CustomerHappiness.tsx` | Modify | Review form backend, UI improvements, form fixes |
| `src/components/header/MegaMenuInsights.tsx` | Modify | Add Customer Happiness link |
| `src/components/header/MegaMenuAccount.tsx` | Modify | Rename shortcut to "Ticket Support Hub" |
| `src/pages/Admin.tsx` | Modify | Add Customer Happiness Hub tab |
| `src/components/admin/EmbeddedCustomerHappinessHub.tsx` | Create | Main hub with sub-tabs |
| `src/components/admin/ReviewsManagement.tsx` | Create | Review approval queue |
| `src/components/admin/IssueReportsManagement.tsx` | Create | Issue reports management |
| `src/components/admin/IdeasManagement.tsx` | Create | Ideas/suggestions management |
| `src/hooks/useCustomerReviews.ts` | Create | React Query hooks for reviews |
| `supabase/functions/send-review-confirmation/index.ts` | Create | Email confirmation |

---

## Database Migrations

1. Create `customer_reviews` table with approval workflow
2. Add RLS policies for secure access
3. Create indexes for performance

---

## Loyalty Points Recommendation

| Action | Points | Limit |
|--------|--------|-------|
| Submit Review | 50 points | Max 3 reviews per user |
| Review Approved | Bonus 25 points | One-time per review |
| Edit Review | 0 points | Within 30 days |

**Total possible**: 225 points (3 reviews x 75 each)

---

## Expected Outcomes

1. Reviews saved to database with approval workflow
2. Owner can approve/reject reviews before they appear on website
3. Users receive email confirmation with points info
4. Users can edit their reviews within 30 days
5. Customer Happiness accessible from Insights menu
6. Ticket Support Hub shortcut in account dropdown
7. Premium UI with color-coded cards and background sections
8. Clearer Report Issue form without confusing placeholders
9. Admin Panel has full Customer Happiness management hub
