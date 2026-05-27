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

  return pageOne + pageTwo;
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

  return pageOne + pageTwo;
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

  return pageOne + pageTwo;
}

/* ───────────── FORM I — Brokers Notification (Co-Broking A↔B) ───────────── */

export function composeFormI(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    "Broker A (the Listing Broker) and Broker B (the Buyer's Broker) hereby register their co-broking arrangement in respect of the Property described above, pursuant to Dubai Law No. 85 of 2006.",
    "The total brokerage commission payable on successful conclusion of the sale shall be split as follows: <strong>" + esc(f.commissionSplit || "50 / 50") + "</strong> between Broker A and Broker B (plus VAT, payable on the DLD transfer date).",
    "Each Broker shall act in good faith, share material information regarding the Property and the Buyer/Seller as reasonably required, and shall not bypass or circumvent the other Broker in the transaction.",
    "Neither Broker shall negotiate directly with the other Broker's client without the other Broker's prior written consent.",
    "This Form I shall remain in force until the earlier of (a) completion of the sale, (b) expiry of the underlying Form A listing, or (c) seven (7) days after written termination by either Broker.",
    "This arrangement is governed by the laws of the Emirate of Dubai. Disputes shall be referred to RERA for mediation prior to escalation to the Dubai Courts.",
  ];

  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    headerBlock("Form I", "Property Brokers Notification", "Co-Broking Registration Between Two RERA Brokerages"),
    section(1, "Property"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Property Address", f.propertyRef)}
      ${field("DLD Title Deed No.", f.titleDeedNo)}
      ${field("Listing Price (AED)", f.listingPrice)}
      ${field("Underlying Form A Ref.", f.formAReference)}
    </div>`,
    section(2, "Broker A — Listing Broker (JBJ Global Real Estate)"),
    brokerBlock(f),
    section(3, "Broker B — Counterpart Brokerage"),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px;">
      ${field("Brokerage Company", f.recipientName)}
      ${field("Office Registration No. (ORN)", f.counterpartyOrn)}
      ${field("Registered Agent Name", f.counterpartyAgent)}
      ${field("Agent BRN", f.counterpartyBrn)}
      ${field("Agent Mobile", f.counterpartyPhone)}
      ${field("Agent Email", f.counterpartyEmail)}
    </div>`,
  ].join("");

  const pageTwo = [
    section(4, "Terms & Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: f.brokerName || input.ownerName,
      ownerTitle: "Founder & CEO",
      ownerDate: input.ownerDate,
      applicantName: f.counterpartyAgent || f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Broker B — Counterpart Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");

  return pageOne + pageTwo;
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

  return pageOne + pageTwo;
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

  return pageOne + pageTwo;
}
