/**
 * DocumentStudio — Premium full-screen workspace
 * -----------------------------------------------
 * Replaces the previous cramped 3-column Dialog. Renders a true
 * full-screen overlay with:
 *   • Topbar (brand + close + step actions)
 *   • Stepper (1 Template · 2 Details · 3 Review & Send)
 *   • Left rail (template gallery on step 1, details form on step 2)
 *   • Center A4 preview (locked letterhead + contentEditable body
 *     with floating selection toolbar + zoom)
 *   • Right collapsible AI assistant (reuses AiEditChatPanel)
 *
 * Public API (Props) is UNCHANGED so DocumentStudioLauncher continues
 * to mount it without modification.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal, flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Sparkles, Loader2, Wand2, Printer, Mail, FlaskConical, X, ChevronRight,
  ChevronLeft, ZoomIn, ZoomOut, Bold, Italic, List, Heading2, Search,
  PanelRightClose, PanelRightOpen, Check, Download, FileText, Stamp,
  PenLine, ChevronDown, ChevronUp, Trash2, Maximize2, Minimize2, Plus, Globe,
  Copy, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { removeWhiteBackground } from "@/lib/removeWhiteBackground";
import { toast } from "sonner";
import DOMPurify from "dompurify";

import {
  getCatalogByAudience, getTemplateById,
 DocumentAudience, DocumentScope, DocumentTemplate,
} from "@/config/documentCatalog";
import { DEPARTMENTS } from "@/hooks/useHRJobOffers";
import { stripChromeArtifacts, jbjWatermarkChampagneSrc, jbjCompanyStampSrc } from "@/templates/jbjLockedChrome";
import { LockedLetterhead, LockedFooter } from "./LockedLetterhead";
import DraggableMark from "./DraggableMark";
import AiEditChatPanel, { LANGUAGES as AI_LANGUAGES } from "./AiEditChatPanel";
import AssetLibraryDialog from "./assets/AssetLibraryDialog";
import { useOwnerAssets, OwnerAsset, AssetKind } from "./assets/useOwnerAssets";
import { exportPdf, exportDocx, exportPng, printDocument, preloadExportLibraries, DocumentMarks } from "./export/exporters";
import {
  compose as composeDocument,
  DEFAULT_BROKER_COMMISSIONS,
  type CommissionRow,
  type CustomField,
} from "@/templates/composers";
import { renderStandardBody } from "@/templates/composers/standardBody";
import {
  useCrmDocuments,
  useSaveDocument,
  useCrmDocumentsDeleted,
  useSoftDeleteDocument,
  useRestoreDocument,
  useHardDeleteDocument,
  type CrmDocument,
} from "@/hooks/useCrmDocuments";
import { useUploadCandidateAttachment } from "@/hooks/useCandidateAttachments";
import { deriveCandidateFolder, pickCandidateDisplayName } from "@/utils/candidateFolder";
import DocumentActionSheet from "./DocumentActionSheet";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import { RotateCcw } from "lucide-react";

interface Props {
  catalog: DocumentScope;
  trigger?: React.ReactNode;
  presetTemplateId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 1 | 2 | 3;
const OWNER_TEST_EMAIL = "infoo.jane@gmail.com";
const DOCUSIGN_TOP_RESERVE = 0;
const PAGE_SIGNATURE_RESERVE = 132;
const escapeSignatureHtml = (value?: string) =>
  (value || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const todayIso = () => new Date().toISOString().slice(0, 10);
const JOB_OFFER_WORKING_HOURS = "Monday to Friday: 10:00 AM – 7:00 PM\nSaturday: 11:00 AM – 4:00 PM";

const UAE_DEVELOPERS = [
  { name: "Emaar Properties", email: "brokerrelations@emaar.ae", phone: "+971 4 366 1688" },
  { name: "DAMAC Properties", email: "broker.support@damacgroup.com", phone: "+971 4 373 1000" },
  { name: "Nakheel", email: "sales@nakheel.com", phone: "+971 4 390 3333" },
  { name: "Sobha Realty", email: "channelpartners@sobharealty.com", phone: "+971 4 423 8064" },
  { name: "Meraas", email: "sales@meraas.com", phone: "+971 800 637227" },
  { name: "Dubai Properties", email: "sales@dp.ae", phone: "+971 800 3787" },
  { name: "Aldar Properties", email: "brokerrelations@aldar.com", phone: "+971 2 810 5555" },
  { name: "Azizi Developments", email: "sales@azizidevelopments.com", phone: "+971 4 359 6673" },
  { name: "Ellington Properties", email: "sales@ellingtongroup.com", phone: "+971 4 278 0888" },
  { name: "Binghatti", email: "sales@binghatti.com", phone: "+971 4 512 4444" },
];

function getTemplateDefaultFields(templateId?: string): Record<string, string> {
  const today = todayIso();
  switch (templateId) {
    case "job_offer":
      return {
        letterDate: "2026-06-20",
        recipientName: "[Employee Name]",
        homeAddress: "[Employee Address]",
        recipientEmail: "[Employee Email]",
        recipientPhone: "[Employee Phone / WhatsApp]",
        jobTitle: "[Position]",
        startDate: "2026-06-20",
        probation: "6 months",
        workingHours: JOB_OFFER_WORKING_HOURS,
        annualLeave: "30 calendar days",
        noticePeriod: "30 calendar days",
        reportingTo: "Management",
        salary: "AED 0 — zero salary; commission-only",
        commission: "65% on own direct deals; 55% on Company-sourced deals; 70% Company-approved premium tier only after AED 10,000,000 Company-recognised sales in one year and written management approval",
        paymentCycle: "Upon the Company's receipt of cleared commission",
        leadsReceivedFrom: "2026-06-20",
        signingDate: "2026-06-26",
        leadsCountAtSigning: "approximately 310",
      };
    case "warning_letter":
      return { recipientName: "[Employee Name]", warningLevel: "first", issueDate: today, correctiveAction: "Immediate corrective action and written acknowledgement are required." };
    case "termination_letter":
      return { recipientName: "[Employee Name]", jobTitle: "[Position]", terminationDate: today, lastWorkingDay: today, noticePeriod: "As per UAE Labour Law / employment contract", reason: "business_requirements", returnOfProperty: "Laptop, access cards, keys, documents and all company property", finalSettlement: "Final settlement to be processed after clearance." };
    case "developer_commission_invoice":
      return { developerName: "Emaar Properties", developerContact: "brokerrelations@emaar.ae · +971 4 366 1688", closingDate: today, commissionRate: "2%", paymentTerms: "Net 7 days from invoice date" };
    case "developer_payment_request":
      return { developerName: "Emaar Properties", accountsEmail: "brokerrelations@emaar.ae", requestedPaymentDate: today, dueReason: "Closed deal — commission payable after SPA / booking confirmation." };
    case "developer_closing_notice":
      return { developerName: "Emaar Properties", closingDate: today, commissionRate: "2%", brokerName: "JBJ GLOBAL REAL ESTATE" };
    case "maintenance_request":
      return { requestDate: today, priority: "normal", serviceRequired: "General maintenance inspection and required rectification works." };
    case "interior_design_quotation":
      return { quotationTitle: "Interior Design Quotation", scope: "Design consultation, concept direction, sourcing and execution coordination.", timeline: "4–6 weeks", validUntil: today };
    case "service_bill":
      return { invoiceNumber: `JBJ-BILL-${new Date().getFullYear()}-001`, serviceDescription: "After-sale service / maintenance coordination", paymentTerms: "Net 7 days", dueDate: today };
    case "client_quotation":
      return { quotationNumber: `JBJ-QTN-${new Date().getFullYear()}-001`, quotationTitle: "After-Sale Service Quotation", scope: "Scope, deliverables and service assumptions to be confirmed.", validUntil: today };
    case "paa":
      return { recipientName: "[Owner Name]", propertyRef: "[Property / Unit]" };
    default:
      return {};
  }
}

const restoreOfferCommissionRows = (templateId?: string, rows?: CommissionRow[]): CommissionRow[] => {
  if (templateId !== "job_offer") return rows?.length ? rows : DEFAULT_BROKER_COMMISSIONS;
  const visible = (rows || []).filter((r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim());
  const byLabel = (needle: string) => visible.find((r) => `${r.label || ""} ${r.rate || ""}`.toLowerCase().includes(needle));
  const direct = byLabel("direct") || DEFAULT_BROKER_COMMISSIONS[0];
  const company = byLabel("company") || byLabel("source") || DEFAULT_BROKER_COMMISSIONS[1];
  const premium = byLabel("premium") || byLabel("70") || DEFAULT_BROKER_COMMISSIONS[2];
  return [
    { ...DEFAULT_BROKER_COMMISSIONS[0], ...direct, rate: direct.rate || DEFAULT_BROKER_COMMISSIONS[0].rate },
    { ...DEFAULT_BROKER_COMMISSIONS[1], ...company, rate: company.rate || DEFAULT_BROKER_COMMISSIONS[1].rate },
    { ...DEFAULT_BROKER_COMMISSIONS[2], ...premium, rate: premium.rate || DEFAULT_BROKER_COMMISSIONS[2].rate },
  ];
};

const IDENTITY_FIELD_KEYS = [
  "fullNameAsPerPassport",
  "passportFullName",
  "fullNameAsPerId",
  "fullNameAsPerID",
  "emiratesIdFullName",
  "fullNameArabic",
  "nameArabic",
  "arabicName",
  "recipientName",
  "emiratesId",
  "passportNumber",
  "nationality",
  "homeAddress",
  "recipientEmail",
  "recipientPhone",
];

const isMeaningfulDocumentValue = (value?: any): value is string => {
  const text = String(value || "").trim();
  return !!text && !/^\[[^\]]+\]$/.test(text);
};

const pickMeaningful = (...values: any[]): string =>
  values.map((v) => String(v || "").trim()).find((v) => isMeaningfulDocumentValue(v)) || "";

const OFFICIAL_NAME_ALIASES: Record<string, { english: string; arabic?: string }> = {
  "alwalid i s alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alwalid i. s. alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alwalid i.s. alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alhalabi alwalid i s": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
};

const cleanIdentityName = (value?: string) => (value || "")
  .replace(/^\s*(?:full\s+name\s+(?:as\s+per\s+(?:id|passport)|on\s+passport)|candidate\s+name|name)\s*(?:is|:|-)?\s*/i, "")
  .replace(/\s+/g, " ")
  .trim();

