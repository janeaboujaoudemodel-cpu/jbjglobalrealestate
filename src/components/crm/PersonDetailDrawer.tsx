/**
 * PersonDetailDrawer
 * --------------------------------------------------------------------------
 * Side drawer for a single CRM lead.
 *
 * Sections:
 *   1. Identity (name, contact type, company)
 *   2. Profile facts: department · role · seniority · position type ·
 *      languages · nationality · location (city/country/region)
 *   3. Uploaded business cards matched by email/phone
 *   4. Relationship timeline (chronological): notes, emails, calls,
 *      activities, follow-ups, campaign sends, scanned cards
 * --------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, User, Briefcase, MapPin, Languages, Flag, Building2,
  StickyNote, Mail, Phone, CalendarClock, Megaphone, CreditCard, Bell,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
}

type LeadRow = Record<string, any>;

interface TimelineItem {
  id: string;
  kind: "note" | "email" | "call" | "activity" | "followup" | "campaign" | "card";
  at: string;
  title: string;
  body?: string | null;
  meta?: string | null;
}

const lower = (s: any) => String(s ?? "").trim().toLowerCase();
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}
function asArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") return v.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

const KIND_ICON: Record<TimelineItem["kind"], React.ReactNode> = {
  note: <StickyNote className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  activity: <CalendarClock className="h-3.5 w-3.5" />,
  followup: <Bell className="h-3.5 w-3.5" />,
  campaign: <Megaphone className="h-3.5 w-3.5" />,
  card: <CreditCard className="h-3.5 w-3.5" />,
};

const KIND_LABEL: Record<TimelineItem["kind"], string> = {
  note: "Note", email: "Email", call: "Call", activity: "Activity",
  followup: "Follow-up", campaign: "Campaign", card: "Business card",
};

export function PersonDetailDrawer({ open, onOpenChange, leadId }: Props) {
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (!open || !leadId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: l } = await supabase
          .from("crm_leads")
          .select(
            "id, full_name, email_lower, phone_e164, contact_type, company_name, " +
            "department, role_title, seniority, position_type, " +
            "languages, preferred_language, nationality, " +
            "current_location_city, current_location_country, country_of_residence, region, " +
            "vip, tags, created_at, last_contacted_at"
          )
          .eq("id", leadId)
          .maybeSingle();
        if (cancelled) return;
        setLead(l ?? null);

        const email = l?.email_lower ? lower(l.email_lower) : null;
        const phone = l?.phone_e164 || null;

        // Cards matched by email or phone (within scanned card_data jsonb)
        let cardsRows: any[] = [];
        if (email || phone) {
          const ors: string[] = [];
          if (email) ors.push(`card_data->>email.ilike.${email}`);
          if (phone) ors.push(`card_data->>phone.ilike.%${phone}%`);
          const { data = [] } = await supabase
            .from("admin_scanned_cards")
            .select("id, card_data, scan_source, scanned_at")
            .or(ors.join(","))
            .order("scanned_at", { ascending: false })
            .limit(50);
          cardsRows = data ?? [];
        }
        if (cancelled) return;
        setCards(cardsRows);

        // Timeline collectors
        const items: TimelineItem[] = [];

        // Notes
        const { data: notes = [] } = await supabase
          .from("crm_notes")
          .select("id, body, created_at")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(100);
        for (const n of notes ?? []) {
          items.push({ id: `note-${n.id}`, kind: "note", at: n.created_at, title: "Note", body: n.body });
        }

        // Calls
        const { data: calls = [] } = await supabase
          .from("crm_calls")
          .select("id, started_at, duration_seconds, outcome, notes, created_at")
          .eq("lead_id", leadId)
          .order("started_at", { ascending: false })
          .limit(100);
        for (const c of calls ?? []) {
          items.push({
            id: `call-${c.id}`,
            kind: "call",
            at: c.started_at || c.created_at,
            title: `Call · ${c.outcome || "logged"}`,
            body: c.notes,
            meta: c.duration_seconds ? `${Math.round(c.duration_seconds / 60)} min` : null,
          });
        }

        // Activities
        const { data: acts = [] } = await supabase
          .from("crm_activities")
          .select("id, activity_type, metadata, created_at")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(100);
        for (const a of acts ?? []) {
          items.push({
            id: `act-${a.id}`,
            kind: "activity",
            at: a.created_at,
            title: String(a.activity_type ?? "Activity"),
            body: a.metadata?.note ?? a.metadata?.message ?? null,
          });
        }

        // Follow-ups
        const { data: fups = [] } = await supabase
          .from("crm_relationship_reminders")
          .select("id, kind, title, body, due_at, is_done, created_at, metadata")
          .filter("metadata->>lead_id", "eq", leadId)
          .order("due_at", { ascending: false })
          .limit(50);
        for (const f of fups ?? []) {
          items.push({
            id: `fup-${f.id}`,
            kind: "followup",
            at: f.due_at || f.created_at,
            title: f.title || String(f.kind),
            body: f.body,
            meta: f.is_done ? "done" : "open",
          });
        }

        // Campaign sends
        const { data: recs = [] } = await supabase
          .from("crm_campaign_recipients")
          .select("id, sent_at, status, campaigns:campaign_id(name)")
          .eq("lead_id", leadId)
          .order("sent_at", { ascending: false })
          .limit(100);
        for (const r of recs ?? []) {
          const name = (r as any).campaigns?.name ?? "Campaign";
          items.push({
            id: `camp-${r.id}`,
            kind: "campaign",
            at: r.sent_at || new Date(0).toISOString(),
            title: `Campaign · ${name}`,
            meta: r.status ?? null,
          });
        }

        // Emails
        if (email) {
          const { data: mails = [] } = await supabase
            .from("crm_relationship_email_log")
            .select("id, direction, subject, body_snippet, from_email, to_emails, sent_at")
            .or(`from_email.ilike.${email},to_emails.cs.{${email}}`)
            .order("sent_at", { ascending: false })
            .limit(100);
          for (const m of mails ?? []) {
            items.push({
              id: `mail-${m.id}`,
              kind: "email",
              at: m.sent_at,
              title: `${m.direction === "outbound" ? "Sent" : "Received"} · ${m.subject || "(no subject)"}`,
              body: m.body_snippet,
              meta: m.direction === "outbound" ? `→ ${(m.to_emails ?? []).join(", ")}` : `← ${m.from_email}`,
            });
          }
        }

        // Cards as timeline events too
        for (const c of cardsRows) {
          items.push({
            id: `card-${c.id}`,
            kind: "card",
            at: c.scanned_at,
            title: `Business card scanned (${c.scan_source ?? "manual"})`,
            body: [c.card_data?.title, c.card_data?.company].filter(Boolean).join(" · ") || null,
          });
        }

        items.sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
        if (!cancelled) setTimeline(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, leadId]);

  const facts = useMemo(() => {
    if (!lead) return [];
    const langs = [
      ...asArray(lead.languages),
      ...(lead.preferred_language ? [lead.preferred_language] : []),
    ];
    const langSet = Array.from(new Set(langs.map((l) => l.trim()).filter(Boolean)));
    const location = [lead.current_location_city, lead.current_location_country, lead.region]
      .filter(Boolean).join(", ");
    return [
      { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Department", value: lead.department },
      { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Role", value: lead.role_title },
      { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Seniority", value: lead.seniority },
      { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Position type", value: lead.position_type },
      { icon: <Languages className="h-3.5 w-3.5" />, label: "Languages", value: langSet.join(", ") },
      { icon: <Flag className="h-3.5 w-3.5" />, label: "Nationality", value: lead.nationality },
      { icon: <MapPin className="h-3.5 w-3.5" />, label: "Location", value: location },
      { icon: <MapPin className="h-3.5 w-3.5" />, label: "Country of residence", value: lead.country_of_residence },
      { icon: <Building2 className="h-3.5 w-3.5" />, label: "Company", value: lead.company_name },
    ].filter((f) => f.value && String(f.value).trim().length);
  }, [lead]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-[#FDFBF7] border-l border-[#B89555]/20 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-[#1A1A1A]">Person details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-[#1A1A1A]/70">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : !lead ? (
          <div className="text-sm text-[#1A1A1A]/60">No record found.</div>
        ) : (
          <div className="space-y-4">
            {/* Identity */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-[#1A1A1A] truncate">
                    {lead.full_name || "—"}
                  </div>
                  <div className="text-xs text-[#1A1A1A]/70 truncate">
                    {[lead.contact_type, lead.company_name].filter(Boolean).join(" · ") || "—"}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lead.vip && (
                      <Badge variant="outline" className="border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">VIP</Badge>
                    )}
                    {asArray(lead.tags).slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" className="border-[#B89555]/30 bg-[#F7F2EA] text-[#1A1A1A] text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile facts */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4">
              <div className="text-xs uppercase tracking-wider text-[#1A1A1A]/60 mb-3">
                Profile
              </div>
              {facts.length === 0 ? (
                <div className="text-sm text-[#1A1A1A]/60">No profile fields recorded.</div>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {facts.map((f) => (
                    <div key={f.label} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-[#1A1A1A]/60">{f.icon}</span>
                      <div className="min-w-0">
                        <dt className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">{f.label}</dt>
                        <dd className="text-[#1A1A1A] truncate">{f.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </Card>

            {/* Cards */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4">
              <div className="text-xs uppercase tracking-wider text-[#1A1A1A]/60 mb-3">
                Uploaded cards <span className="text-[#1A1A1A]/50">({cards.length})</span>
              </div>
              {cards.length === 0 ? (
                <div className="text-sm text-[#1A1A1A]/60">No business cards on file.</div>
              ) : (
                <ul className="space-y-2">
                  {cards.map((c: any) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <CreditCard className="h-3.5 w-3.5 mt-0.5 text-[#1A1A1A]/60" />
                      <div className="min-w-0">
                        <div className="text-sm text-[#1A1A1A]">
                          {c.card_data?.name || c.card_data?.full_name || "Scanned card"}
                        </div>
                        <div className="text-xs text-[#1A1A1A]/70 truncate">
                          {[c.card_data?.title, c.card_data?.company].filter(Boolean).join(" · ")}
                        </div>
                        <div className="text-[11px] text-[#1A1A1A]/50">
                          {c.scan_source ?? "manual"} · {fmtDateTime(c.scanned_at)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Timeline */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4">
              <div className="text-xs uppercase tracking-wider text-[#1A1A1A]/60 mb-3">
                Relationship timeline <span className="text-[#1A1A1A]/50">({timeline.length})</span>
              </div>
              {timeline.length === 0 ? (
                <div className="text-sm text-[#1A1A1A]/60">No interactions recorded yet.</div>
              ) : (
                <ol className="relative border-l border-[#B89555]/25 ml-2 space-y-3">
                  {timeline.slice(0, 200).map((it) => (
                    <li key={it.id} className="pl-4 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center text-[#1A1A1A]">
                        {KIND_ICON[it.kind]}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-[#B89555]/30 bg-[#F7F2EA] text-[#1A1A1A] text-[10px]">
                          {KIND_LABEL[it.kind]}
                        </Badge>
                        <span className="text-[11px] text-[#1A1A1A]/60">{fmtDateTime(it.at)}</span>
                        {it.meta && (
                          <span className="text-[11px] text-[#1A1A1A]/60">· {it.meta}</span>
                        )}
                      </div>
                      <div className="text-sm text-[#1A1A1A] mt-1">{it.title}</div>
                      {it.body && (
                        <div className="text-xs text-[#1A1A1A]/70 mt-0.5 whitespace-pre-wrap line-clamp-3">
                          {it.body}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
