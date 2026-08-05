/**
 * Canonical applicant record → template field aliases.
 *
 * Document templates historically used many different field keys for the same
 * human value (`employeeName`, `fullNameAsPerPassport`, `recipientName`,
 * `client_name`, …). This map is the ONE place that translation lives, so a
 * single applicant record populates every applicable placeholder in every
 * document, and a value edited inside the editor can be pushed back to the
 * canonical record.
 */

import { isPlaceholderValue } from "./documentTitle";

export interface ApplicantRecord {
  /** Database id (hr_candidates.id) when the applicant is a stored record. */
  id: string | null;
  full_name: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  /** Username / human-readable applicant reference. */
  applicant_ref: string;
}

export const EMPTY_APPLICANT: ApplicantRecord = {
  id: null,
  full_name: "",
  position: "",
  email: "",
  phone: "",
  address: "",
  applicant_ref: "",
};

/** Template field keys that carry each canonical value. Order matters: the
 *  first key is the primary one, the rest are mirrors kept in sync. */
export const APPLICANT_FIELD_ALIASES: Record<keyof Omit<ApplicantRecord, "id">, string[]> = {
  full_name: [
    "employeeName", "employee_name",
    "fullNameAsPerPassport", "passportFullName",
    "fullNameAsPerId", "fullNameAsPerID", "emiratesIdFullName",
    "candidateName", "candidate_name", "applicant_name",
    "recipientName", "full_name", "client_name", "name",
  ],
  position: [
    "position", "jobTitle", "job_title", "designation",
    "employeePosition", "employee_position", "role", "position_applied",
  ],
  email: [
    "recipientEmail", "employeeEmail", "employee_email",
    "email", "email_address", "client_email", "candidate_email",
  ],
  phone: [
    "recipientPhone", "employeePhone", "employee_phone",
    "phone", "mobile", "mobile_number", "client_phone", "candidate_phone",
  ],
  address: [
    "address", "employeeAddress", "employee_address",
    "residentialAddress", "address_line", "client_address",
  ],
  applicant_ref: [
    "applicant_id", "applicantRef", "username", "employeeId", "employee_id",
  ],
};

const CANONICAL_KEYS = Object.keys(APPLICANT_FIELD_ALIASES) as Array<keyof Omit<ApplicantRecord, "id">>;

/** Pull a canonical applicant record out of raw template field values. */
export function applicantFromFields(fields: Record<string, string>): Omit<ApplicantRecord, "id"> {
  const out = { ...EMPTY_APPLICANT } as Omit<ApplicantRecord, "id"> & { id?: string | null };
  delete out.id;
  for (const key of CANONICAL_KEYS) {
    for (const alias of APPLICANT_FIELD_ALIASES[key]) {
      const raw = (fields[alias] || "").toString().trim();
      if (raw && !isPlaceholderValue(raw)) { out[key] = raw; break; }
    }
  }
  return out as Omit<ApplicantRecord, "id">;
}

/**
 * Project a canonical applicant onto template field values.
 * Existing real (non-placeholder) values are preserved unless `force` is set,
 * so manual edits survive synchronisation.
 */
export function applyApplicantToFields(
  fields: Record<string, string>,
  applicant: Partial<ApplicantRecord>,
  opts?: { force?: boolean },
): Record<string, string> {
  const next = { ...fields };
  for (const key of CANONICAL_KEYS) {
    const value = ((applicant as any)[key] || "").toString().trim();
    if (!value || isPlaceholderValue(value)) continue;
    for (const alias of APPLICANT_FIELD_ALIASES[key]) {
      const current = (next[alias] || "").toString().trim();
      const shouldWrite =
        opts?.force ||
        isPlaceholderValue(current) ||
        // only overwrite mirrors that already track this canonical value
        Object.prototype.hasOwnProperty.call(fields, alias) === false;
      if (shouldWrite && (opts?.force || Object.prototype.hasOwnProperty.call(fields, alias) || alias === APPLICANT_FIELD_ALIASES[key][0])) {
        next[alias] = value;
      }
    }
  }
  return next;
}

/** True when at least the applicant's name is known. */
export function hasApplicantIdentity(applicant: Partial<ApplicantRecord> | null | undefined): boolean {
  return !!applicant && !isPlaceholderValue(applicant.full_name);
}
