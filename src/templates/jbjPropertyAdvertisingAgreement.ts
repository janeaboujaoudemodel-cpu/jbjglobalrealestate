/**
 * JBJ GLOBAL REAL ESTATE — Property Advertising Agreement for Real Estate Owners
 * Branded letterhead template. Pure white, black titles, champagne hairlines.
 * Tokens are replaced via simple `{{key}}` substitution in the renderer.
 */

export const JBJ_BRAND = {
  company: "JBJ GLOBAL REAL ESTATE",
  phone: "+971 5471 67107",
  email: "contact@jbj.ae",
  website: "jbj.ae",
  gold: "#B89555",
  ink: "#1A1A1A",
} as const;

export type PAAFieldKey =
  // Owner
  | "landlord_name" | "passport_number" | "emirates_id" | "mobile_number"
  | "email_address" | "listing_consultant" | "property_reference_no" | "expiry_date"
  // Property
  | "property_type" | "status_vacant_tenanted" | "furnishing" | "vacating_date"
  | "building_name" | "unit_number" | "street_name" | "community"
  | "bua_sqft" | "plot_sqft" | "bedrooms" | "bathrooms"
  | "rental_amount" | "sales_amount" | "parking" | "additional_notes"
  // Terms
  | "exclusivity" | "listing_period" | "listing_period_until_date"
  // Sign
  | "landlord_signature_name" | "landlord_signature_date"
  | "jbj_signature_name" | "jbj_signature_date";

export const PAA_DEFAULT_VALUES: Record<PAAFieldKey | "doc_number", string> = {
  doc_number: "",
  landlord_name: "", passport_number: "", emirates_id: "", mobile_number: "",
  email_address: "", listing_consultant: "", property_reference_no: "", expiry_date: "",
  property_type: "", status_vacant_tenanted: "", furnishing: "", vacating_date: "",
  building_name: "", unit_number: "", street_name: "", community: "",
  bua_sqft: "", plot_sqft: "", bedrooms: "", bathrooms: "",
  rental_amount: "", sales_amount: "", parking: "", additional_notes: "",
  exclusivity: "", listing_period: "", listing_period_until_date: "",
  landlord_signature_name: "", landlord_signature_date: "",
  jbj_signature_name: "", jbj_signature_date: "",
};

const fill = (label: string, key: PAAFieldKey) =>
  `<div style="margin:6px 0 14px;">
     <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;">${label}</div>
     <div style="border-bottom:1px solid #B89555;min-height:18px;padding:2px 0;font-size:13px;color:#1A1A1A;">{{${key}}}</div>
   </div>`;

const sectionTitle = (n: number, t: string) => `
  <div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#1A1A1A;">${n}. ${t.toUpperCase()}</div>
    <div style="flex:1;height:1px;background:#B89555;"></div>
  </div>`;

export const JBJ_PAA_TEMPLATE_ID = "jbj-property-advertising-agreement";

