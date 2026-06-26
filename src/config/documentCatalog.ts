/**
 * Document Catalog — single source of truth for every template the
 * unified Document Studio can produce.
 *
 * Audience separation (LOCKED):
 *  - "staff"  → Careers Portal · Contracts & Templates (HR / employee docs)
 *  - "client" → Forms & Contracts hub (real-estate client docs)
 *
 * A staff template can never be selected from the client hub and vice
 * versa. The Studio enforces this at runtime via the `catalog` prop.
 *
 * Add new template kinds HERE only — never inline in components.
 */

import {
  Briefcase, FileText, AlertTriangle, ShieldCheck, Handshake,
  GraduationCap, Mail, Users, FileSignature, Home, Key, ClipboardCheck,
  Building2, Stamp, UserSquare2, UserX,
} from "lucide-react";

export type DocumentAudience = "staff" | "client";

export type DocumentFieldType = "text" | "textarea" | "number" | "date" | "select";

export interface DocumentField {
  key: string;
  label: string;
  type: DocumentFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  helpText?: string;
  group?: string;
}

export interface DocumentTemplate {
  id: string;
  audience: DocumentAudience;
  label: string;
  description: string;
  icon: typeof Briefcase;
  /** Reveal the position/department picker (staff only). */
  needsPosition?: boolean;
  /** Reveal the CRM client picker (client only). */
  needsClient?: boolean;
  /** Suggested subject for the email when sending this document. */
  emailSubject: string;
  /** AI system prompt steering for this document type. */
  aiInstructions: string;
  fields: DocumentField[];
}

// Shared field presets
const RECIPIENT_NAME: DocumentField = {
  key: "recipientName",
  label: "Recipient Full Name",
  type: "text",
  placeholder: "e.g., John Doe",
  required: true,
};

const ID_NUMBER: DocumentField = {
  key: "idNumber",
  label: "ID / Passport Number",
  type: "text",
  placeholder: "Optional",
};

const START_DATE: DocumentField = {
  key: "startDate",
  label: "Start / Effective Date",
  type: "date",
};

