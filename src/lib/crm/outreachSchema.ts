/**
 * Shared Outreach schema (client-side parity with DB triggers).
 *
 * These zod schemas mirror the validation rules enforced in
 * `validate_outreach_fields()`, `validate_developer_outreach()`, and
 * `validate_brokerage_outreach()` Postgres triggers.
 *
 * Keep this file in sync with the migration that introduced the
 * Developers + Brokerages outreach field set. See
 * `docs/crm/outreach-schema.md`.
 */
import { z } from "zod";

// --- Enums (keep value lists in sync with DB enums) ---------------------

export const outreachStageValues = [
  "not_contacted",
  "attempted",
  "engaged",
  "meeting_booked",
  "nda_pending",
  "nda_signed",
  "active_partner",
  "dormant",
  "declined",
  "blacklisted",
] as const;
export type OutreachStage = (typeof outreachStageValues)[number];

export const outreachChannelValues = [
  "email",
  "phone",
  "whatsapp",
  "linkedin",
  "in_person",
  "unknown",
] as const;
export type OutreachChannel = (typeof outreachChannelValues)[number];

export const ndaStatusValues = [
  "none",
  "requested",
  "sent",
  "signed",
  "expired",
] as const;
export type NdaStatus = (typeof ndaStatusValues)[number];

export const outreachSourceValues = [
  "manual",
  "import",
  "referral",
  "website",
  "event",
  "cold_research",
  "inbound",
] as const;
export type OutreachSource = (typeof outreachSourceValues)[number];

export const outreachEntityTypeValues = ["developer", "brokerage"] as const;
export type OutreachEntityType = (typeof outreachEntityTypeValues)[number];

export const outreachDirectionValues = ["outbound", "inbound"] as const;
export type OutreachDirection = (typeof outreachDirectionValues)[number];

// --- Primitive validators ------------------------------------------------

const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/[^\s]+$/i, { message: "Must be a valid http(s) URL" });

const e164 = z
  .string()
  .trim()
  .regex(/^\+[1-9][0-9]{6,14}$/, {
    message: "Must be E.164 format (e.g. +9715XXXXXXXX)",
  });

const email = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255);

// --- Shared outreach field set ------------------------------------------

export const sharedOutreachSchema = z
  .object({
    outreach_stage: z.enum(outreachStageValues).default("not_contacted"),
    outreach_channel_pref: z.enum(outreachChannelValues).default("unknown"),

    last_outreach_at: z.string().datetime().nullable().optional(),
    last_response_at: z.string().datetime().nullable().optional(),
    response_count: z.number().int().min(0).default(0),
    attempt_count: z.number().int().min(0).default(0),

    next_action_at: z.string().datetime().nullable().optional(),
    next_action_note: z.string().max(500).nullable().optional(),

    assigned_to: z.string().uuid().nullable().optional(),

    do_not_contact: z.boolean().default(false),
    dnc_reason: z.string().max(500).nullable().optional(),

    nda_status: z.enum(ndaStatusValues).default("none"),
    nda_signed_at: z.string().datetime().nullable().optional(),

    linkedin_url: httpUrl.nullable().optional(),
    whatsapp_e164: e164.nullable().optional(),

    source: z.enum(outreachSourceValues).default("manual"),
    source_detail: z.string().max(500).nullable().optional(),

    health_score: z.number().int().min(0).max(100).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.do_not_contact) {
      if (!val.dnc_reason || val.dnc_reason.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dnc_reason"],
          message: "Reason is required when Do Not Contact is enabled",
        });
      }
    }
    if (val.nda_status === "signed" && !val.nda_signed_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nda_signed_at"],
        message: "Signed date is required when NDA status is 'signed'",
      });
    }
  });

export type SharedOutreachInput = z.infer<typeof sharedOutreachSchema>;

// --- Developer-specific extension ---------------------------------------

export const developerOutreachSchema = sharedOutreachSchema.and(
  z.object({
    developer_email: email.nullable().optional(),
  })
);

// --- Brokerage-specific extension ---------------------------------------

export const brokerageOutreachSchema = sharedOutreachSchema.and(
  z.object({
    website: httpUrl.nullable().optional(),
  })
);

// --- Touchpoint schema --------------------------------------------------

export const outreachTouchpointSchema = z.object({
  owner_id: z.string().uuid(),
  entity_type: z.enum(outreachEntityTypeValues),
  entity_id: z.string().uuid(),
  channel: z.enum(outreachChannelValues).default("unknown"),
  direction: z.enum(outreachDirectionValues).default("outbound"),
  subject: z.string().max(300).nullable().optional(),
  body_excerpt: z.string().max(2000).nullable().optional(),
  occurred_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type OutreachTouchpointInput = z.infer<typeof outreachTouchpointSchema>;

// --- Tag schema ---------------------------------------------------------

export const outreachTagSchema = z.object({
  owner_id: z.string().uuid(),
  label: z.string().trim().min(1).max(64),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/i, { message: "Must be a hex color like #112233" })
    .nullable()
    .optional(),
  category: z.string().max(64).nullable().optional(),
});

export type OutreachTagInput = z.infer<typeof outreachTagSchema>;

// --- Stage transition guard (UI helper) ---------------------------------

const reactivatableFromBlacklisted = false;

export function canTransitionStage(
  from: OutreachStage,
  to: OutreachStage,
  isOwner: boolean,
): boolean {
  if (from === to) return true;
  if (from === "blacklisted") {
    // Only owner role can reactivate from blacklisted
    return isOwner || reactivatableFromBlacklisted;
  }
  return true;
}
