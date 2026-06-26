/**
 * standardBody — render a premium locked template body for a given
 * template id and field state, WITHOUT calling the AI. This is what
 * the preview shows the moment a template is selected, and what
 * re-renders on every field change.
 *
 * The AI editor (right panel) becomes an OPTIONAL enhancement: it
 * edits the body in place but never replaces the deterministic
 * structure of the document.
 */

import { compose, type ComposerInput, type CommissionRow, type CustomField } from "./index";

const INK = "#1A1A1A";
const MUTED = "rgba(26,26,26,0.65)";

const intros: Record<string, (f: Record<string, string>, dept?: string) => string> = {
  job_offer: (f) =>
    `We are delighted to extend a formal offer of employment for the position of ${f.jobTitle || "[Position]"} at JBJ GLOBAL REAL ESTATE. This letter sets out the principal terms of your engagement, which shall be governed by UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations and its Executive Regulations. The full Employment Contract will follow upon your acceptance.`,
  employment_contract: (f) =>
    `This Employment Contract (the "Agreement") is entered into between JBJ GLOBAL REAL ESTATE (the "Employer") and ${f.recipientName || "[Employee]"} (the "Employee"), governing the terms of the Employee's appointment to the role of ${f.jobTitle || "[Position]"}.`,
  warning_letter: (f) =>
    `This letter serves as a formal ${f.warningLevel || "first"} warning regarding the matter set out below. JBJ GLOBAL REAL ESTATE expects every member of staff to uphold the professional standards documented in the Employee Handbook.`,
  termination_letter: (f) =>
    `This letter serves as formal notice that your employment with JBJ GLOBAL REAL ESTATE${f.jobTitle ? ` in the position of ${f.jobTitle}` : ""} is terminated${f.reason ? ` on the grounds of ${f.reason.replace(/_/g, " ")}` : ""}. The decision has been made in accordance with UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations and the firm's internal policies.`,

  nda: (f) =>
    `This Non-Disclosure Agreement is entered into between JBJ GLOBAL REAL ESTATE and ${f.recipientName || "[Counterparty]"}${f.counterparty ? ` of ${f.counterparty}` : ""} to protect Confidential Information exchanged in connection with the Purpose stated below.`,
  commission_agreement: (f) =>
    `This Commission Agreement supplements the underlying engagement between JBJ GLOBAL REAL ESTATE and ${f.recipientName || "[Sales Staff]"} and sets out the commission entitlement, calculation method, and payout schedule applicable to commissionable transactions.`,
  internship_agreement: (f) =>
    `This Internship Agreement is entered into between JBJ GLOBAL REAL ESTATE and ${f.recipientName || "[Intern]"} for a structured learning placement in the ${f.department || "designated"} department.`,
  hr_letter: (f) =>
    `This letter is issued by JBJ GLOBAL REAL ESTATE in connection with the request set out below, in respect of ${f.recipientName || "[Employee]"}, ${f.jobTitle || ""}.`,
  partnership_referral: (f) =>
    `This Partnership / Referral Agreement is entered into between JBJ GLOBAL REAL ESTATE and ${f.recipientName || "[Partner]"}${f.counterparty ? ` of ${f.counterparty}` : ""} to govern the introduction of qualified leads on the terms set out below.`,
  form_a: (f) =>
    `This Form A — Buyer Registration is submitted on behalf of ${f.recipientName || "[Buyer]"} in respect of unit ${f.unitRef || "[Unit]"} at ${f.projectName || "[Project]"}${f.developer ? ` (Developer: ${f.developer})` : ""}, in accordance with the standard RERA Form A procedure.`,
  form_f: (f) =>
    `This Form F — Memorandum of Understanding records the principal terms agreed between ${f.recipientName || "[Buyer]"} and ${f.sellerName || "[Seller]"} in respect of the property at ${f.propertyRef || "[Address]"}.`,
  form_i: (f) =>
    `This Form I — Cancellation formally cancels the previously executed Form A / Form F in respect of ${f.propertyRef || "[Property]"}${f.reason ? ` for the following reason: ${f.reason}` : ""}.`,
  paa: (f) =>
    `This Property Advertising Agreement records the consent of ${f.recipientName || "[Owner]"} for JBJ GLOBAL REAL ESTATE to advertise and procure a tenant for the property situated at ${f.propertyRef || "[Address]"}.`,
  tenancy_addendum: (f) =>
    `This Addendum amends the Ejari Tenancy Contract (No. ${f.ejariNumber || "[Ejari No.]"}) between ${f.landlordName || "[Landlord]"} and ${f.recipientName || "[Tenant]"} as further set out below.`,
};

