

## Plan: User Verification System + Enhanced Homepage Hero

Two major deliverables: (1) a full "Get Verified" trust badge system with backend, and (2) a new introductory hero section above the existing video hero.

---

### Part 1: User Verification / Trust Badge System

**Concept**: Users see a CTA banner ("Join us in building a safer community. Get verified to boost your credibility..."). Clicking it opens a verification flow where they submit identity proof. After admin approval, they receive a verified badge visible on their profile and interactions.

**Database Migration**:
- Add columns to `profiles`: `is_verified boolean default false`, `verified_at timestamptz`, `verification_status text default 'none'` (none/pending/approved/rejected)
- Create `user_verifications` table:
  - `id uuid PK`, `user_id uuid FK profiles`, `submitted_at timestamptz`, `status text` (pending/approved/rejected), `reviewed_at timestamptz`, `reviewed_by uuid`, `rejection_reason text`
  - `id_document_url text` (stored in private storage bucket)
  - `selfie_url text`
  - RLS: users can INSERT/SELECT own rows, owner/admin can SELECT/UPDATE all

- Create private storage bucket `verification-documents` with RLS (user can upload own, admin can read all)

**Frontend Components**:
1. **`VerificationBanner`** — Gold-accented CTA strip shown on homepage and user dashboard: "Join us in building a safer community. Get verified to boost your credibility and assist us in creating trust amongst our users!" with a "Get Verified" button
2. **`VerificationModal`** — Multi-step dialog:
   - Step 1: Upload government-issued ID (front photo)
   - Step 2: Upload a selfie holding the ID
   - Step 3: Confirmation screen ("Submitted! We'll review within 24-48 hours")
3. **`VerifiedBadge`** — Small shield/checkmark icon component shown next to verified users' names across the platform
4. **Admin review page** at `/owner/verification-requests` — Table of pending submissions with approve/reject actions

**Backend**:
- Storage bucket with RLS for document uploads
- Admin approval updates `user_verifications.status` and sets `profiles.is_verified = true` + `profiles.verified_at`

**Files to create/edit**:
- New migration SQL (add columns + table + bucket + RLS)
- `src/components/verification/VerificationBanner.tsx`
- `src/components/verification/VerificationModal.tsx`
- `src/components/verification/VerifiedBadge.tsx`
- `src/pages/owner/VerificationRequests.tsx`
- Edit `src/pages/Index.tsx` — add VerificationBanner
- Edit `src/pages/UserProfile.tsx` — show VerifiedBadge
- Add route for owner verification management

---

### Part 2: Enhanced Homepage — Introductory Hero Above Video

**Concept**: A new section above the video hero that immediately communicates what JBJ Global Real Estate is: a premium real estate marketplace + AI-powered tools hub + brokerage services platform.

**Design**: Full-width section with dark gradient background matching the header/sidebar aesthetic. Contains:
- Company tagline: "Your Gateway to Dubai's Finest Real Estate"
- Three key pillars shown as compact icon cards in a row:
  1. **Premium Marketplace** — "2,400+ Off-Plan & Resale Properties"
  2. **AI-Powered Tools** — "Smart Search, Analysis & Investment Intelligence"  
  3. **Brokerage Services** — "Licensed Advisors, Market Reports & Guides"
- Subtle scroll-down indicator to the video hero below
- Fully responsive, compact on mobile

**Files to create/edit**:
- `src/components/home/IntroHeroSection.tsx` — new component
- Edit `src/pages/Index.tsx` — insert IntroHeroSection above the video hero

---

### Implementation Order
1. Database migration (verification table, columns, storage bucket, RLS)
2. Verification UI components (banner, modal, badge)
3. Owner admin review page + routing
4. IntroHeroSection component
5. Wire everything into Index.tsx and profile pages

