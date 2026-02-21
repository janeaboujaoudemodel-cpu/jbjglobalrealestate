
# Support Ticket Email Premium Redesign + Status Update Emails + Survey System

This plan covers all requested changes to the support ticket confirmation email, automatic status update emails, and a post-ticket survey system with points integration.

---

## Part 1: Email Template Premium Redesign

Changes to `supabase/functions/submit-support-ticket/index.ts` -- the customer confirmation email HTML:

### 1A. Header Block ("JBJ Global Real Estate")
- Change the header background from flat black (`#000000`) to a champagne gold gradient (`linear-gradient(135deg, #C8A766 0%, #B8956E 50%, #A07D4A 100%)`)
- Add fully rounded corners (`border-radius: 20px`) to the header block so it flows smoothly into the white pearl container beneath
- Title text "JBJ Global Real Estate" becomes deep black/dark text on the gold background for contrast
- "Support Ticket Confirmation" subtitle becomes dark text

### 1B. Additional Contact Emails
Under `SUPPORT@JBJ.AE`, add three more contact lines:
- `CONTACT@JBJ.AE` -- General Inquiries
- `PARTNERSHIPS@JBJ.AE` -- Partnerships
- `CAREERS@JBJ.AE` -- Careers

Each with a small label underneath in a stacked layout.

### 1C. Premium Icons for Phone/Email
Replace the emoji icons (phone emoji, envelope emoji) with styled HTML circles containing the icon symbol -- gold circle background with white icon, or use Unicode characters styled in gold circular badges.

### 1D. Divider Under "Support Ticket Confirmation"
Replace the simple 1px gold line with a premium gradient divider: a wider bar with a gold-to-transparent gradient and slight shadow.

### 1E. WhatsApp Follow-up Button
- Change background from green gradient to champagne/pearl gradient (`#FDFBF7` to `#F5F0E6`)
- Only the border becomes green (`border: 2px solid #25D366`)
- WhatsApp icon/text stays green (`color: #25D366`)
- Text "WhatsApp Follow-up" in dark/green

### 1F. Response Time Update
Change all SLA labels from current values to 24-48 hours for normal priority (update `priorityConfig.normal.label` from `"24-48 hours"` to `"24-48 hours"` -- already correct, but verify other tiers are adjusted appropriately).

### 1G. "Need to Follow Up?" Section
Make it more premium:
- Use champagne gold gradient background instead of flat black
- Add gold border with rounded corners
- Use styled icon badges (gold circles) instead of emoji icons

### 1H. "Explore While You Wait" Cards
- Convert from inline link buttons to equal-sized card blocks
- Use a 3-column x 2-row grid with fixed dimensions so all 6 cards are uniform
- Each card: white background, gold border, centered text, same height/width

### 1I. Overall Background
Change the email body background from white pearl (`#f5f0e6`) to a slightly warmer champagne (`#F5EBD7`) with the inner container keeping its white/pearl gradient.

### 1J. Footer Premium Copy
- Update "First Global Real Estate Platform of Its Kind" to more premium language: "The Only Global AI-Powered Real Estate Intelligence Platform"
- Make the "41+" or similar stats more prominent with gold styling

### 1K. Rating Section (in email)
Add a "Rate Your Experience" section at the bottom of the email with 5 clickable star links that redirect to a survey page (Part 3).

---

## Part 2: Automatic Status Update Emails

### 2A. New Edge Function: `send-ticket-status-email`
Create `supabase/functions/send-ticket-status-email/index.ts`:
- Accepts: `ticketId`, `newStatus`, `adminNote` (optional)
- Fetches the ticket from `support_tickets`
- Builds a status-specific email:
  - **"in_review"**: "Your Ticket Is Being Reviewed" -- progress tracker shows step 2 active
  - **"resolved"**: "Your Ticket Has Been Resolved" -- progress tracker shows all 3 steps complete, includes survey link
- Sends via Resend from `info@jbj.ae`
- Uses the same premium table-based HTML layout as the confirmation email

### 2B. Update `useUpdateTicketStatus` Hook
Modify `src/hooks/useSupportTickets.ts`:
- After the status update succeeds in the database, invoke `send-ticket-status-email` edge function
- When status changes to "in_review" -- automatically triggered when admin opens/views the ticket
- When status changes to "resolved" -- send resolution email with survey link

