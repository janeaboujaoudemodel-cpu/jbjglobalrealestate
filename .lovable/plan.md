## JBJ Design System Cleanup — Full Rollout Plan

Phase 1 primitives (tokens, `jbj-form/*`, redesigned Signup wizard with visible generated password + Chrome save wiring, new PublicHeader) are already in the tree. This plan covers everything that remains so the whole public site matches one premium language.

---

### Phase 2 — Site-wide legacy grey purge + token migration
- Codemod pass across `src/pages/**`, `src/components/**` (excluding owner/admin dashboards to avoid destabilizing internal tools this round):
  - Replace hardcoded `text-gray-*`, `bg-gray-*`, `border-gray-*`, `#9CA3AF`, `#6B7280`, `#E5E7EB`, silver hexes → JBJ tokens (`--jbj-ink`, `--jbj-mist`, `--jbj-line`, `--jbj-pearl`, `--jbj-champagne`).
  - Replace native `<select>` and legacy custom selects → `JbjSelect`.
  - Replace ad‑hoc `<input>` recipes → `JbjInput` / `JbjField`.
- Add global utility classes: `.jbj-surface`, `.jbj-eyebrow`, `.jbj-body`, `.jbj-hairline`, `.jbj-elevate-{1,2,3}`.
- Add scroll-reveal utility (`IntersectionObserver` hook → `data-reveal="fade|slide|stagger"`), used on all public sections.
- Button audit: every public CTA routed through `JbjButton` (hover, press, focus-visible, loading, success, disabled states).
- Playwright audit at 390 / 768 / 1024 / 1440 / 1920 with screenshots checked in as evidence.

### Phase 3 — Registration & auth polish (finish the credential UX)
- Signup wizard: when "Generate strong password" fires, show the password in a readable monospace pill with **Copy** + **Reveal** and a helper line *"Save this password — Chrome will offer to save it when you continue."*
- Ensure the wizard `<form>` submits natively (Enter key + submit button), carries `autocomplete="username"` on email and `autocomplete="new-password"` on password, so Chrome/1Password/iCloud Keychain reliably prompt to save `email + password`.
- Post-submit, before navigating, blur the field and dispatch a real form submit so the browser save-password prompt appears; only navigate after `requestIdleCallback`.
- LoginDialog & LeadFormDialog rebuilt on the same primitives (dropdowns, phone, buttons) so the gate matches the wizard.
- International phone (`react-phone-number-input` + `libphonenumber-js`) wired into every public form: signup, login (if applicable), lead capture, contact.

### Phase 4 — Header, navigation, and public shell
- Rebuild `PublicHeader` lockup: monogram + wordmark on a single baseline, 72px height, 1px champagne hairline, even nav rhythm, mobile drawer aligned to same tokens.
- Sticky-on-scroll variant with subtle shadow via `--jbj-elevate-1`.
- Public footer refreshed to match (dividers, spacing, type scale).

### Phase 5 — Company Profile Builder (backend-driven public homepage)
Schema (new migration):
- `public_gate_sections` extended: `section_type`, `layout_variant`, `enabled boolean`, `sort_order int`, `content_blocks jsonb`, `media_ids uuid[]`, `updated_by`, `published_at`.
- New table `gate_media_assets` (image/video, storage path, alt, poster).
- `GRANT`s + RLS: owner/admin write; anon read only where `enabled=true AND published_at IS NOT NULL`.
Owner UI (`/owner/public-gate`):
- Drag-and-drop reorder (dnd-kit), inline edit, duplicate, delete, enable/disable toggle, layout variant picker, image/video upload, live preview drawer, Publish button.
Public rendering:
- `PublicAccess` and `Welcome` render sections dynamically from `public_gate_sections` in `sort_order`, honoring `layout_variant`.

### Phase 6 — Product demo video (replaces the placeholder)
Approach: **Scripted Playwright screencast** of the real live app (login → dashboard → CRM → property browse → tools), stitched with JBJ intro/outro cards and licensed ambient music via `ffmpeg`, output 1080p H.264 MP4 to `/mnt/documents/jbj-demo.mp4`, then uploaded to storage and referenced in place of the "Coming Soon" placeholder.
- Optional bonus: a 15-sec Remotion motion-graphics teaser using the JBJ brand palette to open the demo.

### Phase 7 — Final QA
- Responsive sweep (390/768/1024/1440/1920) on every public route.
- Contrast check against existing `scripts/contrast/*` gates.
- Zero-native-controls check (no naked `<select>`, no browser blue focus).
- Legacy-grey grep must return 0 hits in scanned scope.

---

### Technical notes
- Owner/admin dashboards stay out of scope for this pass (they already have their own emerald/champagne system via `crmTokens.css`) — otherwise the blast radius grows and something visible will regress.
- No changes to `src/integrations/supabase/*` auto-generated files.
- All new SQL includes `GRANT` blocks and RLS per project standards.
- Password reveal never logs to console; copy uses `navigator.clipboard.writeText` with fallback.

---

### Deliverables per phase
Each phase ends with: (1) Playwright screenshots at 5 breakpoints, (2) a short changelog note, (3) explicit ✅/❌ on the audit checklist items it covers.

**Approve this plan and I will execute Phase 2 first, then continue phase by phase without re-asking.** If you'd rather I ship all phases in one pass, say "ship it all" and I'll batch them.
