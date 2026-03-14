

## Session 20 Completion — Document Tool Integration into Communication Workflows

### Problem Summary

The attachment framework exists (picker, chips, renderers, edge function support) but has critical gaps:

1. **Attachments never sent via email** — `sendEmail()` in `EmailClient.tsx` (line 312) does NOT pass the `attachments` array to `send-owner-email`
2. **No "Send via Email" or "Send via Chat"** actions on generated documents (ExclusiveDocuments, DocumentStudio)
3. **No document-type-aware rendering** — stamps/signatures/letterheads all render the same as generic images
4. **E-Signature shortcut is navigation-only** — no return flow back to email/chat
5. **Persona consistency not enforced** — attaching a stamp doesn't check sender persona alignment
6. **Business card / signature not communication-ready** — only picker categories, no preview or inline insertion

### Implementation Plan

#### 1. Fix Critical Bug: Wire attachments into email send

**File:** `src/pages/EmailClient.tsx` — `sendEmail()` function

Add `attachments` to the edge function payload, mapping `DocumentAttachment[]` to the format the edge function expects:
```
attachments: attachments.map(att => ({
  filename: att.name,
  content: att.content,
  type: att.mimeType,
}))
```

Also set `hasAttachment: true` on the sent email record when attachments exist.

#### 2. Add "Send via Email" and "Send via Chat" to ExclusiveDocuments

**File:** `src/pages/owner/ExclusiveDocuments.tsx`

After document generation, add two buttons alongside the existing "Send for E-Signature":
- **"Send by Email"** — Opens EmailClient compose dialog (via navigation with state) with the document body pre-filled and document attached as a file
- **"Send to Team Chat"** — Posts the document content to Team Chat via navigation with state

Implementation: Navigate to `/owner/email-client` or `/team-chat` with `location.state` containing `{ prefillBody, prefillSubject, prefillAttachment }`. The receiving pages will check for this state on mount.

#### 3. Add document-type-aware rendering in `ChatAttachmentRenderer` and `AttachmentChip`

**File:** `src/components/shared/DocumentAttachmentPicker.tsx`

Enhance rendering per asset type:
- **Stamp**: Render with `StampSVGRenderer` (already available) in both chip and chat bubble, with a gold border and "Official Stamp" badge
- **Signature**: Render with handwriting-style styling, translucent background
- **Letterhead**: Show as a document card with company header colors
- **Business Card**: Render as a mini card layout with rounded corners and shadow
- **Logo**: Render with centered layout and brand badge
- **Email Signature**: Render as formatted signature block

#### 4. Add "Send to Email/Chat" actions from DocumentStudio

**File:** `src/pages/DocumentStudio.tsx`

Add "Send by Email" and "Send to Chat" buttons next to the existing "Send for E-Signature" button, using the same `navigate()` with state pattern.

#### 5. Receive prefilled state in EmailClient and TeamChat

**File:** `src/pages/EmailClient.tsx`

On mount, check `location.state` for `prefillBody`, `prefillSubject`, `prefillAttachment`. If present:
- Auto-open compose dialog
- Fill subject/body
- Add attachment to `attachments[]` state

**File:** `src/pages/TeamChat.tsx`

On mount, check `location.state` for `prefillMessage`, `prefillAttachment`. If present:
- Set `newMessage` to the content
- Add attachment to `pendingAttachments[]`

#### 6. Enforce persona consistency for stamp/signature/letterhead

**File:** `src/pages/EmailClient.tsx`

When a stamp or signature brand asset is attached, show a small info badge in the compose area: "Stamp attached — sending as [Current Sender Persona]". This confirms the persona context. If the user switches personas after attaching, the stamp/signature remains (they are company-wide assets, not persona-specific).

#### 7. E-Signature flow clarification and return path

**Current state:** The "Send for E-Signature" button in `DocumentAttachmentPicker` navigates to `/e-signature/create`. This is a **navigation shortcut only**. The E-Signature flow is a separate multi-step wizard (upload PDF → add fields → send to recipients). The completed signed document does not auto-return to the email/chat compose.

**Enhancement:** Add a "Send Completed Document" button on the E-Signature envelope detail page (`EnvelopeDetail.tsx`) that navigates to EmailClient with the signed document attached. This creates the return path.

#### 8. Cross-channel dual sending for document attachments

Already implemented: When "Also notify in Team Chat" is ON in EmailClient, the email (with attachments) sends via `send-owner-email` and a chat notification is created. When "Also send by email" is ON in TeamChat, the `useCrossChannelSend` hook fires the email. The attachment data flows through the same edge function payload.

**Gap to fix:** The `useCrossChannelSend` hook currently does NOT include attachment data in its secondary email call. Add `attachments` parameter to `CrossChannelSendOptions` and pass it through.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/EmailClient.tsx` | FIX attachments in sendEmail(), add prefill state reception |
| `src/pages/TeamChat.tsx` | Add prefill state reception for documents |
| `src/components/shared/DocumentAttachmentPicker.tsx` | Enhanced per-type rendering |
| `src/pages/owner/ExclusiveDocuments.tsx` | Add "Send by Email" / "Send to Chat" buttons |
| `src/pages/DocumentStudio.tsx` | Add "Send by Email" / "Send to Chat" buttons |
| `src/pages/e-signature/EnvelopeDetail.tsx` | Add "Send Completed Document" return path |
| `src/hooks/useCrossChannelSend.ts` | Add attachments support to secondary send |

### Exact Behavior Per Asset Type (Post-Implementation)

| Asset Type | Selection | Preview | Send (Email) | Send (Chat) | Rendering |
|------------|-----------|---------|--------------|-------------|-----------|
| **Stamp** | BrandAssetPicker filtered | SVG thumbnail in chip | Base64 attachment via Resend | Inline SVG in bubble | Gold-bordered stamp badge |
| **Signature** | BrandAssetPicker filtered | SVG thumbnail in chip | Base64 attachment via Resend | Inline image in bubble | Handwriting-style card |
| **Letterhead** | BrandAssetPicker filtered | Document preview chip | Base64 attachment via Resend | Document card in bubble | Company-branded card |
| **Business Card** | BrandAssetPicker filtered | Mini card preview chip | Base64 attachment via Resend | Card layout in bubble | Rounded shadow card |
| **Logo** | BrandAssetPicker filtered | Logo thumbnail chip | Base64 attachment via Resend | Centered image in bubble | Brand badge |
| **Email Signature** | BrandAssetPicker filtered | Signature block chip | Embedded in email footer | Formatted block in bubble | Signature block |
| **Contract/Form** | File upload or ExclusiveDocuments | PDF/text preview chip | Base64 attachment via Resend | Document card in bubble | Download card |
| **E-Signature Doc** | Navigation shortcut → return path | N/A (separate flow) | Attached after completion | Attached after completion | PDF download card |

### Transparency: What Is and Is Not Full Integration

- **Contracts/Forms/Warning Letters**: These are generated in ExclusiveDocuments as text. They can be **sent** via email or chat using the new "Send by Email"/"Send to Chat" buttons. They are NOT embedded as structured form objects — they are text documents attached as content.
- **E-Signature**: The shortcut navigates to the E-Signature wizard. A new return path button is added. This is a **linked flow**, not a single-screen integration.
- **Brand Assets**: Stamps, signatures, letterheads, business cards, logos are fetched from `brand_assets` table and attached as base64 images. They render with type-specific styling.

