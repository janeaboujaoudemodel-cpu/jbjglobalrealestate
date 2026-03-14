

## Session 20 — Document / Signature / Stamp / Letterhead / Business Card Integration into Email + Chat

### Current State

| Feature | Email Hub | Team Chat | Employee Chat |
|---------|-----------|-----------|---------------|
| **Attach file** | "Attach" button exists — **cosmetic**, no file upload logic | "+" and Paperclip buttons exist — **cosmetic** | Paperclip button — **cosmetic** |
| **Stamp** | "Stamp" button exists — **cosmetic**, no BrandAssetPicker wired | No stamp option | No stamp option |
| **Signature / Letterhead** | Signature block in Approve & Send modal — **text only**, no image/brand asset | None | None |
| **Send document** | Can navigate to `/e-signature/create` from Document Studio | None | None |
| **BrandAssetPicker** | Not imported | Not imported | Not imported |
| **E-Sign integration** | Not available from compose | None | None |

**Root problems:**
1. All "Attach", "Stamp", and "Paperclip" buttons are cosmetic — zero upload/insert logic
2. No document attachment workflow in chat (Team or Employee)
3. BrandAssetPicker exists and works (tested in stamp generator) but is not wired into email or chat
4. No way to insert letterhead, signature image, business card, or stamp into email body
5. No way to share documents, contracts, or forms via chat messages
6. E-Signature flow is only accessible from Document Studio, not from email compose

---

### Implementation Plan

#### 1. Create shared `DocumentAttachmentPicker` component
**File:** `src/components/shared/DocumentAttachmentPicker.tsx`

A modal/dropdown that consolidates all insertable document types:
- **Attach File** — native file upload (images, PDFs, docs)
- **Stamp** — opens BrandAssetPicker filtered to `stamp`
- **Signature** — opens BrandAssetPicker filtered to `signature`
- **Letterhead** — opens BrandAssetPicker filtered to `letterhead`
- **Business Card** — opens BrandAssetPicker filtered to `business_card`
- **Logo** — opens BrandAssetPicker filtered to `logo`
- **Email Signature** — opens BrandAssetPicker filtered to `email_signature`
- **Send for E-Signature** — navigates to `/e-signature/create` with prefilled content

Returns selected assets as attachments (SVG/image URL + name + type) that the parent component can render inline or as attachment chips.

#### 2. Wire into Email Hub compose dialog (`EmailClient.tsx`)

Replace the cosmetic "Attach" and "Stamp" buttons with functional ones:
- **Attach** → opens file picker, stores selected files in state, shows attachment chips below body
- **Stamp** → opens DocumentAttachmentPicker filtered to stamps, inserts selected stamp SVG as inline image or attachment
- Add **Letterhead** button → inserts letterhead asset as email header image
- Add **Signature** button → inserts signature brand asset into signature block area
- Add **E-Sign** button → navigates to `/e-signature/create` with current email body prefilled as document
- In the Approve & Send modal, render any attached stamps/letterheads/signatures visually

Update the `send-owner-email` edge function payload to include `attachments[]` array (name, url/base64, type).

#### 3. Wire into Team Chat (`TeamChat.tsx`)

Replace the cosmetic "+" and Paperclip buttons:
- **"+"** → opens DocumentAttachmentPicker (full menu: attach file, stamp, signature, contract, form, etc.)
- **Paperclip** → opens native file picker for quick file attach
- When an attachment is selected, show it as a preview chip above the message input
- On send, include the attachment in the message payload (rendered inline in the chat message bubble)
- Respect Session 19 cross-channel rules: if "Also email" is ON, include attachments in the email too

#### 4. Wire into Employee Chat (`EmployeeChatHub.tsx`)

Same pattern as Team Chat:
- Wire Paperclip button to open DocumentAttachmentPicker
- Show attachment preview before send
- Include in message display

#### 5. Chat message rendering for attachments

Update message rendering in both TeamChat and EmployeeChatHub to handle attachment data:
- If message has an attached stamp/logo SVG → render inline with `StampSVGRenderer`
- If message has an attached image → render as thumbnail
- If message has a PDF/document → render as a download card
- If message has a business card → render as a mini preview card

#### 6. Email signature block enhancement (`EmailClient.tsx` Approve & Send)

Enhance the signature block in the preview modal:
- If a signature brand asset exists for the current persona → render it as an image below the text signature
- If a stamp brand asset is attached → render it in the signature area
- If a letterhead brand asset exists → render it as the email header
- Query `brand_assets` for the owner's default stamp/signature on mount

#### 7. Update `send-owner-email` edge function

Add support for `attachments` in the email payload:
- Accept `attachments: Array<{ filename: string; content: string; type: string }>` in the request body
- Pass to Resend API's `attachments` parameter for file attachments
- For inline images (stamps, signatures), embed as base64 inline content or CID-referenced images

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/shared/DocumentAttachmentPicker.tsx` | NEW — unified picker for all document/brand asset types |
| `src/pages/EmailClient.tsx` | Wire Attach/Stamp/Signature/Letterhead/E-Sign buttons, attachments state, preview rendering |
| `src/pages/TeamChat.tsx` | Wire "+" and Paperclip to DocumentAttachmentPicker, attachment rendering in messages |
| `src/components/employee-chat/EmployeeChatHub.tsx` | Wire Paperclip to picker, attachment rendering |
| `supabase/functions/send-owner-email/index.ts` | Add `attachments` support in Resend API call |

### Cross-Channel Compliance (Session 19)

When sending with attachments:
- **Chat first, email toggle ON** → attachments included in both chat message and email
- **Email first, chat toggle ON** → email attachments sent, chat notification includes a reference to the attached items
- The DocumentAttachmentPicker is channel-agnostic — same component works in both contexts

### What Will NOT Be Implemented (Transparency)

- **Supabase Storage file uploads**: Actual file upload to cloud storage for large files (PDFs, docs) would require Supabase Storage bucket setup. This session will support brand asset insertion (from existing `brand_assets` table) and base64 inline images. Large file upload infrastructure can be added in a future session.
- **Contract/form builder creation**: The integration enables *sending* existing documents — it does not create new contract templates or form builders. Those tools already exist at their respective routes.

