

## Plan: Chat Support Upgrade, Legal Center Hub, and Software Protection System

### What You Asked For (3 Areas)
1. **Chat Support:** Always visible, upgraded AI model, multi-language, "Send Message to JBJ Team" escalation that saves to your notes with full user info, works across all devices
2. **Legal Center Hub:** Backend admin page showing all user agreements, consents, and legal acceptances — bulk-ready and wired
3. **Software Protection:** Anti-copy, anti-scrape, anti-replication system with a public API Access page directing users to contact the team

---

## 1. Chat Support Upgrades

**Current state:** The `AIChatWidget` already exists with AI (Gemini 2.5 Flash), "Submit to Team" button, session logging to `chat_history` table, and a `ChatHistoryAdmin` panel. It's always present on non-back-office routes.

**What I will do:**

**a) Upgrade AI Model** — Change from `google/gemini-2.5-flash` to `google/gemini-2.5-pro` in both `ai-chat-support` and `ai-chat-stream` edge functions for stronger reasoning and multilingual responses.

**b) Add Multi-Language Support** — Update the chat system prompt to instruct the AI: "Detect the user's language from their first message and respond in that same language throughout the conversation. You are fluent in English, Arabic, French, Russian, Chinese, Hindi, Spanish, Portuguese, and German." This handles multilingual automatically without UI changes.

**c) Upgrade "Send to Team" to Save to Owner Notes** — When a user clicks "Submit to Team":
- Save the full conversation transcript + user info (name, email, phone, nationality, language) as a note in the owner's notes system
- Format: "SUPPORT ESCALATION — [User Name] ([email], [phone]) — [Service Type] — [Inquiry Summary] — Full Transcript: [messages]"
- Also suggest an action and any matched property/service
- Keep the existing email notification as backup

**d) Add "Send Message to JBJ Team" Simplified Button** — Add a persistent "Need More Help? Send Message to JBJ Team" option visible at all chat steps (not just during active chatting). This opens a simple form: Name, Email, Phone, Message → saves to owner notes + sends notification.

**Files:** `supabase/functions/ai-chat-support/index.ts`, `supabase/functions/ai-chat-stream/index.ts`, `src/components/AIChatWidget.tsx`, `src/components/chat/ChatMessages.tsx`

---

## 2. Legal Center Hub (Backend Admin)

**Current state:** `user_agreements` table exists, `useAgreementSaver` hook saves consents. No admin view exists to see these records.

**What I will build:**

**a) Legal Compliance Center page** (`src/pages/admin/LegalComplianceCenter.tsx`) — Owner-protected route at `/admin/legal-center`:
- **Dashboard cards:** Total agreements, unique users, today's consents, flagged items
- **Filterable table:** All `user_agreements` records with columns: User Email, Agreement Type, Version, Accepted At, User Agent, IP
- **Detail view:** Click to expand and see the full `agreement_snapshot` JSON (the exact text they agreed to)
- **Bulk export:** Download all records as CSV for legal audits
- **Search & filter:** By agreement type (cookies, privacy, terms, content license), date range, user email

**b) Wire the route** — Add to `AdminRoutes.tsx` under `OwnerGuard`, add sidebar link.

**Files:** New `src/pages/admin/LegalComplianceCenter.tsx`, `src/routes/AdminRoutes.tsx`

---

## 3. Software Protection & API Access Page

**Current state:** Already have `SecurityShield` (DevTools blocking, right-click prevention, headless browser detection), `ContentProtection` (image watermarking, drag prevention), `ObfuscationLayer` (decoy elements, fake data). These are active in production.

**What I will add:**

**a) Enhanced Source Code Protection:**
- Add `Content-Security-Policy` meta tag in `index.html` to restrict script sources
- Add anti-iframe protection (X-Frame-Options equivalent via JS) to prevent embedding/mirroring
- Obfuscate all `data-*` attributes dynamically to break scraper selectors
- Disable `view-source:` protocol detection

**b) API Access Page** (`src/pages/ApiAccess.tsx`) — Public page at `/api-access`:
- Professional landing page explaining that JBJ's platform, data, and APIs are proprietary
- "All API access requires an approved API key issued by JBJ Global Real Estate"
- Contact section: "To request API access, contact our team at contact@jbj.ae or call +971 56 591 1000"
- Legal notice referencing UAE Cybercrime Law, intellectual property protections
- Terms of API usage summary

**c) Add anti-replication watermark** — Inject invisible copyright comments throughout rendered HTML, embed JBJ ownership metadata in all page `<meta>` tags.

**Files:** `index.html`, new `src/pages/ApiAccess.tsx`, `src/components/security/ContentProtection.tsx`, routing files

---

## Summary

| Area | What Changes | Files |
|------|-------------|-------|
| Chat AI upgrade | Gemini 2.5 Pro + multilingual prompts | 2 edge functions |
| Chat escalation | Save to owner notes with full user info | `AIChatWidget.tsx`, `ChatMessages.tsx` |
| Chat "Send to Team" | Simplified message form at all steps | `AIChatWidget.tsx` |
| Legal Center Hub | Admin dashboard for all user agreements | New admin page + route |
| Source protection | CSP, anti-iframe, anti-embed | `index.html`, `ContentProtection.tsx` |
| API Access page | Public page directing to contact team | New page + route |

