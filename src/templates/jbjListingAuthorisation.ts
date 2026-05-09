/**
 * JBJ GLOBAL REAL ESTATE — Listing Authorisation Agreement (Selling)
 * Same letterhead style as the Leasing PAA, adjusted wording for sales.
 */

import { JBJ_BRAND, type PAAFieldKey, PAA_DEFAULT_VALUES } from "./jbjPropertyAdvertisingAgreement";

export type SellingFieldKey = PAAFieldKey;

export const SELLING_DEFAULT_VALUES = PAA_DEFAULT_VALUES;
export const JBJ_SELLING_TEMPLATE_KEY = "jbj-listing-authorisation-selling";

const fill = (label: string, key: SellingFieldKey) =>
  `<div style="margin:6px 0 14px;">
     <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;">${label}</div>
     <div style="border-bottom:1px solid #B89555;min-height:18px;padding:2px 0;font-size:13px;color:#1A1A1A;">{{${key}}}</div>
   </div>`;

const sectionTitle = (n: number, t: string) => `
  <div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#1A1A1A;">${n}. ${t.toUpperCase()}</div>
    <div style="flex:1;height:1px;background:#B89555;"></div>
  </div>`;

export function buildSellingHtml(values: Partial<Record<SellingFieldKey, string>> = {}): string {
  const v = { ...SELLING_DEFAULT_VALUES, ...values };
  const html = `
<div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;background:#FFFFFF;padding:48px 56px;max-width:794px;margin:0 auto;line-height:1.55;">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #B89555;padding-bottom:14px;margin-bottom:8px;">
    <div>
      <div style="font-size:22px;letter-spacing:.18em;font-weight:700;">JBJ GLOBAL REAL ESTATE</div>
      <div style="font-size:10px;letter-spacing:.18em;color:#1A1A1A;opacity:.65;margin-top:2px;">PRIVATE OFFICE · DUBAI</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#1A1A1A;opacity:.8;">
      <div>${JBJ_BRAND.phone}</div>
      <div>${JBJ_BRAND.email}</div>
      <div>${JBJ_BRAND.website}</div>
    </div>
  </div>
  <h1 style="font-size:22px;font-weight:800;letter-spacing:.02em;margin:18px 0 4px;">LISTING AUTHORISATION AGREEMENT</h1>
  <h2 style="font-size:14px;font-weight:600;margin:0 0 18px;opacity:.7;">For Property Sale</h2>
  <p style="font-size:12.5px;opacity:.85;margin:0 0 6px;">
    The undersigned owner authorises JBJ Global Real Estate to market the property described below for sale,
    on the terms set out in this agreement.
  </p>

  ${sectionTitle(1, "Owner Details")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px;">
    ${fill("Owner's Name", "landlord_name")}
    ${fill("Passport Number", "passport_number")}
    ${fill("Emirates ID Number", "emirates_id")}
    ${fill("Mobile Number", "mobile_number")}
    ${fill("Email Address", "email_address")}
    ${fill("Listing Consultant", "listing_consultant")}
    ${fill("Property Reference No.", "property_reference_no")}
    ${fill("Expiry Date", "expiry_date")}
  </div>

  ${sectionTitle(2, "Property Details")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px;">
    ${fill("Property Type", "property_type")}
    ${fill("Status", "status_vacant_tenanted")}
    ${fill("Building Name", "building_name")}
    ${fill("Unit Number", "unit_number")}
    ${fill("Community", "community")}
    ${fill("BUA (Sq.Ft)", "bua_sqft")}
    ${fill("Bedrooms", "bedrooms")}
    ${fill("Bathrooms", "bathrooms")}
    ${fill("Sales Amount (AED)", "sales_amount")}
    ${fill("Parking", "parking")}
  </div>

  ${sectionTitle(3, "Terms")}
  <ol style="font-size:12.5px;padding-left:18px;margin:8px 0 14px;">
    <li style="margin-bottom:6px;">Owner appoints JBJ Global Real Estate on a <strong>{{exclusivity}}</strong> basis to market the property for sale for <strong>{{listing_period}}</strong>.</li>
    <li style="margin-bottom:6px;">Owner confirms legal title or authority to sign on behalf of the registered owner(s).</li>
    <li style="margin-bottom:6px;">JBJ may market via portals, the JBJ website, social media, CRM outreach, partner brokerages and email.</li>
    <li style="margin-bottom:6px;">Owner shall promptly notify JBJ of any change in price, status, or competing offer.</li>
    <li style="margin-bottom:6px;">Either party may terminate this agreement upon seven (7) days' written notice.</li>
  </ol>

  ${sectionTitle(4, "Signatures")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 40px;">
    <div>
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;">Owner</div>
      <div style="height:64px;border-bottom:1px solid #B89555;margin:6px 0 4px;"></div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;">
        ${fill("Name", "landlord_signature_name")}
        ${fill("Date", "landlord_signature_date")}
      </div>
    </div>
    <div>
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;">JBJ Global Real Estate — Authorised Representative</div>
      <div style="height:64px;border-bottom:1px solid #B89555;margin:6px 0 4px;"></div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;">
        ${fill("Name", "jbj_signature_name")}
        ${fill("Date", "jbj_signature_date")}
      </div>
    </div>
  </div>

  <div style="margin-top:36px;padding-top:14px;border-top:1px solid #B89555;display:flex;justify-content:space-between;font-size:10.5px;opacity:.7;">
    <div>${JBJ_BRAND.legalCompany}${JBJ_BRAND.office ? ` · ${JBJ_BRAND.office}` : ""}</div>
    <div>${JBJ_BRAND.phone} · ${JBJ_BRAND.email} · ${JBJ_BRAND.website}</div>
  </div>
</div>`.trim();

  return html.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
    const val = (v as any)[k];
    return val ? String(val).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!)) : "";
  });
}
