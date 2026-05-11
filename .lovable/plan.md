## Problem

The public signing page (`/sign/:token`) has four terminal screens — **error**, **expired link**, **document completed**, and **signing declined** — but none of them offer a way out. The user lands on a dead-end card with no button to return to the JBJ homepage.

## Fix

Add a consistent "Go to Homepage" primary button (plus a secondary "Contact Support" link) to every terminal state in `src/pages/e-signature/SignDocument.tsx`.

### Screens updated

1. **Error / Expired / Invalid link** (line 201 block)
   - Keep current message + branding
   - Add `Button` → `window.location.href = "/"` labeled **"Return to Homepage"**
   - Add small secondary link **"Contact our team"** → `mailto:info@jbj.ae`

2. **Document already completed** (line 220 block)
   - Keep "Document Signed!" confirmation
   - Add **"Return to Homepage"** button

3. **Signing declined** (line 233 block)
   - Keep current message
   - Add **"Return to Homepage"** button

4. **Missing token / generic failure**
   - Same treatment via the shared error block (already routes through `setError`)

### Button styling

- Use existing shadcn `<Button>` with the project's champagne-gold theme: ink text on cream `#EFE6D6` background with thin gold border (per the No-Gold-Fills standard already in the memory index).
- Place button centered under the message, with consistent spacing (`mt-6`).

### Files touched

- `src/pages/e-signature/SignDocument.tsx` — only the four return blocks between lines 188–245. No business logic, no edge-function changes, no template changes.

### Out of scope

- Token generation / expiry logic
- Email template
- Signature/agreement template styling (already handled in earlier turns)

### Verification

- Open `/sign/5055edeb-…` → expired card now shows **Return to Homepage** button, clicking it goes to `/`.
- Open `/sign/a6f9a5a4-…` → completed card shows the same button.
- Open `/sign/invalid-token` → error card shows the same button.