const closings: Record<string, (f: Record<string, string>) => string> = {
  job_offer: (f) =>
    `The following standard terms apply to your employment, drawn from prevailing market practice for Dubai real-estate brokerages and aligned with UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations:\n\n1. Probation — A probationary period of six (6) months from the start date applies. During probation, either party may terminate this contract by giving fourteen (14) calendar days' written notice. No end-of-service gratuity accrues during the probationary period.\n\n2. Working Hours — Your standard working hours are ${f.workingHours || "10:00 AM to 7:00 PM, Monday to Saturday"}. Working hours are reduced during the Holy Month of Ramadan in accordance with UAE law.\n\n3. Annual Leave — Thirty (30) calendar days of paid annual leave per completed year of service (accruing at the rate of 2.5 days per month after probation), in addition to all UAE public holidays gazetted by the Federal Authority for Government Human Resources.\n\n4. End-of-Service Gratuity — Calculated on the employee's last drawn basic salary at the rate of twenty-one (21) days' basic pay for each of the first five (5) years of service and thirty (30) days' basic pay for each subsequent year, capped at a total of two (2) years' pay, payable on lawful termination after one (1) year of continuous service.\n\n5. Notice Period — Following probation, either party may terminate this contract by giving thirty (30) calendar days' written notice (sixty (60) days for senior, managerial or executive positions). The employee shall hand over all company property, client records, leads and confidential material in full as a condition precedent to release of the final settlement.\n\nPlease confirm your acceptance of this offer by countersigning a copy of this letter and returning it to JBJ GLOBAL REAL ESTATE no later than seven (7) calendar days from the date of issue. We look forward to welcoming you to the firm.${f.notes ? `\n\n${f.notes}` : ""}`,
  employment_contract: (f) =>
    `Both parties confirm that they have read and understood every clause of this Agreement and accept its terms in full. This Agreement is governed by the laws of the United Arab Emirates and the Emirate of Dubai.${f.notes ? `\n\n${f.notes}` : ""}`,
  warning_letter: (f) =>
    `You are required to take immediate corrective action${f.correctiveAction ? `: ${f.correctiveAction}` : ""}. A recurrence of this conduct may result in further disciplinary action up to and including termination of employment, in accordance with UAE Labour Law and the firm's internal policies.`,
  termination_letter: (f) =>
    `Your final settlement, including any end-of-service gratuity, accrued leave balance and outstanding salary, will be processed within fourteen (14) calendar days of your last working day, subject to the return of all company property${f.returnOfProperty ? ` (${f.returnOfProperty})` : ""} and clearance of any outstanding obligations. You are reminded that confidentiality obligations under your Employment Contract and any NDA remain in force notwithstanding the termination of your employment. If you require a reference or employment verification in the future, please contact the HR Department directly.${f.finalSettlement ? `\n\nSettlement notes: ${f.finalSettlement}` : ""}${f.notes ? `\n\n${f.notes}` : ""}`,

  nda: (f) =>
    `The obligations under this Agreement shall remain in force for the Term${f.term ? ` of ${f.term}` : ""} and shall survive the termination of any underlying relationship between the parties. The Agreement is governed by the laws of the United Arab Emirates.`,
  commission_agreement: () =>
    `All commission entitlements are subject to actual receipt of cleared funds by JBJ GLOBAL REAL ESTATE and to the firm's clawback policy in the event of buyer cancellation, charge-back, or regulatory reversal. This Agreement is governed by the laws of the United Arab Emirates.`,
  internship_agreement: () =>
    `Upon successful completion of the internship, JBJ GLOBAL REAL ESTATE will issue a Certificate of Completion summarising the duration, scope, and assessment of the placement.`,
  hr_letter: (f) =>
    f.notes || "Should the recipient require further information or verification, please contact the HR Department of JBJ GLOBAL REAL ESTATE directly.",
  partnership_referral: () =>
    `Both parties undertake to comply with the non-circumvention and confidentiality provisions of this Agreement for the duration of the Term and for twenty-four (24) months thereafter. This Agreement is governed by the laws of the United Arab Emirates.`,
  form_a: () =>
    `This registration is submitted in good faith and is subject to the developer's standard sales policy and the applicable RERA regulations.`,
  form_f: () =>
    `The parties acknowledge that this Memorandum is binding upon them and shall be followed by the execution of the formal Sale & Purchase Agreement at the Dubai Land Department within the agreed timeframe.`,
  form_i: () =>
    `Both parties acknowledge that this cancellation discharges any outstanding obligations under the previously executed Form A / Form F, subject to the terms set out therein.`,
  paa: () =>
    `JBJ GLOBAL REAL ESTATE shall conduct all marketing activity in accordance with RERA advertising standards and shall remit any deposit collected to the Owner less the agreed commission.`,
  tenancy_addendum: (f) =>
    f.addendumText || `All other terms of the original Ejari contract remain unchanged and in full force and effect.`,
};

function buildAi(templateId: string, f: Record<string, string>, department?: string) {
  const intro = intros[templateId]?.(f, department);
  const closing = closings[templateId]?.(f);
  return { aiIntro: intro, aiClosing: closing };
}

export interface StandardBodyArgs {
  templateId: string;
  fields: Record<string, string>;
  department?: string;
  commissionRows?: CommissionRow[];
  customFields?: CustomField[];
  ownerName?: string;
  ownerTitle?: string;
  ownerDate?: string;
  applicantDate?: string;
  letterDate?: string;
  hideLetterDate?: boolean;
  extraSignatories?: Array<{ name?: string; title?: string; date?: string; label?: string }>;
}

export function renderStandardBody(args: StandardBodyArgs): string {
  const { aiIntro, aiClosing } = buildAi(args.templateId, args.fields, args.department);
  const input: ComposerInput = {
    templateId: args.templateId,
    fields: args.fields,
    department: args.department,
    commissionRows: args.commissionRows,
    customFields: args.customFields,
    ownerName: args.ownerName,
    ownerTitle: args.ownerTitle,
    ownerDate: args.ownerDate,
    applicantDate: args.applicantDate,
    letterDate: args.letterDate,
    hideLetterDate: args.hideLetterDate,
    aiIntro,
    aiClosing,
    extraSignatories: args.extraSignatories,
  };
  return compose(input);
}

export const __body_meta = { INK, MUTED };
