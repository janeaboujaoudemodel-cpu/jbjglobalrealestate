/**
 * Partners — Premium partnership agreement composers
 * --------------------------------------------------
 * Five RERA-grade partner templates, all sharing the same chrome:
 *   1. partner_referral      → Referral Partner (commission share)
 *   2. partner_marketing     → Marketing / Co-Branding Partner
 *   3. partner_investor      → Investor / Capital Partner
 *   4. partner_strategic     → Strategic Brokerage Partner (cross-market)
 *   5. partner_custom        → Other / Custom partnership (AI-assisted)
 *
 * Layout (all 5): Eyebrow + Premium Title · PART 1 Parties (A/B side-by-side,
 * JBJ auto-prefilled on Party A with company stamp) · PART 2 Scope &
 * Commercial Terms · PART 3 Signatures with per-page Name/Sig/Date strips
 * handled globally by DocumentStudio. Stamp + authorised signatory ONLY on
 * last page (rendered via the standard signatureBlock).
 */

import type { ComposerInput } from "./index";
import { signatureBlock, dateLine, paragraphs } from "./index";
import { jbjPartyBlockHtml, jbjStampOverlayHtml } from "@/templates/jbjLockedChrome";

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const MUTED = "rgba(26,26,26,0.65)";

const esc = (s?: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const fmtDate = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

const section = (n: number, t: string) => `
  <div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:.10em;color:${INK};">${n}. ${t.toUpperCase()}</div>
    <div style="flex:1;height:1px;background:${GOLD};"></div>
  </div>`;

const eyebrow = (title: string, subtitle: string) => `
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin:6px 0 4px;font-size:10.5px;color:${MUTED};letter-spacing:.10em;text-transform:uppercase;font-weight:600;">
    <div>PARTNERSHIP AGREEMENT &nbsp;·&nbsp; JBJ GLOBAL REAL ESTATE</div>
    <div>Ref #: __________</div>
  </div>
  <div style="text-align:center;font-size:22px;font-weight:800;letter-spacing:.06em;color:${INK};margin:6px 0 2px;text-transform:uppercase;">${esc(title)}</div>
  <div style="text-align:center;font-style:italic;font-size:11.5px;color:${MUTED};margin:0 0 14px;">${esc(subtitle)}</div>`;

const blankPartyB = (f: Record<string, string>) => `
  <div style="font-size:11px;line-height:1.7;color:${INK};">
    <div><strong>NAME OF PARTY:</strong> ${esc(f.partnerName) || "___________________________"}</div>
    <div><strong>COMPANY / ENTITY:</strong> ${esc(f.partnerCompany) || "___________________________"}</div>
    <div><strong>JURISDICTION / LICENCE:</strong> ${esc(f.partnerLicence) || "__________"}</div>
    <div style="margin:8px 0 2px;font-weight:700;letter-spacing:.06em;font-size:10.5px;text-transform:uppercase;">Official Contact Details</div>
    <div>PH: ${esc(f.partnerPhone) || "__________"}</div>
    <div>EMAIL: ${esc(f.partnerEmail) || "__________"}</div>
    <div>ADDRESS: ${esc(f.partnerAddress) || "__________"}</div>
    <div style="margin:8px 0 2px;font-weight:700;letter-spacing:.06em;font-size:10.5px;text-transform:uppercase;">Authorised Signatory</div>
    <div>NAME: ${esc(f.partnerSignatory) || "__________"}</div>
    <div>TITLE: ${esc(f.partnerSignatoryTitle) || "__________"}</div>
  </div>`;

const partiesTable = (f: Record<string, string>) => `
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:Inter,system-ui,sans-serif;margin:0 0 14px;">
    <colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>
    <thead>
      <tr>
        <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PARTY &ldquo;A&rdquo; — JBJ GLOBAL REAL ESTATE</th>
        <th style="border:1px solid ${GOLD};background:${CHAMPAGNE};padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${INK};">PARTY &ldquo;B&rdquo; — PARTNER</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid ${GOLD};padding:10px 12px;vertical-align:top;">${jbjPartyBlockHtml("A")}</td>
        <td style="border:1px solid ${GOLD};padding:10px 12px;vertical-align:top;">${blankPartyB(f)}</td>
      </tr>
    </tbody>
  </table>`;

const termsBox = (rows: Array<[string, string]>) => `
  <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;margin:6px 0 14px;">
    <tbody>
      ${rows.map(([k, v], i) => `
        <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
          <td style="padding:9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:12px;">${esc(k)}</td>
          <td style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;">${esc(v) || "—"}</td>
        </tr>`).join("")}
    </tbody>
  </table>`;

const clauseList = (clauses: string[]) => `
  <ol style="font-size:11.5px;line-height:1.65;color:${INK};padding-left:18px;margin:6px 0 10px;">
    ${clauses.map((c) => `<li style="margin:0 0 9px;">${c}</li>`).join("")}
  </ol>`;

const partyIntroLine = (partnerName?: string) => `
  <div style="margin:0 0 12px;font-size:11.5px;line-height:1.7;color:${INK};border:1px solid ${GOLD}55;background:${CHAMPAGNE};padding:9px 12px;">
    <div><strong>Party A:</strong> JBJ Global Real Estate L.L.C S.O.C</div>
    <div><strong>Party B:</strong> ${esc(partnerName) || "___________________________"}</div>
    <div style="margin-top:4px;font-size:10.5px;color:${MUTED};font-style:italic;">All subsequent references to &ldquo;Party A&rdquo; and &ldquo;Party B&rdquo; in this agreement refer to the parties named above.</div>
  </div>`;

const signaturesBlock = (input: ComposerInput, partnerLabel: string) => {
  const f = input.fields;
  return signatureBlock({
    ownerName: "Jane Bou Jaoude",
    ownerTitle: "Founder & CEO",
    ownerDate: input.ownerDate,
    applicantName: f.partnerSignatory || f.partnerName,
    applicantDate: input.applicantDate,
    applicantLabel: partnerLabel,
    extraSignatories: input.extraSignatories,
  });
};

/* ───────── 1) Referral Partner ───────── */
export function composePartnerReferral(input: ComposerInput): string {
  const f = input.fields;
  const fee = esc(f.referralFee) || "25% of net commission";
  const clauses = [
    `Party B refers prospective buyers, sellers, tenants, landlords or investors (each a &ldquo;Referred Lead&rdquo;) to Party A in respect of real-estate transactions in the United Arab Emirates.`,
    `For every Referred Lead that completes a transaction with Party A within twelve (12) months of introduction, Party A shall pay Party B a referral fee of <strong>${fee}</strong> (plus VAT where applicable), settled within fourteen (14) days of Party A receiving cleared commission from the developer / buyer.`,
    `Party A shall keep Party B reasonably informed of the status of each Referred Lead and shall not circumvent Party B by transacting with the lead under any affiliated entity.`,
    `Non-circumvention &amp; non-disclosure: both parties shall not solicit each other's clients or share confidential commercial information with third parties during the term and for twelve (12) months thereafter.`,
    `Term: ${esc(f.term) || "twelve (12) months"} from the effective date, auto-renewable in writing. Either party may terminate on thirty (30) days' written notice; terminations do not affect fees accrued prior to termination.`,
    `Governing law &amp; jurisdiction: laws of the Emirate of Dubai and the United Arab Emirates; exclusive jurisdiction of the Dubai Courts.`,
  ];
  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow("Referral Partner Agreement", "Commission share on closed real-estate transactions"),
    section(1, "The Parties"),
    partiesTable(f),
    section(2, "Commercial Terms"),
    termsBox([
      ["Effective Date", fmtDate(f.startDate) || fmtDate(new Date().toISOString())],
      ["Referral Fee", fee],
      ["Payment Trigger", "Cleared commission received by Party A"],
      ["Settlement Period", "Within 14 days of clearance"],
      ["Term", esc(f.term) || "12 months, auto-renewable"],
      ["Scope / Geography", esc(f.scope) || "UAE-wide, all asset classes"],
    ]),
    section(3, "Terms &amp; Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    section(4, "Signatures"),
    signaturesBlock(input, "Referral Partner"),
  ].join("");
}

/* ───────── 2) Marketing / Co-Branding Partner ───────── */
export function composePartnerMarketing(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    `The parties agree to enter into a joint marketing &amp; co-branding partnership to cross-promote their respective brands, services and listings through agreed channels.`,
    `Logo &amp; brand-usage rights: each party grants the other a non-exclusive, royalty-free, revocable licence to use its name, logo and approved marketing assets solely for the agreed campaigns. No alteration, no sub-licensing.`,
    `Lead-sharing: leads generated via co-branded campaigns shall be shared in accordance with the split set out in the commercial terms below. Each party retains full ownership of its own organic database.`,
    `Campaign approvals: every co-branded creative, press release, email or paid placement must be approved in writing by both parties prior to publication.`,
    `Each party shall bear its own marketing costs unless expressly agreed in a written campaign brief signed by both parties.`,
    `Term: ${esc(f.term) || "twelve (12) months"} from the effective date. Either party may terminate on thirty (30) days' written notice. Upon termination, all use of the other party's brand assets must cease within seven (7) days.`,
    `Governing law: Dubai &amp; UAE laws; exclusive jurisdiction of the Dubai Courts.`,
  ];
  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow("Marketing &amp; Co-Branding Partnership", "Joint campaigns, shared leads &amp; brand-usage rights"),
    section(1, "The Parties"),
    partiesTable(f),
    section(2, "Commercial Terms"),
    termsBox([
      ["Effective Date", fmtDate(f.startDate) || fmtDate(new Date().toISOString())],
      ["Campaign Scope", esc(f.scope) || "TBD per signed campaign brief"],
      ["Channels", esc(f.channels) || "Digital, social, email, events"],
      ["Lead-Share Split", esc(f.leadSplit) || "50 / 50 on co-branded leads"],
      ["Logo Rights", "Non-exclusive, revocable, written-approval only"],
      ["Term", esc(f.term) || "12 months"],
    ]),
    section(3, "Terms &amp; Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    section(4, "Signatures"),
    signaturesBlock(input, "Marketing Partner"),
  ].join("");
}

