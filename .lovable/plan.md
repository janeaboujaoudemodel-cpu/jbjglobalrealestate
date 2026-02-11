

## Personalized Chat Greeting for Logged-In Users

### Problem
When a logged-in user opens the chat widget, it says "Hi there!" and asks for their full name from scratch -- even though we already know who they are. This feels impersonal and redundant.

### Solution
Detect logged-in users when the chat opens, fetch their profile name, and modify the conversational flow to:
1. Greet them by name: "Hi, [Full Name]!"
2. Ask them to **confirm** their name is correct (since it might be a fake signup name)
3. Skip the name input step if confirmed, or let them type a corrected name

### Changes

**1. `src/components/AIChatWidget.tsx`**
- Import `useAuth` from AuthContext
- When the widget opens or goes to `conversational_collect`, check if user is logged in
- If logged in, fetch the user's display name from `crm_users_profile` or fall back to `user.user_metadata` / `user.email`
- Pass the detected name as a new prop (`detectedFullName`) to `ChatConversationalCollect`

**2. `src/components/chat/ChatConversationalCollect.tsx`**
- Add a new optional prop: `detectedFullName?: string`
- Add a new step: `'confirm_name'` (before `'name'`)
- Flow for logged-in users:
  - Initial greeting: "Hi, [Full Name]! I can see you're already a member. Could you please confirm that your full name is **[Full Name]**? If not, please type your correct full name below."
  - Show two options: a "Yes, that's correct" button and a text input to type a different name
  - If confirmed, pre-fill `fullName` and skip to email/phone step
  - If they type a new name, use that instead
- Flow for non-logged-in users: unchanged ("Hi there!" + ask for name)

### Technical Details

- The `crm_users_profile` table has a `display_name` field -- this is the primary source
- Fallback chain: `crm_users_profile.display_name` -> `user.user_metadata.full_name` -> `user.email`
- The confirmation step uses a `confirm_name` collect step with a "Confirm" button and an alternative text input
- No database schema changes required

