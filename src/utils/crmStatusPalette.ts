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
  not_answering: "red",
  rejected: "red",
  declined: "red",
  bounced: "red",
  unsubscribed: "red",

  not_started: "champagne",
  prospect: "champagne",
  pending: "champagne",
  draft: "champagne",

  documents_required: "amber",
  pending_documents: "amber",
  pending_application: "amber",
  in_review: "amber",
  follow_up: "amber",

  interested: "emerald",
  meeting_booked: "emerald",
  attended_briefing: "emerald",
  active: "emerald",
  responded: "emerald",

  registered: "blue",
  contract_signed: "blue",
  contracted: "blue",
  partner: "blue",

  on_hold: "violet",
  paused: "violet",
};

export function statusColor(raw?: string | null): StatusColor {
  const key = String(raw ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  const tone = TONE_BY_KEY[key] ?? "champagne";
  const label = key
    ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
  return { tone, label, ...C[tone] };
}

export const STATUS_OPTIONS: { value: string; label: string; tone: CrmStatusTone }[] = [
  { value: "not_started",         label: "Not started",         tone: "champagne" },
  { value: "interested",          label: "Interested",          tone: "emerald"   },
  { value: "meeting_booked",      label: "Meeting booked",      tone: "emerald"   },
  { value: "attended_briefing",   label: "Attended briefing",   tone: "emerald"   },
  { value: "documents_required",  label: "Documents required",  tone: "amber"     },
  { value: "pending_application", label: "Pending application", tone: "amber"     },
  { value: "registered",          label: "Registered",          tone: "blue"      },
  { value: "contract_signed",     label: "Contract signed",     tone: "blue"      },
  { value: "not_answering",       label: "Not answering",       tone: "red"       },
  { value: "rejected",            label: "Rejected",            tone: "red"       },
  { value: "on_hold",             label: "On hold",             tone: "violet"    },
];

export const BRAND = {
  champagne: "EFE6D6",
  page: "FDFBF7",
  band: "FAF6EE",
  gold: "B89555",
  ink: "1A1A1A",
};
