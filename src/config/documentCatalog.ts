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
  Building2, Stamp,
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
    label: "Job Offer",
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
    label: "Employment Contract",
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
// CLIENT catalog — Forms & Contracts hub (real-estate clients)
// ─────────────────────────────────────────────────────────────────────
const CLIENT: DocumentTemplate[] = [
  {
    id: "form_a",
    audience: "client",
    label: "Form A — Buyer Registration",
    description: "Developer registration for off-plan purchases.",
    icon: Building2,
    needsClient: true,
    emailSubject: "Form A — Buyer Registration · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a Form A buyer registration cover letter referencing the project, unit, buyer details, and developer. Refer to RERA Form A standard.",
    fields: [
      RECIPIENT_NAME,
      { key: "projectName", label: "Project Name", type: "text", required: true },
      { key: "unitRef", label: "Unit Reference", type: "text" },
      { key: "developer", label: "Developer", type: "text" },
    ],
  },
  {
    id: "form_f",
    audience: "client",
    label: "Form F — Listing / MoU",
    description: "RERA Memorandum of Understanding between buyer and seller.",
    icon: ClipboardCheck,
    needsClient: true,
    emailSubject: "Form F — MoU · JBJ GLOBAL REAL ESTATE",
    aiInstructions:
      "Draft a Form F MoU cover with parties, property, agreed price, deposit, completion date and broker commission.",
    fields: [
      { key: "recipientName", label: "Buyer Name", type: "text", required: true },
      { key: "sellerName", label: "Seller Name", type: "text", required: true },
      { key: "propertyRef", label: "Property Address / DLD Ref", type: "text", required: true },
      { key: "price", label: "Agreed Price (AED)", type: "text" },
      { key: "deposit", label: "Deposit (AED)", type: "text" },
      { key: "completionDate", label: "Completion Date", type: "date" },
    ],
  },
  {
    id: "form_i",
    audience: "client",
    label: "Form I — Cancellation",
    description: "Listing cancellation form.",
    icon: FileText,
    needsClient: true,
    emailSubject: "Form I — Cancellation · JBJ GLOBAL REAL ESTATE",
    aiInstructions: "Draft a Form I listing cancellation referencing the original Form A/F and the reason for cancellation.",
    fields: [
      RECIPIENT_NAME,
      { key: "propertyRef", label: "Property Reference", type: "text", required: true },
      { key: "reason", label: "Reason for Cancellation", type: "textarea" },
    ],
  },
  {
    id: "paa",
    audience: "client",
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
      { key: "recipientName", label: "Guest Full Name", type: "text", required: true, placeholder: "e.g., John Doe" },
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
      { key: "amountPaid", label: "Amount Paid (AED)", type: "text", required: true, placeholder: "4,550" },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: [
        { value: "Paid in Full", label: "Paid in Full" },
        { value: "Partial Payment", label: "Partial Payment" },
        { value: "Pending", label: "Pending" },
      ]},
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
];


export const DOCUMENT_CATALOG: DocumentTemplate[] = [...STAFF, ...CLIENT];

export function getCatalogByAudience(audience: DocumentAudience): DocumentTemplate[] {
  return DOCUMENT_CATALOG.filter((t) => t.audience === audience);
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_CATALOG.find((t) => t.id === id);
}