// ─────────────────────────────────────────────────────────────────────
// STAFF catalog — Careers Portal · Contracts & Templates
// ─────────────────────────────────────────────────────────────────────
const STAFF: DocumentTemplate[] = [
  {
    id: "job_offer",
    audience: "staff",
    label: "Offer Letter",
    description: "Formal employment offer with title, salary and start date.",
    icon: Briefcase,
    needsPosition: true,
    emailSubject: "Your Offer of Employment — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal, warm job offer letter. Open with congratulations, state the offered position, start date, salary/package, probation terms, and reporting line. Include a clear acceptance instruction. Do NOT include letterhead or signature blocks.",
    fields: [
      RECIPIENT_NAME,
      { key: "jobTitle", label: "Offered Position", type: "text", placeholder: "e.g., Senior Sales Manager", required: true },
      START_DATE,
      { key: "salary", label: "Salary / Package", type: "text", placeholder: "AED 25,000 per month" },
      { key: "commission", label: "Commission Structure", type: "text", placeholder: "e.g., 30% of net commission" },
      { key: "notes", label: "Additional Instructions", type: "textarea", placeholder: "Relocation, benefits, probation length…" },
    ],
  },
  {
    id: "employment_contract",
    audience: "staff",
    label: "Contract",
    description: "Full employment agreement with clauses and obligations.",
    icon: FileSignature,
    needsPosition: true,
    emailSubject: "Your Employment Contract — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a contract-grade employment agreement. Include: parties, position, duties, term, working hours, compensation, leave, confidentiality, termination, governing law (UAE). Numbered clauses.",
    fields: [
      RECIPIENT_NAME,
      { key: "jobTitle", label: "Position", type: "text", required: true },
      START_DATE,
      { key: "salary", label: "Monthly Compensation", type: "text" },
      { key: "duration", label: "Contract Duration", type: "text", placeholder: "2 years / Unlimited" },
      { key: "notes", label: "Special Clauses", type: "textarea" },
    ],
  },
  {
    id: "warning_letter",
    audience: "staff",
    label: "Warning Letter",
    description: "Formal disciplinary notice with violation and corrective steps.",
    icon: AlertTriangle,
    needsPosition: true,
    emailSubject: "Formal Notice — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a firm but respectful disciplinary warning letter. State the violation factually, reference policy, outline required corrective action, deadline, and consequences of recurrence. Do not threaten — be procedural.",
    fields: [
      RECIPIENT_NAME,
      { key: "jobTitle", label: "Employee Position", type: "text" },
      { key: "incidentDate", label: "Date of Incident", type: "date" },
      { key: "violation", label: "Violation / Issue", type: "textarea", required: true, placeholder: "Describe what happened factually…" },
      { key: "correctiveAction", label: "Required Corrective Action", type: "textarea" },
      { key: "warningLevel", label: "Warning Level", type: "select", options: [
        { value: "first", label: "First Warning" },
        { value: "second", label: "Second Warning" },
        { value: "final", label: "Final Warning" },
      ]},
    ],
  },
  {
    id: "termination_letter",
    audience: "staff",
    label: "Termination Letter",
    description: "Formal notice of employment termination with UAE Labour Law compliance.",
    icon: UserX,
    needsPosition: true,
    emailSubject: "Notice of Termination — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal termination letter. State the decision clearly, cite the reason, specify the effective date, last working day, notice period or payment in lieu, final settlement timeline, and return-of-property obligations. Maintain a respectful, procedural tone compliant with UAE Labour Law.",
    fields: [
      RECIPIENT_NAME,
      { key: "jobTitle", label: "Employee Position", type: "text" },
      { key: "employeeId", label: "Employee ID", type: "text" },
      { key: "terminationDate", label: "Termination Effective Date", type: "date", required: true },
      { key: "lastWorkingDay", label: "Last Working Day", type: "date", required: true },
      { key: "noticePeriod", label: "Notice Period", type: "text", placeholder: "e.g., 30 days / Payment in lieu" },
      { key: "reason", label: "Reason for Termination", type: "select", required: true, options: [
        { value: "mutual_consent", label: "Mutual Consent" },
        { value: "probation", label: "Unsatisfactory Probation" },
        { value: "performance", label: "Performance / Capability" },
        { value: "misconduct", label: "Gross Misconduct" },
        { value: "redundancy", label: "Redundancy / Restructuring" },
        { value: "contract_end", label: "Fixed-Term Contract End" },
        { value: "other", label: "Other (specify in notes)" },
      ]},
      { key: "finalSettlement", label: "Final Settlement Notes", type: "textarea", placeholder: "Gratuity, leave balance, outstanding salary…" },
      { key: "returnOfProperty", label: "Return of Company Property", type: "textarea", placeholder: "Laptop, access card, vehicle, keys…" },
      { key: "notes", label: "Additional Notes", type: "textarea" },
    ],
  },
  {
    id: "nda",
    audience: "staff",
    label: "Non-Disclosure Agreement (NDA)",
    description: "Confidentiality agreement for employees and contractors.",
    icon: ShieldCheck,
    emailSubject: "Non-Disclosure Agreement — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a mutual NDA suitable for UAE jurisdiction. Cover: definition of confidential information, obligations, exclusions, term, return of materials, remedies, governing law.",
    fields: [
      RECIPIENT_NAME,
      { key: "counterparty", label: "Counterparty / Company", type: "text" },
      START_DATE,
      { key: "term", label: "Term of Confidentiality", type: "text", placeholder: "e.g., 3 years" },
      { key: "purpose", label: "Purpose of Disclosure", type: "textarea" },
    ],
  },
  {
    id: "commission_agreement",
    audience: "staff",
    label: "Commission Agreement",
    description: "Commission split and payout terms for sales staff.",
    icon: FileText,
    needsPosition: true,
    emailSubject: "Commission Agreement — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a commission agreement defining: base eligibility, commission percentage, calculation method, deductions, payment timing, clawback conditions.",
    fields: [
      RECIPIENT_NAME,
      { key: "jobTitle", label: "Position", type: "text" },
      { key: "commissionRate", label: "Commission Rate", type: "text", placeholder: "30% of net" },
      { key: "payoutSchedule", label: "Payout Schedule", type: "text", placeholder: "Monthly, after closing" },
      START_DATE,
    ],
  },
  {
    id: "commission_invoice",
    audience: "staff",
    label: "Commission Invoice",
    description: "Auto-calculated commission invoice (rate × deal value + VAT).",
    icon: FileText,
    emailSubject: "Commission Invoice — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal commission invoice. Keep the language short and professional. The calculation table is auto-rendered — do not duplicate the numbers in prose.",
    fields: [
      { key: "invoiceNumber", label: "Invoice No.", type: "text", placeholder: "INV-2026-001" },
      { key: "invoiceDate", label: "Invoice Date", type: "date" },
      { key: "recipientName", label: "Bill To", type: "text", required: true },
      { key: "propertyRef", label: "Property / Deal", type: "text", placeholder: "Villa 12, Palm Jumeirah" },
      { key: "dealValue", label: "Deal Value (AED)", type: "text", required: true, placeholder: "5,000,000" },
      { key: "commissionRate", label: "Commission Rate (%)", type: "text", required: true, placeholder: "2" },
      { key: "vatRate", label: "VAT Rate (%)", type: "text", placeholder: "5" },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "Net 7 days from transfer" },
    ],
  },
  {
    id: "internship_agreement",
    audience: "staff",
    label: "Internship Agreement",
    description: "Internship terms, stipend and learning objectives.",
    icon: GraduationCap,
    needsPosition: true,
    emailSubject: "Internship Offer — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft an internship agreement. Include: duration, learning objectives, stipend (if any), supervisor, working hours, confidentiality, completion certificate.",
    fields: [
      RECIPIENT_NAME,
      { key: "department", label: "Department", type: "text" },
      START_DATE,
      { key: "endDate", label: "End Date", type: "date" },
      { key: "stipend", label: "Monthly Stipend", type: "text", placeholder: "AED 2,000 (optional)" },
    ],
  },
  {
    id: "hr_letter",
    audience: "staff",
    label: "HR Letter",
    description: "General HR correspondence (salary, NOC, experience letter).",
    icon: Mail,
    emailSubject: "HR Letter — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal HR letter as instructed by the user. Common types: salary certificate, NOC, experience letter, employment verification.",
    fields: [
      RECIPIENT_NAME,
      { key: "letterType", label: "Letter Type", type: "select", required: true, options: [
        { value: "salary_certificate", label: "Salary Certificate" },
        { value: "noc", label: "NOC (No Objection)" },
        { value: "experience", label: "Experience Letter" },
        { value: "employment_verification", label: "Employment Verification" },
      ]},
      { key: "jobTitle", label: "Position", type: "text" },
      { key: "notes", label: "Specific Instructions", type: "textarea", placeholder: "Addressed to, purpose, specifics…" },
    ],
  },
  {
    id: "partnership_referral",
    audience: "staff",
    label: "Partnership / Referral Agreement",
    description: "Referral or partner introducer terms.",
    icon: Handshake,
    emailSubject: "Partnership Agreement — JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a partnership/referral agreement. Cover: scope, referral fee %, payment trigger, exclusivity, term, non-circumvention, governing law (UAE).",
    fields: [
      { key: "recipientName", label: "Partner Name", type: "text", required: true },
      { key: "counterparty", label: "Partner Company", type: "text" },
      { key: "referralFee", label: "Referral Fee", type: "text", placeholder: "e.g., 10% of net commission" },
      { key: "term", label: "Term", type: "text", placeholder: "12 months, auto-renew" },
      START_DATE,
    ],
  },
  // NOTE: Candidate CV intentionally removed from the contracts catalog.
  // CVs are NOT contracts — they live in the standalone CV Builder under
  // /owner/careers-portal?section=cv-builder. See src/components/careers-portal/CVBuilder.tsx

  {
    id: "custom_staff",
    audience: "staff",
    label: "Custom Letter",
    description: "Any other HR / internal document.",
    icon: FileText,
    emailSubject: "JBJ GLOBAL REAL ESTATE — Document",
    aiInstructions: "Draft the document as described by the user. Maintain JBJ premium tone.",
    fields: [
      RECIPIENT_NAME,
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "notes", label: "Document Brief", type: "textarea", required: true, placeholder: "Describe what this document should say…" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// SECONDARY-MARKET RERA FORMS — appended to STAFF so they appear in
// Careers Portal · Contracts & Templates alongside HR docs.
// These are the standard Dubai Land Department / RERA brokerage forms
// used for resale, listing, buyer representation and cancellation.
// ─────────────────────────────────────────────────────────────────────
STAFF.push(
  {
    id: "form_a",
    audience: "staff",
    label: "Form A — Contract Between Seller & Broker",
    description: "Official RERA listing authorisation (Bylaw No. 85 of 2006). Renders full legal clauses.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Form A — Listing Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. The full RERA legal clauses are auto-rendered — do NOT restate them.",
    fields: [
      // Seller
      { key: "recipientName", label: "Seller Full Name", type: "text", required: true },
      { key: "sellerNationality", label: "Seller Nationality", type: "text" },
      { key: "sellerIdNumber", label: "Seller Emirates ID / Passport No.", type: "text", required: true },
      { key: "sellerPhone", label: "Seller Mobile", type: "text" },
      { key: "sellerEmail", label: "Seller Email", type: "text" },
      { key: "sellerAddress", label: "Seller Address", type: "text" },
      // Property
      { key: "propertyRef", label: "Property Address", type: "text", required: true },
      { key: "titleDeedNo", label: "DLD Title Deed / Oqood No.", type: "text", required: true },
      { key: "propertyType", label: "Property Type", type: "text", placeholder: "Apartment / Villa / Office" },
      { key: "buaSqft", label: "BUA (sq.ft)", type: "text" },
      { key: "status", label: "Status", type: "text", placeholder: "Vacant / Tenanted" },
      { key: "listingPrice", label: "Listing Price (AED)", type: "text", required: true },
      // Terms
      { key: "commissionRate", label: "Commission Rate (%)", type: "text", placeholder: "2" },
      { key: "exclusivity", label: "Exclusivity", type: "text", placeholder: "exclusive / non-exclusive" },
      { key: "term", label: "Listing Term", type: "text", placeholder: "90 days" },
      START_DATE,
      // Broker (JBJ)
      { key: "brokerName", label: "JBJ Registered Broker Name", type: "text", required: true },
      { key: "brn", label: "Broker Registration No. (BRN)", type: "text", required: true },
      { key: "orn", label: "Office Registration No. (ORN)", type: "text", required: true },
      { key: "brokerPhone", label: "Broker Mobile", type: "text" },
      { key: "brokerEmail", label: "Broker Email", type: "text" },
    ],
  },
  {
    id: "form_b",
    audience: "staff",
    label: "Form B — Contract Between Buyer & Broker",
    description: "Official RERA buyer representation agreement (Bylaw No. 85 of 2006).",
    icon: UserSquare2,
    needsClient: true,
    emailSubject: "Form B — Buyer Representation · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. RERA legal clauses are auto-rendered.",
    fields: [
      { key: "recipientName", label: "Buyer Full Name", type: "text", required: true },
      { key: "buyerNationality", label: "Buyer Nationality", type: "text" },
      { key: "buyerIdNumber", label: "Buyer Emirates ID / Passport No.", type: "text", required: true },
      { key: "buyerPhone", label: "Buyer Mobile", type: "text" },
      { key: "buyerEmail", label: "Buyer Email", type: "text" },
      { key: "buyerAddress", label: "Buyer Address", type: "text" },
      { key: "searchCriteria", label: "Preferred Area(s)", type: "textarea" },
      { key: "propertyType", label: "Property Type", type: "text" },
      { key: "bedrooms", label: "Bedrooms", type: "text" },
      { key: "budget", label: "Budget (AED)", type: "text", required: true },
      { key: "financing", label: "Financing", type: "text", placeholder: "Cash / Mortgage" },
      { key: "intendedUse", label: "Intended Use", type: "text", placeholder: "End-use / Investment" },
      { key: "commissionRate", label: "Commission Rate (%)", type: "text", placeholder: "2" },
      { key: "exclusivity", label: "Exclusivity", type: "text", placeholder: "exclusive / non-exclusive" },
      { key: "term", label: "Representation Term", type: "text", placeholder: "90 days" },
      START_DATE,
      { key: "brokerName", label: "JBJ Registered Broker Name", type: "text", required: true },
      { key: "brn", label: "Broker Registration No. (BRN)", type: "text", required: true },
      { key: "orn", label: "Office Registration No. (ORN)", type: "text", required: true },
      { key: "brokerPhone", label: "Broker Mobile", type: "text" },
      { key: "brokerEmail", label: "Broker Email", type: "text" },
    ],
  },
  {
    id: "form_f",
    audience: "staff",
    label: "Form F — Memorandum of Understanding (Sale)",
    description: "RERA Sale MoU between Seller (A), Buyer (B) and Broker (C). 10% deposit + DLD transfer clauses.",
    icon: ClipboardCheck,
    needsClient: true,
    emailSubject: "Form F — Sale MoU · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. RERA MoU clauses (deposit, default, transfer, governing law) are auto-rendered.",
    fields: [
      // Buyer (recipient)
      { key: "recipientName", label: "Buyer Full Name", type: "text", required: true },
      { key: "buyerNationality", label: "Buyer Nationality", type: "text" },
      { key: "buyerIdNumber", label: "Buyer Emirates ID / Passport No.", type: "text", required: true },
      { key: "buyerPhone", label: "Buyer Mobile", type: "text" },
      { key: "buyerEmail", label: "Buyer Email", type: "text" },
      // Seller
      { key: "sellerName", label: "Seller Full Name", type: "text", required: true },
      { key: "sellerNationality", label: "Seller Nationality", type: "text" },
      { key: "sellerIdNumber", label: "Seller Emirates ID / Passport No.", type: "text", required: true },
      { key: "sellerPhone", label: "Seller Mobile", type: "text" },
      { key: "sellerEmail", label: "Seller Email", type: "text" },
      // Property
      { key: "propertyRef", label: "Property Address", type: "text", required: true },
      { key: "titleDeedNo", label: "DLD Title Deed No.", type: "text", required: true },
      { key: "propertyType", label: "Property Type", type: "text" },
      { key: "buaSqft", label: "BUA (sq.ft)", type: "text" },
      // Deal
      { key: "price", label: "Sale Price (AED)", type: "text", required: true },
      { key: "deposit", label: "Deposit (AED — typically 10%)", type: "text" },
      { key: "completionDate", label: "Transfer / Completion Date", type: "date", required: true },
      { key: "mortgage", label: "Mortgage", type: "text", placeholder: "Yes / No" },
      { key: "commissionRate", label: "Commission Rate (%)", type: "text", placeholder: "2" },
      // Broker
      { key: "brokerName", label: "JBJ Registered Broker Name", type: "text", required: true },
      { key: "brn", label: "Broker Registration No. (BRN)", type: "text", required: true },
      { key: "orn", label: "Office Registration No. (ORN)", type: "text", required: true },
    ],
  },
  {
    id: "form_i",
    audience: "staff",
    label: "Form I — Brokers Notification (Co-Broking)",
    description: "RERA co-broking registration between two registered brokerages (A & B).",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Form I — Co-Broking · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. RERA co-broking clauses are auto-rendered.",
    fields: [
      { key: "jbjSide", label: "JBJ side", type: "select", group: "Party A", options: [
        { value: "A", label: "Party A / Agent A" },
        { value: "B", label: "Party B / Agent B" },
        { value: "none", label: "Manual — no JBJ prefill" },
      ]},
      { key: "partyAEstablishment", label: "Party A — Name of Establishment", type: "text", group: "Party A" },
      { key: "partyAAddress", label: "Party A — Address", type: "text", group: "Party A" },
      { key: "partyAPhone", label: "Party A — Phone", type: "text", group: "Party A" },
      { key: "partyAFax", label: "Party A — Fax", type: "text", group: "Party A" },
      { key: "partyAEmail", label: "Party A — Email", type: "text", group: "Party A" },
      { key: "partyAOrn", label: "Party A — ORN", type: "text", group: "Party A" },
      { key: "partyADedLicence", label: "Party A — DED Licence", type: "text", group: "Party A" },
      { key: "partyAPoBox", label: "Party A — P.O. Box", type: "text", group: "Party A" },
      { key: "partyAAgentName", label: "Party A — Registered Agent Name", type: "text", group: "Party A" },
      { key: "partyABrn", label: "Party A — Broker Reg. No. (BRN)", type: "text", group: "Party A" },
      { key: "partyADateIssued", label: "Party A — BRN Date Issued", type: "text", group: "Party A", placeholder: "24 / 05 / 2024" },
      { key: "partyAMobile", label: "Party A — Mobile", type: "text", group: "Party A" },
      { key: "partyAAgentEmail", label: "Party A — Agent Email", type: "text", group: "Party A" },
      { key: "partyAFormStr", label: "Party A — Sellers/Landlords Form A STR#", type: "text", group: "Party A" },
      { key: "partyBEstablishment", label: "Party B — Name of Establishment", type: "text", group: "Party B" },
      { key: "partyBAddress", label: "Party B — Address", type: "text", group: "Party B" },
      { key: "partyBPhone", label: "Party B — Phone", type: "text", group: "Party B" },
      { key: "partyBFax", label: "Party B — Fax", type: "text", group: "Party B" },
      { key: "partyBEmail", label: "Party B — Email", type: "text", group: "Party B" },
      { key: "partyBOrn", label: "Party B — ORN", type: "text", group: "Party B" },
      { key: "partyBDedLicence", label: "Party B — DED Licence", type: "text", group: "Party B" },
      { key: "partyBPoBox", label: "Party B — P.O. Box", type: "text", group: "Party B" },
      { key: "partyBAgentName", label: "Party B — Registered Agent Name", type: "text", group: "Party B" },
      { key: "partyBBrn", label: "Party B — Broker Reg. No. (BRN)", type: "text", group: "Party B" },
      { key: "partyBDateIssued", label: "Party B — BRN Date Issued", type: "text", group: "Party B", placeholder: "__ / __ / ____" },
      { key: "partyBMobile", label: "Party B — Mobile", type: "text", group: "Party B" },
      { key: "partyBAgentEmail", label: "Party B — Agent Email", type: "text", group: "Party B" },
      { key: "partyBFormStr", label: "Party B — Buyers/Tenants Form B STR#", type: "text", group: "Party B" },
      { key: "strNumber", label: "STR#", type: "text", group: "Property & Commission" },
      START_DATE,
      { key: "propertyRef", label: "Property Address", type: "text", required: true, group: "Property & Commission" },
      { key: "masterDeveloper", label: "Master Developer", type: "text", group: "Property & Commission" },
      { key: "masterProject", label: "Master Project Name", type: "text", group: "Property & Commission" },
      { key: "buildingName", label: "Building Name", type: "text", group: "Property & Commission" },
      { key: "listingPrice", label: "Listed Price (AED)", type: "text", group: "Property & Commission" },
      { key: "propertyDescription", label: "Description", type: "text", group: "Property & Commission" },
      { key: "mouExists", label: "Does MOU exist?", type: "select", group: "Property & Commission", options: [{ value: "YES", label: "YES" }, { value: "NO", label: "NO" }, { value: "N/A", label: "N/A" }] },
      { key: "propertyTenanted", label: "Is the property tenanted?", type: "select", group: "Property & Commission", options: [{ value: "YES", label: "YES" }, { value: "NO", label: "NO" }] },
      { key: "maintenanceFee", label: "Maintenance Fee p.a. / sq.ft", type: "text", group: "Property & Commission" },
      { key: "commissionTotal", label: "Commission Total (AED)", type: "text", group: "Property & Commission" },
      { key: "commissionPctA", label: "Agent A Commission %", type: "text", group: "Property & Commission" },
      { key: "commissionPctB", label: "Agent B Commission %", type: "text", group: "Property & Commission" },
      { key: "buyerFamilyName", label: "Buyer’s/Tenant’s Name (family name only)", type: "text", group: "Property & Commission" },
      { key: "buyerBudget", label: "Budget", type: "text", group: "Property & Commission" },
      { key: "buyerPreFinance", label: "Buyer Pre-Finance Approved?", type: "select", group: "Property & Commission", options: [{ value: "YES", label: "YES" }, { value: "NO", label: "NO" }, { value: "N/A", label: "N/A" }] },
      { key: "buyerContactedAgentA", label: "Buyer/Tenant contacted Agent A?", type: "select", group: "Property & Commission", options: [{ value: "YES", label: "YES" }, { value: "NO", label: "NO" }, { value: "N/A", label: "N/A" }] },
    ],
  },
  {
    id: "form_u",
    audience: "staff",
    label: "Form U — Cancellation of Agency",
    description: "RERA Form U mutual cancellation of a Form A or Form B agreement.",
    icon: FileText,
    needsClient: true,
    emailSubject: "Form U — Cancellation · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. RERA cancellation clauses are auto-rendered.",
    fields: [
      { key: "recipientName", label: "Counterparty Full Name", type: "text", required: true },
      { key: "counterpartyId", label: "Counterparty Emirates ID / Passport", type: "text" },
      { key: "originalForm", label: "Original Form (A or B) Reference", type: "text", required: true, placeholder: "Form A · ref…" },
      { key: "originalDate", label: "Original Sign Date", type: "date" },
      { key: "propertyRef", label: "Property / Representation Ref.", type: "text", required: true },
      { key: "effectiveDate", label: "Effective Termination Date", type: "date", required: true },
      { key: "reason", label: "Reason for Cancellation", type: "textarea" },
      { key: "brokerName", label: "JBJ Registered Broker Name", type: "text", required: true },
      { key: "brn", label: "Broker Registration No. (BRN)", type: "text", required: true },
    ],
  },
  {
    id: "broker_referral",
    audience: "staff",
    label: "Agent-to-Agent Agreement",
    description: "Internal commercial referral between two RERA brokerages. Not a RERA-issued form.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Broker Referral · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. Clauses are auto-rendered.",
    fields: [
      { key: "recipientName", label: "Receiving Brokerage", type: "text", required: true },
      { key: "counterpartyOrn", label: "Receiving Brokerage ORN", type: "text" },
      { key: "counterpartyAgent", label: "Receiving Agent", type: "text" },
      { key: "leadName", label: "Referred Lead / Client", type: "text", required: true },
      { key: "propertyRef", label: "Property / Project (if any)", type: "text" },
      { key: "referralFee", label: "Referral Fee", type: "text", required: true, placeholder: "25% of net commission" },
      START_DATE,
      { key: "brokerName", label: "JBJ Referring Broker", type: "text", required: true },
      { key: "orn", label: "JBJ Office ORN", type: "text", required: true },
    ],
  },
);

// ─────────────────────────────────────────────────────────────────────
// PARTNERS — Premium partnership agreement family
// Shown under a "Partners" group in the catalog dropdown. AI-assisted
// drafting for bespoke clauses; structure + JBJ prefill + stamp locked.
// ─────────────────────────────────────────────────────────────────────
const PARTNER_PARTY_A_FIELDS: DocumentField[] = [
  { key: "partyAEstablishment", label: "Party A — Company / Entity", type: "text", placeholder: "JBJ GLOBAL REAL ESTATE L.L.C S.O.C", group: "Party A" },
  { key: "partyAAddress", label: "Party A — Address", type: "text", placeholder: "Office SM1-195, Port Saeed, Deira, Dubai, UAE", group: "Party A" },
  { key: "partyAPhone", label: "Party A — Phone", type: "text", placeholder: "+971 54 716 7107", group: "Party A" },
  { key: "partyAEmail", label: "Party A — Email", type: "text", placeholder: "contact@jbj.ae", group: "Party A" },
  { key: "partyALicence", label: "Party A — Licence / ORN", type: "text", placeholder: "Trade Licence 1591031 · ORN 41486", group: "Party A" },
  { key: "partyASignatory", label: "Party A — Authorised Signatory", type: "text", placeholder: "Jane Bou Jaoude", group: "Party A" },
  { key: "partyASignatoryTitle", label: "Party A — Signatory Title", type: "text", placeholder: "Founder & CEO", group: "Party A" },
];

const PARTNER_PARTY_B_FIELDS: DocumentField[] = [
  { key: "partnerName", label: "Party B — Full Name", type: "text", required: true, placeholder: "Authorised signatory / individual", group: "Party B" },
  { key: "partnerCompany", label: "Party B — Company / Entity", type: "text", placeholder: "Legal entity name", group: "Party B" },
  { key: "partnerLicence", label: "Party B — Jurisdiction / Licence #", type: "text", placeholder: "e.g., Dubai DED, RERA ORN, foreign", group: "Party B" },
  { key: "partnerPhone", label: "Party B — Phone", type: "text", group: "Party B" },
  { key: "partnerEmail", label: "Party B — Email", type: "text", group: "Party B" },
  { key: "partnerAddress", label: "Party B — Address", type: "text", group: "Party B" },
  { key: "partnerSignatory", label: "Party B — Authorised Signatory", type: "text", placeholder: "If different from above", group: "Party B" },
  { key: "partnerSignatoryTitle", label: "Party B — Signatory Title", type: "text", placeholder: "e.g., Managing Director", group: "Party B" },
];

STAFF.push(
  {
    id: "partner_referral",
    audience: "staff",
    label: "Partner — Referral Partner",
    description: "Commission share on closed real-estate transactions referred by Party B.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Referral Partnership Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. The clauses, commercial terms and signature block are auto-rendered.",
    fields: [
      ...PARTNER_PARTY_A_FIELDS,
      ...PARTNER_PARTY_B_FIELDS,
      { key: "referralFee", label: "Referral Fee", type: "text", required: true, placeholder: "25% of net commission" },
      { key: "scope", label: "Scope / Geography", type: "text", placeholder: "UAE-wide · Resale · Off-plan" },
      { key: "term", label: "Term", type: "text", placeholder: "12 months, auto-renew" },
      START_DATE,
    ],
  },
  {
    id: "partner_marketing",
    audience: "staff",
    label: "Partner — Marketing / Co-Branding",
    description: "Joint campaigns, shared leads, mutual logo-usage rights.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Marketing & Co-Branding Partnership · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. The brand-usage clauses, lead-share split and signatures are auto-rendered.",
    fields: [
      ...PARTNER_PARTY_A_FIELDS,
      ...PARTNER_PARTY_B_FIELDS,
      { key: "scope", label: "Campaign Scope", type: "textarea", placeholder: "e.g., Q2 luxury Palm campaign, joint webinar series…" },
      { key: "channels", label: "Channels", type: "text", placeholder: "Instagram, LinkedIn, email, events" },
      { key: "leadSplit", label: "Lead-Share Split", type: "text", placeholder: "50 / 50 on co-branded leads" },
      { key: "term", label: "Term", type: "text", placeholder: "12 months" },
      START_DATE,
    ],
  },
  {
    id: "partner_investor",
    audience: "staff",
    label: "Partner — Investor / Capital",
    description: "Profit share on a specific project or fund vehicle.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Investor / Capital Partnership · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. Profit-share, capital protection, reporting and exit clauses are auto-rendered.",
    fields: [
      ...PARTNER_PARTY_A_FIELDS,
      ...PARTNER_PARTY_B_FIELDS,
      { key: "projectName", label: "Project / Vehicle", type: "text", required: true },
      { key: "capitalAmount", label: "Capital Contribution (AED)", type: "text", required: true },
      { key: "fundingSchedule", label: "Funding Schedule", type: "text", placeholder: "e.g., 50% on signing, 50% on milestone" },
      { key: "profitShare", label: "Profit Share", type: "text", required: true, placeholder: "e.g., 70 / 30 after capital return" },
      { key: "exitHorizon", label: "Exit Horizon", type: "text", placeholder: "e.g., 24 months / on sale" },
      { key: "term", label: "Term", type: "text", placeholder: "Until exit event" },
      START_DATE,
    ],
  },
  {
    id: "partner_strategic",
    audience: "staff",
    label: "Partner — Strategic Brokerage (Cross-Market)",
    description: "Reciprocal listings, white-label rights, geographic split.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Strategic Brokerage Partnership · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a 1–2 sentence cover paragraph only. Reciprocity, white-label, non-circumvention and split clauses are auto-rendered.",
    fields: [
      ...PARTNER_PARTY_A_FIELDS,
      ...PARTNER_PARTY_B_FIELDS,
      { key: "territoryA", label: "Party A Territory (JBJ)", type: "text", placeholder: "United Arab Emirates" },
      { key: "territoryB", label: "Party B Territory", type: "text", required: true, placeholder: "e.g., KSA · UK · India" },
      { key: "brandingMode", label: "Branding Mode", type: "select", options: [
        { value: "Co-branded", label: "Co-branded (default)" },
        { value: "White-label", label: "White-label" },
        { value: "Full disclosure", label: "Full disclosure" },
      ]},
      { key: "commissionSplit", label: "Commission Split", type: "text", required: true, placeholder: "50 / 50 of net commission" },
      { key: "term", label: "Term", type: "text", placeholder: "12 months, auto-renew" },
      START_DATE,
    ],
  },
  {
    id: "partner_custom",
    audience: "staff",
    label: "Partner — Other / Custom",
    description: "Bespoke partnership — AI drafts tailored clauses from your brief.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Partnership Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft the bespoke partnership clauses ONLY based on the user's brief. Do NOT restate parties, header, or signatures — those are auto-rendered. Use numbered clauses, UAE governing law, clear obligations.",
    fields: [
      ...PARTNER_PARTY_A_FIELDS,
      ...PARTNER_PARTY_B_FIELDS,
      { key: "customTitle", label: "Agreement Title", type: "text", placeholder: "e.g., Joint Venture · Service Partnership" },
      { key: "customSubtitle", label: "Subtitle", type: "text", placeholder: "e.g., Bespoke commercial collaboration" },
      { key: "scope", label: "Scope", type: "textarea", required: true, placeholder: "Describe what each party does…" },
      { key: "mechanism", label: "Commercial Mechanism", type: "text", placeholder: "How value flows between the parties" },
      { key: "term", label: "Term", type: "text", placeholder: "12 months" },
      START_DATE,
    ],
  },
);



// ─────────────────────────────────────────────────────────────────────
// CLIENT catalog — Forms & Contracts hub (real-estate clients)
// ─────────────────────────────────────────────────────────────────────
const CLIENT: DocumentTemplate[] = [

  {
    id: "ai_home_finder_report",
    audience: "client",
    label: "AI Home Finder Report",
    description: "Reusable premium JBJ proposal pack: cover, client brief, matched properties, comparison matrix, property pages, AI summary and consultant contact page.",
    icon: Home,
    needsClient: true,
    emailSubject: "AI Home Finder Recommendation Report · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft concise client-facing copy for an AI Home Finder recommendation report. Keep the tone premium, consultant-led and proposal-grade. Do NOT create fake developer logos, fake images or alternate colors; the rendered report template supplies the locked JBJ palette, imagery, header/footer and property sections.",
    fields: [
      { key: "recipientName", label: "Client / Investor Name", type: "text", required: true, placeholder: "e.g., Mr. Ahmed Al Mansoori" },
      { key: "searchBrief", label: "Client Requirements", type: "textarea", required: true, placeholder: "Budget, bedrooms, emirate, areas, lifestyle/investment purpose, timeline…" },
      { key: "projectShortlist", label: "Matched Project Shortlist", type: "textarea", placeholder: "Project #1, Project #2, Project #3" },
      { key: "recommendation", label: "Consultant Recommendation", type: "textarea", placeholder: "Why the lead option is recommended and what to verify next." },
      { key: "nextSteps", label: "Next Steps", type: "textarea", placeholder: "Confirm availability, compare payment plans, reserve unit…" },
    ],
  },
  {
    id: "jbj_branded_proposal_letterhead",
    audience: "client",
    label: "JBJ Letterhead",
    description: "Company-profile style letterhead / branded proposal material using the locked champagne, emerald-black ombre and premium black palette.",
    icon: FileText,
    needsClient: true,
    emailSubject: "JBJ Branded Proposal · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a polished JBJ branded proposal letter body only. Maintain a premium UAE real-estate tone. The Document Studio shell supplies the official JBJ letterhead, monogram, footer, signature and locked palette; do not restate header/footer details or introduce random colors.",
    fields: [
      { key: "recipientName", label: "Recipient Name", type: "text", required: true, placeholder: "e.g., Ms. Sarah Khan" },
      { key: "proposalTitle", label: "Proposal Title", type: "text", required: true, placeholder: "e.g., Off-Plan Investment Proposal" },
      { key: "proposalPurpose", label: "Proposal Purpose", type: "textarea", required: true, placeholder: "Explain the proposal objective and client context." },
      { key: "scope", label: "Scope / Services", type: "textarea", placeholder: "Advisory scope, property search, due diligence, negotiation support…" },
      { key: "commercialNotes", label: "Commercial Notes", type: "textarea", placeholder: "Fees, timeline, assumptions, validity period…" },
      { key: "nextSteps", label: "Next Steps", type: "textarea", placeholder: "What the client should approve or provide next." },
    ],
  },

  {
    id: "paa",
    audience: "staff",
    label: "Property Advertising Agreement (PAA)",
    description: "Owner consent to advertise a leasing property.",
    icon: Stamp,
    needsClient: true,
    emailSubject: "Property Advertising Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a Property Advertising Agreement for leasing. Include: owner consent to advertise, asking rent, period, exclusivity (if any), broker commission.",
    fields: [
      { key: "recipientName", label: "Owner Name", type: "text", required: true },
      { key: "propertyRef", label: "Property Address", type: "text", required: true },
      { key: "askingRent", label: "Asking Rent (AED/year)", type: "text" },
      { key: "term", label: "Advertising Period", type: "text", placeholder: "e.g., 60 days exclusive" },
      START_DATE,
    ],
  },
  {
    id: "tenancy_addendum",
    audience: "client",
    label: "Tenancy Addendum",
    description: "Amendment or clause added to an Ejari tenancy contract.",
    icon: Key,
    needsClient: true,
    emailSubject: "Tenancy Contract Addendum · JBJ GLOBAL REAL ESTATE",
    aiInstructions: "Draft a tenancy addendum referencing the Ejari contract number, parties and the new clause(s).",
    fields: [
      { key: "recipientName", label: "Tenant Name", type: "text", required: true },
      { key: "landlordName", label: "Landlord Name", type: "text" },
      { key: "ejariNumber", label: "Ejari Contract #", type: "text" },
      { key: "addendumText", label: "Addendum Content", type: "textarea", required: true },
    ],
  },
  {
    id: "holiday_home_agreement",
    audience: "staff",
    label: "Holiday Home — Booking Agreement",
    description: "Short-stay holiday home booking with pre-filled non-refundable terms.",
    icon: Home,
    needsClient: true,
    emailSubject: "Holiday Home Booking Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a concise 1-paragraph confirmation introduction acknowledging the guest's booking. DO NOT restate the terms — the terms & conditions table and non-refund clauses are auto-rendered. Keep tone warm but firm and professional.",
    fields: [
      { key: "recipientName", label: "Guest Full Name (as per ID)", type: "text", required: true, placeholder: "e.g., John Doe" },
      { key: "idType", label: "ID Type", type: "select", options: [
        { value: "Emirates ID Holder", label: "Emirates ID Holder" },
        { value: "Passport Holder", label: "Passport Holder" },
        { value: "GCC National ID Holder", label: "GCC National ID Holder" },
      ]},
      { key: "idNumber", label: "ID / Passport Number", type: "text", placeholder: "e.g., 784-XXXX-XXXXXXX-X" },
      { key: "nationality", label: "Nationality", type: "text", placeholder: "e.g., French" },
      { key: "bookingDate", label: "Date of Booking", type: "date" },
      { key: "guestPhone", label: "Guest Phone / WhatsApp", type: "text" },
      { key: "propertyName", label: "Property / Unit Name", type: "text", required: true, placeholder: "Marina Heights — Apt 1204" },
      { key: "propertyAddress", label: "Property Address", type: "text", required: true },
      { key: "roomType", label: "Room / Unit Type", type: "select", required: true, options: [
        { value: "Studio", label: "Studio" },
        { value: "1-Bedroom", label: "1-Bedroom Apartment" },
        { value: "2-Bedroom", label: "2-Bedroom Apartment" },
        { value: "3-Bedroom", label: "3-Bedroom Apartment" },
        { value: "Penthouse", label: "Penthouse" },
        { value: "Villa", label: "Villa" },
        { value: "Master Room", label: "Master Room" },
        { value: "Single Room", label: "Single Room" },
      ]},
      { key: "unitSize", label: "Unit Size (sq ft)", type: "text", placeholder: "e.g., 1,200" },
      { key: "guestsCount", label: "Number of Guests", type: "number", placeholder: "2" },
      { key: "checkIn", label: "Check-in Date", type: "date", required: true },
      { key: "checkOut", label: "Check-out Date", type: "date", required: true },
      { key: "nights", label: "Number of Nights", type: "number", required: true, placeholder: "7" },
      { key: "nightlyRate", label: "Nightly Rate (AED)", type: "text", placeholder: "650" },
      { key: "cleaningFee", label: "Cleaning Fee (AED)", type: "text", placeholder: "Optional" },
      { key: "securityDeposit", label: "Security Deposit (AED)", type: "text", placeholder: "Optional · refundable" },
      { key: "paymentStatus", label: "Payment Status", type: "select", required: true, options: [
        { value: "Paid in Full", label: "Paid in Full (auto-fills paid amount)" },
        { value: "Partial Payment", label: "Partial Payment" },
        { value: "Pending", label: "Pending" },
      ]},
      { key: "paidNow", label: "Amount Paid So Far (AED) — partial only", type: "text", placeholder: "Only if Partial Payment" },
      { key: "balanceDueDate", label: "Balance Due Date", type: "date" },
      { key: "paymentMethod", label: "Payment Method", type: "select", options: [
        { value: "Bank Transfer", label: "Bank Transfer" },
        { value: "Credit Card", label: "Credit Card" },
        { value: "Cash", label: "Cash" },
        { value: "Online (Stripe/Link)", label: "Online (Stripe / Link)" },
      ]},
      { key: "paymentDate", label: "Payment Date", type: "date" },
      { key: "bookingSource", label: "Booking Source", type: "select", options: [
        { value: "Direct", label: "Direct (JBJ)" },
        { value: "Booking.com", label: "Booking.com" },
        { value: "Airbnb", label: "Airbnb" },
        { value: "Agoda", label: "Agoda" },
        { value: "WhatsApp", label: "WhatsApp" },
        { value: "Other", label: "Other" },
      ]},
      { key: "externalRef", label: "External Reference #", type: "text", placeholder: "e.g., Booking.com confirmation #" },
      { key: "bookingRef", label: "Booking ID (auto if blank)", type: "text", placeholder: "auto: JBJ-HH-…" },
    ],
  },
  {
    id: "facility_management_agreement",
    audience: "staff",
    label: "Facility Management Agreement",
    description: "Property facility management contract — scope, term and fees.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Facility Management Agreement · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal facility management agreement introduction (1-2 short paragraphs). DO NOT restate the scope table or terms — they are auto-rendered. Cover purpose only.",
    fields: [
      { key: "recipientName", label: "Owner / Client Name", type: "text", required: true },
      { key: "propertyName", label: "Property / Building Name", type: "text", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", required: true },
      { key: "unitsCount", label: "Number of Units", type: "text", placeholder: "e.g., 24" },
      { key: "totalArea", label: "Total Managed Area (sq ft)", type: "text" },
      { key: "scope", label: "Scope of Services", type: "textarea", required: true, placeholder: "e.g., Common-area cleaning, MEP maintenance, security coordination, vendor management, tenant relations, monthly reporting…" },
      { key: "startDate", label: "Start Date", type: "date", required: true },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "term", label: "Contract Term", type: "text", placeholder: "e.g., 12 months, auto-renewable" },
      { key: "monthlyFee", label: "Monthly Management Fee (AED)", type: "text", required: true },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "Monthly in advance, Net 7" },
      { key: "responseTime", label: "Emergency Response SLA", type: "text", placeholder: "Within 4 hours, 24/7" },
      { key: "notes", label: "Additional Clauses", type: "textarea" },
    ],
  },
  {
    id: "maintenance_request",
    audience: "client",
    label: "Maintenance Request / Work Order",
    description: "After-sale maintenance instruction with property, issue, vendor and approval fields.",
    icon: ClipboardCheck,
    needsClient: true,
    emailSubject: "Maintenance Request · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a professional maintenance work order. Include the property, issue summary, requested action, access instructions, urgency, vendor coordination and owner/client approval note. Keep it operational and clear.",
    fields: [
      { key: "recipientName", label: "Owner / Client Name", type: "text", required: true },
      { key: "propertyRef", label: "Property / Unit", type: "text", required: true },
      { key: "issueSummary", label: "Issue Summary", type: "textarea", required: true, placeholder: "AC leak, plumbing, electrical, snagging…" },
      { key: "urgency", label: "Urgency", type: "select", options: [
        { value: "Normal", label: "Normal" },
        { value: "Urgent", label: "Urgent" },
        { value: "Emergency", label: "Emergency" },
      ]},
      { key: "vendorName", label: "Vendor / Contractor", type: "text" },
      { key: "estimatedCost", label: "Estimated Cost (AED)", type: "text" },
      { key: "accessInstructions", label: "Access Instructions", type: "textarea" },
      { key: "targetDate", label: "Target Completion Date", type: "date" },
    ],
  },
  {
    id: "interior_design_quotation",
    audience: "client",
    label: "Interior Design Quotation",
    description: "After-sale quotation for furnishing, styling, fit-out or interior design services.",
    icon: Home,
    needsClient: true,
    emailSubject: "Interior Design Quotation · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a premium interior design quotation. Cover design scope, rooms/areas, deliverables, timeline, fee, exclusions, validity and next steps. Use a concise luxury real-estate tone.",
    fields: [
      { key: "recipientName", label: "Client Name", type: "text", required: true },
      { key: "propertyRef", label: "Property / Unit", type: "text", required: true },
      { key: "scope", label: "Scope", type: "textarea", required: true, placeholder: "Furniture package, curtains, lighting, fit-out, styling…" },
      { key: "areas", label: "Areas / Rooms", type: "text", placeholder: "Living room, 2 bedrooms, balcony…" },
      { key: "quotedAmount", label: "Quoted Amount (AED)", type: "text", required: true },
      { key: "timeline", label: "Timeline", type: "text", placeholder: "e.g., 4–6 weeks" },
      { key: "validUntil", label: "Quotation Valid Until", type: "date" },
      { key: "notes", label: "Notes / Exclusions", type: "textarea" },
    ],
  },
  {
    id: "service_bill",
    audience: "client",
    label: "Service Bill / Invoice",
    description: "Bill clients for after-sale services, maintenance, utilities or management fees.",
    icon: FileText,
    needsClient: true,
    emailSubject: "Service Bill · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a short invoice cover note for services rendered. Reference invoice number, property/unit, services, total amount, due date and payment terms. Do not over-explain.",
    fields: [
      { key: "invoiceNumber", label: "Bill / Invoice No.", type: "text", required: true, placeholder: "JBJ-BILL-2026-001" },
      { key: "recipientName", label: "Bill To", type: "text", required: true },
      { key: "propertyRef", label: "Property / Unit", type: "text" },
      { key: "serviceDescription", label: "Services / Items", type: "textarea", required: true },
      { key: "amount", label: "Amount (AED)", type: "text", required: true },
      { key: "vat", label: "VAT (if applicable)", type: "text", placeholder: "5% / AED amount" },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "Net 7 days" },
    ],
  },
  {
    id: "client_quotation",
    audience: "client",
    label: "Client Quotation",
    description: "Generic after-sale quotation for services, upgrades, maintenance or consultancy.",
    icon: FileText,
    needsClient: true,
    emailSubject: "Quotation · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal quotation with scope, deliverables, price, validity, assumptions, exclusions and acceptance steps. Keep it clean and business-ready.",
    fields: [
      { key: "quotationNumber", label: "Quotation No.", type: "text", required: true },
      { key: "recipientName", label: "Client Name", type: "text", required: true },
      { key: "quotationTitle", label: "Quotation Title", type: "text", required: true },
      { key: "scope", label: "Scope / Deliverables", type: "textarea", required: true },
      { key: "quotedAmount", label: "Quoted Amount (AED)", type: "text", required: true },
      { key: "timeline", label: "Delivery Timeline", type: "text" },
      { key: "validUntil", label: "Valid Until", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    id: "developer_commission_invoice",
    audience: "client",
    label: "Developer Commission Invoice",
    description: "Invoice a developer after a closed deal with unit, commission percentage and payable amount.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Developer Commission Invoice · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a professional developer commission invoice cover note. Include project, unit, buyer/client, closing date, sale price, agreed commission percentage, amount due, VAT if applicable and payment deadline.",
    fields: [
      { key: "developerName", label: "Developer Name", type: "text", required: true, placeholder: "Search/select developer or type manually" },
      { key: "developerContact", label: "Developer Contact / Email", type: "text" },
      { key: "projectName", label: "Project", type: "text", required: true },
      { key: "unitNumber", label: "Unit Number", type: "text", required: true },
      { key: "buyerName", label: "Buyer / Client Name", type: "text", required: true },
      { key: "closingDate", label: "Deal Closing Date", type: "date", required: true },
      { key: "salePrice", label: "Sale Price (AED)", type: "text", required: true },
      { key: "commissionRate", label: "Commission %", type: "text", required: true },
      { key: "amountDue", label: "Amount Due (AED)", type: "text", required: true },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "Net 7 days from invoice" },
    ],
  },
  {
    id: "developer_payment_request",
    audience: "client",
    label: "Developer Payment Request",
    description: "Formal request to developer/accounts for commission or outstanding deal payment.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Developer Payment Request · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a concise payment request to a developer accounts team. Reference developer, project, unit, buyer, amount due, reason, documents attached and requested payment date.",
    fields: [
      { key: "developerName", label: "Developer Name", type: "text", required: true },
      { key: "accountsEmail", label: "Accounts Contact / Email", type: "text" },
      { key: "projectName", label: "Project", type: "text", required: true },
      { key: "unitNumber", label: "Unit Number", type: "text", required: true },
      { key: "buyerName", label: "Buyer / Client", type: "text" },
      { key: "amountDue", label: "Amount Due (AED)", type: "text", required: true },
      { key: "dueReason", label: "Reason / Milestone", type: "textarea", required: true, placeholder: "Closed deal, commission payable after SPA, booking accepted…" },
      { key: "requestedPaymentDate", label: "Requested Payment Date", type: "date" },
    ],
  },
  {
    id: "developer_closing_notice",
    audience: "client",
    label: "Developer Deal Closing Notice",
    description: "Notify developer of a closed deal and confirm commission, date, unit and client details.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Deal Closing Notice · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal closing notice to the developer. Confirm the closed deal, project/unit, buyer, date, broker details, commission entitlement, required documents and next payment steps.",
    fields: [
      { key: "developerName", label: "Developer Name", type: "text", required: true },
      { key: "projectName", label: "Project", type: "text", required: true },
      { key: "unitNumber", label: "Unit Number", type: "text", required: true },
      { key: "buyerName", label: "Buyer / Client Name", type: "text", required: true },
      { key: "closingDate", label: "Closing Date", type: "date", required: true },
      { key: "salePrice", label: "Sale Price (AED)", type: "text" },
      { key: "commissionRate", label: "Commission %", type: "text" },
      { key: "brokerName", label: "JBJ Broker / Consultant", type: "text" },
      { key: "notes", label: "Additional Notes", type: "textarea" },
    ],
  },
  {
    id: "custom_client",
    audience: "client",
    label: "Custom Client Letter",
    description: "Any other client-facing letter.",
    icon: FileText,
    needsClient: true,
    emailSubject: "JBJ GLOBAL REAL ESTATE — Document",
    aiInstructions: "Draft the client document as described. Maintain a polished, client-facing tone.",
    fields: [
      RECIPIENT_NAME,
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "notes", label: "Brief", type: "textarea", required: true },
    ],
  },
  // ─── Added RERA-aligned client documents ──────────────────────────
  // These slot into Document Studio as the single source of truth for
  // every form/agreement. Composers in src/templates/composers/index.ts
  // fall back to standardBody for any id not explicitly handled, which
  // produces a polished body using `notes` + the field set below.
  {
    id: "mou",
    audience: "client",
    label: "Memorandum of Understanding (MOU)",
    description: "Pre-contract MOU between buyer and seller — terms, price, deposit, timeline.",
    icon: Handshake,
    needsClient: true,
    emailSubject: "Memorandum of Understanding · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a binding Memorandum of Understanding between the buyer and seller for the property described. Cover: parties, property, agreed price, deposit, payment schedule, key milestones (SPA signing, transfer), exclusivity, governing law (UAE) and default. Keep clauses numbered and concise.",
    fields: [
      { key: "recipientName", label: "Buyer Full Name", type: "text", required: true },
      { key: "sellerName", label: "Seller Full Name", type: "text", required: true },
      { key: "propertyRef", label: "Property Address / Reference", type: "text", required: true },
      { key: "agreedPrice", label: "Agreed Price (AED)", type: "text", required: true },
      { key: "deposit", label: "Deposit (AED)", type: "text" },
      { key: "spaDate", label: "Target SPA Signing Date", type: "date" },
      { key: "transferDate", label: "Target Transfer Date", type: "date" },
      { key: "notes", label: "Additional Terms", type: "textarea" },
    ],
  },
  {
    id: "ejari_tenancy",
    audience: "client",
    label: "Tenancy Contract (Ejari)",
    description: "Full Ejari-style tenancy contract between landlord and tenant.",
    icon: Key,
    needsClient: true,
    emailSubject: "Tenancy Contract · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a complete Ejari-aligned tenancy contract. Include parties, property, annual rent, payment schedule (cheques), term (start/end), security deposit, agency commission, maintenance responsibilities, utilities, and Dubai-Land-Department / Ejari registration clause.",
    fields: [
      { key: "recipientName", label: "Tenant Full Name", type: "text", required: true },
      { key: "landlordName", label: "Landlord Full Name", type: "text", required: true },
      { key: "propertyRef", label: "Property Address", type: "text", required: true },
      { key: "annualRent", label: "Annual Rent (AED)", type: "text", required: true },
      { key: "chequeCount", label: "Number of Cheques", type: "text", placeholder: "e.g., 4" },
      { key: "securityDeposit", label: "Security Deposit (AED)", type: "text" },
      { key: "startDate", label: "Contract Start", type: "date", required: true },
      { key: "endDate", label: "Contract End", type: "date", required: true },
      { key: "commission", label: "Agency Commission (AED or %)", type: "text" },
      { key: "notes", label: "Additional Clauses", type: "textarea" },
    ],
  },
  {
    id: "noc",
    audience: "client",
    label: "No Objection Certificate (NOC)",
    description: "Developer / landlord NOC for sale, lease, fit-out or transfer.",
    icon: ShieldCheck,
    needsClient: true,
    emailSubject: "No Objection Certificate · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a formal No Objection Certificate confirming the issuer has no objection to the stated action (sale, lease, transfer, fit-out) by the named party for the specified property. Keep wording precise, single-purpose and signed/stamped on the last page.",
    fields: [
      { key: "recipientName", label: "Issued To (Name)", type: "text", required: true },
      { key: "issuerName", label: "Issuing Party (Developer / Landlord)", type: "text", required: true },
      { key: "propertyRef", label: "Property / Unit Reference", type: "text", required: true },
      { key: "purpose", label: "Purpose of NOC", type: "select", required: true, options: [
        { value: "sale", label: "Sale / Transfer of Ownership" },
        { value: "lease", label: "Lease / Sub-lease" },
        { value: "fitout", label: "Fit-Out / Renovation" },
        { value: "utility", label: "Utility Connection (DEWA / Cooling)" },
        { value: "other", label: "Other (specify in notes)" },
      ]},
      { key: "issueDate", label: "Issue Date", type: "date", required: true },
      { key: "validUntil", label: "Valid Until", type: "date" },
      { key: "notes", label: "Additional Details", type: "textarea" },
    ],
  },
  {
    id: "property_reservation",
    audience: "client",
    label: "Property Reservation Form",
    description: "Off-plan / secondary reservation: holds a unit pending SPA.",
    icon: ClipboardCheck,
    needsClient: true,
    emailSubject: "Property Reservation Form · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a property reservation form confirming the buyer's intent to purchase the unit, the reservation deposit received, the validity window of the reservation, and the next steps to convert into an SPA. Keep wording short, formal and binding.",
    fields: [
      { key: "recipientName", label: "Buyer Full Name", type: "text", required: true },
      { key: "propertyRef", label: "Unit / Property Reference", type: "text", required: true },
      { key: "projectName", label: "Project / Tower Name", type: "text" },
      { key: "reservationFee", label: "Reservation Deposit (AED)", type: "text", required: true },
      { key: "totalPrice", label: "Indicative Total Price (AED)", type: "text" },
      { key: "paymentMethod", label: "Payment Method", type: "text", placeholder: "Bank transfer / cheque / card" },
      { key: "validUntil", label: "Reservation Valid Until", type: "date", required: true },
      { key: "notes", label: "Additional Terms", type: "textarea" },
    ],
  },
];

export const DOCUMENT_CATALOG: DocumentTemplate[] = [...STAFF, ...CLIENT];



export type DocumentScope = DocumentAudience | "all";
export function getCatalogByAudience(audience: DocumentScope): DocumentTemplate[] {
  if (audience === "all") return [...DOCUMENT_CATALOG];
  return DOCUMENT_CATALOG.filter((t) => t.audience === audience);
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_CATALOG.find((t) => t.id === id);
}
