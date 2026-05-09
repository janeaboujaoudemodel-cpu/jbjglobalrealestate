## Goals

1. **Add Email button** next to Copy link / WhatsApp on every recipient row in the envelope sidebar (in addition to the existing toolbar "Send via Email").
2. **Branded "Thank you for signing" email** auto-sent to the signer (and admin notification preserved) the moment they sign — already partially in place via `esign-complete-envelope`; polish into a premium signer-specific template and add a dedicated "Signed ✓" status sync so the dashboard auto-flips to **Completed** in real time (already wired via realtime — verify and surface).
3. **Show signed agreements as a first-class section.** Dashboard "Completed" tile already filters; add a permanent **"Signed agreements"** quick filter chip + per-card "Signed on …" timestamp + Open Signed PDF / Audit cert shortcuts. Inside the envelope detail, the "Signed Document" card stays + new green banner at top once status = `completed`.
4. **Universal WhatsApp / Email / Phone open helper** so clicks never get blocked again, anywhere on the site.
5. **Send a real test email now** through Resend using `esign-send-for-signature` against a draft envelope so the locked template is visually verified end-to-end.

---

## 1. Universal contact-action helper (site-wide fix for "api.whatsapp.com is blocked")

Root causes found:
- `supabase/functions/_shared/email-html.ts:184` uses `https://api.whatsapp.com/send?phone=…` — Chrome / iOS blocks this when the user has no WhatsApp Web session, and corporate filters block `api.whatsapp.com` outright. `wa.me/<digits>?text=` is the only universally-allowed form.
- 30+ call sites across `src/` use `window.open("https://wa.me/…")` after `await`, which trips popup blockers because the click is no longer the trusted gesture.

**Fix — create `src/utils/contactActions.ts`:**
```ts
openWhatsApp(phone?: string, text?: string)
openEmail(to: string, subject?: string, body?: string, cc?: string[])
openTel(phone: string)
```
Each function:
- Synchronously creates `<a href=…  target="_blank" rel="noopener noreferrer">`, appends to body, calls `.click()`, removes — preserves user gesture so popup blockers stay quiet.
- Always uses `https://wa.me/<digits>?text=` (never `api.whatsapp.com`).
- Strips non-digits and drops leading `+` / `00`.
- Falls back to clipboard + toast if `phone` empty (`wa.me/?text=…`) or window.open returns null.
- For email uses `mailto:` with proper percent-encoding; for tel uses `tel:`.

**Refactor:** swap every `window.open("https://wa.me/…")`, `window.location.href = "https://wa.me/…"`, `mailto:` builders, and `tel:` links across `src/` to use the helper. Replace the one `api.whatsapp.com` occurrence in `_shared/email-html.ts` with `https://wa.me/971565911000?text=Hello%20JBJ`.

---

## 2. E-signature dialog — add Email quick-share button per recipient

In `EnvelopeDetail.tsx`, recipient row currently has **Copy link** + **WhatsApp**. Add a third button **Email** (and rename existing toolbar button to keep consistency). Email button:
- Uses `openEmail(recipient.email, subject, body)` with a pre-filled premium template:
  - Subject: `Please sign — {{doc_title}} · {{doc_number}}`
  - Body: branded JBJ message + signing link
- Plus a **"Send for signature now"** secondary action that calls `esign-send-for-signature` directly so the client gets the Resend-branded email immediately without opening the full dialog.

The existing `SendForSignatureDialog` (full editor with editable subject/body) stays and is opened from the toolbar's primary "Send for signature" — fully editable as the user requested.

---

## 3. "Thank you for signing" — premium signer email + signed-state sync

`esign-complete-envelope` already sends a completion email to sender + all recipients. Two improvements:

a. **Two distinct emails** instead of one:
   - **Signer email** (to each `recipient.email`):
     subject `✓ Thank you — your signed copy of {{doc_title}}`
     body emphasises **"Thank you for signing"**, attaches signed PDF link + audit certificate, JBJ champagne/gold theme.
   - **Owner email** (to `envelope.sender_email` and `contact@jbj.ae`):
     subject `Signed: {{doc_title}} by {{signer_name}}`
     body lists signers + timestamps + review CTA.

b. **App status sync** is already realtime via `EnvelopeDetail`'s postgres_changes channel. Confirm dashboard refresh by adding a `useQuery` invalidation on `esign_envelopes` channel in `ESignatureDashboard` so a freshly-signed envelope flips to **Completed** without manual refresh.

c. **Inside envelope detail**, when `status === "completed"`, render a top emerald banner: "Signed by {{signer}} on {{date}} — view signed PDF / Download audit certificate." (Signed Document card already lower in sidebar — banner just elevates it.)

---

## 4. Dashboard "Signed agreements" surfacing

`ESignatureDashboard.tsx` already has a Completed tile that filters by `status==="completed"`. Add:
- A persistent chip row above the list: **All · Draft · Sent · Signed · Expired** (Signed = completed + partially_signed showing emerald check).
- On each completed card: emerald "✓ Signed {date}" badge + inline "Signed PDF" + "Audit cert" buttons.
- Search continues to match doc number, client name, building, etc. (already implemented in last loop).

---

## 5. Send a test email now (after plan approval, in build mode)

Using existing test envelope (or creating a minimal draft programmatically):
- Fetch the most-recent `draft` envelope owned by the current user via `supabase.read_query`.
- Invoke `esign-send-for-signature` with `channels: ["email"]`, `to: <user supplies test address>`.
- Confirm Resend 200 OK in `supabase.edge_function_logs` and report message-id back in chat.

I will ask the user for the **test recipient email** before sending.

---

## Files Changed

| File | Change |
|------|--------|
| `src/utils/contactActions.ts` | **new** — universal openWhatsApp/openEmail/openTel |
| `src/pages/e-signature/EnvelopeDetail.tsx` | add per-recipient Email button; route WhatsApp/Email through helper; emerald "Signed" banner |
| `src/pages/e-signature/ESignatureDashboard.tsx` | add Signed filter chip; per-card signed badge + signed PDF link |
| `src/components/e-signature/SendForSignatureDialog.tsx` | route WhatsApp open through helper |
| `supabase/functions/esign-complete-envelope/index.ts` | split into two branded emails (signer "Thank you", owner "Signed") |
| `supabase/functions/_shared/email-html.ts` | replace `api.whatsapp.com` → `wa.me` |
| `src/**/*.tsx,*.ts` (≈30 files) | migrate `window.open("https://wa.me/…")` and `mailto:` / `tel:` to helper |

No DB migrations, no RLS changes, no new secrets — Resend already configured.

---

## Open question before I send the test

What email address should I send the locked-template test to? (e.g. your own inbox.) After approval I'll deploy the edge functions and trigger one real send so we can lock the template visually.