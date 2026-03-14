/**
 * DLP Export Logger — centralized export auditing and PII masking
 */
import { supabase } from "@/integrations/supabase/client";

export interface ExportEventParams {
  exportType: string;
  exportFormat: string;
  recordCount: number;
  containsPii: boolean;
  fieldsExported?: string[];
  fieldsMasked?: string[];
  watermarkId?: string;
  requiredStepUp?: boolean;
  status?: "completed" | "blocked" | "pending_approval";
}

/**
 * Logs an export event to the dlp_export_events table.
 * Fire-and-forget — never blocks the caller.
 */
export async function logExportEvent(params: ExportEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("dlp_export_events" as any).insert({
      user_id: user.id,
      user_email: user.email ?? null,
      export_type: params.exportType,
      export_format: params.exportFormat,
      record_count: params.recordCount,
      contains_pii: params.containsPii,
      fields_exported: params.fieldsExported ?? [],
      fields_masked: params.fieldsMasked ?? [],
      watermark_id: params.watermarkId ?? null,
      user_agent: navigator.userAgent,
      required_step_up: params.requiredStepUp ?? false,
      status: params.status ?? "completed",
    } as any);
  } catch (err) {
    // Never block the export itself
    console.error("[DLP] Failed to log export event:", err);
  }
}

/**
 * Masks a PII field value for safe export.
 */
export function maskExportField(fieldName: string, value: string | null | undefined): string {
  if (!value) return "—";

  if (fieldName === "phone_e164" || fieldName === "phone" || fieldName === "phone_raw") {
    if (value.length > 6) {
      return value.slice(0, 4) + " ••• " + value.slice(-3);
    }
    return "••••••";
  }

  if (fieldName === "email_lower" || fieldName === "email" || fieldName === "email_normalized") {
    if (value.includes("@")) {
      const [local, domain] = value.split("@");
      return local.slice(0, 2) + "•••@" + domain;
    }
    return "••••••";
  }

  // Generic masking
  if (value.length > 4) {
    return value.slice(0, 2) + "•••" + value.slice(-2);
  }
  return "••••••";
}

/** PII field names used to detect if an export contains PII */
export const PII_FIELDS = new Set([
  "phone_e164", "phone", "phone_raw", "phone_normalized", "mobile",
  "email_lower", "email", "email_normalized",
  "full_name", "name",
]);

/** Check if a list of field names contains PII */
export function containsPiiFields(fields: string[]): boolean {
  return fields.some(f => PII_FIELDS.has(f));
}
