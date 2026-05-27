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
import { jbjPartyBlockHtml, jbjStampOverlayHtml } from "@/templates/jbjLockedChrome";

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
  const jbjSide = (f.jbjSide === "A" || f.jbjSide === "B") ? f.jbjSide : "";

  const blankParty = (label: "A" | "B") => `
    <div style="font-size:10.2px;line-height:1.45;color:${INK};">
      <div><strong>NAME OF ESTABLISHMENT:</strong> ___________________________</div>
      <div><strong>ADDRESS:</strong> ___________________________</div>
      <div style="margin:5px 0 1px;font-weight:700;letter-spacing:.06em;font-size:9.5px;text-transform:uppercase;">Official Contact Details</div>
      <div>PH: __________ &nbsp; FAX: __________</div>
      <div>EMAIL: __________</div>
      <div>ORN: __________ &nbsp; DED LISC: __________</div>
      <div>P.O. BOX: __________</div>
      <div style="margin:5px 0 1px;font-weight:700;letter-spacing:.06em;font-size:9.5px;text-transform:uppercase;">The Registered Agent &ldquo;${label}&rdquo;</div>
      <div>NAME: __________</div>
      <div>BRN: __________ &nbsp; DATE ISSUED: __ / __ / ____</div>
      <div>MOBILE: __________</div>
      <div>EMAIL: __________</div>
    </div>`;

  const compactJbjParty = (label: "A" | "B") => `
    <div style="font-size:10.2px;line-height:1.45;color:${INK};">
      <div><strong>NAME OF ESTABLISHMENT:</strong> JBJ GLOBAL REAL ESTATE L.L.C S.O.C</div>
      <div><strong>ADDRESS:</strong> Dubai, UAE</div>
      <div style="margin:5px 0 1px;font-weight:700;letter-spacing:.06em;font-size:9.5px;text-transform:uppercase;">Official Contact Details</div>
      <div>PH: +971 50 000 0000 &nbsp; FAX: —</div>
      <div>EMAIL: info@jbj.ae</div>
      <div>ORN: 41486 &nbsp; DED LISC: —</div>
      <div>P.O. BOX: —</div>
      <div style="margin:5px 0 1px;font-weight:700;letter-spacing:.06em;font-size:9.5px;text-transform:uppercase;">The Registered Agent &ldquo;${label}&rdquo;</div>
      <div>NAME: Jane Bou Jaoude</div>
      <div>BRN: 44750 &nbsp; DATE ISSUED: 24 / 05 / 2024</div>
      <div>MOBILE: +971 50 000 0000</div>
      <div>EMAIL: info@jbj.ae</div>
    </div>`;

  const partyA = jbjSide === "A" ? compactJbjParty("A") : blankParty("A");
  const partyB = jbjSide === "B" ? compactJbjParty("B") : blankParty("B");

  const declarationA = `<em style="font-size:9.8px;line-height:1.42;color:${INK};">I hereby declare, I have read and understood the Real Estate Brokers Code of Ethics, I have a current signed Seller's/Landlord's Agreement FORM A, I shall respond to a reasonable offer to purchase/lease the listed property from Agent B, and shall not contact Agent B's Buyer/Tenant nor confer with their client under no circumstances unless the nominated Buyer/Tenant herein has already discussed the stated listed property with our Office.</em>`;

  const declarationB = `<em style="font-size:9.8px;line-height:1.42;color:${INK};">I hereby declare, I have read and understood the Real Estate Brokers Code of Ethics, I have a current signed Buyer's/Tenant's Agreement FORM B, I shall encourage my Buyer/Tenant as named herein to submit a reasonable offer for the stated property and not contact Agent A's Seller/Landlord nor confer with their client under no circumstances unless the Agent A has delayed our proposal on the prescribed FORM with a reasonable reply within 24 hours.</em>`;

  const partsTable = `
    <table data-pdf-section="form-i-parties" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,sans-serif;margin:0 0 6px;">
      <colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>
      <thead>
        <tr>
          <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:5px 8px;text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PART 1A — THE AGENT / BROKER (Seller / Landlord)</th>
          <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:5px 8px;text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PART 1B — THE AGENT / BROKER (Buyer / Tenant)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;">${partyA}</td>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;">${partyB}</td>
        </tr>
      </tbody>
    </table>`;

  const propertyAndCommission = `
    <table data-pdf-section="form-i-property-commission" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,sans-serif;margin:0 0 6px;">
      <colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>
      <thead>
        <tr>
          <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:5px 8px;text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PART 2 — THE PROPERTY</th>
          <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:5px 8px;text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PART 3 — THE COMMISSION (SPLIT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;font-size:10.2px;line-height:1.45;color:${INK};">
            <div><strong>PROPERTY ADDRESS:</strong> ${esc(f.propertyRef) || "__________"}</div>
            <div><strong>MASTER DEVELOPER:</strong> ${esc(f.masterDeveloper) || "__________"}</div>
            <div><strong>MASTER PROJECT NAME:</strong> ${esc(f.masterProject) || "__________"}</div>
            <div><strong>BUILDING NAME:</strong> ${esc(f.buildingName) || "__________"}</div>
            <div><strong>LISTED PRICE:</strong> ${f.listingPrice ? "AED " + esc(f.listingPrice) : "AED __________"}</div>
            <div><strong>DESCRIPTION:</strong> ${esc(f.propertyDescription) || "__________"}</div>
            <div style="margin-top:4px;"><strong>MOU EXISTS?</strong> YES [ ] NO [ ] N/A [ ] &nbsp; <strong>TENANTED?</strong> YES [ ] NO [ ]</div>
            <div><strong>MAINTENANCE FEE P.A:</strong> ${esc(f.maintenanceFee) || "__________"} per sq. ft</div>
          </td>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;font-size:10.2px;line-height:1.45;color:${INK};">
            <div style="font-style:italic;color:${MUTED};margin-bottom:4px;">Additional commission split agreed between the Seller/Landlord's Agent &amp; the Buyer/Tenant's Agent.</div>
            <div><strong>COMMISSION TOTAL:</strong> AED ${esc(f.commissionTotal) || "__________"}</div>
            <div style="margin-top:4px;"><strong>AGENT &ldquo;A&rdquo; [ ${esc(f.commissionPctA) || "__"} % ]</strong> (Seller/Landlord's Agent)</div>
            <div><strong>AGENT &ldquo;B&rdquo; [ ${esc(f.commissionPctB) || "__"} % ]</strong> (Buyer/Tenant's Agent)</div>
            <div style="margin-top:5px;"><strong>BUYER'S / TENANT'S NAME:</strong> ${esc(f.buyerFamilyName) || "__________"} <span style="color:${MUTED};">(family name only)</span></div>
            <div><strong>BUDGET:</strong> ${esc(f.buyerBudget) || "__________"}</div>
            <div><strong>TRANSFER FEE BY:</strong> SELLER [ ] BUYER [ ] NEGOTIABLE [ ]</div>
            <div><strong>BUYER PRE-FINANCE APPROVED?</strong> YES [ ] NO [ ] N/A [ ]</div>
            <div><strong>HAS BUYER/TENANT CONTACTED AGENT A?</strong> YES [ ] NO [ ] N/A [ ]</div>
          </td>
        </tr>
      </tbody>
    </table>`;

  const declarationsTable = `
    <table data-pdf-section="form-i-declarations" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,sans-serif;margin:0 0 8px;">
      <colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>
      <tbody>
        <tr>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;background:${CHAMPAGNE};">
            <strong style="font-size:9.8px;letter-spacing:.08em;text-transform:uppercase;">Declaration by Agent A</strong>
            <div style="margin-top:3px;">${declarationA}</div>
          </td>
          <td style="border:1px solid ${GOLD};padding:7px 9px;vertical-align:top;background:${CHAMPAGNE};">
            <strong style="font-size:9.8px;letter-spacing:.08em;text-transform:uppercase;">Declaration by Agent B</strong>
            <div style="margin-top:3px;">${declarationB}</div>
          </td>
        </tr>
      </tbody>
    </table>`;

  const signatureCell = (label: "A" | "B") => {
    const isJbj = jbjSide === label;
    return `
      <td style="border:1px solid ${GOLD};padding:12px 14px 74px;vertical-align:top;width:50%;position:relative;min-height:168px;">
        <div style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:${INK};font-weight:700;margin-bottom:10px;">SIGNATURE &amp; COMPANY STAMP OF AGENT &ldquo;${label}&rdquo;</div>
        <div style="border-top:1px solid ${INK};margin-top:52px;padding-top:6px;font-size:10.5px;color:${MUTED};">Signature</div>
        <div style="margin-top:10px;font-size:10.5px;color:${INK};"><strong>Name:</strong> ${isJbj ? "Jane Bou Jaoude" : "__________"}</div>
        <div style="margin-top:4px;font-size:10.5px;color:${INK};"><strong>Date:</strong> __ / __ / ____</div>
        ${isJbj ? jbjStampOverlayHtml() : ""}
      </td>`;
  };

  // data-signature-block="1" suppresses the GLOBAL per-page signature
  // strip on this (last) page — avoiding a duplicate Name/Signature/Date
  // row appearing under the official RERA signatures.
  const signatures = `
    <div data-signature-block="1" data-pdf-section="signature" style="margin-top:auto;padding-top:12px;page-break-inside:avoid;break-inside:avoid;">
      <div style="font-size:10.3px;color:${INK};margin:0 0 8px;line-height:1.45;">Both Agents are required to cooperate fully, complete this FORM, and BOTH retain a fully signed &amp; stamped copy on file. RERA DRS is available to both Parties.</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,sans-serif;margin:0 0 8px;">
        <tbody><tr>${signatureCell("A")}${signatureCell("B")}</tr></tbody>
      </table>
      <div style="font-size:10.2px;color:${MUTED};line-height:1.45;font-style:italic;">The Agent &ldquo;B&rdquo; is confirming to view the above mentioned property through Agent &ldquo;A&rdquo;. In the event that Agent &ldquo;A&rdquo; did not respond within 24 hours, Agent &ldquo;B&rdquo; must contact RERA.</div>
    </div>`;

  const eyebrow = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin:0 0 3px;font-size:10px;color:${MUTED};letter-spacing:.10em;text-transform:uppercase;font-weight:600;">
      <div>FORM I &nbsp;·&nbsp; BRN: 44750</div>
      <div>Str #: __________</div>
    </div>
    <div style="text-align:center;font-size:19px;font-weight:800;letter-spacing:.06em;color:${INK};margin:3px 0 1px;text-transform:uppercase;">Agent to Agent Agreement</div>
    <div style="text-align:center;font-style:italic;font-size:10.5px;color:${MUTED};margin:0 0 8px;">As per the Real Estate Brokers By-Law No. (85) of 2006</div>`;

  // Page 1: eyebrow + Parties + Property/Commission.
  // Page 2: Declarations + RERA Signatures.
  // Explicit <section data-pdf-page> wrappers — DocumentStudio honours
  // these and disables auto-re-splitting (see DocumentStudio.tsx L375).
  const pageOne = [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow,
    partsTable,
    propertyAndCommission,
  ].join("");

  const pageTwo = [
    declarationsTable,
    signatures,
  ].join("");

  return page(1, pageOne) + page(2, pageTwo);
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
