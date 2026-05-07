// Centralised status colour palette — drives card badges, Excel View grid,
// and the colored XLSX/PDF export so the visual code matches end-to-end.

export type CrmStatusTone = "red" | "emerald" | "amber" | "blue" | "champagne" | "violet" | "ink";

export interface StatusColor {
  tone: CrmStatusTone;
  bg: string;       // hex (no #) for ExcelJS / inline style
  fg: string;       // hex (no #)
  cssBg: string;    // tailwind hex with #
  cssFg: string;
  label: string;
}

const C: Record<CrmStatusTone, Omit<StatusColor, "label" | "tone">> = {
  red:       { bg: "FCA5A5", fg: "7F1D1D", cssBg: "#FCA5A5", cssFg: "#7F1D1D" },
  emerald:   { bg: "A7F3D0", fg: "065F46", cssBg: "#A7F3D0", cssFg: "#065F46" },
  amber:     { bg: "FDE68A", fg: "92400E", cssBg: "#FDE68A", cssFg: "#92400E" },
  blue:      { bg: "BFDBFE", fg: "1E3A8A", cssBg: "#BFDBFE", cssFg: "#1E3A8A" },
  champagne: { bg: "EFE6D6", fg: "1A1A1A", cssBg: "#EFE6D6", cssFg: "#1A1A1A" },
  violet:    { bg: "DDD6FE", fg: "4C1D95", cssBg: "#DDD6FE", cssFg: "#4C1D95" },
  ink:       { bg: "1A1A1A", fg: "FDFBF7", cssBg: "#1A1A1A", cssFg: "#FDFBF7" },
};

// Map any status string (or human label) to a tone.
const TONE_BY_KEY: Record<string, CrmStatusTone> = {
  // RED — terminal / negative
  not_answering: "red",
  rejected: "red",
  registration_rejected: "red",
  declined: "red",
  bounced: "red",
  unsubscribed: "red",
  blacklisted: "red",

  // CHAMPAGNE — neutral / not started
  not_started: "champagne",
  prospect: "champagne",
  pending: "champagne",
  draft: "champagne",
  not_contacted: "champagne",
  not_registered: "champagne",
  unknown: "champagne",
  inquiries: "champagne",

  // AMBER — in-progress / waiting
  documents_required: "amber",
  pending_documents: "amber",
  documents_pending_review: "amber",
  pending_application: "amber",
  in_review: "amber",
  under_review: "amber",
  follow_up: "amber",
  attempted: "amber",
  negotiating: "amber",
  closing_deal: "amber",
  nda_pending: "amber",
  introduced: "amber",
  expired: "amber",
  partially_active: "amber",

  // EMERALD — engaged / active
  interested: "emerald",
  meeting_booked: "emerald",
  attended_briefing: "emerald",
  active: "emerald",
  active_partner: "emerald",
  responded: "emerald",
  engaged: "emerald",
  closed_deals: "emerald",

  // BLUE — registered / contracted
  registered: "blue",
  contract_signed: "blue",
  contracted: "blue",
  partner: "blue",
  nda_signed: "blue",

  // VIOLET — paused
  on_hold: "violet",
  paused: "violet",
  dormant: "violet",
};

export function statusColor(raw?: string | null): StatusColor {
  const key = String(raw ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  const tone = TONE_BY_KEY[key] ?? "champagne";
  const label = key
    ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
  return { tone, label, ...C[tone] };
}

// Registration / developer pipeline statuses
export const STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "not_started",         label: "Not started",         tone: "champagne" },
  { value: "pending_application", label: "Pending application", tone: "amber"     },
  { value: "documents_required",  label: "Documents required",  tone: "amber"     },
  { value: "under_review",        label: "Under review",        tone: "amber"     },
  { value: "registered",          label: "Registered",          tone: "blue"      },
  { value: "rejected",            label: "Rejected",            tone: "red"       },
  { value: "expired",             label: "Expired",             tone: "amber"     },
];

// Agency / outreach activity statuses (how active the relationship is).
// Used for BOTH brokerages (outreach_stage) and developer registry agency activity.
export const AGENCY_STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "not_contacted",    label: "Not contacted",    tone: "champagne" },
  { value: "attempted",        label: "Attempted",        tone: "amber"     },
  { value: "engaged",          label: "Engaged",          tone: "emerald"   },
  { value: "inquiries",        label: "Inquiries",        tone: "champagne" },
  { value: "meeting_booked",   label: "Meeting booked",   tone: "emerald"   },
  { value: "closing_deal",     label: "Closing deal",     tone: "amber"     },
  { value: "nda_pending",      label: "NDA pending",      tone: "amber"     },
  { value: "nda_signed",       label: "NDA signed",       tone: "blue"      },
  { value: "active_partner",   label: "Active partner",   tone: "emerald"   },
  { value: "partially_active", label: "Partially active", tone: "amber"     },
  { value: "dormant",          label: "Dormant",          tone: "violet"    },
  { value: "declined",         label: "Declined",         tone: "red"       },
  { value: "blacklisted",      label: "Blacklisted",      tone: "red"       },
];

// Brokerage REGISTRATION pipeline (separate from outreach activity).
// Stored in crm_brokerages.registration_status.
export const BROKERAGE_REGISTRATION_STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "not_registered",           label: "Not registered",          tone: "champagne" },
  { value: "pending_documents",        label: "Pending documents",       tone: "amber"     },
  { value: "documents_pending_review", label: "Docs pending review",     tone: "amber"     },
  { value: "registered",               label: "Registered",              tone: "blue"      },
  { value: "registration_rejected",    label: "Rejected",                tone: "red"       },
  { value: "expired",                  label: "Expired",                 tone: "amber"     },
];

// Contract pipeline (separate from registration). Stored in crm_brokerages.contract_status.
export const CONTRACT_STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "none",                label: "No contract",        tone: "champagne" },
  { value: "draft_sent",          label: "Draft sent",         tone: "amber"     },
  { value: "awaiting_signature",  label: "Awaiting signature", tone: "amber"     },
  { value: "signed",              label: "Signed",             tone: "emerald"   },
  { value: "expired",             label: "Expired",            tone: "red"       },
  { value: "terminated",          label: "Terminated",         tone: "red"       },
];

// Attendance health (derived bucket from total_attendance count).
export const ATTENDANCE_STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "none",     label: "No attendance",  tone: "champagne" },
  { value: "occasional", label: "Occasional",    tone: "amber"     },
  { value: "active",   label: "Active",         tone: "blue"      },
  { value: "champion", label: "Champion",       tone: "emerald"   },
];

export function attendanceBucket(total: number | null | undefined): string {
  const t = Number(total || 0);
  if (t <= 0) return "none";
  if (t <= 2) return "occasional";
  if (t <= 5) return "active";
  return "champion";
}

// Brokerage agency-level lifecycle (legacy enum) — kept for backwards compat.
export const BROKERAGE_STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "prospect",       label: "Prospect",       tone: "champagne" },
  { value: "negotiating",    label: "Negotiating",    tone: "amber"     },
  { value: "active_partner", label: "Active partner", tone: "emerald"   },
  { value: "closed_deals",   label: "Closed deals",   tone: "blue"      },
  { value: "dormant",        label: "Dormant",        tone: "violet"    },
  { value: "blacklisted",    label: "Blacklisted",    tone: "red"       },
];

export const BRAND = {
  champagne: "EFE6D6",
  page: "FDFBF7",
  band: "FAF6EE",
  gold: "B89555",
  ink: "1A1A1A",
};