export function buildPAAHtml(values: Partial<Record<PAAFieldKey | "doc_number", string>> = {}): string {
  const v = { ...PAA_DEFAULT_VALUES, ...values };
  const get = (k: PAAFieldKey | "doc_number") => (v[k] ?? "").toString();

  const html = `
<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;background:#FFFFFF;padding:48px 56px;max-width:794px;margin:0 auto;line-height:1.55;">
  <!-- Letterhead -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #B89555;padding-bottom:14px;margin-bottom:8px;">
    <div>
      <div style="font-size:22px;letter-spacing:.18em;font-weight:700;">JBJ GLOBAL REAL ESTATE</div>
      <div style="font-size:10px;letter-spacing:.18em;color:#1A1A1A;opacity:.65;margin-top:2px;">PRIVATE OFFICE · DUBAI</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#1A1A1A;opacity:.8;">
      <div style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.55;margin-bottom:4px;">DOC&nbsp;NO.&nbsp;<strong style="color:#1A1A1A;opacity:1;">{{doc_number}}</strong></div>
      <div>${JBJ_BRAND.phone}</div>
      <div>${JBJ_BRAND.email}</div>
      <div>${JBJ_BRAND.website}</div>
    </div>
  </div>
  <div style="height:2px;background:transparent;border-top:1px solid #B89555;opacity:.4;margin-bottom:28px;"></div>

  <!-- Title -->
  <h1 style="font-size:22px;font-weight:800;letter-spacing:.02em;margin:0 0 4px;color:#1A1A1A;">
    PROPERTY ADVERTISING AGREEMENT
  </h1>
  <h2 style="font-size:14px;font-weight:600;letter-spacing:.04em;margin:0 0 18px;color:#1A1A1A;opacity:.7;">
    For Real Estate Owners
  </h2>

  <p style="font-size:12.5px;color:#1A1A1A;opacity:.85;margin:0 0 6px;">
    As a property owner or landlord, you are partnering with JBJ Global Real Estate — a private office offering maximum exposure
    and trusted representation to sell or lease your property at the best possible terms in the shortest time.
  </p>
  <p style="font-size:12.5px;color:#1A1A1A;opacity:.85;margin:0 0 6px;">
    By signing this document and providing the details below, your property will be advertised across JBJ's premium channels —
    portals, website, social media, partner brokerages, CRM, WhatsApp and email — and will receive enhanced positioning where applicable.
  </p>

  ${sectionTitle(1, "Landlord / Owner Details")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px;">
    ${fill("Landlord's Name", "landlord_name")}
    ${fill("Passport Number", "passport_number")}
    ${fill("Emirates ID Number", "emirates_id")}
    ${fill("Mobile Number", "mobile_number")}
    ${fill("Email Address", "email_address")}
    ${fill("Listing Consultant", "listing_consultant")}
    ${fill("Property Reference No.", "property_reference_no")}
    ${fill("Expiry Date", "expiry_date")}
  </div>

  ${sectionTitle(2, "Property Details")}
  <div style="margin:6px 0 14px;font-size:12.5px;">
    <span style="opacity:.7;text-transform:uppercase;letter-spacing:.08em;font-size:10px;">Property Type:</span>
    <span style="margin-left:8px;">{{property_type}}</span>
    &nbsp;·&nbsp;
    <span style="opacity:.7;text-transform:uppercase;letter-spacing:.08em;font-size:10px;">Status:</span>
    <span style="margin-left:8px;">{{status_vacant_tenanted}}</span>
    &nbsp;·&nbsp;
    <span style="opacity:.7;text-transform:uppercase;letter-spacing:.08em;font-size:10px;">Furnishing:</span>
    <span style="margin-left:8px;">{{furnishing}}</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px;">
    ${fill("Vacating Date", "vacating_date")}
    ${fill("Parking", "parking")}
    ${fill("Building Name", "building_name")}
    ${fill("Unit Number", "unit_number")}
    ${fill("Street Name", "street_name")}
    ${fill("Community", "community")}
    ${fill("BUA (Sq.Ft)", "bua_sqft")}
    ${fill("Plot (Sq.Ft)", "plot_sqft")}
    ${fill("Bedrooms", "bedrooms")}
    ${fill("Bathrooms", "bathrooms")}
    ${fill("Rental Amount (AED)", "rental_amount")}
    ${fill("Sales Amount (AED)", "sales_amount")}
  </div>
  <div style="margin:6px 0 14px;">
    <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;">Additional Notes</div>
    <div style="border:1px solid #B89555;border-radius:4px;min-height:54px;padding:8px 10px;font-size:12.5px;color:#1A1A1A;white-space:pre-wrap;">{{additional_notes}}</div>
  </div>

  ${sectionTitle(3, "Terms & Conditions")}
  <ol style="font-size:12.5px;color:#1A1A1A;padding-left:18px;margin:8px 0 14px;">
    <li style="margin-bottom:6px;">
      The landlord / legal representative hereby appoints <strong>JBJ Global Real Estate</strong> on an
      <strong>{{exclusivity}}</strong> basis to list and advertise the above property for a period of
      <strong>{{listing_period}}</strong>${get("listing_period_until_date") ? `, until <strong>{{listing_period_until_date}}</strong>` : ""}.
    </li>
    <li style="margin-bottom:6px;">
      The undersigned confirms that they are the owner of the above property and / or have the legal authority to sign on behalf of the named owner(s).
    </li>
    <li style="margin-bottom:6px;">
      The brokerage is authorised to advertise this property through portals, the JBJ website, social media,
      CRM outreach, WhatsApp, email campaigns and partner brokerage channels.
    </li>
    <li style="margin-bottom:6px;">
      The owner agrees that all information provided herein is accurate to the best of their knowledge,
      and shall promptly notify JBJ of any change in availability, price or status.
    </li>
    <li style="margin-bottom:6px;">
      Should the property be subject to an offer at any point, the owner shall notify the brokerage immediately.
    </li>
    <li style="margin-bottom:6px;">
      This Agreement may be terminated by either party at any time upon seven (7) days' written notice to the other party.
    </li>
  </ol>

  ${sectionTitle(4, "Signatures")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:6px;">
    <div>
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;">Landlord / Owner</div>
      <div style="height:64px;border-bottom:1px solid #B89555;margin:6px 0 4px;position:relative;">
        <!-- {{client_signature_image}} -->
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;">
        ${fill("Name", "landlord_signature_name")}
        ${fill("Date", "landlord_signature_date")}
      </div>
    </div>
    <div>
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;">JBJ Global Real Estate — Authorised Representative</div>
      <div style="height:64px;border-bottom:1px solid #B89555;margin:6px 0 4px;position:relative;">
        <!-- {{owner_signature_image}} -->
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;">
        ${fill("Name", "jbj_signature_name")}
        ${fill("Date", "jbj_signature_date")}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:36px;padding-top:14px;border-top:1px solid #B89555;display:flex;justify-content:space-between;font-size:10.5px;color:#1A1A1A;opacity:.7;">
    <div>JBJ GLOBAL REAL ESTATE · Private Office · Dubai, UAE</div>
    <div>${JBJ_BRAND.phone} · ${JBJ_BRAND.email} · ${JBJ_BRAND.website}</div>
  </div>
</div>
`.trim();

  // simple {{key}} replace
  return html.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
    const val = (v as any)[k];
    return val ? String(val).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!)) : "";
  });
}