/* ───────── 3) Investor / Capital Partner ───────── */
export function composePartnerInvestor(input: ComposerInput): string {
  const f = input.fields;
  const cap = esc(f.capitalAmount) || "__________";
  const profitShare = esc(f.profitShare) || "as set out in Schedule A";
  const clauses = [
    `Party B (the &ldquo;Investor&rdquo;) shall contribute capital of <strong>AED ${cap}</strong> to Party A for the purpose described in the commercial terms, in accordance with the funding schedule agreed in writing between the parties.`,
    `Profit share: net profits arising from the agreed project / vehicle shall be distributed <strong>${profitShare}</strong>, calculated after deduction of agreed costs, fees and reserves.`,
    `Capital protection: invested capital ranks ahead of profit distributions and shall be returned to the Investor on the exit / liquidation event in accordance with the agreed waterfall.`,
    `Reporting: Party A shall provide the Investor with quarterly written progress reports, audited annual accounts (where applicable), and reasonable access to project documentation upon written request.`,
    `Decision rights: material decisions (sale of the underlying asset, additional capital calls, refinancing, change of strategy) require the prior written consent of both parties.`,
    `Confidentiality &amp; non-circumvention: each party shall keep all commercial, financial and strategic information strictly confidential during the term and for three (3) years thereafter.`,
    `Term &amp; exit: ${esc(f.term) || "until the agreed exit event"}. Early exit only by mutual written agreement or on the terms set out in Schedule A.`,
    `Governing law: Dubai &amp; UAE laws; exclusive jurisdiction of the Dubai Courts (DIFC Courts may be elected by mutual written agreement).`,
  ];
  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow("Investor / Capital Partnership", "Profit share on a specific project or fund vehicle"),
    section(1, "The Parties"),
    partiesTable(f),
    section(2, "Commercial Terms"),
    termsBox([
      ["Effective Date", fmtDate(f.startDate) || fmtDate(new Date().toISOString())],
      ["Project / Vehicle", esc(f.projectName) || "—"],
      ["Capital Contribution (AED)", cap],
      ["Funding Schedule", esc(f.fundingSchedule) || "Per Schedule A"],
      ["Profit Share", profitShare],
      ["Exit Horizon", esc(f.exitHorizon) || "On project exit / liquidation"],
      ["Reporting Cadence", "Quarterly + audited annual accounts"],
    ]),
    section(3, "Terms &amp; Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    section(4, "Signatures"),
    signaturesBlock(input, "Capital Partner"),
  ].join("");
}

