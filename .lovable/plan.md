# Always-Visible Developer Card Details

## Goal

Make every developer card in **Relationships → Developer Registry** show, without any click or hover:

- **Name** — the developer / company name
- **Company** — same value, shown with an explicit "Company:" label so the role is unambiguous
- **Office location** — the registry's `emirate` field (e.g. Dubai, Abu Dhabi)
- **Phone** — registry `phone`, click-to-call, or `—` when not set
- **External point of contact** — `developer_contact.name`, role, phone, email, all visible up-front

The current card already renders most of these, but they're crammed into a single wrap row and the contact block only appears if data exists. We'll restructure into a clear labeled grid that always renders all five rows, so nothing is hidden behind a click.

## Change — `src/pages/CRMRelationships.tsx` (Developer Registry tab card body)

Replace the single inline meta line (lines 737–753) with:

1. **Two-column labeled grid** with icons and label/value pairs:
   - `Building2` Company: <name>
   - `MapPin` Office: <emirate or "—">
   - `Phone` Phone: <click-to-call or "—">
   - `Mail` Email: <mailto or "—">
   - `LinkIcon` Website: <link> (full row, only when present)
   - Agency code: <code> (full row, only when present)

2. **Always-visible "Point of Contact" card** (amber-on-white per existing convention):
   - Header chip "Point of Contact" with `Users` icon
   - When data exists: name · role · click-to-call phone · mailto email
   - When empty: a subtle "+ Add point of contact" button that opens the edit dialog

```tsx
<div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-800">
  <div className="flex items-center gap-1.5">
    <Building2 className="w-3 h-3 text-gray-500 shrink-0" />
    <span className="text-gray-500">Company:</span>
    <span className="font-medium text-black truncate">{r.developer_name || "—"}</span>
  </div>
  <div className="flex items-center gap-1.5">
    <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
    <span className="text-gray-500">Office:</span>
    <span className="font-medium text-black truncate">{r.emirate || "—"}</span>
  </div>
  <div className="flex items-center gap-1.5">
    <Phone className="w-3 h-3 text-gray-500 shrink-0" />
    <span className="text-gray-500">Phone:</span>
    {r.phone
      ? <a href={`tel:${r.phone}`} className="font-medium text-black underline truncate" onClick={e => e.stopPropagation()}>{r.phone}</a>
      : <span className="font-medium text-black">—</span>}
  </div>
  <div className="flex items-center gap-1.5">
    <Mail className="w-3 h-3 text-gray-500 shrink-0" />
    <span className="text-gray-500">Email:</span>
    {r.developer_email
      ? <a href={`mailto:${r.developer_email}`} className="font-medium text-black underline truncate" onClick={e => e.stopPropagation()}>{r.developer_email}</a>
      : <span className="font-medium text-black">—</span>}
  </div>
  {r.website && (
    <div className="flex items-center gap-1.5 sm:col-span-2">
      <LinkIcon className="w-3 h-3 text-gray-500 shrink-0" />
      <span className="text-gray-500">Website:</span>
      <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-black underline truncate" onClick={e => e.stopPropagation()}>{r.website}</a>
    </div>
  )}
  {r.agency_code && (
    <div className="flex items-center gap-1.5 sm:col-span-2">
      <span className="text-gray-500">Agency code:</span>
      <span className="font-medium text-black">{r.agency_code}</span>
    </div>
  )}
</div>

<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-900 mb-0.5">
    <Users className="w-3 h-3" />Point of Contact
  </div>
  {(r.developer_contact?.name || r.developer_contact?.role || r.developer_contact?.phone || r.developer_contact?.email) ? (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-black">
      <span className="font-semibold">{r.developer_contact?.name || "—"}</span>
      {r.developer_contact?.role && <span className="text-gray-700">· {r.developer_contact.role}</span>}
      {r.developer_contact?.phone && (
        <a href={`tel:${r.developer_contact.phone}`} className="underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Phone className="w-3 h-3" />{r.developer_contact.phone}
        </a>
      )}
      {r.developer_contact?.email && (
        <a href={`mailto:${r.developer_contact.email}`} className="underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Mail className="w-3 h-3" />{r.developer_contact.email}
        </a>
      )}
    </div>
  ) : (
    <button onClick={() => openEdit(r)} className="text-[11px] text-amber-900/70 hover:text-amber-900 italic">
      + Add point of contact
    </button>
  )}
</div>
```

`Building2`, `Users`, `LinkIcon`, `Phone`, `Mail`, `MapPin` are already imported in this file — no new imports.

## What is preserved (no removal)

- Header row with developer name, status pill, "Confirmed" / "Email sent N days ago" badges, and outreach count.
- Notes inline editor.
- Action buttons (Send / AI / Remind / Edit).
- AI next-action banner.
- Selection checkbox and bulk actions.

## Why this is internal-only and safe

The Relationships page lives under owner-restricted routes; per the project's "Contact Gating Standard", developer/broker contact info is only displayed in the owner workspace. This change does not surface any contact details on public pages.

## Files touched

- `src/pages/CRMRelationships.tsx` — replace the meta row + conditional contact block with a labeled grid and a permanent Point-of-Contact panel inside `DeveloperRegistryTab`'s card.

## Verification

1. Open Relationships → Developer Registry.
2. Every card shows, without any interaction: Name, Company, Office, Phone, Email (and Website / Agency code when set).
3. Cards with a saved point of contact show name, role, click-to-call phone, mailto email — all visible at a glance.
4. Cards without a point of contact still show the panel with a small "+ Add point of contact" inline action that opens the existing edit dialog.
