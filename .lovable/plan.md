
## What I found (root cause + why it feels “not clicking”)

### 1) “Service with Issue” + “Priority Level” dropdowns in **Create Support Ticket** are effectively broken (hidden)
In `src/components/SupportTicketBox.tsx`, both dropdown menus override the shared Select menu styling:

- They pass `SelectContent className="... z-[200]"`

Your app’s dialog overlay/content uses a very high z-index (`z-[10050]` in `src/components/ui/dialog.tsx`), and the shared Select component is designed to appear above everything (`z-[10100]` in `src/components/ui/select.tsx`).

Because the SupportTicketBox overrides that with `z-[200]`, the dropdown content (the list of options) is rendered behind the modal overlay/content, so you don’t see it and it feels like the field is “not clickable”.

This matches what I observed: I can click the combobox triggers, but no visible menu appears.

### 2) There are multiple “Support Ticket” implementations (inconsistent + harder to QA)
You currently have at least two different implementations:
- `src/components/SupportTicketBox.tsx` (used on homepage, /contact, /services/customer-happiness-center)
- `SupportTicketForm` inside `src/pages/CustomerHappiness.tsx` (owner-only page)

They don’t use the same field names / priority values, and this makes “audit testing” unreliable because one may work while the other breaks.

---

## Immediate fixes to implement (high priority)

### A) Fix dropdown visibility/clickability in `SupportTicketBox` (the user-facing issue)
1. Update **both** `SelectContent` usages in `src/components/SupportTicketBox.tsx`:
   - Remove the `z-[200]` override entirely (preferred), or set it to something safely above the dialog (e.g. `z-[10150]`).
   - Keep a solid background (not transparent) and proper border/shadow.
   - Result: the menu renders on top of the dialog as intended and selections become usable.

2. Small UX hardening:
   - Ensure the trigger has `cursor-pointer` (optional polish).
   - Ensure menu items remain clearly hoverable (your shared `SelectItem` already handles this well).

**Expected outcome:** Clicking “Service with Issue” opens the category list; clicking “Priority Level” opens Low/Normal/High/Critical list; selecting updates the form state.

---

### B) Standardize ticket payload + priority values across the app (prevents “works here, fails there”)
1. Align all ticket forms to the backend function contract (`submit-support-ticket` expects `serviceCategory`, and priority values like `low|normal|high|critical`).
2. `src/pages/CustomerHappiness.tsx` currently uses:
   - `category` instead of `serviceCategory`
   - default priority `"medium"` (not in your main priority set)
3. Choose one approach:
   - Preferred: reuse the same `SupportTicketBox` component in `CustomerHappiness.tsx`, or extract a shared `<SupportTicketForm/>` component used everywhere.
   - Alternative: update `SupportTicketForm` inside `CustomerHappiness.tsx` to match the same fields/values and the same Select styling.

**Expected outcome:** every “Create Support Ticket” UI in the product behaves identically.

---

## Deep audit test (so we stop repeating the same issues)

### Audit scope (based on what you’ve repeatedly flagged)
1. **Support Ticket UX (primary)**
   - Homepage → Create Support Ticket modal: both dropdowns open and selections save.
   - `/contact` → Create Support Ticket modal: same.
   - `/services/customer-happiness-center` → Create Support Ticket modal: same.
   - Owner `/customer-happiness` page: ticket creation works and uses the same schema/priority options.

2. **Ticket submission flow**
   - Fill minimum required fields.
   - Submit.
   - Confirm success UI shows ticket number.
   - Confirm network call returns success (no 400/500).
   - Optional: confirm a record exists in the backend `support_tickets` table (internal verification).

3. **Regression checks (the other items you raised earlier)**
   - Home Hero search/filter bar: verify it matches your requested placement/behavior on desktop + mobile.
   - Homepage “JBJ Royal Tools Hub” card alignment: verify CTA buttons are aligned consistently.
   - Header duplication: verify only one header renders and the scroll behavior is correct.
   - Toolkit Hub page styling: verify it matches the homepage’s JBJ Royal Tools Hub style tokens.

### How I’ll report the audit
- A checklist with Pass/Fail per page + screenshots if needed
- If any step fails, it becomes an immediate fix item before moving on

---

## Files that will be modified (implementation)
1. `src/components/SupportTicketBox.tsx`
   - Remove/raise the `z-[200]` override on both `SelectContent`s
   - Ensure dropdown background + border + shadow are consistent and non-transparent

2. `src/pages/CustomerHappiness.tsx`
   - Standardize to the same support ticket schema/values (either reuse SupportTicketBox or align the form)

(If during audit we find the homepage hero/search bar still not matching your exact instructions, we’ll include:)
3. `src/components/home/HeroSearchBar.tsx` (only if audit fails)
4. Any toolkit homepage section file(s) only if audit fails

---

## Success criteria (what “fixed” means)
- “Service with Issue” and “Priority Level” always open their menus and allow selection on every page where support ticket exists.
- “Normal” priority is selectable and persisted into the outgoing request.
- Ticket submission succeeds and returns a ticket number (no silent failures).
- Audit checklist shows all target flows as PASS (not “looks fixed” — actually verified).