### 2C. Auto "In Review" on Admin View
In `src/components/support/TicketDetailPanel.tsx`:
- When a ticket with status "open" is loaded by an admin, automatically update it to "in_review"
- This triggers the status update email to the customer

---

## Part 3: Post-Ticket Survey System

### 3A. Database: Create `ticket_surveys` Table
New table with columns:
- `id` (uuid PK, default gen_random_uuid())
- `ticket_id` (uuid, references support_tickets)
- `ticket_number` (text)
- `user_id` (uuid, nullable)
- `full_name` (text)
- `email` (text)
- `phone` (text)
- `overall_rating` (integer, 1-5)
- `ease_of_submission` (integer, 1-5) -- "How easy was it to submit your ticket?"
- `response_speed` (integer, 1-5) -- "How fast was our response?"
- `resolution_quality` (integer, 1-5) -- "How satisfied are you with the resolution?"
- `website_smartness` (integer, 1-5) -- "How smart/intuitive is the website?"
- `would_recommend` (boolean)
- `suggestions` (text) -- free-text remarks/notes/complaints
- `points_awarded` (integer, default 50)
- `created_at` (timestamptz)

RLS: Anonymous insert allowed (via edge function service role). Authenticated users can read their own. Owner can read all.

### 3B. New Page: `/ticket-survey`
Create `src/pages/TicketSurvey.tsx`:
- Route: `/ticket-survey?ticket=JBJ-XXXX&email=xxx`
- Premium champagne/gold themed page
- Questions:
  1. Overall experience (5 gold stars)
  2. Ease of ticket submission (1-5 scale)
  3. Response speed (1-5 scale)
  4. Resolution quality (1-5 scale)
  5. Website intelligence rating (1-5 scale)
  6. Would you recommend? (Yes/No toggle)
  7. Suggestions, complaints, or remarks (textarea)
- Submit button calls edge function
- Success screen: "Thank you! You've earned 50 points!" with confetti/animation
- Add route to `App.tsx`

### 3C. Edge Function: `submit-ticket-survey`
Create `supabase/functions/submit-ticket-survey/index.ts`:
- Validates ticket number and email match
- Prevents duplicate surveys for same ticket
- Inserts into `ticket_surveys`
- Awards 50 points (updates `vip_clients.loyalty_points` if user exists, or stores in survey record)
- Returns success with points awarded

### 3D. Admin View: Survey Results in Customer Happiness Hub
Modify `src/components/admin/EmbeddedCustomerHappinessHub.tsx`:
- Add a new tab or section: "Ticket Surveys"
- Table showing all submitted surveys with:
  - User details (name, email, phone)
  - Ticket number (clickable -- opens ticket detail)
  - All 5 ratings displayed as star icons
  - Suggestions text
  - Points awarded
  - Submitted date
- Charts for each question showing distribution (bar chart using recharts)
- Filter by date range, rating range

---

## Part 4: Points Integration

### 4A. Survey Points
- 50 points awarded per completed ticket survey
- Points stored in `ticket_surveys.points_awarded`
- If user exists in `vip_clients`, increment their `loyalty_points`
- Points source labeled as "Ticket Survey" in the points history

---

## Technical Summary

### New files:
- `supabase/functions/send-ticket-status-email/index.ts`
- `supabase/functions/submit-ticket-survey/index.ts`
- `src/pages/TicketSurvey.tsx`

### Modified files:
- `supabase/functions/submit-support-ticket/index.ts` -- email HTML redesign (header, contacts, WhatsApp, cards, icons, dividers, background, rating section)
- `src/hooks/useSupportTickets.ts` -- trigger status email on update
- `src/components/support/TicketDetailPanel.tsx` -- auto "in_review" on admin open
- `src/components/admin/EmbeddedCustomerHappinessHub.tsx` -- add survey results tab with charts
- `src/App.tsx` -- add `/ticket-survey` route

### Database migration:
- Create `ticket_surveys` table with RLS policies
- Add index on `ticket_surveys.ticket_id`

### Edge functions to deploy:
- `send-ticket-status-email`
- `submit-ticket-survey`
