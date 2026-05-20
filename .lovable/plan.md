# Plan — Wave 3 finish: scroll fixes + unified broker sheet in Databases

## 1. Fix scroll in every picker dropdown

Root cause: shadcn `CommandList` and `SelectContent` need an explicit scrollable viewport. In several pickers the list renders all items but the wrapper has no working overflow inside the Radix portal (Popover/Select), so the wheel/touch scroll is swallowed.

Files to fix (apply the same pattern everywhere):

- `src/components/crm/pickers/PhoneInputWithCountry.tsx` — country dial picker
- `src/components/crm/pickers/NationalityPicker.tsx` — nationality
- `src/components/crm/pickers/LanguageMultiPicker.tsx` — languages
- `src/components/ui/phone-input-with-country.tsx` — legacy phone picker (still used elsewhere)
- `src/components/ui/nationality-select.tsx` — legacy nationality select
- `src/components/crm/BrokerageCombobox.tsx` — "Tap to search brokerage"
- `src/components/crm/BrokerCombobox.tsx` — broker typeahead (defensive)

Fix pattern:
- For Command-based pickers: ensure `<CommandList class="max-h-72 overflow-y-auto overscroll-contain">` and that the surrounding `PopoverContent` does NOT set `overflow-hidden`. Add `onWheel={(e) => e.stopPropagation()}` on the list to prevent parent Sheet/Dialog from intercepting wheel events.
- For Select-based pickers: replace inner `<div class="max-h-... overflow-y-auto">` wrappers (they fight Radix's Viewport). Let `SelectContent` handle scroll via Radix's built-in scroll buttons + give it `max-h-[60vh]`.
- Make every popover portal-safe inside Sheet/Dialog by setting `PopoverContent` `side="bottom"`, `sideOffset={6}`, `collisionPadding={12}`.

## 2. Use canonical AddBrokerSheet inside Databases (folder assignment)

Currently `src/components/crm/CRMListSidebar.tsx` uses just `BrokerCombobox` to pick an existing broker for a folder. The user wants the **same full screen** as `Add Broker` from the CRM header — with **Access settings, Expires, Notes, Branded invitation email, Onboarding link**.

Changes in `src/components/crm/CRMListSidebar.tsx`:
- Keep the inline `BrokerCombobox` for the fast "pick existing" path.
- Add a secondary button on each folder card: **"+ New broker for this folder"** that opens the canonical `AddBrokerSheet` (imported from `@/pages/owner/crm/BrokersRegistry`).
- Prefill the sheet's "folder context" via a new optional `defaultFolderId` prop on `AddBrokerSheet`; on successful create, auto-call `folders.updateFolder.mutate({ id: folderId, assigned_broker_id: newBroker.id })`.
- Confirm `AddBrokerSheet` already exposes Access settings, Expires, Notes, Branded invitation, Onboarding link sections — if any are missing in that sheet, add them (they live in `BrokersRegistry.tsx`).

## 3. Scope clarification (access settings)

- Access settings, branded invitation email, onboarding link → **brokers only** (AddBrokerSheet).
- `CRMLeadModal` (Add Lead) stays as-is — no access settings block.

## 4. Verification

- Open Add Lead → scroll country code list, nationality list, languages list ✓
- Open Add Broker from CRM header → same scroll checks + brokerage search scroll ✓
- Open Databases → folder → "+ New broker for this folder" → AddBrokerSheet opens with full Access/Expires/Notes/Invitation/Onboarding sections, and the created broker is auto-assigned to the folder ✓

## Out of scope

No backend schema changes. No changes to lead form. Wave 4 (Broker Accounts admin: provisioning, force password change, audit timeline, suspend/reset, per-broker export) starts after this is approved.