/* ───────── 4) Strategic Brokerage Partner (cross-market) ───────── */
export function composePartnerStrategic(input: ComposerInput): string {
  const f = input.fields;
  const clauses = [
    `The parties enter into a reciprocal cross-market brokerage partnership for the purpose of representing each other's listings and clients in the respective territories defined below.`,
    `Listing reciprocity: each party may market the other's listings to its client base under the agreed branding (white-label, co-branded or full disclosure) as specified in the commercial terms.`,
    `Geographic split: each party shall be the lead brokerage in its primary territory and shall refer transactions in the other territory to the partner unless otherwise agreed in writing per deal.`,
    `Commission split: ${esc(f.commissionSplit) || "50 / 50 of net commission"} on every cross-market transaction, payable within fourteen (14) days of Party A receiving cleared commission.`,
    `White-label rights: where agreed, the receiving party may present the listing under its own brand subject to the written approval of the originating party and full disclosure to the end client per RERA Bylaw No. 85 of 2006.`,
    `Non-circumvention: neither party may transact directly with the other's introduced clients during the term and for twelve (12) months thereafter.`,
    `Term: ${esc(f.term) || "twelve (12) months"}, auto-renewable. Either party may terminate on sixty (60) days' written notice.`,
    `Governing law: laws of the Emirate of Dubai and the United Arab Emirates; exclusive jurisdiction of the Dubai Courts.`,
  ];
  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow("Strategic Brokerage Partnership", "Reciprocal listings, white-label rights &amp; geographic split"),
    section(1, "The Parties"),
    partiesTable(f),
    section(2, "Commercial Terms"),
    termsBox([
      ["Effective Date", fmtDate(f.startDate) || fmtDate(new Date().toISOString())],
      ["Party A Territory", esc(f.territoryA) || "United Arab Emirates"],
      ["Party B Territory", esc(f.territoryB) || "—"],
      ["Branding Mode", esc(f.brandingMode) || "Co-branded (default)"],
      ["Commission Split", esc(f.commissionSplit) || "50 / 50"],
      ["Settlement", "Within 14 days of clearance"],
      ["Term", esc(f.term) || "12 months, auto-renewable"],
    ]),
    section(3, "Terms &amp; Conditions"),
    clauseList(clauses),
    paragraphs(input.aiClosing),
    section(4, "Signatures"),
    signaturesBlock(input, "Strategic Brokerage Partner"),
  ].join("");
}

