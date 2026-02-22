

# Chat Support Memory and Flow Fix

## Problem Summary
The chat support widget has no persistent memory. Every time a user opens the chat, they must re-enter their name, email, and phone -- even if they are already logged in or have chatted before. The back button from the shortcuts screen incorrectly navigates to an old "check_email" step. The bottom of the email check form is cropped.

---

## Fix 1: Persistent User Memory with localStorage

**Current:** Uses `sessionStorage` (lost when tab closes). User details are never remembered across sessions.

**Fix in `src/components/AIChatWidget.tsx`:**
- Switch from `sessionStorage` to `localStorage` for `jbj_chat_user` and `jbj_chat_step`
- On mount, check three sources in order:
  1. **Logged-in user** -- if `user` exists, fetch their profile from `crm_users_profile` or `leads` table and pre-fill `userInfo`
  2. **localStorage** -- if saved user data exists with a valid email, restore it
  3. **Fresh start** -- show the welcome screen
- If user data is found (from either source), skip `conversational_collect` entirely and go straight to `shortcuts` (or a new "confirm details" step)

---

## Fix 2: New "Confirm Details" Step for Returning Users

**New step: `confirm_details`** added to `ChatStep` type.

**New component: `src/components/chat/ChatConfirmDetails.tsx`**
- Shows the user's saved details (name, email, phone) in a read-only card
- Two buttons:
  - "Continue" -- proceeds directly to `shortcuts`
  - "Update My Details" -- switches to an editable mode where the user can change their info
- When details are updated:
  - Save new details to `localStorage`
  - Update the `leads` table with new contact info (keeping old data)
  - Create an admin alert in `chat_conversations` or `jbj_analytics` flagging "Contact details updated" with both old and new values
  - The admin chat dashboard will show a notification that the user changed their details

**Flow for returning users:**
`welcome_choice` -> (user data found in memory) -> `confirm_details` -> `shortcuts`

**Flow for new users (no change):**
`welcome_choice` -> `conversational_collect` -> `shortcuts`

---

## Fix 3: Fix Back Button Navigation

**Current broken mapping in `handleBack`:**
- `shortcuts` -> `check_email` (wrong -- `check_email` is not in the current flow)
- `chat_history` -> `check_email` (same issue)

**Fix:**
- `shortcuts` -> `welcome_choice`
- `chat_history` -> `shortcuts`
- `confirm_details` -> `welcome_choice`
- `conversational_collect` -> `welcome_choice` (already correct)

---

## Fix 4: Admin Notification for Contact Detail Changes

When a user updates their details from the `confirm_details` screen:
- Call `capture-lead` edge function with updated info (it handles upsert)
- Insert a record into `jbj_analytics` with `action_type: 'contact_details_updated'` and metadata containing both old and new values
- The admin chat dashboard already reads from `jbj_analytics`, so the alert will appear automatically

---

## Fix 5: Bottom Padding / Cropping on Email Check Form

**In `src/components/chat/ChatEmailCheck.tsx`:**
- The "Your information is secure..." text and form are cropped at the bottom
- Add `pb-6` to the outer container and reduce unnecessary elements
- Since this form is now only shown for the very first interaction (before any data exists), simplify the button text to just "Continue to Support"

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/chat/types.ts` | Add `'confirm_details'` to `ChatStep` type |
| `src/components/chat/ChatConfirmDetails.tsx` | New component: shows saved details, confirm or update |
| `src/components/AIChatWidget.tsx` | Switch to `localStorage`, add returning-user detection on mount, add `confirm_details` step rendering, fix back button mapping |
| `src/components/chat/ChatEmailCheck.tsx` | Fix bottom padding, simplify button text |
| `src/components/chat/ChatHeader.tsx` | Add title for `confirm_details` step |