export const PAA_FIELD_GROUPS: { title: string; fields: { key: PAAFieldKey; label: string; type?: "text" | "date" | "textarea" | "select" | "number"; options?: string[] }[] }[] = [
  {
    title: "Landlord / Owner Details",
    fields: [
      { key: "landlord_name", label: "Landlord's Name" },
      { key: "passport_number", label: "Passport Number" },
      { key: "emirates_id", label: "Emirates ID Number" },
      { key: "mobile_number", label: "Mobile Number" },
      { key: "email_address", label: "Email Address" },
      { key: "listing_consultant", label: "Listing Consultant" },
      { key: "property_reference_no", label: "Property Reference No." },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
    ],
  },
  {
    title: "Property Details",
    fields: [
      { key: "property_type", label: "Property Type", type: "select", options: ["Villa", "Apartment", "Office", "Warehouse", "Other"] },
      { key: "status_vacant_tenanted", label: "Status", type: "select", options: ["Vacant", "Tenanted"] },
      { key: "furnishing", label: "Furnishing", type: "select", options: ["Furnished", "Unfurnished", "Semi-furnished"] },
      { key: "vacating_date", label: "Vacating Date", type: "date" },
      { key: "building_name", label: "Building Name" },
      { key: "unit_number", label: "Unit Number" },
      { key: "street_name", label: "Street Name" },
      { key: "community", label: "Community" },
      { key: "bua_sqft", label: "BUA (Sq.Ft)", type: "number" },
      { key: "plot_sqft", label: "Plot (Sq.Ft)", type: "number" },
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "rental_amount", label: "Rental Amount (AED)", type: "number" },
      { key: "sales_amount", label: "Sales Amount (AED)", type: "number" },
      { key: "parking", label: "Parking" },
      { key: "additional_notes", label: "Additional Notes", type: "textarea" },
    ],
  },
  {
    title: "Terms & Conditions",
    fields: [
      { key: "exclusivity", label: "Exclusivity", type: "select", options: ["Exclusive", "Non-Exclusive"] },
      { key: "listing_period", label: "Listing Period", type: "select", options: ["1 Month", "2 Months", "3 Months", "6 Months", "Until Date"] },
      { key: "listing_period_until_date", label: "Until Date (if applicable)", type: "date" },
    ],
  },
  {
    title: "Signatures",
    fields: [
      { key: "landlord_signature_name", label: "Landlord — Printed Name" },
      { key: "landlord_signature_date", label: "Landlord — Date", type: "date" },
      { key: "jbj_signature_name", label: "JBJ Representative — Printed Name" },
      { key: "jbj_signature_date", label: "JBJ Representative — Date", type: "date" },
    ],
  },
];