const normaliseNameAliasKey = (value?: string): string =>
  cleanIdentityName(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const officialNameAlias = (value?: string) => {
  const key = normaliseNameAliasKey(value);
  return key ? OFFICIAL_NAME_ALIASES[key] : undefined;
};

const normalizeArabicIdentityName = (value?: string): string => {
  if (!value || !/[\u0600-\u06FF]/.test(value)) return "";
  const line = value.match(/(?:الاسم\s*كاملا|الاسم)\s*[:：]?\s*([\u0600-\u06FF\s]+)/)?.[1] || value;
  return line.split(/\n/)[0].replace(/\s+/g, " ").trim();
};

const normalizeJobOfferIdentityFields = (raw: Record<string, string> = {}, shared: Record<string, string> = {}) => {
  const base = getTemplateDefaultFields("job_offer");
  const next = { ...base, ...shared, ...raw };
  const from = (keys: string[]) => pickMeaningful(...keys.map((k) => raw[k]), ...keys.map((k) => shared[k]), ...keys.map((k) => next[k]));
  const name = from(["fullNameAsPerPassport", "passportFullName", "fullNameAsPerId", "fullNameAsPerID", "emiratesIdFullName", "recipientName", "employeeName", "employee_name", "fullName", "full_name", "candidateName", "client_name", "guest_name", "name"]);
  const official = officialNameAlias(name);
  const legalName = official?.english || name;
  const arabicName = from(["fullNameArabic", "nameArabic", "arabicName", "fullNameAsPerPassportArabic", "fullNameAsPerIdArabic"]) || official?.arabic || "";
  const address = from(["homeAddress", "employeeAddress", "employee_address", "address", "home_address", "residentialAddress", "residential_address"]);
  const email = from(["recipientEmail", "employeeEmail", "employee_email", "email", "emailAddress", "email_address"]);
  const phone = from(["recipientPhone", "employeePhone", "employee_phone", "phone", "phoneNumber", "mobile", "mobileNumber", "whatsapp"]);
  const title = from(["jobTitle", "position", "employeeTitle", "employee_title", "title"]);
  if (legalName) {
    next.fullNameAsPerPassport = legalName;
    next.fullNameAsPerId = legalName;
    next.recipientName = legalName;
  }
  if (arabicName) next.fullNameArabic = normalizeArabicIdentityName(arabicName) || arabicName;
  if (address) next.homeAddress = address;
  if (email) next.recipientEmail = email;
  if (phone) next.recipientPhone = phone;
  if (title) next.jobTitle = title;
  return next;
};

function cleanIdentityNotes(value?: string) {
  if (!value) return value;
  const parts = value.split(/[;\n]+/).map((p) => p.trim()).filter(Boolean);
  const keep = parts.filter((p) => !/^(emirates\s*id|eid|passport|full\s*name|name\s*as\s*per\s*id|home\s*address|residential\s*address|address|email|phone|mobile|date\s*of\s*birth|dob|nationality|state\s*of|issuing\s*date|issue\s*date|expiry\s*date|id\s*expiry|sex)\b/i.test(p));
  return keep.join("; ");
}

function normalizeExtractedDocumentFields(raw: Record<string, any> = {}, source = ""): Record<string, string> {
  const out: Record<string, string> = {};
  const all = { ...raw } as Record<string, any>;
  const text = [source, Object.entries(raw).map(([k, v]) => `${k}: ${v}`).join("\n")].join("\n");
  const pick = (...keys: string[]) => keys.map((k) => all[k]).find((v) => typeof v === "string" && v.trim());
  const set = (k: string, v?: any) => { if (typeof v === "string" && v.trim()) out[k] = v.trim(); };

  const cleanName = cleanIdentityName;
  const arabicName = normalizeArabicIdentityName(text);
  const arabicNameAlias = arabicName === "الوليد عصام شعبان الحلبي"
    ? "Alwalid Issam Shaaban Alhalabi"
    : "";
  const mrzLine = text.split(/\n/).find((line) => /^P<|^[A-Z0-9<]{20,}$/.test(line.trim()))?.trim() || "";
  const mrzMatch = mrzLine.match(/P<[A-Z]{3}([A-Z<]+)<<([A-Z<]+)/i) || mrzLine.match(/^([A-Z<]+)<<([A-Z<]+)/i);
  const mrzFullName = mrzMatch ? cleanName(`${mrzMatch[2].replace(/<+/g, " ")} ${mrzMatch[1].replace(/<+/g, " ")}`) : "";
  const nameCandidates = [
    arabicNameAlias,
    pick("fullNameAsPerPassport", "passportFullName", "passport_name", "nameOnPassport"),
    pick("fullNameAsPerId", "fullNameAsPerID", "idFullName", "emiratesIdFullName"),
    pick("recipientName", "fullName", "nameAsPerId", "name", "applicantName"),
    mrzFullName,
    text.match(/(?:full\s+name\s+as\s+per\s+passport|name\s+on\s+passport|passport\s+full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i)?.[1],
    text.match(/(?:full\s+name\s+as\s+per\s+id|name\s+as\s+per\s+id|full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i)?.[1],
  ].map(cleanName).map((name) => officialNameAlias(name)?.english || name).filter(Boolean);
  nameCandidates.sort((a, b) => {
    const score = (name: string) => (/\b[A-Z]\.?\b(?:\s*[A-Z]\.?\b)+/i.test(name) ? 0 : 1000) + name.length + (name.split(/\s+/).length >= 4 ? 180 : name.split(/\s+/).length >= 3 ? 100 : 0);
    return score(b) - score(a);
  });
  set("fullNameAsPerPassport", nameCandidates[0]);
  set("fullNameAsPerId", nameCandidates[0]);
  set("recipientName", nameCandidates[0]);
  set("fullNameArabic", arabicName || officialNameAlias(nameCandidates[0])?.arabic);
  set("emiratesId", pick("emiratesId", "emiratesID", "emirates_id", "eid", "idNumber", "id_number", "eidNumber"));
  set("passportNumber", pick("passportNumber", "passportNo", "passport_no", "passport", "passport_number"));
  set("homeAddress", pick("homeAddress", "residentialAddress", "residential_address", "address", "home_address"));
  set("recipientEmail", pick("recipientEmail", "email", "emailAddress", "email_address"));
  set("recipientPhone", pick("recipientPhone", "phone", "phoneNumber", "mobile", "mobileNumber", "whatsapp"));
  set("nationality", pick("nationality", "nationalityName", "country", "countryOfNationality"));

  set("recipientEmail", out.recipientEmail || text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]);
  set("emiratesId", text.match(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/)?.[0]?.replace(/\s+/g, "-") || out.emiratesId);
  set("nationality", out.nationality || text.match(/nationality\s*(?:is|:|-)?\s*([^;\n]+)/i)?.[1]);
  if (!out.recipientPhone) {
    // Phone must look like a phone — require explicit phone label OR a +971/00971 prefix,
    // OR a local 0[2-9] number with at least 8 trailing digits.
    // NEVER fall back to a bare 7-prefixed number — that collides with Emirates IDs (784-…).
    const labeled = text.match(/(?:phone|mobile|whatsapp|tel|contact)\s*(?:number|no\.?|#)?\s*[:#-]?\s*((?:\+?971|00971|0)?[\s-]?\d[\d\s-]{6,})/i)?.[1];
    const intl = text.match(/(?:\+971|00971)[\s-]?\d[\d\s-]{6,}/)?.[0];
    const local = text.match(/(?<!\d)0(?:5\d|[2-46-9])[\s-]?\d[\d\s-]{5,}(?!\d)/)?.[0];
    const candidate = (labeled || intl || local || "").replace(/\s+/g, " ").trim();
    const eidDigits = (out.emiratesId || "").replace(/\D+/g, "");
    const candDigits = candidate.replace(/\D+/g, "");
    if (candidate && candDigits && candDigits !== eidDigits && !(eidDigits && eidDigits.includes(candDigits))) {
      set("recipientPhone", candidate);
    }
  }
  set("passportNumber", out.passportNumber || text.match(/passport(?:\s*(?:number|no\.?))?\s*[:#-]\s*([A-Z0-9]{5,})/i)?.[1]);
  set("homeAddress", out.homeAddress || text.match(/(?:home|residential)\s+address\s*(?:is|:|-)?\s*([^;\n]+)/i)?.[1]);
  set("recipientName", out.recipientName || text.match(/(?:full\s+name\s+as\s+per\s+id|name\s+as\s+per\s+id|full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i)?.[1]);

  Object.entries(all).forEach(([k, v]) => {
    if (/expiry|expire|dateOfBirth|dob|birthDate|issueDate|issuingDate|sex/i.test(k)) return;
    if (IDENTITY_FIELD_KEYS.includes(k)) return;
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  });
  if (out.notes) {
    const cleaned = cleanIdentityNotes(out.notes);
    if (cleaned) out.notes = cleaned; else delete out.notes;
  }
  return out;
}

/**
 * GLOBAL per-page signature strip (locked, v3):
 * Inner pages render ONLY a single short signature line — no Name, no Date
  * rows. A thin gold hairline closes every page at the very bottom so the
 * page is visually sealed. The full official signatory block + JBJ stamp
 * appears ONLY on the last page (rendered via composer signatureBlock).
 *
 * ============================================================================
 * 🔒 LOCKED — DO NOT MODIFY (approved by owner 2026-05-28)
 * ----------------------------------------------------------------------------
 * The per-page "Signature:" row + gold hairline below it is the approved,
 * final visual standard. It applies globally to EVERY template and EVERY
 * page where it renders (Job Offer, Form I, Form A/B/F/U, NDA, MOU,
 * Partners family, CV, Cover Letter, Company Profile, etc.).
 *
 * Locked properties (do not change without explicit owner approval):
 *   - Signature row: margin-top:auto, padding:14px 0 10px, right-aligned,
 *     min-width 300px, label 10px uppercase tracked, 1px ink underline.
 *   - Gold divider directly below: 1px rgba(184,149,85,.55), margin:10px 0 0.
 *   - Both elements anchored to bottom of page via flex column + margin-top:auto
 *     (see anchorSignatureArtifacts).
 *
 * Any future restyle MUST re-read this block and preserve it byte-for-byte.
 * See mem://documents/signature-and-gold-divider-lock for the standard.
 * ============================================================================
 */
const renderPerPageUserSignature = (name?: string) => {
  const legalName = escapeSignatureHtml((name || "[Candidate Name]").trim());
  // Inner pages render a compact INITIALS strip only. The full
  // "Accepted by Candidate / Signature" block and the authorised signatory
  // appear ONLY on the final page (via composer signatureBlock).
  return `
    <div data-rendered-page-signature="1" data-locked-signature="1" data-initials-strip="1" style="margin-top:auto;padding:14px 0 46px;display:flex;justify-content:flex-end;align-items:flex-end;flex:0 0 auto;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <div style="color:#1A1A1A;min-width:230px;max-width:280px;display:flex;align-items:flex-end;gap:10px;">
        <div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;font-size:9.5px;line-height:1;padding-bottom:2px;" title="${legalName}">Candidate Initials:</div>
        <div style="flex:1;border-bottom:1px solid #1A1A1A;height:1px;min-width:120px;"></div>
      </div>
    </div>
    <div data-rendered-page-divider="1" data-locked-divider="1" style="border-top:1px solid rgba(184,149,85,.55);height:0;margin:10px 0 0;flex:0 0 auto;page-break-inside:avoid;break-inside:avoid;"></div>`;
};


const renderPageGeneratedDate = (): string => {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return `Generated ${today}`;
};

const stripGeneratedPageArtifacts = (html: string): string => {
  if (!html || typeof window === "undefined") return html;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content
    .querySelectorAll("[data-client-signature-strip],[data-page-divider],[data-rendered-page-signature],[data-rendered-page-divider],[data-signature-spacer]")
    .forEach((el) => el.remove());
  return tpl.innerHTML;
};

const cleanDocumentFieldRows = (html: string): string => {
  if (!html || typeof window === "undefined") return html;
  const tpl = document.createElement("template");
  tpl.innerHTML = stripGeneratedPageArtifacts(html);
  tpl.content.querySelectorAll("[data-field-delete-control]").forEach((el) => el.remove());

  tpl.content.querySelectorAll<HTMLElement>("[data-removable-field]").forEach((row) => {
    const valueCell = row.querySelector<HTMLElement>("[data-field-value-cell]");
    const probe = valueCell || row;
    const hasValue = (probe.textContent || "")
      .replace(/×/g, "")
      .replace(/\u00a0/g, " ")
      .trim().length > 0;
    if (!hasValue) row.remove();
  });

  tpl.content.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    if (table.querySelectorAll("tbody tr").length === 0) table.remove();
  });
  if (!tpl.content.querySelector('[data-pdf-section="commission"],[data-pdf-section="comp-commission"]')) {
    tpl.content.querySelectorAll('[data-pdf-section="commission-note"]').forEach((el) => el.remove());
  }

  return tpl.innerHTML;
};

const countBracketPlaceholders = (html: string): number =>
  (html.match(/\[[^\]]+\]/g) || []).length;

const hasMeaningfulApplicantData = (source: Record<string, string>): boolean => {
  const keys = [
    "fullNameAsPerPassport",
    "passportFullName",
    "fullNameAsPerId",
    "fullNameAsPerID",
    "emiratesIdFullName",
    "recipientName",
    "recipientEmail",
    "recipientPhone",
    "jobTitle",
    "passportNumber",
    "emiratesId",
    "nationality",
    "homeAddress",
  ];
  return keys.some((key) => {
    const value = String(source[key] || "").trim();
    return !!value && !/^\[[^\]]+\]$/.test(value);
  });
};

const shouldUseSyncedTemplateForExport = (
  currentHtml: string,
  syncedHtml: string,
  fields: Record<string, string>,
): boolean => {
  if (!currentHtml || !syncedHtml || !hasMeaningfulApplicantData(fields)) return false;
  const currentCount = countBracketPlaceholders(currentHtml);
  const syncedCount = countBracketPlaceholders(syncedHtml);
  return currentCount >= 2 && syncedCount + 1 < currentCount;
};

const waitForDocumentPaint = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
});

const parseDocumentPageGroups = (html: string): string[] => {
  if (!html) return [""];
  if (typeof window === "undefined") return [stripGeneratedPageArtifacts(html)];
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const groups = Array.from(tpl.content.querySelectorAll<HTMLElement>("[data-pdf-page]"))
    .map((el) => stripGeneratedPageArtifacts(el.innerHTML));
  return groups.length ? groups : [stripGeneratedPageArtifacts(html)];
};

const wrapDocumentPageGroups = (groups: string[]): string =>
  groups.map((group, index) => `<section data-pdf-page="${index + 1}">${group}</section>`).join("");

const normalizeEditableFragment = (html: string): string =>
  stripGeneratedPageArtifacts(html || "")
    .replace(/\scontenteditable=("true"|'true'|true)/gi, "")
    .replace(/\sdata-page-index=("\d+"|'\d+'|\d+)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const anchorSignatureArtifacts = (html: string): string => {
  if (!html || typeof window === "undefined") return html;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const movable = Array.from(
    tpl.content.querySelectorAll<HTMLElement>(
      '[data-signature-block="1"],[data-rendered-page-signature="1"],[data-rendered-page-divider="1"]',
    ),
  ).filter((el) => !el.closest('[data-form-i-page="1"]'));
  if (movable.length === 0) return tpl.innerHTML;
  // Insert a flex spacer BEFORE the signature artifacts so they reliably
  // pin to the bottom of the page even when prose CSS or other parent
  // styles defeat `margin-top:auto` on the sig elements. The spacer grows
  // to fill remaining vertical space inside the flex-column body region.
  const spacer = document.createElement("div");
  spacer.setAttribute("data-signature-spacer", "1");
  spacer.setAttribute(
    "style",
    "flex:1 1 auto;min-height:0;align-self:stretch;",
  );
  tpl.content.appendChild(spacer);
  movable.forEach((el) => tpl.content.appendChild(el));
  return tpl.innerHTML;
};


export default function DocumentStudio({ catalog, trigger, presetTemplateId, open: controlledOpen, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = useCallback((next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }, [controlledOpen, onOpenChange]);

  // Auto-open when a one-shot prefill payload was dropped in sessionStorage
  // by an external bridge (e.g. CV Center "Open in Document Studio").
  useEffect(() => {
    try {
      const key = `jbj:doc-studio:prefill:${catalog}`;
      if (sessionStorage.getItem(key)) setOpen(true);
    } catch {}
  }, [catalog, setOpen]);

  return (
    <>
      {trigger !== null && (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger || (
          <Button variant="primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Document
          </Button>
          )}
        </span>
      )}
      {open && (
        <StudioShell
          catalog={catalog}
          presetTemplateId={presetTemplateId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ───────────────────────────── Shell ───────────────────────────── */

function StudioShell({
  catalog,
  presetTemplateId,
  onClose,
}: {
  catalog: DocumentScope;
  presetTemplateId?: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const templates = useMemo(() => getCatalogByAudience(catalog), [catalog]);
  const isValidCatalogTemplate = (id?: string | null) => {
    if (!id) return false;
    const t = getTemplateById(id);
    if (!t) return false;
    return catalog === "all" ? true : t.audience === catalog;
  };
  const initialId =
    presetTemplateId && isValidCatalogTemplate(presetTemplateId)
      ? presetTemplateId
      : "";

  // ── Session persistence: survive refresh / tab-close / accidental logout.
  const SESSION_KEY = `jbj:doc-studio:session:${catalog}`;
  const TEMPLATE_KEY = (tid: string) => `jbj:doc-studio:template:${tid}`;
  const DOCUMENT_FIX_VERSION = 46;
  const hydratedRef = useRef(false);
  const restoredOnce = useRef(false);
  const parseSnap = (raw: string | null): any => {
    if (!raw) return null;
    try {
      const j = JSON.parse(raw);
      if (!j?.savedAt || (Date.now() - new Date(j.savedAt).getTime()) > 30 * 86400_000) return null;
      return j;
    } catch { return null; }
  };
  const snapContentScore = (s: any) => {
    if (!s) return -1;
    const bodyLen = typeof s.bodyHtml === "string" ? s.bodyHtml.replace(/<[^>]*>/g, "").trim().length : 0;
    const meaningfulFields = s.fields && typeof s.fields === "object"
      ? Object.values(s.fields).filter((v) => {
          const text = String(v || "").trim();
          return text && !/^\[[^\]]+\]$/.test(text) && !/^not applicable/i.test(text);
        }).length
      : 0;
    return (bodyLen > 80 ? 100 : bodyLen > 0 ? 25 : 0)
      + (s.userEdited ? 60 : 0)
      + Math.min(45, meaningfulFields * 5)
      + (Array.isArray(s.commissionRows) && s.commissionRows.length >= 3 ? 15 : 0);
  };
  const newerSnap = (a: any, b: any) => {
    if (!a) return b || null;
    if (!b) return a;
    const aScore = snapContentScore(a);
    const bScore = snapContentScore(b);
    // Protect an owner's filled contract from being overwritten by a newer blank
    // snapshot produced during reload/hydration. Intentional "New submission"
    // clears the per-template key, so this only guards accidental loss.
    if (Math.abs(aScore - bScore) >= 60) return aScore > bScore ? a : b;
    return new Date(b.savedAt || 0).getTime() > new Date(a.savedAt || 0).getTime() ? b : a;
  };
  const readSnapshot = (): any => {
    try {
      const j = parseSnap(localStorage.getItem(SESSION_KEY));
      if (j) {
        if (j.templateId && !isValidCatalogTemplate(j.templateId)) {
          localStorage.removeItem(SESSION_KEY);
          return null;
        }
        return j;
      }
      return null;
    } catch { return null; }
  };
  // Per-template fallback: if user previously filled "job_offer" inside another
  // catalog (e.g. "all") and now opens it via the staff hub, still resume that
  // draft. Looks up jbj:doc-studio:template:<tid> first, then any catalog key
  // whose snapshot matches the requested templateId.
  const readTemplateSnapshot = (tid: string): any => {
    try {
      const direct = parseSnap(localStorage.getItem(TEMPLATE_KEY(tid)));
      let best: any = direct && direct.templateId === tid ? direct : null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("jbj:doc-studio:session:")) continue;
        const cand = parseSnap(localStorage.getItem(k));
        if (cand && cand.templateId === tid) {
          best = newerSnap(best, cand);
        }
      }
      return best;
    } catch { return null; }
  };
  const readLatestSnapshot = (): any => {
    try {
      let best: any = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || (!k.startsWith("jbj:doc-studio:session:") && !k.startsWith("jbj:doc-studio:template:"))) continue;
        const cand = parseSnap(localStorage.getItem(k));
        if (cand?.templateId && isValidCatalogTemplate(cand.templateId)) {
          best = newerSnap(best, cand);
        }
      }
      return best;
    } catch { return null; }
  };
  // Opening a specific template from the hub must NEVER be hijacked by an
  // unrelated previous draft. It may resume only that exact template.
  const storedSnap = readSnapshot();
  const snap = initialId
    ? newerSnap(storedSnap?.templateId === initialId ? storedSnap : null, readTemplateSnapshot(initialId))
    : newerSnap(storedSnap, readLatestSnapshot());



  const [step, setStep] = useState<Step>(snap?.templateId ? (snap.step ?? 2) : (initialId ? 2 : 1));
  const [templateId, setTemplateId] = useState<string>(snap?.templateId || initialId);
  const template = useMemo(() => getTemplateById(templateId), [templateId]);


  // Custom departments (persisted locally so users can add/rename/delete their own).
  const DEPT_STORAGE_KEY = "jbj:doc-studio:custom-departments";
  const [customDepartments, setCustomDepartments] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DEPT_STORAGE_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(DEPT_STORAGE_KEY, JSON.stringify(customDepartments)); } catch {}
  }, [customDepartments]);
  const allDepartments = useMemo(
    () => Array.from(new Set([...(DEPARTMENTS as readonly string[]), ...customDepartments])),
    [customDepartments]
  );
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptDraft, setDeptDraft] = useState("");
  const [addingOtherDept, setAddingOtherDept] = useState(false);
  const [otherDeptDraft, setOtherDeptDraft] = useState("");
  // Shared identity store: identity fields (name, ID, passport, contact) are
  // mirrored across every template so once the owner fills the Offer Letter
  // for a candidate, opening the NDA (or any contract) for the same person
  // auto-prefills those same fields. The composer-specific defaults remain.
  const SHARED_IDENTITY_KEY = "jbj:doc-studio:shared-identity";
  const readSharedIdentity = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem(SHARED_IDENTITY_KEY);
      const j = raw ? JSON.parse(raw) : null;
      return j && typeof j === "object" ? j : {};
    } catch { return {}; }
  };
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const baseTemplateId = snap?.templateId || initialId;
    const base = getTemplateDefaultFields(baseTemplateId);
    const shared = readSharedIdentity();
    // NDA opened directly from the template launcher must be BLANK — it only
    // pre-fills when entered via the Offer → NDA companion toggle (handled
    // below). Existing NDA drafts keep their saved fields.
    if (baseTemplateId === "nda" && !snap) {
      return { ...base };
    }
    const merged = { ...base, ...shared, ...(snap?.fields || {}) };
    return baseTemplateId === "job_offer" ? normalizeJobOfferIdentityFields(snap?.fields || {}, shared) : merged;
  });

  // Mirror identity fields to the shared store whenever they change.
  useEffect(() => {
    try {
      const out: Record<string, string> = {};
      for (const k of IDENTITY_FIELD_KEYS) {
        const v = (fields[k] || "").toString().trim();
        if (v && !/^\[[^\]]+\]$/.test(v)) out[k] = v;
      }
      if (Object.keys(out).length) {
        const merged = { ...readSharedIdentity(), ...out };
        localStorage.setItem(SHARED_IDENTITY_KEY, JSON.stringify(merged));
      }
    } catch {}
  }, [fields]);
  const [bodyHtml, setBodyHtml] = useState<string>(() => {
    const staleStructuredDraft =
      !!snap?.templateId &&
      (snap.templateId === "job_offer" || snap.templateId === "nda") &&
      (snap.documentFixVersion || 0) < DOCUMENT_FIX_VERSION;
    return staleStructuredDraft ? "" : (snap?.bodyHtml || "");
  });
  const [generating, setGenerating] = useState(false);
  const [addPagePrompt, setAddPagePrompt] = useState("");
  const [addPageAfterIndex, setAddPageAfterIndex] = useState<number | null>(null);
  const [aiPageBusy, setAiPageBusy] = useState(false);

  // Commission rows — pre-seeded for broker/HR templates
  const usesCommission =
    !!template &&
    (template.id === "job_offer" ||
      template.id === "commission_agreement" ||
      template.id === "employment_contract" ||
      template.id === "partnership_referral");
  const [commissionRows, setCommissionRows] = useState<CommissionRow[]>(restoreOfferCommissionRows(snap?.templateId || initialId, snap?.commissionRows));
  const [customFields, setCustomFields] = useState<CustomField[]>(snap?.customFields || []);

  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  const [zoom, setZoom] = useState(100);
  const [setupChromeCollapsed, setSetupChromeCollapsed] = useState(true);
  const [studioMinimized, setStudioMinimized] = useState(false);
  const [actionChromeCollapsed, setActionChromeCollapsed] = useState(true);
  const [detailsPanelCollapsed, setDetailsPanelCollapsed] = useState(true);
  const [templatePanelCollapsed, setTemplatePanelCollapsed] = useState(false);
  // Keep the Live Document Editor as the premium sparkle launcher by default.
  // It expands only when requested, so the A4 preview stays centered and fast.
  const [aiOpen, setAiOpen] = useState(false);
  // Pending AI preview — snapshot of the previous body so the user can
  // visually approve or revert before the AI's change is committed.
  const [aiPreviewSnapshot, setAiPreviewSnapshot] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Auto-fit preview: scale the fixed 816-wide A4 page down to whatever
  // width the center pane has so it never overflows horizontally.
  //
  // Pagination model:
  //   • Preview renders separate fixed 816×1154 A4 sheets only — never one
  //     stretched PAGE_H * pageCount / natural-height canvas.
  //   • pageCount is derived from measured body content with NO upper cap —
  //     it auto-grows to as many A4 sheets as the content requires.
  //   • Page-break overlays snap UP to the nearest block bottom inside the
  //     body (paragraphs, tables, signature block) so a break never slices
  //     through content. SAFE_GUTTER also keeps content off the very top
  //     and bottom edges of each visual A4 page.
  //   • Owner can manually add extra blank A4 pages via the "+ Add page"
  //     button below the preview.
  //   • No hard cap on page count — documents grow to as many A4 sheets
  //     as their content needs.
  const PAGE_W = 816;
  const PAGE_H = 1154; // A4 ratio @ 96dpi (one page)

  const SAFE_GUTTER = 48; // top/bottom breathing room on every visual page
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);
  const [chromeHeights, setChromeHeights] = useState({ header: 210, footer: 86 });
  const [smartBreaks, setSmartBreaks] = useState<number[]>([]);
  const [manualPages, setManualPages] = useState<number>(snap?.manualPages || 0);
  // GLOBAL pagination rule: any composed document body is auto-split into
  // as many A4 pages as needed so content (esp. signatures) never collides
  // with the footer. Footer renders ONLY on the last page.
  const [autoPageGroups, setAutoPageGroups] = useState<string[] | null>(null);
  const autoPageGroupsSourceRef = useRef<string>("");
  const committedBodyHtmlRef = useRef<string>(bodyHtml || "");
  const liveEditedBodyHtmlRef = useRef<string | null>(null);
  useEffect(() => {
    committedBodyHtmlRef.current = bodyHtml || "";
    liveEditedBodyHtmlRef.current = null;
  }, [bodyHtml]);
  const getCurrentBodyHtml = useCallback(() => liveEditedBodyHtmlRef.current ?? committedBodyHtmlRef.current ?? "", []);
  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const update = () => {
      const w = wrap.clientWidth;
      const padding = 48;
      const fit = Math.min(1, Math.max(0.3, (w - padding) / PAGE_W));
      setFitScale(fit);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);
  const effectiveScale = (zoom / 100) * fitScale;

  useEffect(() => {
    if (!open || !template) return;
    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const body = bodyRef.current;
        if (!body) return;

        const headerH = headerRef.current?.offsetHeight ?? 0;
        const footerH = footerRef.current?.offsetHeight ?? 0;
        const nextSheetH = Math.max(0, Math.ceil(body.scrollHeight));
        setSheetH((current) => (Math.abs(current - nextSheetH) > 1 ? nextSheetH : current));
        setChromeHeights((current) => {
          const next = { header: Math.max(1, Math.ceil(headerH)), footer: Math.max(1, Math.ceil(footerH)) };
          return Math.abs(current.header - next.header) > 1 || Math.abs(current.footer - next.footer) > 1 ? next : current;
        });

        const bodyTop = body.getBoundingClientRect().top;
        // Atomic blocks: never break inside these — only their outer bottom is a candidate.
        const atomicSelector = "[data-pdf-section],[data-signature-block]";
        const atomicEls = Array.from(body.querySelectorAll<HTMLElement>(atomicSelector));
        const atomicRanges = atomicEls.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top - bodyTop), bottom: Math.round(r.bottom - bodyTop) };
        });
        const insideAtomic = (y: number) =>
          atomicRanges.some((rg) => y > rg.top + 2 && y < rg.bottom - 2);

        const childBoundaries = Array.from(body.querySelectorAll<HTMLElement>("p,li,table,h1,h2,h3"))
          .map((el) => Math.round(el.getBoundingClientRect().bottom - bodyTop))
          .filter((y) => !insideAtomic(y));
        const atomicBoundaries = atomicRanges.map((rg) => rg.bottom);
        const all = [...childBoundaries, ...atomicBoundaries]
          .filter((y) => y > SAFE_GUTTER && y < nextSheetH - SAFE_GUTTER)
          .sort((a, b) => a - b);
        const unique = all.filter((y, index, arr) => index === 0 || Math.abs(y - arr[index - 1]) > 4);
        setSmartBreaks(unique);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [open, template, bodyHtml, manualPages]);

  // ──────────────────────────────────────────────────────────────────
  // GLOBAL AUTO-PAGINATION
  // Measure the off-screen body, walk its top-level children, and split
  // them across A4 pages based on each page's available height. The
  // footer is reserved on every page (worst case) so signatures cannot
  // collide with it on the last page.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !template) return;
    const body = bodyRef.current;
    if (!body || !bodyHtml) {
      autoPageGroupsSourceRef.current = "";
      setAutoPageGroups(null);
      return;
    }
    // GLOBAL: composers that opt out of chrome (Form I and other single-
    // page form-style templates) must NEVER be re-paginated. They are
    // self-contained A4 layouts and any split corrupts the table.
    if (/data-no-chrome=["']1["']/.test(bodyHtml) || /data-single-page=["']1["']/.test(bodyHtml) || /data-locked-pages=["']1["']/.test(bodyHtml)) {
      autoPageGroupsSourceRef.current = "";
      setAutoPageGroups(null);
      return;
    }
    let frame = 0;
    const run = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const b = bodyRef.current;
        if (!b) return;
        if (b.querySelector("[data-pdf-page]") && /data-manual-added-page=["']1["']/.test(bodyHtml)) {
          autoPageGroupsSourceRef.current = "";
          setAutoPageGroups(null);
          return;
        }
        const headerH = chromeHeights.header;
        const footerH = chromeHeights.footer;
        // DocuSign auto-stamps the envelope ID in the top ~0.4in of every page.
        // Reserve a 42px safe band on every page so it never overlays content.
        const FIRST_TOP = 30;
        // GLOBAL RULE: inner pages must have EQUAL top/bottom interior padding
        // (the DocuSign safe band + footer reserve are fixed/locked, applied
        // separately). NEXT_TOP is the interior top padding only.
        const NEXT_TOP = 53;
        const BOTTOM_PAD = 50;
        // Tentative single-page cap: assume page 1 IS the last page so the
        // footer height is reserved. If everything fits here, the official
        // signature block stays with the body on a single sheet (no orphan
        // page 2). Otherwise we fall back to the multi-page caps that only
        // reserve the per-page signature strip on page 1.
        const singlePageCap = Math.max(200, PAGE_H - DOCUSIGN_TOP_RESERVE - headerH - FIRST_TOP - BOTTOM_PAD - Math.max(PAGE_SIGNATURE_RESERVE, footerH));
        const page0Cap = Math.max(200, PAGE_H - DOCUSIGN_TOP_RESERVE - headerH - FIRST_TOP - BOTTOM_PAD - PAGE_SIGNATURE_RESERVE);
        const otherCap = Math.max(200, PAGE_H - NEXT_TOP - BOTTOM_PAD - Math.max(PAGE_SIGNATURE_RESERVE, footerH));

        // Flatten: if composer wrapped content in <section data-pdf-page>,
        // unwrap those so we re-split based on real measured heights.
        const sourceChildren: HTMLElement[] = [];
        Array.from(b.children).forEach((child) => {
          const el = child as HTMLElement;
          if (el.matches?.("[data-client-signature-strip],[data-page-divider],[data-rendered-page-signature],[data-rendered-page-divider]")) return;
          if (el.matches?.("[data-pdf-page]")) {
            Array.from(el.children).forEach((g) => {
              const groupChild = g as HTMLElement;
              if (!groupChild.matches?.("[data-client-signature-strip],[data-page-divider],[data-rendered-page-signature],[data-rendered-page-divider]")) {
                sourceChildren.push(groupChild);
              }
            });
          } else {
            sourceChildren.push(el);
          }
        });
        if (!sourceChildren.length) {
          autoPageGroupsSourceRef.current = "";
          setAutoPageGroups(null);
          return;
        }

        const bodyTop = b.getBoundingClientRect().top;
        const items = sourceChildren.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            html: el.outerHTML,
            top: r.top - bodyTop,
            height: r.height,
            isSignature: el.matches?.('[data-signature-block="1"]') || !!el.querySelector?.('[data-signature-block="1"]'),
          };
        });

        // Fast path: does everything fit on a single sheet (with footer reserve)?
        // Measure by summed block heights instead of absolute offsets so the
        // bottom-anchoring spacer/signature never tricks a short contract into
        // becoming two pages. Job Offer and similar compact documents must stay
        // on page 1 unless their real content cannot fit.
        const contentHeight = Math.max(
          items.reduce((sum, it) => sum + it.height, 0),
          Math.ceil(b.scrollHeight || 0),
        );
        const interBlockGaps = Math.max(0, items.length - 1) * 8;
        const fitsSinglePage = contentHeight + interBlockGaps <= singlePageCap;

        if (fitsSinglePage) {
          const singleGroup = items.map((it) => it.html).join("");
          autoPageGroupsSourceRef.current = bodyHtml || "";
          setAutoPageGroups((prev) => (prev && prev.length === 1 && prev[0] === singleGroup ? prev : [singleGroup]));
          return;
        }

        const pages: Array<typeof items> = [];
        let current: typeof items = [];
        let pageStartTop = items[0].top;
        let cap = fitsSinglePage ? singlePageCap : page0Cap;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const relBottom = it.top + it.height - pageStartTop;
          if (relBottom > cap && current.length > 0) {
            pages.push(current);
            current = [it];
            pageStartTop = it.top;
            cap = otherCap;
          } else {
            current.push(it);
          }
          // No page cap — document grows to as many pages as content needs.

        }
        if (current.length) pages.push(current);
        const pageHeight = (p: typeof items) => p.reduce((sum, it) => sum + it.height, 0);
        const last = pages[pages.length - 1];
        const beforeLast = pages[pages.length - 2];
        if (pages.length > 1 && last && beforeLast && beforeLast.length > 1) {
          const lastIsOrphan = last.length === 1 && last.some((it) => it.isSignature);
          let lastTooSmall = pageHeight(last) < otherCap * 0.62;
          while ((lastIsOrphan || lastTooSmall) && beforeLast.length > 1 && pageHeight(last) < otherCap * 0.74) {
            const moved = beforeLast.pop();
            if (!moved) break;
            last.unshift(moved);
            lastTooSmall = pageHeight(last) < otherCap * 0.62;
          }
        }
        const groups = pages.map((p) => p.map((it) => it.html).join(""));
        autoPageGroupsSourceRef.current = bodyHtml || "";
        setAutoPageGroups((prev) => {
          if (prev && prev.length === groups.length && prev.every((g, i) => g === groups[i])) return prev;
          return groups;
        });
      });
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(body);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [open, template, bodyHtml, chromeHeights.header, chromeHeights.footer]);






  // Owner-side signature defaults (editable from the left rail).
  const [ownerName, setOwnerName] = useState<string>(snap?.ownerName || "Jane Bou Jaoude");
  const [ownerTitle, setOwnerTitle] = useState<string>(snap?.ownerTitle || "Founder & CEO");
  const [ownerDate, setOwnerDate] = useState<string>(snap?.ownerDate || new Date().toISOString().slice(0, 10));
  const [applicantDate, setApplicantDate] = useState<string>(snap?.applicantDate || ""); // blank by design

  useEffect(() => {
    if (template?.id !== "job_offer") return;
    setOwnerDate("2026-06-26");
    setApplicantDate("2026-06-26");
  }, [template?.id]);

  // Additional signatories (beyond the default Owner + Counterparty).
  type ExtraSig = { id: string; name: string; title: string; date: string; label: string };
  const newSig = (): ExtraSig => ({ id: Math.random().toString(36).slice(2, 9), name: "", title: "", date: "", label: "" });
  const [extraSignatories, setExtraSignatories] = useState<ExtraSig[]>(snap?.extraSignatories || []);
  const updateSig = (id: string, patch: Partial<ExtraSig>) => {
    resumeStructuredSync();
    setExtraSignatories((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const removeSig = (id: string) => {
    resumeStructuredSync();
    setExtraSignatories((p) => p.filter((s) => s.id !== id));
  };
  const duplicateSig = (id: string) =>
    setExtraSignatories((p) => {
      resumeStructuredSync();
      const i = p.findIndex((s) => s.id === id);
      if (i < 0) return p;
      const copy = { ...p[i], id: Math.random().toString(36).slice(2, 9) };
      return [...p.slice(0, i + 1), copy, ...p.slice(i + 1)];
    });

  /** Scroll to and briefly highlight a signature cell in the preview. */
  const highlightSig = (sigId: string) => {
    const el = document.querySelector<HTMLElement>(`[data-sig-id="${sigId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "outline-color 200ms, background-color 200ms";
    el.style.outline = "2px solid #B89555";
    el.style.outlineOffset = "4px";
    el.style.backgroundColor = "rgba(184,149,85,0.08)";
    window.setTimeout(() => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.backgroundColor = "";
    }, 1400);
  };

  // Hide / restore the "Commission" and "Custom fields" rail cards.
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(() => new Set(snap?.hiddenSections || []));
  const toggleSection = (id: string) =>
    setHiddenSections((s) => { resumeStructuredSync(); const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Per-field hide + rename for the template fields panel.
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState<Set<string>>(() => new Set(snap?.hiddenFieldKeys || []));
  const [fieldLabelOverrides, setFieldLabelOverrides] = useState<Record<string, string>>(snap?.fieldLabelOverrides || {});
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const hideField = (k: string) => setHiddenFieldKeys((s) => { resumeStructuredSync(); const n = new Set(s); n.add(k); return n; });
  const restoreAllFields = () => { resumeStructuredSync(); setHiddenFieldKeys(new Set()); };

  // Save-as-Template state.
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  type SavedTpl = { id: string; name: string; base_template_id: string; payload: any; is_default: boolean };
  const [savedTemplates, setSavedTemplates] = useState<SavedTpl[]>([]);

  // Load saved templates for current audience.
  const reloadSavedTemplates = async () => {
    let q: any = (supabase as any)
      .from("saved_document_templates")
      .select("id,name,base_template_id,payload,is_default");
    if (catalog !== "all") q = q.eq("audience", catalog);
    const { data, error } = await q.order("updated_at", { ascending: false });
    if (!error && Array.isArray(data)) setSavedTemplates(data as SavedTpl[]);
  };
  useEffect(() => { reloadSavedTemplates(); /* eslint-disable-next-line */ }, [catalog]);

  const applySavedTemplate = (s: SavedTpl) => {
    const p = s.payload || {};
    setTemplateId(s.base_template_id);
    resumeStructuredSync();
    if (p.fields) setSyncedFields(p.fields);
    if (p.department) setDepartment(p.department);
    if (p.commissionRows) setCommissionRows(p.commissionRows);
    if (p.customFields) setCustomFields(p.customFields);
    if (p.ownerName) setOwnerName(p.ownerName);
    if (p.ownerTitle) setOwnerTitle(p.ownerTitle);
    if (p.ownerDate) setOwnerDate(p.ownerDate);
    if (p.hiddenFieldKeys) setHiddenFieldKeys(new Set(p.hiddenFieldKeys));
    if (p.fieldLabelOverrides) setFieldLabelOverrides(p.fieldLabelOverrides);
    if (p.hiddenSections) setHiddenSections(new Set(p.hiddenSections));
    setStep(2);
    toast.success(`Loaded "${s.name}"`);
  };

  const deleteSavedTemplate = async (id: string) => {
    const { error } = await (supabase as any).from("saved_document_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSavedTemplates((xs) => xs.filter((x) => x.id !== id));
    toast.success("Template deleted");
  };

  const handleSaveTemplate = async () => {
    if (!template) { toast.error("Pick a template first"); return; }
    const name = (saveName || `${template.label} — Custom`).trim();
    setSavingTemplate(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Sign in required");
      const payload = {
        fields, department, commissionRows, customFields,
        ownerName, ownerTitle, ownerDate,
        hiddenFieldKeys: Array.from(hiddenFieldKeys),
        fieldLabelOverrides,
        hiddenSections: Array.from(hiddenSections),
      };
      const { error } = await (supabase as any).from("saved_document_templates").insert({
        owner_id: u.user.id,
        audience: catalog === "all" ? (template.audience as DocumentAudience) : catalog,
        base_template_id: template.id,
        name,
        is_default: saveAsDefault,
        payload,
      });
      if (error) throw error;
      toast.success(`Saved "${name}"`);
      setSaveDialogOpen(false);
      setSaveName("");
      setSaveAsDefault(false);
      reloadSavedTemplates();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSavingTemplate(false);
    }
  };

  /* ── Generated Documents library (crm_documents) ─────────────────── */
  const { data: allDocs = [] } = useCrmDocuments("all");
  const saveDocMutation = useSaveDocument();
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(undefined);
  const docsForTemplate = useMemo(
    () => (template ? allDocs.filter((d) => d.template_id === template.id) : []),
    [allDocs, template],
  );

  const getProfileValues = (source: Record<string, string>) => {
    const pick = (...keys: string[]) => keys.map((key) => (source[key] || "").trim()).find(Boolean) || "";
    const developerName = pick("developerName", "developer_name", "developer", "developer_company");
    const clientName = pick(
      "fullNameAsPerPassport", "passportFullName", "fullNameAsPerId", "fullNameAsPerID", "emiratesIdFullName",
      "recipientName", "employeeName", "employee_name", "guest_name", "client_name", "full_name",
      "landlord_name", "tenant_name", "buyer_name", "seller_name", "applicant_name", "customer_name",
    );
    return {
      clientName: clientName || developerName || "",
      clientEmail: pick("recipientEmail", "employeeEmail", "guest_email", "client_email", "email", "email_address", "developerEmail"),
      clientPhone: pick("recipientPhone", "employeePhone", "guest_phone", "client_phone", "mobile", "mobile_number", "phone", "developerPhone"),
      profileType: developerName ? "developer" : "client",
      developerName,
      emiratesId: pick("emirates_id", "emiratesId", "eid_number", "id_number", "idNumber"),
      passportNumber: pick("passport_number", "passportNo", "passport", "passportNumber"),
    };
  };

  const handleSaveDocument = async (opts?: { silent?: boolean }) => {
    if (!template) { if (!opts?.silent) toast.error("Pick a template first"); return undefined; }
    // Derive booking id (chained, server-side) if not already in field_values.
    let booking_id = (fields.booking_id || fields.bookingRef || "").trim();
    if (!booking_id) {
      const prefix =
        template.id === "holiday_home_agreement" ? "JBJ-HH" :
        template.id === "commission_agreement"   ? "JBJ-CA" :
        template.id === "property_advertising_agreement" ? "JBJ-PAA" :
        "JBJ-DOC";
      try {
        const { data, error } = await (supabase as any).rpc("next_booking_id", { prefix });
        if (!error && data) booking_id = String(data);
      } catch { /* fall back to client gen below */ }
      if (!booking_id) booking_id = `${"JBJ-DOC"}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    const profile = getProfileValues(fields);
    const nextFields = { ...fields, booking_id, profile_type: profile.profileType, developerName: fields.developerName || profile.developerName };
    if (userEditedRef.current || liveEditedBodyHtmlRef.current) setFields(nextFields);
    else setSyncedFields(nextFields);
    const currentBody = cleanDocumentFieldRows(getCurrentBodyHtml());
    const candidateMeta = deriveCandidateFolder(nextFields);
    const title =
      (candidateMeta.displayName || profile.clientName || "Untitled") +
      ` — ${template.label} (${booking_id})`;
    try {
      const saved = await saveDocMutation.mutateAsync({
        id: currentDocId,
        template_id: template.id,
        title,
        field_values: nextFields,
        rendered_html: currentBody || null,
        client_name: candidateMeta.displayName || profile.clientName || null,
        client_email: profile.clientEmail || null,
        client_phone: profile.clientPhone || null,
        candidate_folder: candidateMeta.folder,
        candidate_display_name: candidateMeta.displayName,
        silent: opts?.silent,
      });
      setCurrentDocId(saved.id);
      // Companion NDA: when an Offer Letter is saved for a candidate with a
      // resolvable folder, ensure a matching NDA draft exists in the same
      // folder, pre-filled with the same identity.
      if (template.id === "job_offer" && candidateMeta.folder) {
        try {
          const { data: existing } = await (supabase as any)
            .from("crm_documents")
            .select("id")
            .eq("template_id", "nda")
            .eq("candidate_folder", candidateMeta.folder)
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();
          if (!existing) {
            const ndaHtml = composeDocument({
              templateId: "nda",
              fields: nextFields,
              ownerName,
              ownerTitle,
              ownerDate,
              letterDate: (nextFields as any).letterDate || ownerDate,
            });
            await saveDocMutation.mutateAsync({
              template_id: "nda",
              title: `${candidateMeta.displayName} — NDA (${booking_id})`,
              field_values: nextFields,
              rendered_html: ndaHtml,
              client_name: candidateMeta.displayName,
              client_email: profile.clientEmail || null,
              client_phone: profile.clientPhone || null,
              candidate_folder: candidateMeta.folder,
              candidate_display_name: candidateMeta.displayName,
              silent: true,
            });
            if (!opts?.silent) {
              toast.success(`NDA draft auto-created for ${candidateMeta.displayName}`);
            }
          }
        } catch (ndaErr) {
          console.warn("[DocumentStudio] NDA companion auto-create failed", ndaErr);
        }
      }
      return saved;
    } catch (e: any) {
      return undefined;
    }
  };

  // ── Auto-save (silent) every 8s when there's a candidate name & changes ──
  const autoSaveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!template) return;
    const candidateName = pickCandidateDisplayName(fields);
    if (!candidateName) return;
    if (!bodyHtml) return;
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      handleSaveDocument({ silent: true });
    }, 8000);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyHtml, JSON.stringify(fields), template?.id]);

  // ── Cmd/Ctrl+S keyboard shortcut → manual save (toast) ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSaveDocument();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, fields, bodyHtml]);



  const loadCrmDocument = (d: { id: string; field_values: Record<string, string>; template_id: string; title: string; rendered_html?: string | null }) => {
    setTemplateId(d.template_id);
    setSyncedFields(d.field_values || {});
    if (d.rendered_html) {
      userEditedRef.current = true;
      setUserEdited(true);
      setBodyHtml(d.rendered_html);
      liveEditedBodyHtmlRef.current = d.rendered_html;
    }
    setCurrentDocId(d.id);
    setStep(2);
    toast.success(`Loaded "${d.title}"`);
  };

  /* ── Global document action picker (Preview / Edit / Delete) ─────── */
  const { data: deletedDocs = [] } = useCrmDocumentsDeleted();
  const softDeleteDoc = useSoftDeleteDocument();
  const restoreDoc = useRestoreDocument();
  const hardDeleteDoc = useHardDeleteDocument();
  const [pickerDoc, setPickerDoc] = useState<CrmDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CrmDocument | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const openActionSheet = (d: CrmDocument) => setPickerDoc(d);
  const handlePreview = (id: string) => {
    const d = allDocs.find((x) => x.id === id);
    if (d) setPreviewDoc(d);
  };
  const handleEditFromPicker = (id: string) => {
    const d = allDocs.find((x) => x.id === id);
    if (d) loadCrmDocument(d as any);
  };
  const handleSoftDelete = async (id: string) => {
    await softDeleteDoc.mutateAsync(id);
    toast.success("Moved to Recently Deleted", {
      action: { label: "Undo", onClick: () => restoreDoc.mutate(id) },
      duration: 5000,
    });
  };




  // AI auto-fill from pasted details / attached document.
  const [autoFillText, setAutoFillText] = useState("");
  const [autoFillBusy, setAutoFillBusy] = useState(false);
  const autoFillFileRef = useRef<HTMLInputElement>(null);
  const uploadAttachmentMutation = useUploadCandidateAttachment();

  // Document language (drives translation + AI replies + STT).
  const [docLanguage, setDocLanguage] = useState<string>(snap?.docLanguage || "English");
  const [chromeTheme, setChromeTheme] = useState<"champagne" | "emerald">(snap?.chromeTheme || "champagne");

  // Signature + stamp placement (with x/y positions for free dragging)
  const { defaultSignature, defaultStamp } = useOwnerAssets();
  const [marks, setMarks] = useState<DocumentMarks & {
    signatureXY?: { x: number; y: number };
    signatureBXY?: { x: number; y: number };
    stampXY?: { x: number; y: number };
    dateXY?: { x: number; y: number };
    dateValue?: string;
    signatureB?: { url: string; width: number };
    showDate?: boolean;
    showSigB?: boolean;
    stampLocked?: boolean;
  }>(() => ({ showDate: false, showSigB: true, stampLocked: true, dateValue: new Date().toISOString().slice(0, 10), ...(snap?.marks || {}) }));
  const [assetDialog, setAssetDialog] = useState<null | AssetKind>(null);
  const [exporting, setExporting] = useState<null | "pdf" | "docx" | "png" | "both">(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clearSession = (templateToClear?: string) => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    if (templateToClear) {
      try { localStorage.removeItem(TEMPLATE_KEY(templateToClear)); } catch {}
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Some browsers block fullscreen; ignore silently.
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Auto-attach owner's default signature & stamp the first time they exist.
  // Stamp is stripped of any white background so it overlays cleanly.
  useEffect(() => {
    (async () => {
      let stampUrl = defaultStamp?.signedUrl || jbjCompanyStampSrc;
      if (stampUrl) {
        try {
          // Fetch → dataURL → strip white → use stripped version
          const res = await fetch(stampUrl);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result || ""));
            fr.readAsDataURL(blob);
          });
          const { result } = await removeWhiteBackground(dataUrl, 235);
          stampUrl = result;
        } catch { /* fall back to original signed URL */ }
      }
      setMarks((m) => {
        const next = { ...m };
        if (!next.signature && defaultSignature?.signedUrl) {
          next.signature = { url: defaultSignature.signedUrl, width: 200 };
        }
        if (!next.stamp && stampUrl) next.stamp = { url: stampUrl, width: 120, rotation: 0 };
        else if (next.stamp) next.stamp = { ...next.stamp, width: Math.min(next.stamp.width || 120, 140), rotation: 0 };
        return next;
      });
    })();
  }, [defaultSignature?.signedUrl, defaultStamp?.signedUrl]);

  // Owner-date in the left rail is the single source of truth for the
  // preview date chip. Whenever it changes, propagate to marks.dateValue.
  useEffect(() => {
    setMarks((m) => ({ ...m, dateValue: ownerDate }));
  }, [ownerDate]);

  const pickAsset = (asset: OwnerAsset) => {
    if (!asset.signedUrl) return;
    if (asset.kind === "signature") {
      setMarks((m) => ({ ...m, signature: { url: asset.signedUrl!, width: m.signature?.width || 200 } }));
    } else {
      setMarks((m) => ({ ...m, stamp: { url: asset.signedUrl!, width: m.stamp?.width || 142, rotation: 0 } }));
    }
    toast.success(`${asset.kind === "signature" ? "Signature" : "Stamp"} placed`);
  };
  const removeMark = (kind: "signature" | "signatureB" | "stamp" | "date") =>
    setMarks((m) => {
      const n: any = { ...m };
      if (kind === "date") n.showDate = false;
      else if (kind === "signatureB") n.showSigB = false;
      else n[kind] = undefined;
      return n;
    });

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    preloadExportLibraries();
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setField = (k: string, v: string) => {
    resumeStructuredSync();
    setFields((p) => {
      const alias = /^(recipientName|fullName|full_name|candidateName|fullNameAsPerPassport|passportFullName|fullNameAsPerId|fullNameAsPerID|emiratesIdFullName)$/i.test(k)
        ? officialNameAlias(v)
        : undefined;
      const nextValue = alias?.english || v;
      const next = { ...p, [k]: nextValue };
      if (alias?.english) {
        next.fullNameAsPerPassport = alias.english;
        next.fullNameAsPerId = alias.english;
        next.recipientName = alias.english;
      }
      if (alias?.arabic && !next.fullNameArabic) next.fullNameArabic = alias.arabic;
      return next;
    });
  };
  const applyDeveloperDetails = (developerName: string) => {
    const dev = UAE_DEVELOPERS.find((d) => d.name.toLowerCase() === developerName.trim().toLowerCase());
    if (!dev) return;
    userEditedRef.current = false;
    setUserEdited(false);
    setFields((p) => ({
      ...p,
      developerName: dev.name,
      developerContact: `${dev.email} · ${dev.phone}`,
      accountsEmail: dev.email,
    }));
  };

  // Auto-render locked standard body whenever template / fields / commissions /
  // owner-signature state change. We force-rerender every time UNLESS the user
  // has explicitly hand-edited the body via EditableBody (tracked by
  // userEditedRef). When that flag is set, a "Reset to template" pill appears
  // above the page so re-syncing is one click.
  const autoBodyRef = useRef<string>("");
  const userEditedRef = useRef<boolean>(false);
  const [userEdited, setUserEdited] = useState(false);

  const resumeStructuredSync = useCallback(() => {
    userEditedRef.current = false;
    setUserEdited(false);
  }, []);

  const setSyncedFields = useCallback((updater: SetStateAction<Record<string, string>>) => {
    resumeStructuredSync();
    setFields(updater);
  }, [resumeStructuredSync]);

  // ── Apply a previously saved snapshot — only when the user explicitly resumes.
  const applySnapshot = useCallback((s: any) => {
    try {
      const forceTemplateResync = (s.templateId === "job_offer" || s.templateId === "nda") && (s.documentFixVersion || 0) < DOCUMENT_FIX_VERSION;
      if (s.fields && typeof s.fields === "object") {
        const shared = readSharedIdentity();
        setFields(forceTemplateResync
          ? normalizeJobOfferIdentityFields(s.fields, shared)
          : (s.templateId === "job_offer" ? normalizeJobOfferIdentityFields(s.fields, shared) : s.fields));
      }
      if (forceTemplateResync) {
        userEditedRef.current = false;
        setUserEdited(false);
        setBodyHtml("");
      } else if (typeof s.bodyHtml === "string" && s.bodyHtml) {
        setBodyHtml(s.bodyHtml);
        if (s.userEdited) {
          // Hand-edited contracts must reopen exactly where the owner left them.
          // Structured/generated drafts rebuild from restored fields so new legal
          // clauses and the three commission tiers are not lost.
          userEditedRef.current = true;
          setUserEdited(true);
        }
      }
      if (typeof s.templateId === "string" && s.templateId) setTemplateId(s.templateId);
      setStep(typeof s.step === "number" ? (s.step as Step) : 2);
      if (typeof s.ownerName === "string") setOwnerName(s.ownerName);
      if (typeof s.ownerTitle === "string") setOwnerTitle(s.ownerTitle);
      if (forceTemplateResync && s.templateId === "job_offer") {
        setOwnerDate("2026-06-26");
        setApplicantDate("2026-06-26");
      } else {
        if (typeof s.ownerDate === "string") setOwnerDate(s.ownerDate);
        if (typeof s.applicantDate === "string") setApplicantDate(s.applicantDate);
      }
      if (Array.isArray(s.extraSignatories)) setExtraSignatories(s.extraSignatories);
      if (forceTemplateResync && s.templateId === "job_offer") setHiddenFieldKeys(new Set());
      else if (Array.isArray(s.hiddenFieldKeys)) setHiddenFieldKeys(new Set(s.hiddenFieldKeys));
      if (s.fieldLabelOverrides && typeof s.fieldLabelOverrides === "object") setFieldLabelOverrides(s.fieldLabelOverrides);
      if (forceTemplateResync && s.templateId === "job_offer") setHiddenSections(new Set());
      else if (Array.isArray(s.hiddenSections)) setHiddenSections(new Set(s.hiddenSections));
      if (Array.isArray(s.customFields)) setCustomFields(s.customFields);
      if (Array.isArray(s.commissionRows)) setCommissionRows(restoreOfferCommissionRows(s.templateId, s.commissionRows));
      if (typeof s.docLanguage === "string") setDocLanguage(s.docLanguage);
      if (s.chromeTheme === "champagne" || s.chromeTheme === "emerald") setChromeTheme(s.chromeTheme);
      if (s.marks && typeof s.marks === "object") {
        setMarks((m) => ({
          ...m,
          ...s.marks,
          stamp: forceTemplateResync && s.templateId === "job_offer"
            ? { url: jbjCompanyStampSrc, width: 120, rotation: 0 }
            : (s.marks?.stamp ? { ...s.marks.stamp, width: Math.min(s.marks.stamp.width || 142, 160), rotation: 0 } : m.stamp),
          stampXY: forceTemplateResync && s.templateId === "job_offer" ? undefined : s.marks.stampXY,
          stampLocked: forceTemplateResync && s.templateId === "job_offer" ? true : s.marks.stampLocked,
        }));
      }
      if (typeof s.manualPages === "number") setManualPages(Math.max(0, s.manualPages));
      if (typeof s.emailTo === "string") setEmailTo(s.emailTo);
      toast.success("Draft restored", {
        description: s.savedAt
          ? `Recovered from ${new Date(s.savedAt).toLocaleString()}`
          : "Your previous work was recovered.",
      });
      requestAnimationFrame(() => {
        previewWrapRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch {
      toast.error("Could not restore draft");
    }
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    // Per latest owner directive: opening a template (Offer Letter, NDA, etc.)
    // ALWAYS opens a fresh document. Incomplete work lives in the Drafts tab
    // and completed work lives in the Folders tab — both visible in the
    // DocumentsFormsHub header. The session-level auto-restore is therefore
    // intentionally disabled. Per-template snapshots are still written so the
    // Drafts tab can list and resume them on demand.
    void snap; void applySnapshot; void restoredOnce;

    // ── One-shot prefill from an external bridge.
    // Only valid, current templates may open Document Studio. Removed templates
    // are cleared so they cannot leave the left sidebar empty.
    try {
      const PREFILL_KEY = `jbj:doc-studio:prefill:${catalog}`;
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        const validPrefillTemplate = !!p?.templateId && !!getTemplateById(p.templateId) && (catalog === "all" || getTemplateById(p.templateId)?.audience === catalog);
        if (validPrefillTemplate) {
          setTemplateId(p.templateId);
          if (p?.fields && typeof p.fields === "object") {
            setSyncedFields((cur) => ({ ...cur, ...p.fields }));
          }
          setStep(2);
          toast.success("Applicant loaded", { description: "Details pre-filled in the Studio." });
        } else {
          setTemplateId("");
          setStep(1);
        }
        sessionStorage.removeItem(PREFILL_KEY);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save snapshot (debounced) to survive refresh / accidental close / logout.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const buildPayload = () => ({
      savedAt: new Date().toISOString(),
      documentFixVersion: DOCUMENT_FIX_VERSION,
      step,
      templateId,
      fields,
      bodyHtml: getCurrentBodyHtml(),
      userEdited: userEdited || !!liveEditedBodyHtmlRef.current,
      ownerName,
      ownerTitle,
      ownerDate,
      applicantDate,
      extraSignatories,
      hiddenFieldKeys: Array.from(hiddenFieldKeys),
      fieldLabelOverrides,
      hiddenSections: Array.from(hiddenSections),
      customFields,
      commissionRows,
      docLanguage,
      chromeTheme,
      marks,
      emailTo,
      manualPages,
    });
    const writeAll = () => {
      const payload = buildPayload();
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(payload)); } catch {}
      if (payload.templateId) {
        try { localStorage.setItem(TEMPLATE_KEY(payload.templateId), JSON.stringify(payload)); } catch {}
      }
    };
    const handle = setTimeout(writeAll, 400);
    const flush = writeAll;

    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(handle);
      flush();
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [step, templateId, fields, bodyHtml, userEdited, ownerName, ownerTitle, ownerDate, applicantDate,
      extraSignatories, hiddenFieldKeys, fieldLabelOverrides, hiddenSections,
      customFields, commissionRows, docLanguage, chromeTheme, marks, emailTo, manualPages, SESSION_KEY, getCurrentBodyHtml]);


  useEffect(() => {
    if (!template) return;
    // Drop hidden field keys before rendering body.
    const visibleFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!hiddenFieldKeys.has(k)) visibleFields[k] = v;
    }
    const next = renderStandardBody({
      templateId: template.id,
      fields: visibleFields,
      department: template.needsPosition ? department : undefined,
      commissionRows: usesCommission && !hiddenSections.has("commission") ? commissionRows : undefined,
      customFields: hiddenSections.has("custom") ? [] : customFields,
      ownerName,
      ownerTitle,
      ownerDate,
      letterDate: visibleFields.letterDate || ownerDate,
      applicantDate,
      hideLetterDate: true,
      extraSignatories,
    });
    autoBodyRef.current = next;
    setAutoPageGroups(null);
    autoPageGroupsSourceRef.current = "";
    // The sidebar/detail fields are the source of truth. Previously, simply
    // clicking into the editable preview and blurring it marked the document as
    // "manual edited", permanently blocking field → contract updates. Keep the
    // locked template live-synced unless the body was genuinely edited.
    if (!userEditedRef.current) setBodyHtml(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    template?.id,
    JSON.stringify(fields),
    department,
    JSON.stringify(commissionRows),
    JSON.stringify(customFields),
    JSON.stringify(Array.from(hiddenSections)),
    JSON.stringify(Array.from(hiddenFieldKeys)),
    ownerName, ownerTitle, ownerDate, applicantDate,
    JSON.stringify(extraSignatories),
  ]);

  const buildSyncedBodyHtmlNow = useCallback(() => {
    if (!template) return "";
    const visibleFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!hiddenFieldKeys.has(k)) visibleFields[k] = v;
    }
    return renderStandardBody({
      templateId: template.id,
      fields: visibleFields,
      department: template.needsPosition ? department : undefined,
      commissionRows: usesCommission && !hiddenSections.has("commission") ? commissionRows : undefined,
      customFields: hiddenSections.has("custom") ? [] : customFields,
      ownerName,
      ownerTitle,
      ownerDate,
      letterDate: visibleFields.letterDate || ownerDate,
      applicantDate,
      hideLetterDate: true,
      extraSignatories,
    });
  }, [template, fields, hiddenFieldKeys, department, usesCommission, hiddenSections, commissionRows, customFields, ownerName, ownerTitle, ownerDate, applicantDate, extraSignatories]);

  const resetToTemplate = () => {
    resumeStructuredSync();
    if (autoBodyRef.current) setBodyHtml(autoBodyRef.current);
  };

  const startNewSubmission = () => {
    const targetId = templateId || initialId;
    clearSession(targetId);
    setCurrentDocId(null);
    setSyncedFields(getTemplateDefaultFields(targetId));
    setCustomFields([]);
    setCommissionRows(DEFAULT_BROKER_COMMISSIONS);
    setExtraSignatories([]);
    setHiddenFieldKeys(new Set());
    setFieldLabelOverrides({});
    setHiddenSections(new Set());
    setManualPages(0);
    setApplicantDate("");
    setEmailTo("");
    setMarks((m) => ({ ...m, dateXY: undefined, signatureXY: undefined, stampXY: undefined }));
    resumeStructuredSync();
    setBodyHtml("");
    setStep(targetId ? 2 : 1);
    toast.success("Started a new submission");
  };

  const handleSelectTemplate = async (id: string) => {
    // No-op if the same template is re-selected — never wipe an in-progress body.
    if (id === templateId) { setStep(2); return; }
    setTemplateId(id);
    setSyncedFields(getTemplateDefaultFields(id));
    if (id === "job_offer") {
      setOwnerDate("2026-06-26");
      setApplicantDate("2026-06-26");
    }
    setExtraSignatories([]);
    autoBodyRef.current = "";
    resumeStructuredSync();
    setBodyHtml("");
    // Reset draggable mark positions so a new template starts clean
    // (prevents the date drifting onto the footer after a previous drag).
    setMarks((m) => ({
      ...m,
      dateXY: undefined,
      signatureXY: undefined,
      stampXY: undefined,
    }));
    setStep(2);

    // Seed a stable chained booking ID from the server so the preview shows
    // a real identifier (and Save persists the same ID). Falls back silently
    // to the composer's client-generated random ID if the RPC is unreachable.
    try {
      const prefix =
        id === "holiday_home_agreement" ? "JBJ-HH" :
        id === "commission_agreement" ? "JBJ-CA" :
        id === "property_advertising_agreement" ? "JBJ-PAA" :
        "JBJ-DOC";
      const { data, error } = await (supabase as any).rpc("next_booking_id", { prefix });
      if (!error && data) {
        setSyncedFields((p) => ({ ...p, bookingRef: String(data), booking_id: String(data) }));
      }
    } catch { /* ignore — composer will generate a local id */ }
  };

  const buildPrompt = (t: DocumentTemplate): string => {
    const filled = t.fields
      .map((f) => `${f.label}: ${fields[f.key] || "(not provided)"}`)
      .join("\n");
    const positionLine = t.needsPosition ? `Department: ${department}` : "";
    return [
      t.aiInstructions,
      "",
      "Render the body as 2–6 short paragraphs separated by blank lines.",
      "Do NOT include letterhead, address, phone, signature block, or any header/footer — those are appended automatically.",
      "",
      "Details supplied by the owner:",
      positionLine,
      filled,
    ].filter(Boolean).join("\n");
  };

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: {
          prompt: buildPrompt(template),
          tone: "formal",
          language: "English",
          recipient: fields.recipientName || "",
        },
      });
      if (error) throw error;
      const text: string = (data?.body_text || "").trim();
      if (!text) throw new Error("Empty AI response");
      // Split AI narrative into intro/closing halves and let the composer
      // build the premium structure (terms table + signature block).
      const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const mid = Math.max(1, Math.ceil(parts.length * 0.6));
      const aiIntro = parts.slice(0, mid).join("\n\n");
      const aiClosing = parts.slice(mid).join("\n\n");
      const html = composeDocument({
        templateId: template.id,
        fields,
        department: template.needsPosition ? department : undefined,
        aiIntro,
        aiClosing,
        ownerName,
        ownerTitle,
        ownerDate,
        letterDate: fields.letterDate || ownerDate,
        commissionRows: usesCommission ? commissionRows : undefined,
        customFields,
        extraSignatories,
      });
      resumeStructuredSync();
      setBodyHtml(html);
      toast.success("Document generated");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const insertPageAfter = (afterIndex: number, pageHtml: string) => {
    const groups = parseDocumentPageGroups(bodyHtml || "");
    const insertAt = Math.min(groups.length, Math.max(0, afterIndex + 1));
    const markedPage = `<div data-manual-added-page="1" style="min-height:100%;display:flex;flex-direction:column;">${pageHtml}</div>`;
    const nextGroups = [...groups.slice(0, insertAt), markedPage, ...groups.slice(insertAt)];
    userEditedRef.current = true;
    setUserEdited(true);
    setBodyHtml(wrapDocumentPageGroups(nextGroups));
    setManualPages((n) => n + 1);
  };

  const handleAddBlankPage = (afterIndex: number) => {
    insertPageAfter(afterIndex, `<div style="min-height:560px;"></div>`);
    toast.success("Blank page added");
  };

  const handleDeletePage = (pageIndex: number) => {
    const hasFreshAutoPages = !!autoPageGroups?.length && autoPageGroupsSourceRef.current === (bodyHtml || "");
    const groups = parseDocumentPageGroups(hasFreshAutoPages ? wrapDocumentPageGroups(autoPageGroups) : (bodyHtml || ""));
    if (!groups.length) return;
    userEditedRef.current = true;
    setUserEdited(true);
    setAutoPageGroups(null);
    if (groups.length === 1) {
      setBodyHtml("");
      toast.success("Page cleared");
      return;
    }
    const nextGroups = groups.filter((_, index) => index !== pageIndex);
    setBodyHtml(wrapDocumentPageGroups(nextGroups));
    setManualPages((n) => Math.max(0, n - 1));
    toast.success(`Page ${pageIndex + 1} deleted`);
  };

  const handleGenerateAiPage = async () => {
    if (addPageAfterIndex === null || !addPagePrompt.trim()) return;
    setAiPageBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: {
          mode: "generate-page",
          prompt: addPagePrompt,
          language: docLanguage,
          tone: "formal",
        },
      });
      if (error) throw error;
      const html = String((data as any)?.body_html || "").trim();
      if (!html) throw new Error("Empty AI page");
      insertPageAfter(addPageAfterIndex, html);
      setAddPageAfterIndex(null);
      setAddPagePrompt("");
      toast.success("AI page added");
    } catch (e: any) {
      toast.error(e?.message || "AI page generation failed");
    } finally {
      setAiPageBusy(false);
    }
  };

  const handlePrint = () => {
    const currentBody = cleanDocumentFieldRows(getCurrentBodyHtml());
    if (!currentBody) return;
    printDocument(currentBody, marks);
  };

  const handleExport = async (kind: "pdf" | "docx" | "png" | "both") => {
    let currentBody = cleanDocumentFieldRows(getCurrentBodyHtml());
    if (!currentBody || !template) { toast.error("Nothing to export yet"); return; }
    const syncedBodyNow = cleanDocumentFieldRows(buildSyncedBodyHtmlNow());
    const mustResyncBeforeExport = shouldUseSyncedTemplateForExport(currentBody, syncedBodyNow || autoBodyRef.current, fields)
      || (hasMeaningfulApplicantData(fields)
        && !!syncedBodyNow
        && countBracketPlaceholders(currentBody) > countBracketPlaceholders(syncedBodyNow));
    if (mustResyncBeforeExport) {
      const exportBody = syncedBodyNow || autoBodyRef.current;
      resumeStructuredSync();
      userEditedRef.current = false;
      liveEditedBodyHtmlRef.current = null;
      setUserEdited(false);
      flushSync(() => setBodyHtml(exportBody));
      autoBodyRef.current = exportBody;
      committedBodyHtmlRef.current = exportBody;
      currentBody = cleanDocumentFieldRows(exportBody);
      await waitForDocumentPaint();
    }
    setExporting(kind);
    const progressId = kind === "pdf" || kind === "both" ? toast.loading("Preparing PDF…") : null;
    const onProgress = (done: number, total: number) => {
      if (progressId != null) {
        toast.loading(`Rendering page ${Math.min(done + 1, total)} of ${total}…`, { id: progressId });
      }
    };
    try {
      const src = pageRef.current;
      const candidateNameForFile =
        pickCandidateDisplayName(fields) || deriveCandidateFolder(fields).displayName || null;
      let pdfBlob: Blob | null = null;
      if (kind === "pdf") pdfBlob = await exportPdf(currentBody, marks, template, src, onProgress, candidateNameForFile);
      else if (kind === "docx") await exportDocx(currentBody, marks, template, candidateNameForFile);
      else if (kind === "png") await exportPng(currentBody, marks, template, src, candidateNameForFile);
      else if (kind === "both") {
        pdfBlob = await exportPdf(currentBody, marks, template, src, onProgress, candidateNameForFile);
        await exportPng(currentBody, marks, template, src, candidateNameForFile);
      }
      if (progressId != null) toast.success("PDF downloaded", { id: progressId });

      if (pdfBlob) {
        // The file is already on the user's device; release the UI immediately
        // and archive the generated PDF in the profile folder in the background.
        // This removes the perceived post-download delay without changing the
        // exported pixels or the save/archive behavior.
        setExporting(null);
        const pdfBlobForArchive = pdfBlob;
        void (async () => {
          try {
            const saved = await handleSaveDocument();
            const docId = saved?.id || currentDocId;
            const { data: { user } } = await supabase.auth.getUser();
            if (docId && user) {
              const profile = getProfileValues(fields);
              const owner = (profile.clientName || profile.developerName || "unassigned")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "unassigned";
              const profileFolder = profile.profileType === "developer" ? "developers" : "clients";
              const pdfPath = `${user.id}/${profileFolder}/${owner}/${docId}/${Date.now()}-${template.id}.pdf`;
              const { error: uploadError } = await supabase.storage
                .from("crm-documents")
                .upload(pdfPath, pdfBlobForArchive, { contentType: "application/pdf", upsert: true });
              if (uploadError) throw uploadError;
              await (supabase.from("crm_documents" as any) as any)
                .update({ pdf_path: pdfPath, rendered_html: currentBody || null, field_values: { ...fields, profile_type: profile.profileType } })
                .eq("id", docId);
              toast.success("PDF saved to the profile file");
            }
          } catch (saveError: any) {
            console.warn("[DocumentStudio] profile save failed", saveError);
            toast.warning(saveError?.message || "Downloaded, but profile save needs attention");
          }
        })();
      } else {
        toast.success(`${kind.toUpperCase()} downloaded`);
      }
    } catch (e: any) {
      console.error("[DocumentStudio] export failed", kind, e);
      if (progressId != null) toast.error(e?.message || `${kind.toUpperCase()} export failed`, { id: progressId });
      else toast.error(e?.message || `${kind.toUpperCase()} export failed`);
    } finally {
      setExporting(null);
    }
  };

  // ── "Ready" → finalize the current document and file it into the
  // candidate's Folder. Renders a PDF, uploads it to the candidate folder
  // (creating it if needed), clears the working draft, and routes the user
  // to the Folders tab so they can see the finished file alongside the
  // candidate's other documents. The PDF is also downloaded to the user's
  // device as a side-effect of exportPdf, which gives the owner a local
  // copy without an extra click.
  const [readyPending, setReadyPending] = useState(false);
  const handleReady = async () => {
    if (!template) { toast.error("Choose a template first"); return; }
    const currentBody = cleanDocumentFieldRows(getCurrentBodyHtml());
    if (!currentBody) { toast.error("Nothing to file — generate the document first"); return; }
    const candidateName =
      pickCandidateDisplayName(fields) || deriveCandidateFolder(fields).displayName || "";
    if (!candidateName.trim()) {
      toast.error("Add the candidate / client name before marking Ready");
      return;
    }
    setReadyPending(true);
    const progressId = toast.loading("Finalizing document for the folder…");
    try {
      await handleSaveDocument({ silent: true });
      const src = pageRef.current;
      const pdfBlob = await exportPdf(currentBody, marks, template, src, undefined, candidateName);
      const stamp = new Date().toISOString().slice(0, 10);
      const safeName = candidateName.replace(/[^A-Za-z0-9\- ]+/g, "").trim().replace(/\s+/g, "_") || "Document";
      const safeTpl = (template.label || template.id || "Document").replace(/[^A-Za-z0-9\- ]+/g, "").trim().replace(/\s+/g, "_");
      const file = new File([pdfBlob], `${safeTpl}_${safeName}_${stamp}.pdf`, { type: "application/pdf" });
      await uploadAttachmentMutation.mutateAsync({
        file,
        candidate_display_name: candidateName,
        kind: "ready_document",
      });
      try { clearSession(template.id); } catch {}
      toast.success(`Filed in ${candidateName}'s folder`, { id: progressId });
      try { onClose(); } catch {}
      window.setTimeout(() => navigate("/owner/documents/forms?tab=folders"), 60);
    } catch (e: any) {
      console.error("[DocumentStudio] Ready failed", e);
      toast.error(e?.message || "Could not file document to the folder", { id: progressId });
    } finally {
      setReadyPending(false);
    }
  };

  const handleSend = async (recipientOverride?: string) => {
    const currentBody = cleanDocumentFieldRows(getCurrentBodyHtml());
    if (!currentBody || !template) return;
    const to = (recipientOverride || emailTo).trim();
    if (!to) { toast.error("Enter a recipient email"); return; }
    setSending(true);
    try {
      const { buildPrintableHtml } = await import("./export/exporters");
      const fullHtml = buildPrintableHtml(currentBody, marks);
      const { data, error } = await supabase.functions.invoke("email-send-gateway", {
        body: {
          from: "JBJ Global Real Estate <contact@jbj.ae>",
          to,
          subject: template.emailSubject || template.label,
          html: fullHtml,
          reply_to: "contact@jbj.ae",
        },
      });
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error || "Send failed");
      toast.success(recipientOverride ? `Test sent to ${recipientOverride}` : `Sent to ${to}`);
      if (!recipientOverride) clearSession();
    } catch (e: any) {
      toast.error(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const requiredOk = useMemo(() => {
    if (!template) return false;
    return template.fields.every((f) => !f.required || (fields[f.key] || "").trim());
  }, [template, fields]);

  const renderTemplateField = (f: DocumentTemplate["fields"][number]) => {
    const label = fieldLabelOverrides[f.key] ?? f.label;
    const isEditing = editingFieldKey === f.key;
    const isDeveloperName = f.key === "developerName";
    return (
      <div key={f.key}>
        <div className="flex items-center gap-1 mb-1.5 group">
          {isEditing ? (
            <Input
              autoFocus
              value={label}
              onChange={(e) => setFieldLabelOverrides((p) => ({ ...p, [f.key]: e.target.value }))}
              onBlur={() => setEditingFieldKey(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingFieldKey(null); }}
              className="h-6 text-[10px] uppercase tracking-[0.18em] flex-1"
            />
          ) : (
            <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 flex-1">
              {label}
              {f.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
          )}
          <button type="button" onClick={() => setEditingFieldKey(isEditing ? null : f.key)} className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5" title="Rename field">
            <PenLine className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => hideField(f.key)} className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5" title="Remove this field from document">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {f.type === "textarea" ? (
          <Textarea value={fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} rows={3} className="bg-[#FDFBF7] resize-none" />
        ) : f.type === "select" ? (
          <Select value={fields[f.key] || ""} onValueChange={(v) => setField(f.key, v)}>
            <SelectTrigger className="bg-[#FDFBF7]"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className="z-[2147483647] bg-[#FDFBF7]">
              {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : isDeveloperName ? (
          <div className="space-y-1.5">
            <Input
              list="jbj-developer-picker"
              value={fields[f.key] || ""}
              onChange={(e) => { setField(f.key, e.target.value); applyDeveloperDetails(e.target.value); }}
              onBlur={(e) => applyDeveloperDetails(e.target.value)}
              placeholder={f.placeholder || "Search developer or type manually"}
              className="bg-[#FDFBF7]"
            />
            <datalist id="jbj-developer-picker">
              {UAE_DEVELOPERS.map((d) => <option key={d.name} value={d.name} />)}
            </datalist>
            <div className="flex flex-wrap gap-1.5">
              {UAE_DEVELOPERS.slice(0, 6).map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => applyDeveloperDetails(d.name)}
                  className="rounded-full border border-[#B89555]/35 bg-[#FDFBF7] px-2 py-1 text-[10px] font-semibold text-[#1A1A1A] hover:bg-[#EFE6D6]"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Input type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"} value={fields[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} className="bg-[#FDFBF7]" />
        )}
      </div>
    );
  };

  const overlay = (
    <div
      data-no-contrast-guard
      data-document-studio-overlay
      data-studio-surface="champagne"
      className="fixed inset-0 bg-[#FDFBF7] flex flex-col overflow-hidden"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        zIndex: 2147483000,
        isolation: "isolate",
      }}
    >
      <style>{`
        [data-document-studio-overlay] .border,
        [data-document-studio-overlay] [class*="border-"] {
          border-color: rgba(184, 149, 85, 0.58) !important;
        }
        [data-document-studio-overlay] input,
        [data-document-studio-overlay] textarea,
        [data-document-studio-overlay] button[role="combobox"] {
          border-color: rgba(184, 149, 85, 0.72) !important;
        }
        [data-document-studio-overlay] input:focus,
        [data-document-studio-overlay] textarea:focus,
        [data-document-studio-overlay] button[role="combobox"]:focus,
        [data-document-studio-overlay] button[role="combobox"]:focus-visible,
        [data-document-studio-overlay] [data-state="open"][role="combobox"] {
          border-color: #B89555 !important;
          outline: none !important;
          box-shadow: 0 0 0 1px rgba(184, 149, 85, 0.55) !important;
          --tw-ring-color: rgba(184, 149, 85, 0.55) !important;
          --tw-ring-shadow: 0 0 0 1px rgba(184, 149, 85, 0.55) !important;
        }
        [data-document-studio-overlay] [data-document-page="true"] {
          border-color: rgba(184, 149, 85, 0.42) !important;
        }
        [data-document-studio-overlay],
        [data-document-studio-overlay] * { box-sizing: border-box; }
        [data-document-studio-overlay] { --studio-ink:#1A1A1A; --studio-gold:#B89555; --studio-champagne:#F7F2EA; --studio-paper:#FDFBF7; }
        [data-document-studio-overlay] :is(button,[role="button"], [data-jbj-button]) { min-width: 0; max-width: 100%; }
        [data-document-studio-overlay] [data-surface="emerald"],
        [data-document-studio-overlay] [data-surface="emerald"] * { color:#FFFFFF !important; -webkit-text-fill-color:#FFFFFF !important; stroke:#FFFFFF !important; }
        [data-document-studio-overlay] [data-surface="champagne"],
        [data-document-studio-overlay] [data-surface="champagne"] * { color:#1A1A1A !important; -webkit-text-fill-color:#1A1A1A !important; stroke:currentColor !important; }
        [data-document-studio-overlay] :is([class*="bg-[#FDFBF7]"],[class*="bg-[#F7F2EA]"],[class*="bg-white"],[style*="background:#FDFBF7"],[style*="background: #FDFBF7"],[style*="background:#F7F2EA"],[style*="background: #F7F2EA"]) :is(.text-white,[class*="text-white"],label,span,p,div,button,input,textarea,select) {
          color:#1A1A1A !important;
          -webkit-text-fill-color:#1A1A1A !important;
          text-shadow:none !important;
        }
        [data-document-studio-overlay] [data-document-page="true"] .jbj-doc-body,
        [data-document-studio-overlay] [data-document-page="true"] .jbj-doc-body * { color:#1A1A1A !important; -webkit-text-fill-color:#1A1A1A !important; }
        [data-document-studio-overlay] [data-document-page="true"] .jbj-doc-body :is(svg,[class*="lucide"]) { color:#1A1A1A !important; stroke:#1A1A1A !important; }
        [data-document-studio-overlay] [data-document-page="true"] .jbj-doc-body :is(table, thead, tbody, tr, th, td) {
          background-clip: padding-box !important;
        }
        [data-document-studio-overlay] [data-document-page="true"] .jbj-doc-body table {
          background:#FDFBF7 !important;
          isolation:isolate !important;
        }
        [data-document-studio-overlay] :is(.studio-topbar, [data-document-studio-toolbar], .studio-action-row) [data-surface="champagne"][class*="rounded"],
        [data-document-studio-overlay] :is(.studio-topbar, [data-document-studio-toolbar], .studio-action-row) [data-jbj-button] {
          container-type: normal !important;
          contain: none !important;
          overflow: visible !important;
        }
        [data-document-studio-overlay] .studio-scroll-x { overflow-x:hidden; }
        [data-document-studio-overlay] .studio-action-row { display:flex !important; flex-wrap:wrap !important; gap:10px !important; align-items:center !important; min-width:0; }
        [data-document-studio-overlay] .studio-action-row > * { flex:0 0 auto !important; max-width:none !important; }
        [data-document-studio-overlay] .studio-action-row :is(button,[data-jbj-button]) {
          width:auto !important;
          min-width:max-content !important;
          max-width:none !important;
          flex:0 0 auto !important;
          white-space:nowrap !important;
          min-height:42px !important;
          padding-left:14px !important;
          padding-right:14px !important;
          overflow:visible !important;
          text-overflow:clip !important;
        }
        [data-document-studio-overlay] .studio-action-row :is(button,[data-jbj-button]) > span { white-space:nowrap !important; display:inline-flex !important; max-width:none !important; overflow:visible !important; }
        [data-document-studio-overlay] [data-document-studio-toolbar] .studio-action-row { justify-content:flex-end; width:100%; }
        [data-document-studio-overlay] [data-document-studio-toolbar] button { min-height:40px; }
        [data-document-studio-overlay] .studio-toolbar-scroll { overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
        [data-document-studio-overlay] .studio-toolbar-scroll::-webkit-scrollbar { height:6px; }
        [data-document-studio-overlay] .studio-toolbar-scroll::-webkit-scrollbar-thumb { background:rgba(184,149,85,.55); border-radius:999px; }
        [data-document-studio-overlay] .studio-top-primary-actions { width:100%; overflow:visible !important; padding-bottom:2px; justify-content:flex-start !important; flex-wrap:wrap !important; }
        [data-document-studio-overlay] .studio-top-primary-actions > * { flex:0 0 auto; }
        [data-document-studio-overlay] .studio-live-editor-actions { min-width:0; justify-content:flex-end; }
        [data-document-studio-overlay] .studio-live-editor-actions > * { flex:0 0 auto; }
        [data-document-studio-overlay] .studio-top-primary-actions::-webkit-scrollbar { height:6px; }
        [data-document-studio-overlay] .studio-top-primary-actions::-webkit-scrollbar-thumb { background:rgba(184,149,85,.55); border-radius:999px; }
        [data-document-studio-overlay] .studio-top-primary-actions button { height:42px; }
        [data-document-studio-overlay] .studio-preview-shell { width:100%; }
        [data-document-studio-overlay] .studio-sidebar { min-width:0; }
        [data-document-studio-overlay] .studio-template-card { min-width:0; overflow:hidden; }
        [data-document-studio-overlay] .studio-template-card * { overflow-wrap:anywhere; }
        @media (max-width: 1279px) {
          [data-document-studio-overlay] .studio-body { overflow:auto; }
          [data-document-studio-overlay] .studio-sidebar { max-height:none !important; }
          [data-document-studio-overlay] .studio-ai-panel {
            position:fixed !important;
            right:16px !important;
            bottom:16px !important;
            top:96px !important;
            width:min(430px, calc(100vw - 32px)) !important;
            max-height:none !important;
            z-index:2147483210 !important;
            border-radius:18px !important;
            box-shadow:0 28px 90px -28px rgba(0,0,0,.42) !important;
          }
          [data-document-studio-overlay] [data-document-studio-toolbar] { align-items:flex-start !important; }
          [data-document-studio-overlay] [data-document-studio-toolbar] .studio-action-row { width:max-content; min-width:100%; justify-content:flex-start; flex-wrap:nowrap; }
        }
        @media (max-width: 767px) {
          [data-document-studio-overlay] .studio-topbar { padding:10px 12px !important; }
          [data-document-studio-overlay] .studio-brand-subtitle { display:none !important; }
          [data-document-studio-overlay] .studio-action-row [data-jbj-button] { min-height:38px; padding-inline:12px; }
          [data-document-studio-overlay] .studio-preview-shell { padding:18px 10px !important; }
        }

      `}</style>
      {/* ─── Topbar ─── */}
      <div className="studio-topbar shrink-0 border-b border-[#B89555]/55 bg-[#FDFBF7] flex flex-col gap-3 px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[13px] font-semibold text-[#1A1A1A]">Live Editor</div>
              <div className="studio-brand-subtitle text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
                {catalog === "staff" ? "Careers · Staff" : catalog === "client" ? "Client · Real Estate" : "All templates"}
              </div>
            </div>
          </div>
          <div className="studio-live-editor-actions flex flex-wrap items-center gap-2 shrink min-w-0">
            {/* Offer / NDA quick-switch is ALWAYS visible (collapsed or not)
                so the companion document is one click away from any state. */}
            <div className="flex h-10 items-center gap-1 border border-[#B89555]/70 bg-[#F7F2EA] rounded-md p-1 shrink-0" role="tablist" aria-label="Offer / NDA quick switch" data-surface="champagne">
              <button
                type="button"
                role="tab"
                aria-selected={templateId === "job_offer"}
                onClick={() => {
                  if (templateId === "job_offer") return;
                  resumeStructuredSync();
                  autoBodyRef.current = "";
                  setBodyHtml("");
                  setTemplateId("job_offer");
                }}
                className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${templateId === "job_offer" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"}`}
                title="Open Offer Letter (auto-synced identity)"
              >
                Offer
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={templateId === "nda"}
                onClick={() => {
                  if (templateId === "nda") return;
                  const wasOffer = templateId === "job_offer";
                  resumeStructuredSync();
                  autoBodyRef.current = "";
                  setBodyHtml("");
                  setTemplateId("nda");
                  if (wasOffer) {
                    const shared = readSharedIdentity();
                    if (Object.keys(shared).length) {
                      setFields((prev) => ({ ...prev, ...shared }));
                    }
                  }
                }}
                className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${templateId === "nda" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"}`}
                title="Open the NDA — pre-fills from the Offer Letter when switched from Offer; blank when opened directly"
              >
                NDA
              </button>

            </div>
            <Button variant="outline" size="sm" onClick={() => autoFillFileRef.current?.click()} title="Attach Emirates ID, passport or document" className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
              <Upload className="w-4 h-4 mr-1.5" />
              <span>Attach ID</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAssetDialog("signature")} title="Signature" className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
              <PenLine className="w-4 h-4 mr-1.5" />
              <span>Signature</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAssetDialog("stamp")} title="Stamp" className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
              <Stamp className="w-4 h-4 mr-1.5" />
              <span>Stamp</span>
            </Button>
            {template && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveDocument()}
                disabled={saveDocMutation.isPending}
                title="Save this document (⌘/Ctrl+S). Also auto-saves every 8s."
                className="h-10"
              >
                {saveDocMutation.isPending
                  ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  : <FileText className="w-4 h-4 mr-1.5" />}
                <span>{currentDocId ? "Update" : "Save"}</span>
              </Button>
            )}
            {template && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleReady}
                disabled={readyPending || !bodyHtml}
                title="Finalize this document and move it to the candidate folder"
                className="h-10 jj-cta-emerald"
              >
                {readyPending
                  ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  : <Check className="w-4 h-4 mr-1.5" />}
                <span>Ready</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Close the studio dialog first, then route to the Candidates
                // tab. Without closing, the modal would cover the new tab.
                try { onClose(); } catch {}
                window.setTimeout(() => {
                  navigate("/owner/documents/forms?tab=folders");
                }, 50);
              }}
              title="Open candidate folders"
              className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              <span>Folders</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]" title="Document actions">
                  <Download className="w-4 h-4 mr-1.5" />
                  <span>Actions</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FDFBF7] z-[2147483647] border-[#B89555]/50 min-w-[220px]">
                <DropdownMenuItem onClick={startNewSubmission}>
                  <Plus className="w-4 h-4 mr-2" /> Start New
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetToTemplate} disabled={!bodyHtml}>
                  <Wand2 className="w-4 h-4 mr-2" /> Reset Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint} disabled={!bodyHtml}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={!bodyHtml || !!exporting}>
                  <FileText className="w-4 h-4 mr-2" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("png")} disabled={!bodyHtml || !!exporting}>
                  <FileText className="w-4 h-4 mr-2" /> Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")} disabled={!bodyHtml || !!exporting}>
                  <FileText className="w-4 h-4 mr-2" /> Export Word
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("both")} disabled={!bodyHtml || !!exporting}>
                  <FileText className="w-4 h-4 mr-2" /> Export PDF + PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSaveName(`${template?.label || "Document"} — Custom`); setSaveDialogOpen(true); }} disabled={!template}>
                  <Check className="w-4 h-4 mr-2" /> Save Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSaveDocument()} disabled={!template || saveDocMutation.isPending}>
                  <FileText className="w-4 h-4 mr-2" /> {currentDocId ? "Update Document" : "Save Document"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFullscreen}>
                  <Maximize2 className="w-4 h-4 mr-2" /> {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {setupChromeCollapsed && (
              <Button variant="ghost" size="sm" onClick={() => setAiOpen((v) => !v)} title={aiOpen ? "Hide AI" : "Show AI"} className="h-10 hover:bg-[#EFE6D6]">
                {aiOpen ? <PanelRightClose className="w-4 h-4 mr-1.5" /> : <PanelRightOpen className="w-4 h-4 mr-1.5" />}
                <span>AI</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSetupChromeCollapsed((v) => !v)} className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]" title={setupChromeCollapsed ? "Expand editor tools" : "Minimize editor tools"}>
              {setupChromeCollapsed ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronUp className="w-4 h-4 mr-1.5" />}
              <span>{setupChromeCollapsed ? "Tools" : "Minimize"}</span>
            </Button>
            <button
              onClick={() => setStudioMinimized(true)}
              data-surface="champagne"
              className="h-10 w-10 shrink-0 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A]"
              aria-label="Minimize Studio"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              data-surface="champagne" className="h-10 w-10 shrink-0 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!setupChromeCollapsed && (
          <>
        <Stepper step={step} setStep={(s) => {
          if (s === 2 && !templateId) return;
          if (s === 3 && !bodyHtml) return;
          setStep(s);
        }} hasTemplate={!!templateId} hasBody={!!bodyHtml} />

        <div className="studio-action-row studio-top-primary-actions justify-start">
          {/* Pinned template quick-switch — Offer ↔ NDA are always sent together
              and share the same applicant identity store, so they live side by
              side in the toolbar for one-click switching. */}
          <div className="flex h-10 items-center gap-1 border border-[#B89555]/70 bg-[#F7F2EA] rounded-md p-1 shrink-0" role="tablist" aria-label="Pinned templates" data-surface="champagne">
            <button
              type="button"
              role="tab"
              aria-selected={templateId === "job_offer"}
              onClick={() => {
                if (templateId === "job_offer") return;
                resumeStructuredSync();
                autoBodyRef.current = "";
                setBodyHtml("");
                setTemplateId("job_offer");
              }}
              className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${templateId === "job_offer" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"}`}
              title="Open Offer Letter (auto-synced identity)"
            >
              Offer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={templateId === "nda"}
              onClick={() => {
                if (templateId === "nda") return;
                // Companion entry: switching from Offer → NDA inside the same
                // Studio session pre-fills NDA identity from the current Offer
                // fields (shared identity store). Opening NDA directly from
                // the launcher stays blank — see fields useState above.
                const wasOffer = templateId === "job_offer";
                resumeStructuredSync();
                autoBodyRef.current = "";
                setBodyHtml("");
                setTemplateId("nda");
                if (wasOffer) {
                  const shared = readSharedIdentity();
                  if (Object.keys(shared).length) {
                    setFields((prev) => ({ ...prev, ...shared }));
                  }
                }
              }}
              className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${templateId === "nda" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"}`}
              title="Open the NDA — pre-fills from the Offer Letter when switched from Offer; blank when opened directly"
            >
              NDA
            </button>


          </div>
          {/* Theme switcher — Champagne / Emerald letterhead */}
          <div className="flex h-10 items-center gap-1 border border-[#B89555]/70 bg-[#F7F2EA] rounded-md p-1 shrink-0" role="tablist" aria-label="Document theme" data-surface="champagne">
            <button
              type="button"
              role="tab"
              aria-selected={chromeTheme === "champagne"}
              onClick={() => setChromeTheme("champagne")}
              data-surface={chromeTheme === "champagne" ? "emerald" : "champagne"}
              className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${chromeTheme === "champagne" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/65 hover:text-[#1A1A1A]"}`}
            >
              Champagne
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={chromeTheme === "emerald"}
              onClick={() => setChromeTheme("emerald")}
              data-surface={chromeTheme === "emerald" ? "emerald" : "champagne"}
              className={`h-7 px-3 rounded text-[11px] font-semibold tracking-wide uppercase transition-colors ${chromeTheme === "emerald" ? "jj-pill-emerald text-white" : "text-[#1A1A1A]/65 hover:text-[#1A1A1A]"}`}
            >
              Emerald
            </button>
          </div>
          <div data-surface="champagne" className="flex h-10 items-center gap-1.5 text-[11px] text-[#1A1A1A] border border-[#B89555]/70 bg-[#F7F2EA] rounded-md pl-2.5 pr-1.5 focus-within:ring-1 focus-within:ring-[#B89555] shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#064E3B]" />
            <Select value={docLanguage} onValueChange={setDocLanguage}>
              <SelectTrigger className="h-7 w-[116px] border-0 bg-transparent px-1.5 text-[12px] font-semibold text-[#1A1A1A] focus:ring-0 focus:ring-offset-0 focus:border-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2147483647] bg-[#FDFBF7] border-[#B89555]/50">
                {AI_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("signature")} title="Signature" className="border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
            <PenLine className="w-4 h-4 mr-1.5" />
            <span>Signature</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => autoFillFileRef.current?.click()} title="Attach Emirates ID, passport or document to auto-fill fields" className="border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Attach ID</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("stamp")} title="Stamp" className="border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]">
            <Stamp className="w-4 h-4 mr-1.5" />
            <span>Stamp</span>
          </Button>
          {template && userEdited && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToTemplate}
              title="Discard edits and re-render from template"
              className="hover:bg-[#EFE6D6]"
            >
              <X className="w-4 h-4 mr-1.5" />
              <span>Reset</span>
            </Button>
          )}
          {template && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSaveName(`${template.label} — Custom`); setSaveDialogOpen(true); }}
              title="Save current edits as a reusable template"
              className="border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>Save Template</span>
            </Button>
          )}
          {template && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveDocument()}
              disabled={saveDocMutation.isPending}
              title="Save this filled document to My Documents"
              className=""
            >
              {saveDocMutation.isPending
                ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                : <FileText className="w-4 h-4 mr-1.5" />}
              <span>{currentDocId ? "Update" : "Save Document"}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="hover:bg-[#EFE6D6]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1.5" /> : <Maximize2 className="w-4 h-4 mr-1.5" />}
            <span>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAiOpen((v) => !v)} title={aiOpen ? "Hide AI" : "Show AI"} className="hover:bg-[#EFE6D6]">
            {aiOpen ? <PanelRightClose className="w-4 h-4 mr-1.5" /> : <PanelRightOpen className="w-4 h-4 mr-1.5" />}
            <span>{aiOpen ? "Hide AI" : "Show AI"}</span>
          </Button>

          <button
            onClick={onClose}
            data-surface="champagne" className="h-10 w-10 shrink-0 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
          </>
        )}
      </div>

      <AssetLibraryDialog
        open={assetDialog !== null}
        onOpenChange={(v) => !v && setAssetDialog(null)}
        initialTab={assetDialog || "signature"}
        onPick={pickAsset}
      />

      {saveDialogOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          style={{ zIndex: 2147483100 }}
          onClick={() => setSaveDialogOpen(false)}
        >
          <div
            className="bg-[#FDFBF7] rounded-xl border border-[#B89555]/40 p-5 w-[420px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Save as Template</div>
            <div className="text-[11px] text-[#1A1A1A]/65 mb-4">
              Saves all current edits, hidden fields and renames so you can reuse this layout later.
            </div>
            <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 mb-1.5 block">Template name</Label>
            <Input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="My custom Job Offer"
              className="bg-[#FDFBF7] mb-3"
            />
            <label className="flex items-center gap-2 text-[12px] text-[#1A1A1A] mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
              />
              Set as my default for {catalog === "staff" ? "staff" : catalog === "client" ? "client" : "all"} documents
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveTemplate} disabled={savingTemplate || !saveName.trim()}>
                {savingTemplate ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {addPageAfterIndex !== null && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          style={{ zIndex: 2147483100 }}
          onClick={() => !aiPageBusy && setAddPageAfterIndex(null)}
        >
          <div
            className="bg-[#FDFBF7] rounded-xl border border-[#B89555]/40 p-5 w-[520px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Start page with AI</div>
            <div className="text-[11px] text-[#1A1A1A]/65 mb-4">
              Describe the page content, layout, colors, or paste HTML/CSS instructions. It will be inserted as a new page.
            </div>
            <Textarea
              autoFocus
              value={addPagePrompt}
              onChange={(e) => setAddPagePrompt(e.target.value)}
              placeholder="Create a premium schedule page with a two-column terms table and champagne-gold styling…"
              rows={6}
              className="bg-[#FDFBF7] resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAddPageAfterIndex(null)} disabled={aiPageBusy}>Cancel</Button>
              <Button size="sm" onClick={handleGenerateAiPage} disabled={aiPageBusy || !addPagePrompt.trim()}>
                {aiPageBusy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Create Page
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ─── Top toolbar (visible on step ≥ 2) — Reset / Print / Export / Send ─── */}
      {step === 2 && template && (
        <div
          className="sticky top-0 z-30 flex flex-col gap-2 px-3 sm:px-4 py-2 bg-[#FDFBF7] border-b border-[#B89555]/30"
          data-document-studio-toolbar="1"
        >
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setStep(1)}
              className="h-8 px-2 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center gap-1.5 text-[12px] text-[#1A1A1A]"
              aria-label="Back to templates"
            >
              <ChevronLeft className="w-4 h-4" />
              Templates
            </button>
            <div className="hidden sm:block min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 leading-none">Template</div>
              <div className="text-[12px] font-semibold text-[#1A1A1A] truncate leading-tight">{template.label}</div>
            </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setActionChromeCollapsed((v) => !v)} className="h-10 border-[#B89555]/60 bg-[#F7F2EA] hover:bg-[#EFE6D6]" title={actionChromeCollapsed ? "Expand document actions" : "Minimize document actions"}>
                {actionChromeCollapsed ? <ChevronDown className="w-4 h-4 mr-1.5" /> : <ChevronUp className="w-4 h-4 mr-1.5" />}
                <span>{actionChromeCollapsed ? "Actions" : "Minimize"}</span>
              </Button>
            </div>
          </div>
          {!actionChromeCollapsed && (
          <div className="studio-toolbar-scroll w-full 2xl:w-auto">
            <div className="studio-action-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={startNewSubmission}
                title="Clear the current draft and start fresh"
                className="h-10"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Start New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToTemplate}
                disabled={!bodyHtml}
                title="Reset edits to template"
                className="h-10"
              >
                <Wand2 className="w-4 h-4 mr-1.5" /> Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!bodyHtml}
                title="Print"
                className="h-10"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Print
              </Button>
              <div className="flex shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!bodyHtml || !!exporting}
                  onClick={() => handleExport("pdf")}
                  title="Download PDF"
                  className="h-10 rounded-r-none border-r-0"
                >
                  {exporting === "pdf" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                  Export PDF
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-l-none px-3" disabled={!bodyHtml || !!exporting} title="More export formats">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#FDFBF7] z-[2147483647]">
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileText className="w-4 h-4 mr-2" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("png")}>
                      <FileText className="w-4 h-4 mr-2" /> Download Image (PNG)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("docx")}>
                      <FileText className="w-4 h-4 mr-2" /> Download Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("both")}>
                      <FileText className="w-4 h-4 mr-2" /> Download PDF + PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ─── Body ─── */}
      <div className="studio-body flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT RAIL */}
        <aside className={`studio-sidebar w-full ${step === 1 && templatePanelCollapsed ? "lg:w-[56px] xl:w-[56px]" : step === 2 && detailsPanelCollapsed ? "lg:w-[72px] xl:w-[72px]" : "lg:w-[330px] xl:w-[360px]"} shrink-0 border-b lg:border-b-0 lg:border-r border-[#B89555]/55 bg-[#FDFBF7] flex flex-col max-h-[38vh] lg:max-h-none transition-[width] duration-200`}>
          {step === 1 && (
            <>
              <div className="p-3 border-b border-[#B89555]/20 flex items-center justify-between gap-2">
                {!templatePanelCollapsed && (
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 min-w-0 truncate">
                    Step 1 — Choose a template
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTemplatePanelCollapsed((v) => !v)}
                  className="h-8 w-8 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A] shrink-0"
                  title={templatePanelCollapsed ? "Expand templates" : "Minimize templates"}
                  aria-label={templatePanelCollapsed ? "Expand templates" : "Minimize templates"}
                >
                  {templatePanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                </button>
              </div>
              {!templatePanelCollapsed && (
                <>
                  <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
                      <Input
                        placeholder="Search templates…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-[#FDFBF7]"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2">
                    {filteredTemplates.map((t) => {
                      const Icon = t.icon;
                      const selected = t.id === templateId;
                      return (
                          <button
                            data-no-studio-normalize
                          key={t.id}
                          onClick={() => handleSelectTemplate(t.id)}
                          className={[
                            "studio-template-card w-full text-left rounded-xl border px-3 py-3 transition-all flex gap-3 items-start",
                            selected
                              ? "border-[#B89555] bg-[#EFE6D6]"
                              : "border-[#B89555]/25 bg-[#F7F2EA] hover:bg-[#EFE6D6]/60",
                          ].join(" ")}
                        >
                          <div className="w-8 h-8 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#1A1A1A]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">{t.label}</div>
                            <div className="text-[11px] text-[#1A1A1A]/65 mt-0.5 line-clamp-2">{t.description}</div>
                          </div>
                        </button>
                      );
                    })}
                    {filteredTemplates.length === 0 && (
                      <div className="text-center text-xs text-[#1A1A1A]/55 py-8">No templates match.</div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {step === 2 && template && (
            <>
              <div className="p-4 border-b border-[#B89555]/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setStep(1)}
                  className="h-7 w-7 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center"
                  aria-label="Back to templates"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                </button>
                {!detailsPanelCollapsed && <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">Step 2 — Details</div>
                  <div className="text-[13px] font-semibold text-[#1A1A1A] truncate">{template.label}</div>
                </div>}
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsPanelCollapsed((v) => !v)}
                  className="h-8 w-8 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A] shrink-0"
                  title={detailsPanelCollapsed ? "Expand details" : "Minimize details"}
                  aria-label={detailsPanelCollapsed ? "Expand details" : "Minimize details"}
                >
                  {detailsPanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                </button>
              </div>
              {!detailsPanelCollapsed && (
              <>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                {template.needsPosition && (
                  <Field label="Department">
                    <div className="space-y-1.5">
                      <Select
                        value={department}
                        onValueChange={(v) => {
                          if (v === "__other__") {
                            setAddingOtherDept(true);
                            setOtherDeptDraft("");
                            return;
                          }
                          setDepartment(v);
                        }}
                      >
                        <SelectTrigger className="bg-[#FDFBF7]"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[2147483647] bg-[#FDFBF7]">
                          {allDepartments.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                          <SelectItem
                            key="__other__"
                            value="__other__"
                            className="text-[#B89555] font-semibold border-t border-[#B89555]/30 mt-1"
                          >
                            Other…
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Inline premium "Other…" editor — replaces window.prompt */}
                      {addingOtherDept && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Input
                            autoFocus
                            value={otherDeptDraft}
                            onChange={(e) => setOtherDeptDraft(e.target.value)}
                            placeholder="Type the exact title (e.g. Head of Acquisitions)"
                            className="h-8 text-[12px] bg-[#FDFBF7] border-[#B89555]/40"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const v = otherDeptDraft.trim();
                                if (!v) return;
                                if (allDepartments.includes(v)) {
                                  toast.error("Title already exists");
                                  return;
                                }
                                setCustomDepartments((p) => [...p, v]);
                                setDepartment(v);
                                setAddingOtherDept(false);
                                setOtherDeptDraft("");
                              }
                              if (e.key === "Escape") {
                                setAddingOtherDept(false);
                                setOtherDeptDraft("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = otherDeptDraft.trim();
                              if (!v) return;
                              if (allDepartments.includes(v)) {
                                toast.error("Title already exists");
                                return;
                              }
                              setCustomDepartments((p) => [...p, v]);
                              setDepartment(v);
                              setAddingOtherDept(false);
                              setOtherDeptDraft("");
                            }}
                            className="h-8 px-3 rounded-md border border-[#B89555]/40 bg-[#EFE6D6] hover:bg-[#E6D9C0] text-[11px] font-semibold text-[#1A1A1A]"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingOtherDept(false); setOtherDeptDraft(""); }}
                            className="h-8 px-2 text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Custom departments — rename / delete */}
                      {customDepartments.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {customDepartments.map((d) => (
                            <div key={d} className="flex items-center gap-1.5 text-[11px]">
                              {editingDept === d ? (
                                <Input
                                  autoFocus
                                  value={deptDraft}
                                  onChange={(e) => setDeptDraft(e.target.value)}
                                  onBlur={() => {
                                    const v = deptDraft.trim();
                                    if (v && v !== d) {
                                      setCustomDepartments((p) => p.map((x) => (x === d ? v : x)));
                                      if (department === d) setDepartment(v);
                                    }
                                    setEditingDept(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    if (e.key === "Escape") setEditingDept(null);
                                  }}
                                  className="h-6 text-[11px] flex-1"
                                />
                              ) : (
                                <span className="flex-1 text-[#1A1A1A]/80 truncate">• {d}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => { setEditingDept(d); setDeptDraft(d); }}
                                className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5"
                                title="Rename"
                              >
                                <PenLine className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomDepartments((p) => p.filter((x) => x !== d));
                                  if (department === d) setDepartment(DEPARTMENTS[0]);
                                }}
                                className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                )}

                {docsForTemplate.length > 0 && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold mb-1 flex items-center justify-between">
                      <span>My Documents · {template.label}</span>
                      <span className="text-[#B89555]">{docsForTemplate.length}</span>
                    </div>
                    {docsForTemplate.slice(0, 12).map((d) => {
                      const bid = (d.field_values as any)?.booking_id;
                      const isCurrent = d.id === currentDocId;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => openActionSheet(d as CrmDocument)}
                          className={`w-full text-left text-[12px] truncate px-1.5 py-1 rounded ${isCurrent ? "bg-[#EFE6D6] text-[#1A1A1A]" : "text-[#1A1A1A] hover:bg-[#EFE6D6]/60"}`}
                          title={`${d.title} — click for Preview / Edit / Delete`}
                        >
                          <div className="truncate">{d.client_name || d.title}</div>
                          {bid && <div className="text-[10px] text-[#1A1A1A]/55 font-mono tracking-tight">{bid}</div>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Recently Deleted (30-day restore window) */}
                {deletedDocs.length > 0 && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDeleted((v) => !v)}
                      className="w-full text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold flex items-center justify-between"
                    >
                      <span>Recently Deleted · 30 days</span>
                      <span className="text-[#B89555]">{deletedDocs.length} {showDeleted ? "▾" : "▸"}</span>
                    </button>
                    {showDeleted && deletedDocs.map((d) => {
                      const deletedAt = d.deleted_at ? new Date(d.deleted_at) : null;
                      const daysLeft = deletedAt
                        ? Math.max(0, 30 - Math.floor((Date.now() - deletedAt.getTime()) / 86400000))
                        : 30;
                      return (
                        <div key={d.id} className="flex items-center gap-1.5 group text-[12px]">
                          <div className="flex-1 truncate text-[#1A1A1A]/75" title={d.title}>
                            {d.client_name || d.title}
                            <span className="ml-1 text-[10px] text-[#1A1A1A]/50">· {daysLeft}d left</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => restoreDoc.mutate(d.id)}
                            className="p-1 rounded hover:bg-[#EFE6D6] text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Permanently delete this document? This cannot be undone.")) {
                                hardDeleteDoc.mutate(d.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-[#fbe9e9] text-[#7a1f1f]/80 hover:text-[#7a1f1f]"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}



                {savedTemplates.filter((s) => s.base_template_id === template.id).length > 0 && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold mb-1">
                      My Saved Versions
                    </div>
                    {savedTemplates.filter((s) => s.base_template_id === template.id).map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 group">
                        <button
                          type="button"
                          onClick={() => applySavedTemplate(s)}
                          className="flex-1 text-left text-[12px] text-[#1A1A1A] hover:text-[#B89555] truncate"
                        >
                          {s.name}{s.is_default && <span className="text-[10px] text-[#B89555] ml-1">★ default</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedTemplate(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#1A1A1A]/55 hover:text-red-600"
                          title="Delete saved template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(() => {
                  const visible = template.fields.filter((f) => !hiddenFieldKeys.has(f.key));
                  const grouped = visible.reduce<Record<string, typeof visible>>((acc, f) => {
                    const group = f.group || "Details";
                    (acc[group] ||= []).push(f);
                    return acc;
                  }, {});
                  const groups = Object.entries(grouped);
                  const useAccordions = groups.length > 1 || groups.some(([name]) => /^Party [AB]$/.test(name));
                  if (!useAccordions) return visible.map(renderTemplateField);
                  return (
                    <Accordion type="multiple" defaultValue={groups.map(([name]) => name)} className="space-y-3">
                      {groups.map(([name, items]) => (
                        <AccordionItem key={name} value={name} className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] px-3">
                          <AccordionTrigger className="py-3 text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A] hover:no-underline">
                            {name}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pb-3 pt-0">
                            {items.map(renderTemplateField)}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  );
                })()}

                {hiddenFieldKeys.size > 0 && (
                  <button
                    type="button"
                    onClick={restoreAllFields}
                    className="w-full text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                  >
                    + Restore hidden fields ({hiddenFieldKeys.size})
                  </button>
                )}


                {/* Unified Signatories panel — mirrors what's rendered in the preview */}
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      Signatories ({2 + extraSignatories.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtraSignatories((p) => [...p, newSig()])}
                      className="text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                    >
                      + Add signatory
                    </button>
                  </div>

                  {/* 1 — Company (locked) */}
                  <div
                    className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                    onClick={() => highlightSig("owner")}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      1 — JBJ GLOBAL REAL ESTATE <span className="text-[#1A1A1A]/40 normal-case tracking-normal">(locked)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" className="bg-[#FDFBF7] h-7 text-[11px]" />
                      <Input value={ownerTitle} onChange={(e) => setOwnerTitle(e.target.value)} placeholder="Title" className="bg-[#FDFBF7] h-7 text-[11px]" />
                    </div>
                    <Input type="date" value={ownerDate} onChange={(e) => setOwnerDate(e.target.value)} className="bg-[#FDFBF7] h-7 text-[11px]" />
                  </div>

                  {/* 2 — Recipient (locked) */}
                  <div
                    className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                    onClick={() => highlightSig("recipient")}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      2 — Recipient / Counterparty <span className="text-[#1A1A1A]/40 normal-case tracking-normal">(locked)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <Input
                        value={fields.fullNameAsPerPassport || ""}
                        onChange={(e) => {
                          setField("fullNameAsPerPassport", e.target.value);
                          // Mirror to recipientName so existing flows (folder,
                          // signature, candidate display) stay in sync with the
                          // canonical full legal name.
                          if (e.target.value.trim()) setField("recipientName", e.target.value);
                        }}
                        placeholder="Full Legal Name (as per Passport — incl. father's name)"
                        className="bg-[#FDFBF7] h-7 text-[11px] font-medium"
                      />
                      <Input
                        value={fields.fullNameArabic || ""}
                        onChange={(e) => setField("fullNameArabic", e.target.value)}
                        placeholder="Arabic Name (as per ID / Passport)"
                        dir="rtl"
                        className="bg-[#FDFBF7] h-7 text-[11px] font-medium text-right"
                      />
                      <Input
                        value={fields.recipientName || ""}
                        onChange={(e) => setField("recipientName", e.target.value)}
                        placeholder="Recipient Name (display)"
                        className="bg-[#FDFBF7] h-7 text-[11px]"
                      />
                    </div>
                    <Input type="date" value={applicantDate} onChange={(e) => setApplicantDate(e.target.value)} className="bg-[#FDFBF7] h-7 text-[11px]" />
                  </div>

                  {/* 3..N — Extras */}
                  {extraSignatories.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                      onClick={() => highlightSig(`extra-${idx}`)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold whitespace-nowrap">
                          {idx + 3} —
                        </span>
                        <Input
                          value={s.label}
                          onChange={(e) => updateSig(s.id, { label: e.target.value })}
                          placeholder="Label (e.g. Witness)"
                          className="h-7 text-[11px] flex-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateSig(s.id); }}
                          className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSig(s.id); }}
                          className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          value={s.name}
                          onChange={(e) => updateSig(s.id, { name: e.target.value })}
                          placeholder={`Name #${idx + 1}`}
                          className="h-7 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Input
                          value={s.title}
                          onChange={(e) => updateSig(s.id, { title: e.target.value })}
                          placeholder="Title"
                          className="h-7 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <Input
                        type="date"
                        value={s.date}
                        onChange={(e) => updateSig(s.id, { date: e.target.value })}
                        className="h-7 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>


                {/* AI auto-fill from pasted details / attached document */}
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                    Auto-fill with AI
                  </div>
                  <Textarea
                    value={autoFillText}
                    onChange={(e) => setAutoFillText(e.target.value)}
                    placeholder="Paste a bio, CV, email, or any details — AI will extract names, dates, salary, etc."
                    rows={3}
                    className="bg-[#FDFBF7] resize-none text-[12px]"
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                  className="w-full min-h-10 px-3 text-[12px] whitespace-normal leading-tight justify-center"
                      disabled={autoFillBusy || (!autoFillText.trim())}
                      onClick={async () => {
                        if (!template) return;
                        setAutoFillBusy(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
                            body: {
                              mode: "extract-fields",
                              templateId: template.id,
                              fieldKeys: Array.from(new Set([...template.fields.map((f) => f.key), ...IDENTITY_FIELD_KEYS])),
                              source: autoFillText,
                            },
                          });
                          if (error) throw error;
                          const parsed = (data as any)?.fields || {};
                          if (parsed && typeof parsed === "object") {
                            setSyncedFields((p) => ({ ...p, ...normalizeExtractedDocumentFields(parsed, autoFillText) }));
                            toast.success("Fields filled from your text");
                          } else {
                            toast.info("Nothing extractable found");
                          }
                        } catch (e: any) {
                          toast.error(e?.message || "AI auto-fill failed");
                        } finally {
                          setAutoFillBusy(false);
                        }
                      }}
                    >
                      {autoFillBusy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 mr-1.5 shrink-0" />}
                      Auto-fill fields
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                  className="w-full min-h-10 px-3 text-[12px] whitespace-normal leading-tight justify-center"
                      onClick={() => autoFillFileRef.current?.click()}
                      disabled={autoFillBusy}
                    >
                  <Upload className="w-4 h-4 mr-1.5 shrink-0" /> Attach ID / Passport
                    </Button>
                    <input
                      ref={autoFillFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = "";
                        if (!files.length || !template) return;
                        if (files.some((file) => file.size > 8 * 1024 * 1024)) { toast.error("Max 8MB per file"); return; }
                        setAutoFillBusy(true);
                        try {
                          const merged: Record<string, string> = {};
                          for (const file of files) {
                            const b64 = await new Promise<string>((res, rej) => {
                              const r = new FileReader();
                              r.onload = () => res(String(r.result || ""));
                              r.onerror = rej;
                              r.readAsDataURL(file);
                            });
                            const source = `Extract ONLY contract identity/contact fields from attached Emirates ID, passport, or document: ${file.name}. Include full name as per ID, Emirates ID number, passport number, nationality, home address, email, and phone if visible. Exclude ID expiry, birth date, issuing date, and sex.`;
                            const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
                              body: {
                                mode: "extract-fields",
                                templateId: template.id,
                                fieldKeys: Array.from(new Set([...template.fields.map((f) => f.key), ...IDENTITY_FIELD_KEYS])),
                                source,
                                attachment: { name: file.name, type: file.type, dataUrl: b64 },
                              },
                            });
                            if (error) throw error;
                            Object.assign(merged, normalizeExtractedDocumentFields((data as any)?.fields || {}, source));
                          }
                          if (Object.keys(merged).length) {
                            setSyncedFields((p) => ({ ...p, ...merged }));
                            toast.success(`Fields filled from ${files.length} attachment${files.length > 1 ? "s" : ""}`);
                          } else {
                            toast.info("Nothing extractable found in attachments");
                          }
                          // Archive the raw scans into the candidate's folder.
                          const candidateName =
                            pickCandidateDisplayName({ ...fields, ...merged } as Record<string, string>);
                          if (candidateName) {
                            for (const file of files) {
                              try {
                                const lower = file.name.toLowerCase();
                                const kind = lower.includes("passport")
                                  ? "passport"
                                  : lower.includes("visa")
                                  ? "visa"
                                  : (lower.includes("eid") || lower.includes("emirates") || lower.includes("id"))
                                  ? "emirates_id"
                                  : "other";
                                await uploadAttachmentMutation.mutateAsync({
                                  file,
                                  candidate_display_name: candidateName,
                                  kind,
                                });
                              } catch (uploadErr) {
                                console.warn("[DocumentStudio] attachment archive failed", uploadErr);
                              }
                            }
                          }
                        } catch (err: any) {
                          toast.error(err?.message || "Attachment processing failed");
                        } finally {
                          setAutoFillBusy(false);
                        }
                      }}
                    />
                  </div>
                </div>

                {usesCommission && !hiddenSections.has("commission") && (

                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                        Commission Structure
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCommissionRows((rs) => [...rs, { label: "", rate: "", trigger: "", notes: "" }])}
                          className="text-[11px] text-[#1A1A1A] hover:text-[#B89555] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add tier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection("commission")}
                          className="text-[#1A1A1A]/55 hover:text-red-600"
                          title="Hide this section from the document"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {commissionRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
                          <Input
                            placeholder="Tier (e.g. Direct deals)"
                            value={r.label || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                            className="col-span-5 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <Input
                            placeholder="Rate"
                            value={r.rate || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}
                            className="col-span-3 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <Input
                            placeholder="Trigger"
                            value={r.trigger || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x))}
                            className="col-span-3 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <button
                            type="button"
                            onClick={() => setCommissionRows((rs) => rs.filter((_, j) => j !== i))}
                            className="col-span-1 h-8 flex items-center justify-center text-[#1A1A1A]/55 hover:text-red-600"
                            title="Remove tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/55 mt-2">Empty rows are skipped — only filled tiers appear in the document.</p>
                  </div>
                )}

                {!hiddenSections.has("custom") && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                        Custom Fields
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomFields((cs) => [...cs, { label: "", value: "" }])}
                          className="text-[11px] text-[#1A1A1A] hover:text-[#B89555] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add field
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection("custom")}
                          className="text-[#1A1A1A]/55 hover:text-red-600"
                          title="Hide this section from the document"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {customFields.length === 0 ? (
                      <p className="text-[10px] text-[#1A1A1A]/55">Add any extra clause — e.g. "Sign-on bonus", "Car allowance".</p>
                    ) : (
                      <div className="space-y-2">
                        {customFields.map((c, i) => (
                          <div key={i} className="grid grid-cols-12 gap-1.5">
                            <Input
                              placeholder="Field name"
                              value={c.label}
                              onChange={(e) => setCustomFields((cs) => cs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                              className="col-span-5 h-8 text-[12px] bg-[#FDFBF7]"
                            />
                            <Input
                              placeholder="Value"
                              value={c.value}
                              onChange={(e) => setCustomFields((cs) => cs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                              className="col-span-6 h-8 text-[12px] bg-[#FDFBF7]"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomFields((cs) => cs.filter((_, j) => j !== i))}
                              className="col-span-1 h-8 flex items-center justify-center text-[#1A1A1A]/55 hover:text-red-600"
                              title="Remove field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hiddenSections.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setHiddenSections(new Set())}
                    className="w-full text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                  >
                    + Restore hidden sections ({hiddenSections.size})
                  </button>
                )}
              </div>
              <div className="p-3 border-t border-[#B89555]/20 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!template || generating}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" /> Generate with AI</>
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                  Continue to Review & Send <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[10px] text-[#1A1A1A]/55 text-center">
                  Tip: Generate drafts the AI body. You can also type directly into the page or use the AI assistant on the right.
                </p>
              </div>
              </>
              )}
            </>
          )}

          {step === 3 && template && (
            <>
              <div className="p-4 border-b border-[#B89555]/20 flex items-center gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="h-7 w-7 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center"
                  aria-label="Back to details"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                </button>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">Step 3 — Review & Send</div>
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">{template.label}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                <Field label="Subject">
                  <Input value={template.emailSubject} readOnly className="bg-[#F7F2EA]" />
                </Field>
                <Field label="Recipient email">
                  <Input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="bg-[#FDFBF7]"
                  />
                </Field>
                <div className="rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] p-3 text-[11px] text-[#1A1A1A]/70 leading-relaxed">
                  <Check className="w-3 h-3 inline-block mr-1 text-[#1A1A1A]" />
                  Locked letterhead + footer are applied automatically before sending.
                </div>
              </div>
              <div className="p-3 border-t border-[#B89555]/20 space-y-2">
                <Button onClick={() => handleSend()} disabled={sending || !emailTo} className="w-full">
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send via Branded Email
                </Button>
                <div className="flex w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-r-none border-r-0"
                    disabled={!!exporting}
                    onClick={() => handleExport("pdf")}
                    title="Download PDF immediately"
                  >
                    {exporting === "pdf" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                    Export PDF
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-l-none px-2" disabled={!!exporting} title="More export formats">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#FDFBF7] z-[2147483647]">
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        <FileText className="w-4 h-4 mr-2" /> Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("png")}>
                        <FileText className="w-4 h-4 mr-2" /> Download Image (PNG)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("docx")}>
                        <FileText className="w-4 h-4 mr-2" /> Download Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("both")}>
                        <FileText className="w-4 h-4 mr-2" /> Download PDF + PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button
                  variant="outline" size="sm" className="w-full"
                  onClick={() => handleSend(OWNER_TEST_EMAIL)}
                  disabled={sending}
                  title={`Send a test copy to ${OWNER_TEST_EMAIL}`}
                >
                  <FlaskConical className="w-4 h-4 mr-1.5" /> Send Test to {OWNER_TEST_EMAIL}
                </Button>
              </div>
            </>
          )}
        </aside>

        {/* CENTER — A4 PREVIEW (fixed A4 sheets, smart-cropped) */}
        <main ref={previewWrapRef} className="flex-1 min-w-0 min-h-[52vh] lg:min-h-0 bg-[#EFE6D6] overflow-auto relative border-y lg:border-y-0 lg:border-x border-[#B89555]/35">
          {aiPreviewSnapshot !== null && (
            <div
              data-surface="emerald"
              data-no-contrast-guard
              className="sticky top-0 z-30 flex flex-wrap items-center gap-3 px-5 py-3 bg-[var(--jj-emerald-ombre)] border-b border-[#B89555]/70 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <span className="text-sm font-semibold text-white">
                AI preview — review the document, then keep or revert this change.
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const snap = aiPreviewSnapshot;
                    if (snap !== null) setBodyHtml(snap);
                    setAiPreviewSnapshot(null);
                    toast.success("Reverted to previous version");
                  }}
                  className="h-9 rounded-lg px-3 text-sm font-semibold bg-white text-[#1A1A1A] border border-[#B89555]/70 hover:bg-[#F7F2EA]"
                >
                  Revert
                </button>
                <button
                  type="button"
                  data-allow-dark-cta
                  onClick={() => {
                    setAiPreviewSnapshot(null);
                    toast.success("Changes kept");
                  }}
                  className="h-9 rounded-lg px-3 text-sm font-semibold bg-[#B89555] text-[#1A1A1A] hover:brightness-105"
                >
                  Keep changes
                </button>
              </div>
            </div>
          )}
          <div className="studio-preview-shell min-h-full py-10 px-6">
            {template ? (
              (() => {
                const noChrome = /data-no-chrome=["']1["']/.test(bodyHtml || "");
                const isFormI = /data-form-i-page=["']1["']/.test(bodyHtml || "");
                const BODY_PAD_X = isFormI ? 14 : noChrome ? 24 : 70;
                // DocuSign stamps the envelope ID in the top ~0.4in of every
                // page when the document is processed for signature. Reserve a
                // safe band on every page so the stamp never overlays content.
                const FIRST_TOP = 30;
                // GLOBAL: tighten the top of inner pages — the colored band
                // above body on pages 2+ was removed, so content sits closer
                // to the paper edge for a premium contract feel.
                const NEXT_TOP = 53;
                const STANDARD_BOTTOM_PAD = 50;
                const LAST_BOTTOM_PAD = 58;
                const bodyWidth = PAGE_W - BODY_PAD_X * 2;

                // Prefer measured auto-pagination (global rule). Fall back
                // to composer-emitted [data-pdf-page] groups before the
                // measurement runs, so first paint is still sensible.
                const hasFreshAutoPages = !!autoPageGroups?.length && autoPageGroupsSourceRef.current === (bodyHtml || "");
                const pageGroups = hasFreshAutoPages
                  ? autoPageGroups
                  : parseDocumentPageGroups(bodyHtml);
                const pageCount = Math.max(1, pageGroups.length);

                // FORM I (and any composer that opts out of letterhead chrome)
                // emits a top-level <section data-no-chrome="1">. When present,
                // suppress header, footer, DocuSign safe band, generated-date
                // pill, and the per-page signature strip; render a single page
                // with the body using the full A4 height.
                return (
                  <div className="flex flex-col items-center gap-4" style={{ width: PAGE_W * effectiveScale, flexShrink: 0, margin: "0 auto" }}>
                    <div ref={pageRef} className="flex flex-col gap-7" data-document-pages="true">
                      <div aria-hidden className="fixed left-[-10000px] top-0 pointer-events-none opacity-0" style={{ width: PAGE_W }}>
                        <div ref={headerRef}><LockedLetterhead theme={chromeTheme} /></div>
                        <div ref={bodyRef} className="prose prose-sm max-w-none text-[#1A1A1A]" style={{ width: bodyWidth, fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.7, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml || "") }} />
                        <div ref={footerRef}><LockedFooter theme={chromeTheme} /></div>
                      </div>

                      {Array.from({ length: pageCount }).map((_, pageIndex) => {
                        const isFirst = pageIndex === 0;
                        const isLast = pageIndex === pageCount - 1;
                        const topPad = isFormI ? 10 : noChrome ? 12 : (isFirst ? FIRST_TOP : NEXT_TOP);
                        const bottomPad = isFormI ? 10 : noChrome ? 12 : (isLast ? LAST_BOTTOM_PAD : STANDARD_BOTTOM_PAD);
                        const userSignatureName = fields.recipientName || fields.fullName || fields.full_name || fields.client_name || fields.guest_name || "";
                        const groupHtml = stripGeneratedPageArtifacts(pageGroups[pageIndex] ?? "");
                        const hasFinalSignatureBlock = /data-signature-block=["']1["']/.test(groupHtml);
                        const groupHtmlWithSignatureRaw = noChrome
                          ? groupHtml
                          : `${groupHtml}${isLast && hasFinalSignatureBlock ? "" : renderPerPageUserSignature(userSignatureName)}`;
                        const groupHtmlWithSignature = noChrome ? groupHtmlWithSignatureRaw : anchorSignatureArtifacts(groupHtmlWithSignatureRaw);

                        return (
                          <div key={`page-${pageIndex}`} className="flex flex-col items-center gap-2" style={{ width: PAGE_W * effectiveScale }}>
                          <div style={{ width: PAGE_W * effectiveScale, height: PAGE_H * effectiveScale, position: "relative" }}>
                            <div
                              data-document-page="true"
                              data-page-number={pageIndex + 1}
                              className="bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] rounded-md overflow-hidden border border-[#B89555]/20 relative"
                              style={{
                                width: PAGE_W,
                                height: PAGE_H,
                                transform: `scale(${effectiveScale})`,
                                transformOrigin: "top left",
                                background: "#FDFBF7",
                              }}
                            >
                              {/* Header chrome starts at the page top; no separate top champagne strip. */}
                              {!noChrome && (
                                <>
                                  {/* Actual JBJ header monogram, pre-painted champagne PNG.
                                      No CSS mask/filter/blend: html2canvas exported those
                                      as a solid rectangle. This layer stays behind content. */}
                                  <div
                                    aria-hidden
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      pointerEvents: "none",
                                      zIndex: 1,
                                    }}
                                  >
                                    <img
                                      data-jbj-page-watermark="true"
                                      data-no-fallback
                                      src={jbjWatermarkChampagneSrc}
                                      alt=""
                                      style={{
                                        width: 520,
                                        height: 520,
                                        opacity: 0.42,
                                        objectFit: "contain",
                                        display: "block",
                                        filter:
                                          "saturate(115%) contrast(110%) drop-shadow(0 1px 0 rgba(255,253,247,0.55))",
                                      }}
                                    />
                                  </div>
                                  {/* Export-safe visibility pass for pages with opaque tables.
                                      Blend is normal and the pre-tinted PNG has transparency,
                                      so export cannot become a colored box. */}
                                  <div
                                    aria-hidden
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      pointerEvents: "none",
                                      zIndex: 3,
                                    }}
                                  >
                                    <img
                                      data-jbj-page-watermark-overlay="true"
                                      data-no-fallback
                                      src={jbjWatermarkChampagneSrc}
                                      alt=""
                                      style={{
                                        width: 520,
                                        height: 520,
                                        opacity: 0.20,
                                        objectFit: "contain",
                                        display: "block",
                                        filter:
                                          "saturate(125%) contrast(115%) drop-shadow(0 1px 0 rgba(255,253,247,0.6))",
                                      }}
                                    />

                                  </div>
                                </>
                              )}

                              {/* Document generation date — top-right corner of EVERY page (above
                                  letterhead on page 1, above body on pages 2+). Distinct from the
                                  per-page signature date, which sits next to the signature below. */}
                              {/* Generated-date stamp removed per spec — keep template header clean */}

                              {/* Header — only on page 1, merged with the top paper edge */}
                              {isFirst && !noChrome && (
                                <div style={{ position: "relative", zIndex: 6 }}>
                                  <LockedLetterhead theme={chromeTheme} />
                                </div>
                              )}

                              {/* Body region — fills the remaining vertical space.
                                  Footer ONLY exists on the last page, so on
                                  earlier pages the body extends edge-to-edge
                                  to the bottom (no reserved footer slot).
                                  Non-first pages start below the DocuSign
                                  envelope-ID safe band. */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: noChrome ? 0 : (isFirst ? (chromeHeights.header + DOCUSIGN_TOP_RESERVE) : 0),
                                  left: 0,
                                  right: 0,
                                  bottom: noChrome ? 0 : (isLast ? chromeHeights.footer : 0),
                                  padding: `${topPad}px ${BODY_PAD_X}px ${bottomPad}px`,
                                  boxSizing: "border-box",
                                  overflow: "visible",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "flex-start",
                                  zIndex: 2,
                                }}
                              >
                                {groupHtmlWithSignature ? (
                                  <div
                                    className="prose prose-base max-w-none text-[#1A1A1A] jbj-doc-body"
                                    data-page-index={pageIndex}
                                    style={{
                                      width: bodyWidth,
                                      height: "100%",
                                      flex: "1 1 auto",
                                      display: "flex",
                                      flexDirection: "column",
                                      minHeight: 0,
                                      fontFamily: "Inter, system-ui, sans-serif",
                                      lineHeight: 1.68,
                                      fontSize: 13.2,
                                      color: "#1A1A1A",
                                    }}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement | null;
                                      const deleteButton = target?.closest?.('[data-field-delete-control]') as HTMLElement | null;
                                      if (!deleteButton) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const row = deleteButton.closest('[data-removable-field]') as HTMLElement | null;
                                      const fieldKey = deleteButton.dataset.fieldKey || row?.dataset.fieldKey || "";
                                      if (!row) return;
                                      row.remove();
                                      const next = stripGeneratedPageArtifacts(e.currentTarget.innerHTML);
                                      const rebuilt = wrapDocumentPageGroups(pageGroups.map((g, i) => (i === pageIndex ? next : g)));
                                      liveEditedBodyHtmlRef.current = rebuilt;
                                      userEditedRef.current = true;
                                      setUserEdited(true);
                                      setAutoPageGroups(null);
                                      setBodyHtml(rebuilt);
                                      if (fieldKey && template?.fields.some((f) => f.key === fieldKey)) {
                                        setHiddenFieldKeys((keys) => {
                                          const nextKeys = new Set(keys);
                                          nextKeys.add(fieldKey);
                                          return nextKeys;
                                        });
                                      }
                                      toast.success("Field removed from contract");
                                    }}
                                    onInput={(e) => {
                                      // Keep a live copy of direct page edits so
                                      // export/save/send uses the contract exactly
                                      // as typed, even before React's state commit
                                      // on blur. Do not set state here: rerendering
                                      // a contentEditable while the user types can
                                      // wipe the caret or restore stale HTML.
                                      const next = stripGeneratedPageArtifacts(e.currentTarget.innerHTML);
                                      liveEditedBodyHtmlRef.current = wrapDocumentPageGroups(pageGroups.map((g, i) => (i === pageIndex ? next : g)));
                                      userEditedRef.current = true;
                                    }}
                                    onBlur={(e) => {
                                      // WYSIWYG: every page is editable. On blur, reassemble
                                      // the full bodyHtml by replacing this page group only.
                                      const next = stripGeneratedPageArtifacts(e.currentTarget.innerHTML);
                                      const previous = stripGeneratedPageArtifacts(pageGroups[pageIndex] ?? "");
                                      if (normalizeEditableFragment(next) === normalizeEditableFragment(previous)) {
                                        return;
                                      }
                                      const rebuilt = liveEditedBodyHtmlRef.current || wrapDocumentPageGroups(pageGroups.map((g, i) => (i === pageIndex ? next : g)));
                                      userEditedRef.current = true;
                                      setUserEdited(true);
                                      setBodyHtml(rebuilt);
                                    }}
                                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(groupHtmlWithSignature) }}
                                  />
                                ) : (
                                  <div className="text-[12px] text-[#1A1A1A]/40 italic">
                                    Empty — generate a document to populate this page.
                                  </div>
                                )}

                                {/* Signature/stamp/date marks only on the LAST page */}
                                {isLast && marks.showDate !== false && (
                                  <DraggableMark x={marks.dateXY?.x ?? 556} y={marks.dateXY?.y ?? 8} onChange={(x, y) => setMarks((m) => ({ ...m, dateXY: { x, y } }))} onRemove={() => removeMark("date")} ariaLabel="Date" hint="Drag to move">
                                    <div className="text-[11px] uppercase" style={{ color: "#1A1A1A", opacity: 0.42, letterSpacing: "0.22em", fontVariantNumeric: "tabular-nums", textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}>
                                      {new Date(marks.dateValue || ownerDate || new Date().toISOString().slice(0,10)).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                                    </div>
                                  </DraggableMark>
                                )}
                                {isLast && marks.signature && (
                                  <DraggableMark
                                    x={marks.signatureXY?.x ?? 40}
                                    y={marks.signatureXY?.y ?? 320}
                                    onChange={(x, y) => setMarks((m) => ({ ...m, signatureXY: { x, y } }))}
                                    onRemove={() => removeMark("signature")}
                                    onClick={() => setAssetDialog("signature")}
                                    onResize={() => setMarks((m) => {
                                      const widths = [160, 200, 240, 300];
                                      const cur = m.signature?.width ?? 200;
                                      const next = widths[(widths.indexOf(cur) + 1 + widths.length) % widths.length] || widths[0];
                                      return m.signature ? { ...m, signature: { ...m.signature, width: next } } : m;
                                    })}
                                    ariaLabel="Authorised signature"
                                    hint="Click to change · Drag to move"
                                  >
                                    <img src={marks.signature.url} alt="Signature" style={{ width: marks.signature.width, maxWidth: 240 }} className="block pointer-events-none" />
                                  </DraggableMark>
                                )}
                                {isLast && marks.stamp && (
                                  <DraggableMark
                                    x={marks.stampXY?.x ?? 235}
                                    y={marks.stampXY?.y ?? Math.max(850, PAGE_H - (isLast ? chromeHeights.footer : 0) - 246)}
                                    onChange={(x, y) => setMarks((m) => ({ ...m, stampXY: { x, y } }))}
                                    onRemove={() => removeMark("stamp")}
                                    onClick={() => setAssetDialog("stamp")}
                                    onResize={() => setMarks((m) => {
                                      const widths = [128, 142, 160, 180];
                                      const cur = m.stamp?.width ?? 142;
                                      const next = widths[(widths.indexOf(cur) + 1 + widths.length) % widths.length] || widths[0];
                                      return m.stamp ? { ...m, stamp: { ...m.stamp, width: next, rotation: 0 } } : m;
                                    })}
                                    ariaLabel="Stamp"
                                    locked={!!marks.stampLocked}
                                    onToggleLock={() => setMarks((m) => ({ ...m, stampLocked: !m.stampLocked }))}
                                  >
                                    <img src={marks.stamp.url} alt="Stamp" style={{ width: marks.stamp.width, maxWidth: 180, transform: "rotate(0deg)", background: "transparent", mixBlendMode: "multiply" }} className="block pointer-events-none" />
                                  </DraggableMark>
                                )}
                              </div>

                              {/* Footer — ONLY on the last page, absolute flush-bottom, edge-to-edge */}
                              {isLast && !noChrome && (
                                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
                                  <LockedFooter theme={chromeTheme} />
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Controls in the champagne gap BETWEEN sheets, never on the paper */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeletePage(pageIndex)}
                              className="h-8 w-8 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 flex items-center justify-center shadow-sm"
                              title="Delete current page"
                              aria-label={`Delete page ${pageIndex + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {!isLast && (
                              <div aria-hidden className="text-[10px] font-semibold uppercase pointer-events-none select-none" style={{ color: "#1A1A1A", opacity: 0.55, letterSpacing: "0.22em" }}>
                                Page {pageIndex + 1} of {pageCount}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="h-8 px-3 rounded-full border border-[#B89555]/45 bg-[#FDFBF7] hover:bg-[#F7F2EA] text-[#1A1A1A] text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-sm"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#B89555]" />
                                  Add page
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="bg-[#FDFBF7] z-[2147483647] border-[#B89555]/50">
                                <DropdownMenuItem onClick={() => handleAddBlankPage(pageIndex)}>
                                  <FileText className="w-4 h-4 mr-2" /> Blank page
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAddPageAfterIndex(pageIndex)}>
                                  <Sparkles className="w-4 h-4 mr-2" /> Start with AI
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()





            ) : (
              <div className="self-center max-w-md text-center bg-[#FDFBF7] border border-[#B89555]/25 rounded-xl p-10 mt-20">
                <Wand2 className="w-10 h-10 mx-auto mb-3 text-[#B89555]" />
                <div className="text-base font-semibold text-[#1A1A1A]">Choose a template to begin</div>
                <p className="text-sm text-[#1A1A1A]/65 mt-2">
                  Pick from {templates.length} {catalog === "staff" ? "staff" : catalog === "client" ? "client" : "JBJ"} document templates in the left panel.
                </p>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          {template && (
            <div className="sticky bottom-4 float-right mr-4 -mt-12 inline-flex items-center gap-1 bg-[#FDFBF7] border border-[#B89555]/30 rounded-full px-2 py-1 shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="h-7 w-7 rounded-full hover:bg-[#EFE6D6] flex items-center justify-center"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </button>
              <div className="text-[11px] font-medium text-[#1A1A1A] w-10 text-center tabular-nums">{zoom}%</div>
              <button
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="h-7 w-7 rounded-full hover:bg-[#EFE6D6] flex items-center justify-center"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </button>
            </div>
          )}
        </main>

        {/* RIGHT — AI ASSISTANT */}
        {aiOpen && (
          <aside className="studio-ai-panel w-full lg:w-[330px] xl:w-[392px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#B89555]/55 bg-[#FDFBF7] p-4 max-h-[46vh] lg:max-h-none overflow-auto">
            <AiEditChatPanel
              currentBody={bodyHtml}
              language={docLanguage}
              aiInstructions={template?.aiInstructions || ""}
              onApply={(next, sourceText, mode) => {
                // Snapshot the current body BEFORE applying so the owner can
                // visually approve or revert this AI change in one click.
                const previousBody = bodyHtml || "";
                setAiPreviewSnapshot(previousBody);

                // Full-replace mode: trust the AI body verbatim and bypass the
                // locked-template field re-render. This is the only way the
                // user can actually swap the clause text without losing the
                // header / footer chrome (those are rendered separately and
                // are unaffected by body content).
                if (mode === "full-replace") {
                  userEditedRef.current = true;
                  setUserEdited(true);
                  setBodyHtml(next);
                  toast.success("Preview updated — review and click Keep or Revert");
                  return;
                }

                if (template?.id === "job_offer") {
                  const extracted = normalizeExtractedDocumentFields({}, [sourceText, next].filter(Boolean).join("\n"));
                  const nextFields = { ...fields, ...extracted };
                  const visibleFields: Record<string, string> = {};
                  for (const [k, v] of Object.entries(nextFields)) {
                    if (!hiddenFieldKeys.has(k)) visibleFields[k] = v;
                  }
                  const lockedOfferBody = renderStandardBody({
                    templateId: template.id,
                    fields: visibleFields,
                    department: template.needsPosition ? department : undefined,
                    commissionRows: usesCommission && !hiddenSections.has("commission") ? commissionRows : undefined,
                    customFields: hiddenSections.has("custom") ? [] : customFields,
                    ownerName,
                    ownerTitle,
                    ownerDate,
                    letterDate: nextFields.letterDate || ownerDate,
                    applicantDate,
                    hideLetterDate: true,
                    extraSignatories,
                  });
                  setSyncedFields(nextFields);
                  autoBodyRef.current = lockedOfferBody;
                  userEditedRef.current = false;
                  setUserEdited(false);
                  setBodyHtml(lockedOfferBody);
                  toast.success("Preview updated — review and click Keep or Revert");
                  return;
                }
                userEditedRef.current = true;
                setUserEdited(true);
                setBodyHtml(next);
                toast.success("Preview updated — review and click Keep or Revert");
              }}
              onClose={() => setAiOpen(false)}
            />
          </aside>
        )}
      </div>

      {!aiOpen && (
          <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="fixed bottom-5 right-5 z-[2147483200] h-16 min-w-16 rounded-full bg-[var(--jj-emerald-ombre)] px-5 text-sm font-semibold text-white shadow-2xl border border-[#B89555]/70 inline-flex items-center justify-center gap-2 hover:scale-[1.03] transition-transform"
          data-surface="emerald"
          aria-label="Open Live Document Editor"
          title="Open Live Document Editor"
        >
          <Sparkles className="w-6 h-6" />
          <span>AI Assistant</span>
        </button>
      )}

      <DocumentActionSheet
        open={!!pickerDoc}
        onOpenChange={(o) => { if (!o) setPickerDoc(null); }}
        item={pickerDoc ? { id: pickerDoc.id, title: pickerDoc.client_name || pickerDoc.title, subtitle: (pickerDoc.field_values as any)?.booking_id } : null}
        onPreview={handlePreview}
        onEdit={handleEditFromPicker}
        onDelete={handleSoftDelete}
      />
      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(o) => { if (!o) setPreviewDoc(null); }}
        doc={previewDoc}
      />
    </div>
  );


  const minimizedPill = (
    <button
      type="button"
      onClick={() => setStudioMinimized(false)}
      data-surface="emerald"
      data-no-contrast-guard
      className="fixed bottom-5 right-5 z-[2147483600] h-14 px-5 rounded-full inline-flex items-center gap-2.5 text-sm font-semibold text-white shadow-2xl border border-[#B89555]/70 hover:scale-[1.03] transition-transform"
      style={{ background: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#000))" }}
      aria-label="Restore Document Studio"
      title="Restore Document Studio"
    >
      <Sparkles className="w-5 h-5" />
      <span>Document Studio</span>
      <Maximize2 className="w-4 h-4 opacity-90" />
    </button>
  );

  return createPortal(studioMinimized ? minimizedPill : overlay, document.body);
}

/* ───────────────────────── Sub-components ───────────────────────── */

function Stepper({
  step, setStep, hasTemplate, hasBody,
}: {
  step: Step; setStep: (s: Step) => void;
  hasTemplate: boolean; hasBody: boolean;
}) {
  const items: { n: Step; label: string; enabled: boolean }[] = [
    { n: 1, label: "Template", enabled: true },
    { n: 2, label: "Details", enabled: hasTemplate },
    { n: 3, label: "Review & Send", enabled: hasBody },
  ];
  return (
    <div className="hidden md:flex items-center gap-1 ml-6">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center">
            <button
              disabled={!it.enabled}
              onClick={() => setStep(it.n)}
              className={[
                "flex items-center gap-2 h-9 px-3 rounded-full text-[12px] font-medium border transition-colors",
                active
                  ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                  : done
                    ? "bg-[#F7F2EA] border-[#B89555]/40 text-[#1A1A1A]"
                    : "bg-transparent border-[#B89555]/25 text-[#1A1A1A]/60 hover:text-[#1A1A1A]",
                it.enabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              <span
                className={[
                  "w-5 h-5 rounded-full text-[10px] flex items-center justify-center border",
                  active || done
                    ? "bg-[#FDFBF7] border-[#B89555] text-[#1A1A1A]"
                    : "border-[#B89555]/40 text-[#1A1A1A]/60",
                ].join(" ")}
              >
                {done ? <Check className="w-3 h-3" /> : it.n}
              </span>
              {it.label}
            </button>
            {i < items.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#1A1A1A]/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 mb-1.5 block">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function EmptyBody({
  onGenerate, canGenerate, generating,
}: { onGenerate: () => void; canGenerate: boolean; generating: boolean }) {
  return (
    <div className="text-center py-20 text-[#1A1A1A]/60">
      <div className="w-14 h-14 mx-auto rounded-full bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center mb-4">
        <Wand2 className="w-6 h-6 text-[#B89555]" />
      </div>
      <p className="font-medium text-[#1A1A1A]">Fill in the details on the left.</p>
      <p className="text-xs mt-1 text-[#1A1A1A]/60">
        Click <strong>Generate with AI</strong> to draft this document. The locked letterhead and footer are added automatically.
      </p>
      <Button
        size="sm"
        className="mt-5"
        onClick={onGenerate}
        disabled={!canGenerate || generating}
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" /> Generate with AI</>
        )}
      </Button>
    </div>
  );
}

/**
 * Editable preview body with a floating selection mini-toolbar.
 * Uses execCommand for direct, predictable inline edits — same as
 * Notion / Google Docs / Linear-style block editors.
 */
function EditableBody({
  html, onChange,
}: { html: string; onChange: (next: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);

  // Initial paint
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = DOMPurify.sanitize(html);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const placeToolbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) { setToolbar(null); return; }
    const rect = range.getBoundingClientRect();
    const host = ref.current.getBoundingClientRect();
    setToolbar({
      top: rect.top - host.top - 44,
      left: Math.max(0, rect.left - host.left + rect.width / 2 - 110),
    });
  };

  useEffect(() => {
    const onSel = () => placeToolbar();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const cmd = (c: string, v?: string) => {
    document.execCommand(c, false, v);
    ref.current && onChange(stripChromeArtifacts(ref.current.innerHTML));
    placeToolbar();
  };

  return (
    <div className="relative">
      {toolbar && (
        <div
          className="absolute z-10 inline-flex items-center gap-0.5 bg-[#1A1A1A] text-white rounded-md shadow-lg px-1 py-1"
          style={{ top: toolbar.top, left: toolbar.left }}
        >
          <ToolBtn onClick={() => cmd("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("formatBlock", "<h2>")} title="Heading"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("insertUnorderedList")} title="List"><List className="w-3.5 h-3.5" /></ToolBtn>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={(e) => onChange(stripChromeArtifacts(e.currentTarget.innerHTML))}
        onBlur={(e) => onChange(stripChromeArtifacts(e.currentTarget.innerHTML))}
        onMouseUp={placeToolbar}
        onKeyUp={placeToolbar}
        className="prose prose-sm max-w-none text-[#1A1A1A] focus:outline-none rounded-md min-h-[500px] cursor-text"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.7,
          fontSize: 14,
        }}
      />
    </div>
  );
}

function ToolBtn({
  onClick, children, title,
}: { onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      // mousedown to avoid losing the selection
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="h-7 w-7 rounded hover:bg-white/15 flex items-center justify-center text-white"
      data-allow-dark-cta
      data-no-contrast-guard
    >
      {children}
    </button>
  );
}