/* ───────── 5) Custom / Other Partnership (AI-assisted) ───────── */
export function composePartnerCustom(input: ComposerInput): string {
  const f = input.fields;
  const title = esc(f.customTitle) || "Custom Partnership Agreement";
  const subtitle = esc(f.customSubtitle) || "Bespoke partnership between JBJ Global Real Estate and Party B";
  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    eyebrow(title, subtitle),
    section(1, "The Parties"),
    partiesTable(f),
    section(2, "Commercial Terms"),
    termsBox([
      ["Effective Date", fmtDate(f.startDate) || fmtDate(new Date().toISOString())],
      ["Scope", esc(f.scope) || "—"],
      ["Commercial Mechanism", esc(f.mechanism) || "—"],
      ["Term", esc(f.term) || "12 months"],
    ]),
    section(3, "Terms &amp; Conditions"),
    `<div style="font-size:11.5px;line-height:1.7;color:${INK};border:1px solid ${GOLD}55;background:${CHAMPAGNE};padding:14px 16px;">
      ${paragraphs(input.aiIntro) || `<em style="color:${MUTED};">AI-generated bespoke clauses will appear here. Use the &ldquo;Generate with AI&rdquo; copilot in the Studio to draft tailored terms based on the brief above.</em>`}
    </div>`,
    paragraphs(input.aiClosing),
    section(4, "Signatures"),
    signaturesBlock(input, "Partner"),
  ].join("");
}
