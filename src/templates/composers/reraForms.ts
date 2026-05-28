/**
 * RERA Secondary-Market Forms — legally faithful composers
 * --------------------------------------------------------
 * Reference standards:
 *   • Dubai Law No. 85 of 2006 (Bylaw regulating the Real Estate Brokers Register)
 *   • Dubai Law No. 7 of 2006 (Real Estate Registration Law)
 *   • Dubai Law No. 26 of 2007 & No. 33 of 2008 (Landlord–Tenant)
 *   • Executive Council Resolution No. 6 of 2010
 *   • UAE Federal Law No. 5 of 1985 (Civil Transactions Code)
 *
 * Each composer renders the official RERA clauses inline. AI narrative is
 * limited to a short cover paragraph; legal text is NEVER AI-generated.
 *
 * Forms covered: A, B, F, I, U.
 * (No Form R exists in RERA — broker-to-broker referrals are handled by a
 * separate non-RERA internal letter.)
 */

import type { ComposerInput } from "./index";
import { signatureBlock, dateLine, subjectLine, paragraphs } from "./index";
import { JBJ_BRAND, jbjCompanyStampSrc } from "@/templates/jbjLockedChrome";

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const MUTED = "rgba(26,26,26,0.65)";

/** Wrap content as an explicit A4 page group the renderer can split on. */
const page = (n: number, content: string) =>
  `<section data-pdf-page="${n}" style="display:block;">${content}</section>`;

const esc = (s?: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const fmtDate = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

const field = (label: string, value?: string) => `
  <div style="margin:0 0 10px;">
    <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600;">${esc(label)}</div>
    <div style="border-bottom:1px solid ${GOLD};min-height:18px;padding:2px 0;font-size:12px;color:${INK};">${esc(value || "")}</div>
  </div>`;

const section = (n: number, t: string) => `
  <div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:.10em;color:${INK};">${n}. ${t.toUpperCase()}</div>
    <div style="flex:1;height:1px;background:${GOLD};"></div>
  </div>`;

const headerBlock = (formCode: string, formTitle: string, subtitle: string) => `
  <div style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:14px 18px;margin:6px 0 14px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <div>
        <div style="font-size:10px;letter-spacing:.20em;text-transform:uppercase;color:${MUTED};font-weight:600;">RERA · Dubai Land Department</div>
        <div style="font-size:16px;font-weight:700;color:${INK};margin-top:2px;">${esc(formCode)} — ${esc(formTitle)}</div>
        <div style="font-size:11px;color:${MUTED};margin-top:2px;">${esc(subtitle)}</div>
      </div>
      <div style="font-size:10px;color:${MUTED};">Governed by Bylaw No. 85 of 2006</div>
    </div>
  </div>`;

const clauseList = (clauses: string[]) => `
  <ol style="font-size:11.5px;line-height:1.55;color:${INK};padding-left:18px;margin:6px 0 10px;">
    ${clauses.map((c) => `<li style="margin:0 0 6px;">${c}</li>`).join("")}
  </ol>`;

const brokerBlock = (f: Record<string, string>) => `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
    ${field("Brokerage Company", f.brokerCompany || "JBJ Global Real Estate L.L.C S.O.C")}
    ${field("Office Registration No. (ORN)", f.orn || "")}
    ${field("Registered Broker Name", f.brokerName || "")}
    ${field("Broker Registration No. (BRN)", f.brn || "")}
    ${field("Broker Mobile", f.brokerPhone || "")}
    ${field("Broker Email", f.brokerEmail || "")}
  </div>`;

/* ───────────── FORM A — Contract Between Seller & Broker ───────────── */

export function composeFormA(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    "The Seller hereby appoints the Broker to market the property described above on the terms set out herein, in accordance with Dubai Law No. 85 of 2006 regulating the Real Estate Brokers Register.",
    "The Seller warrants that he/she is the lawful owner of the property or has the legal authority to sign on behalf of the registered owner(s), and that the title is free of any encumbrances except those disclosed.",
    "The Seller authorises the Broker to advertise the property on real-estate portals, the Broker's website, social media, and to share property details with other RERA-registered brokers as required.",
    "The Seller shall promptly notify the Broker in writing of any change in price, availability, or any direct enquiry received regarding the property.",
    "The Seller agrees to pay the Broker a commission of <strong>" + esc(f.commissionRate || "2") + "%</strong> of the final sale price (plus VAT) upon successful conclusion of the sale, payable on the transfer date at the Dubai Land Department.",
    "This authorisation is granted on a <strong>" + esc(f.exclusivity || "non-exclusive") + "</strong> basis for a period of <strong>" + esc(f.term || "90 days") + "</strong> commencing on " + esc(fmtDate(f.startDate) || "the date of signature") + ", renewable by mutual consent. Either party may terminate on seven (7) days' written notice.",
    "Any dispute arising out of or in connection with this agreement shall be governed by the laws of the Emirate of Dubai and the United Arab Emirates, and shall be referred to the Rental Disputes Settlement Centre or the competent Dubai Courts.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    headerBlock("Form A", "Contract Between Real Estate Brokers and Owner", "Property Listing Authorisation — Secondary Market Sale"),
    section(1, "Property Details"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Property Address", f.propertyRef)}
      ${field("DLD Title Deed / Oqood No.", f.titleDeedNo)}
      ${field("Property Type", f.propertyType)}
      ${field("BUA (sq.ft)", f.buaSqft)}
      ${field("Listing Price (AED)", f.listingPrice)}
      ${field("Status (Vacant / Tenanted)", f.status)}
    </div>`,
    section(2, "Seller Details"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Seller Full Name", f.recipientName)}
      ${field("Nationality", f.sellerNationality)}
      ${field("Emirates ID / Passport No.", f.sellerIdNumber)}
      ${field("Mobile", f.sellerPhone)}
      ${field("Email", f.sellerEmail)}
      ${field("Address", f.sellerAddress)}
    </div>`,
    section(3, "Broker Details"),
    brokerBlock(f),
  ].join("");

  const pageTwo = [
    section(4, "Terms & Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.brokerName || input.ownerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Seller / Owner Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
}

/* ───────────── FORM B — Contract Between Buyer & Broker ───────────── */

export function composeFormB(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    "The Buyer hereby appoints the Broker to act on the Buyer's behalf in searching for and negotiating the purchase of a property matching the criteria set out herein, pursuant to Dubai Law No. 85 of 2006.",
    "The Broker shall use reasonable endeavours to identify suitable properties, arrange viewings, and negotiate terms in the Buyer's best interest.",
    "The Buyer agrees not to negotiate directly with, or purchase through, any other broker or seller in respect of properties introduced by the Broker during the term of this agreement and for a period of six (6) months thereafter.",
    "The Buyer shall pay the Broker a commission of <strong>" + esc(f.commissionRate || "2") + "%</strong> of the agreed purchase price (plus VAT) on the date of transfer at the Dubai Land Department.",
    "This agreement is entered into on a <strong>" + esc(f.exclusivity || "non-exclusive") + "</strong> basis for a period of <strong>" + esc(f.term || "90 days") + "</strong> commencing on " + esc(fmtDate(f.startDate) || "the date of signature") + ".",
    "Either party may terminate this agreement on seven (7) days' written notice. Termination shall not affect the Broker's right to commission on transactions already in progress at the date of termination.",
    "This agreement is governed by the laws of the Emirate of Dubai and the United Arab Emirates. Disputes shall be referred to the competent Dubai Courts.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    headerBlock("Form B", "Contract Between Real Estate Brokers and Buyer", "Buyer Representation Agreement — Secondary Market"),
    section(1, "Buyer Details"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Buyer Full Name", f.recipientName)}
      ${field("Nationality", f.buyerNationality)}
      ${field("Emirates ID / Passport No.", f.buyerIdNumber)}
      ${field("Mobile", f.buyerPhone)}
      ${field("Email", f.buyerEmail)}
      ${field("Address", f.buyerAddress)}
    </div>`,
    section(2, "Search Criteria"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Preferred Area(s)", f.searchCriteria)}
      ${field("Property Type", f.propertyType)}
      ${field("Bedrooms", f.bedrooms)}
      ${field("Budget (AED)", f.budget)}
      ${field("Financing", f.financing)}
      ${field("Intended Use", f.intendedUse)}
    </div>`,
    section(3, "Broker Details"),
    brokerBlock(f),
  ].join("");

  const pageTwo = [
    section(4, "Terms & Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.brokerName || input.ownerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Buyer Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
}

/* ───────────── FORM F — Memorandum of Understanding (Buyer ↔ Seller) ───────────── */

export function composeFormF(input: ComposerInput): string {
  const f = input.fields;
  const price = f.price || "";
  const deposit = f.deposit || "10% of the Sale Price";

  const clauses = [
    "The Seller agrees to sell and the Buyer agrees to purchase the Property described above for a total sale price of <strong>AED " + esc(price) + "</strong> (the &quot;Sale Price&quot;) on the terms set out herein.",
    "Upon signature of this MoU, the Buyer shall pay to the Seller (or hold via a manager's cheque in favour of the Seller, lodged with the Broker) a deposit of <strong>" + esc(deposit) + "</strong> by way of security for completion (the &quot;Deposit&quot;).",
    "Completion shall take place on <strong>" + esc(fmtDate(f.completionDate) || "the agreed Transfer Date") + "</strong> at the Dubai Land Department (or a registered Trustee Office), at which time the balance of the Sale Price shall be paid by manager's cheque against transfer of title to the Buyer.",
    "If the Buyer fails to complete the purchase on the Transfer Date for reasons not attributable to the Seller, the Deposit shall be forfeited to the Seller as agreed liquidated damages.",
    "If the Seller fails to complete the sale on the Transfer Date for reasons not attributable to the Buyer, the Seller shall refund the Deposit and pay to the Buyer an additional sum equal to the Deposit as agreed liquidated damages.",
    "Each party shall pay their respective brokerage commission of <strong>" + esc(f.commissionRate || "2") + "%</strong> of the Sale Price (plus VAT) to the Broker(s) on the Transfer Date.",
    "Dubai Land Department transfer fees (4%), Trustee Office fees, NOC fees, and any developer service-charge clearance costs shall be borne by the party customarily responsible under DLD practice, unless otherwise agreed in writing herein.",
    "The Property is sold on an &quot;as-is, where-is&quot; basis, with vacant possession on transfer unless stated otherwise. The Seller warrants clear title and that all service charges are settled up to the Transfer Date.",
    "This MoU is governed by the laws of the Emirate of Dubai and the United Arab Emirates, including UAE Federal Law No. 5 of 1985 (Civil Transactions) and Dubai Law No. 7 of 2006 (Real Estate Registration). Any dispute shall be referred to the competent Dubai Courts.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    headerBlock("Form F", "Memorandum of Understanding (Contract F)", "Sale Contract Between Buyer & Seller — Secondary Market"),
    section(1, "Parties"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      <div>
        <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600;margin-bottom:4px;">SELLER (Party &quot;A&quot;)</div>
        ${field("Full Name", f.sellerName)}
        ${field("Nationality", f.sellerNationality)}
        ${field("Emirates ID / Passport", f.sellerIdNumber)}
        ${field("Mobile / Email", [f.sellerPhone, f.sellerEmail].filter(Boolean).join(" · "))}
      </div>
      <div>
        <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600;margin-bottom:4px;">BUYER (Party &quot;B&quot;)</div>
        ${field("Full Name", f.recipientName)}
        ${field("Nationality", f.buyerNationality)}
        ${field("Emirates ID / Passport", f.buyerIdNumber)}
        ${field("Mobile / Email", [f.buyerPhone, f.buyerEmail].filter(Boolean).join(" · "))}
      </div>
    </div>`,
    section(2, "Broker (Party “C”)"),
    brokerBlock(f),
    section(3, "Property"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Property Address", f.propertyRef)}
      ${field("DLD Title Deed No.", f.titleDeedNo)}
      ${field("Property Type", f.propertyType)}
      ${field("BUA (sq.ft)", f.buaSqft)}
      ${field("Sale Price (AED)", price)}
      ${field("Deposit (AED)", f.deposit)}
      ${field("Transfer / Completion Date", fmtDate(f.completionDate))}
      ${field("Mortgage (Yes / No)", f.mortgage)}
    </div>`,
  ].join("");

  const pageTwo = [
    section(4, "Terms & Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.sellerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Buyer — Party “B”",
      extraSignatories: [
        ...(input.extraSignatories || []),
        { name: f.brokerName, title: "Broker — Party “C” (JBJ Global Real Estate)", label: "Broker" },
      ],
    }),
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
}

/* ───────────── FORM I — Agent-to-Agent Agreement (RERA 4-part) ─────────────
 * Faithful rebuild of the official Dubai RERA "Form I" issued under Bylaw
 * No. 85 of 2006. Four parts: Parties (Agent A / Agent B side-by-side) ·
 * Property · Commission Split · Signatures.
 *
 * `fields.jbjSide` controls auto-prefill:
 *   "A" → JBJ block + stamp in Agent A cell, Agent B left blank
 *   "B" → JBJ block + stamp in Agent B cell, Agent A left blank
 *   ""  → both sides blank for manual fill
 */
export function composeFormI(input: ComposerInput): string {
  const f = input.fields;
  const jbjSide = (f.jbjSide === "B" ? "B" : f.jbjSide === "none" ? "" : "A") as "A" | "B" | "";
  const [day, month, year] = (() => {
    const raw = f.startDate || input.ownerDate || new Date().toISOString().slice(0, 10);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      const parts = raw.split(/[\/\-.\s]+/).filter(Boolean);
      return [parts[0] || "__", parts[1] || "__", parts[2] || "____"];
    }
    return [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), String(d.getFullYear())];
  })();

  const val = (...keys: string[]) => keys.map((k) => f[k]).find((v) => (v || "").trim()) || "";
  const yesNo = (value?: string, labels = ["YES", "NO", "N/A"]) => {
    const normalized = (value || "").toLowerCase();
    return labels.map((l) => `${l} [ ${normalized === l.toLowerCase() ? "✓" : ""} ]`).join(" &nbsp;&nbsp;&nbsp; ");
  };
  const line = (value?: string, min = 60, center = false) => `
    <span style="display:inline-block;min-width:${min}px;border-bottom:1px solid ${INK};padding:0 3px 1px;line-height:1.02;text-align:${center ? "center" : "left"};vertical-align:baseline;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(value || "") || "&nbsp;"}</span>`;
  const row = (label: string, value?: string, _min = 0, center = false) => `
    <div style="display:flex;align-items:flex-end;gap:3px;margin:0 0 2px;min-height:12px;font-size:8.8px;">
      <strong style="white-space:nowrap;font-size:8.8px;">${label}</strong>
      <span style="flex:1;min-width:0;border-bottom:1px solid ${INK};padding:0 3px 1px;line-height:1.02;text-align:${center ? "center" : "left"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(value || "") || "&nbsp;"}</span>
    </div>`;

  const partyDefaults = (label: "A" | "B") => {
    const isJbj = jbjSide === label;
    const p = label === "A" ? "partyA" : "partyB";
    const legacy = label === "A"
      ? {
          establishment: val("partyAEstablishment", "brokerCompany"),
          address: val("partyAAddress"),
          phone: val("partyAPhone", "brokerPhone"),
          fax: val("partyAFax"),
          email: val("partyAEmail", "brokerEmail"),
          orn: val("partyAOrn", "orn"),
          ded: val("partyADedLicence"),
          poBox: val("partyAPoBox"),
          agentName: val("partyAAgentName", "brokerName"),
          brn: val("partyABrn", "brn"),
          issued: val("partyADateIssued"),
          mobile: val("partyAMobile", "brokerPhone"),
          agentEmail: val("partyAAgentEmail", "brokerEmail"),
          formStr: val("partyAFormStr"),
        }
      : {
          establishment: val("partyBEstablishment", "recipientName"),
          address: val("partyBAddress"),
          phone: val("partyBPhone", "counterpartyPhone"),
          fax: val("partyBFax"),
          email: val("partyBEmail", "counterpartyEmail"),
          orn: val("partyBOrn", "counterpartyOrn"),
          ded: val("partyBDedLicence"),
          poBox: val("partyBPoBox"),
          agentName: val("partyBAgentName", "counterpartyAgent"),
          brn: val("partyBBrn", "counterpartyBrn"),
          issued: val("partyBDateIssued"),
          mobile: val("partyBMobile", "counterpartyPhone"),
          agentEmail: val("partyBAgentEmail", "counterpartyEmail"),
          formStr: val("partyBFormStr"),
        };
    return isJbj
      ? {
          establishment: `${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}`,
          address: JBJ_BRAND.address,
          phone: JBJ_BRAND.phone,
          fax: "",
          email: JBJ_BRAND.email.toLowerCase(),
          orn: val(`${p}Orn`, "orn") || "41486",
          ded: JBJ_BRAND.tradeLicense,
          poBox: val(`${p}PoBox`),
          agentName: val(`${p}AgentName`, "brokerName") || "Jane Bou Jaoude",
          brn: val(`${p}Brn`, "brn") || "44750",
          issued: val(`${p}DateIssued`) || "24 / 05 / 2024",
          mobile: val(`${p}Mobile`, "brokerPhone") || JBJ_BRAND.phone,
          agentEmail: val(`${p}AgentEmail`, "brokerEmail") || JBJ_BRAND.email.toLowerCase(),
          formStr: val(`${p}FormStr`),
        }
      : legacy;
  };

  const partyBlock = (label: "A" | "B", role: string) => {
    const p = partyDefaults(label);
    return `
      <td style="width:50%;border:1px solid ${GOLD};vertical-align:top;padding:0;">
        <div style="font-size:10.5px;line-height:1.35;color:${INK};">
          <div style="display:grid;grid-template-columns:36px 1fr;align-items:center;border-bottom:1px solid ${GOLD};background:${CHAMPAGNE};min-height:19px;">
            <div style="font-size:13px;font-weight:800;text-align:center;">${label})</div>
            <div style="font-size:11px;font-weight:800;letter-spacing:.02em;">THE AGENT/ BROKER <span style="font-weight:500;">(${role})</span></div>
          </div>
          <div style="padding:7px 8px 8px;">
            ${row("NAME OF ESTABLISHMENT:", p.establishment, 200, true)}
            ${row("ADDRESS:", p.address, 235, true)}
            <div style="height:5px;"></div>
            <div style="font-weight:800;font-size:11px;margin:0 0 4px;letter-spacing:.02em;">OFFICIAL CONTACT DETAILS</div>
            <div style="display:flex;align-items:flex-end;gap:4px;margin:0 0 4px;font-size:10px;">
              <strong>Phone:</strong>${line(p.phone, 92, true)}<strong>FAX:</strong><span style="flex:1;min-width:0;border-bottom:1px solid ${INK};padding:0 3px 1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.fax) || "&nbsp;"}</span>
            </div>
            ${row("EMAIL:", p.email, 280, false)}
            <div style="display:flex;align-items:flex-end;gap:4px;margin:0 0 4px;font-size:10px;">
              <strong>ORN:</strong>${line(p.orn, 84, true)}<strong>DED LISC:</strong><span style="flex:1;min-width:0;border-bottom:1px solid ${INK};padding:0 3px 1px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.ded) || "&nbsp;"}</span>
            </div>
            ${row("P.O. BOX:", p.poBox, 260, true)}
            <div style="font-weight:800;font-size:11px;margin:6px 0 4px;letter-spacing:.02em;">THE REGISTERED AGENT “${label}”</div>
            ${row("NAME:", p.agentName, 310, false)}
            <div style="display:flex;align-items:flex-end;gap:4px;margin:0 0 4px;font-size:10px;">
              <strong>BRN:</strong>${line(p.brn, 84, true)}<strong>DATE ISSUED:</strong><span style="flex:1;min-width:0;border-bottom:1px solid ${INK};padding:0 3px 1px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.issued) || "&nbsp;"}</span>
            </div>
            ${row("MOBILE:", p.mobile, 282, false)}
            ${row("EMAIL:", p.agentEmail, 292, false)}
            <div style="height:4px;"></div>
            ${row(`${label === "A" ? "SELLERS/LANDLORDS FORM A" : "BUYERS/TENANTS FORM B"} STR#`, p.formStr, 178, false)}
          </div>
        </div>
      </td>`;
  };

  const declarationA = `I hereby declare, I have read and understood the Real Estate Brokers Code of Ethics, I have a current signed Seller's/Landlord's Agreement FORM A, I shall respond to a reasonable offer to purchase/lease the listed property from Agent B, and shall not contact Agent B's Buyer/Tenant nor confer with their client under no circumstances unless the nominated Buyer/Tenant herein has already discussed the stated listed property with our Office.`;
  const declarationB = `I hereby declare, I have read and understood the Real Estate Brokers Code of Ethics, I have a current signed Buyer's/Tenant's Agreement FORM B, I shall encourage my Buyer/Tenant as named herein, to submit a reasonable offer for the stated property and not contact Agent A's Seller/Landlord nor confer with their client under no circumstances unless the Agent A has delayed our proposal on the prescribed FORM with a reasonable reply within 24 hours`;

  const isJbjSignature = (label: "A" | "B") => jbjSide === label;
  const signatureCell = (label: "A" | "B") => `
    <td style="width:50%;height:170px;border:1px solid ${GOLD};vertical-align:top;position:relative;padding:9px 12px;overflow:hidden;">
      <div style="font-size:9.5px;font-weight:800;line-height:1.05;">SIGNATURE &amp; COMPANY STAMP OF AGENT "${label}":</div>
      ${isJbjSignature(label) ? `<img src="${jbjCompanyStampSrc}" alt="JBJ Company Stamp" style="position:absolute;right:18px;bottom:14px;width:96px;height:96px;object-fit:contain;opacity:.9;mix-blend-mode:multiply;transform:rotate(-8deg);" />` : ""}
    </td>`;

  const companyFooter = `
    <div style="text-align:center;color:${INK};font-size:8.6px;line-height:1.2;margin-top:8px;padding-top:7px;padding-bottom:18px;border-top:1px solid ${GOLD}55;">
      <div style="font-weight:800;letter-spacing:.04em;margin-bottom:2px;">${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}</div>
      <div>Tel Number : ${JBJ_BRAND.phone}</div>
      <div>${JBJ_BRAND.address}</div>
      <div>${JBJ_BRAND.website} | ${JBJ_BRAND.email.toLowerCase()} | ORN : 41486</div>
    </div>`;

  const html = `
    <div data-form-i-page="1" data-signature-block="1" style="font-family:Inter,Arial,sans-serif;color:${INK};font-size:9px;line-height:1.08;width:100%;height:100%;display:flex;flex-direction:column;">
      <div style="position:relative;min-height:80px;margin-bottom:4px;">
        <div style="position:absolute;right:0;top:0;width:162px;font-size:9.5px;line-height:1.22;">
          <div style="text-align:right;font-weight:800;font-size:11.5px;margin-bottom:1px;">FORM I</div>
          <div style="display:grid;grid-template-columns:42px 1fr;gap:6px;align-items:end;"><span>Brn:</span>${line(val("brn", "partyABrn") || "44750", 70, true)}</div>
          <div style="display:grid;grid-template-columns:42px 1fr;gap:6px;align-items:end;"><span>Str#:</span>${line(val("strNumber"), 70, true)}</div>
          <div style="height:9px;"></div>
          <div style="display:flex;align-items:flex-end;gap:4px;font-weight:800;"><span>DATE:</span>${line(day, 22, true)}<span>/</span>${line(month, 22, true)}<span>/</span>${line(year, 38, true)}</div>
        </div>
        <div style="margin-right:180px;text-align:center;padding-top:16px;">
          <div style="font-size:17px;font-weight:900;letter-spacing:.02em;">AGENT to AGENT AGREEMENT</div>
          <div style="font-style:italic;font-size:9px;margin-top:7px;">As per the Real estate Brokers By-Law No. (85) of 2006</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid ${GOLD};flex:1 1 auto;">
        <colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>
        <tbody>
          <tr style="background:${CHAMPAGNE};height:18px;">
            <td colspan="2" style="border:1px solid ${GOLD};font-size:10.5px;font-weight:900;padding:2px 6px;">
              <span style="display:inline-block;width:86px;">PART 1.</span><span style="display:inline-block;width:calc(100% - 172px);text-align:center;">THE PARTIES</span>
            </td>
          </tr>
          <tr>${partyBlock("A", "SELLER / LANDLORD")}${partyBlock("B", "BUYER /TENANT")}</tr>
          <tr>
            <td style="border:1px solid ${GOLD};background:${CHAMPAGNE};font-size:10px;font-weight:900;text-align:center;padding:2px 6px;">DECLARATION BY AGENT “A”</td>
            <td style="border:1px solid ${GOLD};background:${CHAMPAGNE};font-size:10px;font-weight:900;text-align:center;padding:2px 6px;">DECLARATION BY AGENT “B”</td>
          </tr>
          <tr>
            <td style="border:1px solid ${GOLD};height:84px;vertical-align:top;text-align:center;padding:6px 10px;font-style:italic;font-size:8.4px;line-height:1.18;">${declarationA}</td>
            <td style="border:1px solid ${GOLD};height:84px;vertical-align:top;text-align:center;padding:6px 10px;font-style:italic;font-size:8.4px;line-height:1.18;">${declarationB}</td>
          </tr>
          <tr style="background:${CHAMPAGNE};height:18px;">
            <td style="border:1px solid ${GOLD};font-size:10.5px;font-weight:900;padding:2px 6px;">PART2. <span style="float:right;margin-right:118px;">THE PROPERTY</span></td>
            <td style="border:1px solid ${GOLD};font-size:10.5px;font-weight:900;padding:2px 6px;">PART3. <span style="float:right;margin-right:86px;">THE COMMISSION (split)</span></td>
          </tr>
          <tr>
            <td style="border:1px solid ${GOLD};height:340px;vertical-align:top;padding:12px 14px;font-size:11px;line-height:1.6;">
              ${row("PROPERTY ADDRESS:", val("propertyRef"), 240, true)}
              ${row("MASTER DEVELOPER:", val("masterDeveloper"), 250, false)}
              ${row("MASTER PROJECT NAME:", val("masterProject"), 220, false)}
              <div style="height:10px;"></div>
              <div style="font-weight:400;margin-bottom:9px;"><strong>PROPERTY DETAILS</strong> (to be completed by Agent "A")</div>
              ${row("BUILDING NAME:", val("buildingName"), 236, true)}
              ${row("LISTED PRICE:", val("listingPrice") ? `AED ${val("listingPrice")}` : "", 260, true)}
              ${row("DESCRIPTION:", val("propertyDescription"), 270, false)}
              <div style="height:12px;"></div>
              <div style="margin-bottom:6px;">DOES MOU EXIST ON THIS PROPERTY?</div>
              <div style="text-align:center;margin-bottom:14px;">${yesNo(val("mouExists"))}</div>
              <div style="margin-bottom:6px;">IS THE PROPERTY TENANTED</div>
              <div style="text-align:center;margin-bottom:18px;">${yesNo(val("propertyTenanted"), ["YES", "NO"])}</div>
              <div style="display:flex;align-items:flex-end;gap:4px;"><strong style="font-weight:500;">MAINTENANCE FEE P.A:</strong>${line(val("maintenanceFee"), 110, false)}<strong>per sq. ft</strong></div>
            </td>
            <td style="border:1px solid ${GOLD};height:340px;vertical-align:top;padding:12px 14px;text-align:center;font-size:11px;line-height:1.6;">
              <div style="font-weight:800;margin:4px auto 14px;max-width:460px;">The following additional commission split is agreed between the Seller/Landlord's Agent &amp; Buyer/Tenant's Agent.</div>
              <div style="font-weight:900;font-size:12.5px;margin-bottom:16px;">Commission in total is: AED ${esc(val("commissionTotal")) || "__________"}/-</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;align-items:start;">
                <div><div style="font-weight:900;font-size:15px;">AGENT "A" [ ${esc(val("commissionPctA")) || "__"}%]</div><div>(Seller/Landlord's Agent)</div></div>
                <div><div style="font-weight:900;font-size:15px;">AGENT "B" [ ${esc(val("commissionPctB")) || "__"}%]</div><div>(Buyer/Tenant's Agent)</div></div>
              </div>
              <div style="text-align:left;">${row("BUYER’S/TENANT’S NAME:", val("buyerFamilyName"), 205, false)}<div style="margin:-2px 0 10px;">(family name ONLY)</div></div>
              <div style="text-align:left;">${row("BUDGET:", val("buyerBudget"), 324, false)}</div>
              <div style="margin:14px 0 6px;text-align:left;">TRANSFER FEE PAID BY:</div>
              <div style="margin-bottom:16px;">SELLER [ ] &nbsp;&nbsp;&nbsp;&nbsp; BUYER [ ] &nbsp;&nbsp;&nbsp;&nbsp; NEGOTIABLE [ ]</div>
              <div style="margin-bottom:6px;text-align:left;">DOES THE BUYER HAVE APPROVED PRE-FINANCE?</div>
              <div style="margin-bottom:16px;">${yesNo(val("buyerPreFinance"))}</div>
              <div style="margin-bottom:6px;text-align:left;">HAS THIS BUYER/TENANT CONTACTED THE AGENT "A"?</div>
              <div>${yesNo(val("buyerContactedAgentA"))}</div>
            </td>
          </tr>
          <tr style="background:${CHAMPAGNE};height:18px;">
            <td style="border:1px solid ${GOLD};font-size:10.5px;font-weight:900;padding:2px 6px;">PART 4.</td>
            <td style="border:1px solid ${GOLD};font-size:10.5px;font-weight:900;text-align:center;padding:2px 6px;">THE SIGNATURES</td>
          </tr>
          <tr>
            <td colspan="2" style="border:1px solid ${GOLD};padding:3px 6px;font-size:8.8px;font-style:italic;font-weight:800;line-height:1.08;">Both Agents are required to cooperate fully, complete this FORM, and BOTH retain a fully signed &amp; stamped copy on file. RERA DRS is available to both Parties.</td>
          </tr>
          <tr>${signatureCell("A")}${signatureCell("B")}</tr>
          <tr>
            <td colspan="2" style="border:1px solid ${GOLD};background:${CHAMPAGNE};text-align:center;font-weight:900;font-size:8.4px;line-height:1.12;padding:3px 6px;">
              The Agent "B" is confirming to view the above mentioned property through Agent "A".<br />
              In the event that Agent "A" did not respond within 24 hours, Agent "B" must contact RERA
            </td>
          </tr>
        </tbody>
      </table>
      ${companyFooter}
    </div>`;

  return `<section data-pdf-page="1" data-no-chrome="1" data-single-page="1" style="display:flex;flex-direction:column;height:100%;min-height:0;">${html}</section>`;
}
/* ───────────── FORM U — Cancellation of Form A / Form B ───────────── */

export function composeFormU(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    "The parties hereby mutually agree to terminate the agency relationship established under <strong>" + esc(f.originalForm || "the original RERA form") + "</strong> in respect of the property/representation referenced above.",
    "Termination shall take effect on <strong>" + esc(fmtDate(f.effectiveDate) || "the date specified above") + "</strong> (the &quot;Effective Date&quot;).",
    "Each party confirms that, save as expressly set out herein, no commission, fees or other sums are owed by either party to the other in respect of the terminated agency.",
    "Notwithstanding the above, the Broker shall remain entitled to commission on any transaction that was substantially negotiated by the Broker prior to the Effective Date and which completes within sixty (60) days thereafter with a party introduced by the Broker.",
    "Each party releases the other from all further obligations under the terminated agreement, save for any obligation that by its nature survives termination (including confidentiality and non-circumvention).",
    "This cancellation is governed by the laws of the Emirate of Dubai and the United Arab Emirates.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    headerBlock("Form U", "Cancellation of Agency Agreement", "Mutual Termination of Form A or Form B"),
    section(1, "Reference"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Original Form Reference", f.originalForm)}
      ${field("Original Sign Date", fmtDate(f.originalDate))}
      ${field("Property / Representation Ref.", f.propertyRef)}
      ${field("Effective Termination Date", fmtDate(f.effectiveDate))}
    </div>`,
    section(2, "Parties"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Broker (JBJ Global Real Estate) — BRN", f.brn)}
      ${field("Broker Name", f.brokerName)}
      ${field("Counterparty Name", f.recipientName)}
      ${field("Counterparty Emirates ID / Passport", f.counterpartyId)}
    </div>`,
    section(3, "Reason for Cancellation"),
    `<div style="font-size:12px;line-height:1.6;color:${INK};border:1px solid ${GOLD}55;background:${CHAMPAGNE};padding:10px 14px;min-height:48px;">${esc(f.reason || "Mutually agreed termination.")}</div>`,
  ].join("");

  const pageTwo = [
    section(4, "Terms"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.brokerName || input.ownerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Counterparty Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
}

/* ───────────── Broker-to-Broker Referral (NOT a RERA form) ───────────── */

export function composeBrokerReferral(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    "The Referring Brokerage refers the lead/client identified above to the Receiving Brokerage on the terms set out herein. This is an internal commercial arrangement between two RERA-registered brokerages and is <em>not</em> a RERA-issued form.",
    "If a transaction completes with the referred lead within twelve (12) months of the date of this letter, the Receiving Brokerage shall pay the Referring Brokerage a referral fee of <strong>" + esc(f.referralFee || "25% of net commission") + "</strong> (plus VAT), payable within fourteen (14) days of the Receiving Brokerage receiving cleared commission.",
    "The Receiving Brokerage shall keep the Referring Brokerage reasonably informed of progress and shall not circumvent the Referring Brokerage in respect of the referred lead.",
    "This arrangement is governed by the laws of the Emirate of Dubai.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine("Broker-to-Broker Referral Letter (Non-RERA · Internal Commercial Agreement)"),
    section(1, "Parties"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Referring Brokerage (JBJ) — ORN", f.orn)}
      ${field("Receiving Brokerage", f.recipientName)}
      ${field("Receiving Brokerage ORN", f.counterpartyOrn)}
      ${field("Receiving Agent", f.counterpartyAgent)}
    </div>`,
    section(2, "Referred Lead"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Lead / Client Name", f.leadName)}
      ${field("Property / Project (if any)", f.propertyRef)}
      ${field("Referral Fee", f.referralFee)}
      ${field("Date of Referral", fmtDate(f.startDate))}
    </div>`,
  ].join("");

  const pageTwo = [
    section(3, "Terms"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.brokerName || input.ownerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.counterpartyAgent || f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Receiving Brokerage Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
}
