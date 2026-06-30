/**
 * CompanyHub
 * --------------------------------------------------------------------------
 * Unified org view for a brokerage or developer. Auto-derives every linked
 * record by matching the company name (case-insensitive) across crm_leads,
 * and by brokerage_id / dev_registry_id across the relationship tables.
 *
 * Props:
 *   - type: "brokerage" | "developer"
 *   - companyName: canonical org name (used to derive linked rows)
 *
 * Layout:
 *   Tabs: Overview · People · Campaigns · Events · Follow-ups · Cards · Notes · Emails · Comms
 *   Overview shows compact previews of every other section.
 *
 * Editing:
 *   - Inline add for Notes and Follow-ups (per Inline notes + follow-ups standard).
 *   - Everything else read-only; full editing happens on source pages.
 * --------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Building2, Users, Megaphone, CalendarDays, Bell,
  CreditCard, StickyNote, Mail, MessagesSquare, ExternalLink,
  Phone, Globe, MapPin, Linkedin, Instagram, BadgeCheck, MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export type CompanyType = "brokerage" | "developer";

interface CompanyHubProps {
  type: CompanyType;
  companyName: string;
  /** Optional: when known, skip the name → id resolution step. */
  brokerageId?: string | null;
  devRegistryId?: string | null;
}

const lower = (s: any) => String(s ?? "").trim().toLowerCase();

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

interface HubData {
  people: any[];
  campaigns: { id: string; name: string; status: string | null; sent_at: string | null }[];
  events: any[];
  followups: any[];
  cards: any[];
  notes: any[];
  emails: any[];
  threads: any[];
  brokerageId: string | null;
  devRegistryId: string | null;
  brokerage: any | null;
  developer: any | null;
}

const EMPTY: HubData = {
  people: [], campaigns: [], events: [], followups: [], cards: [],
  notes: [], emails: [], threads: [], brokerageId: null, devRegistryId: null,
  brokerage: null, developer: null,
};

export function CompanyHub({ type, companyName, brokerageId, devRegistryId }: CompanyHubProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HubData>(EMPTY);
  const [tab, setTab] = useState("overview");
  const [noteDraft, setNoteDraft] = useState("");
  const [foTitle, setFoTitle] = useState("");
  const [foDue, setFoDue] = useState("");
  const [saving, setSaving] = useState(false);

  const nameKey = lower(companyName);

  async function load() {
    setLoading(true);
    try {
      // Phase A — resolve org id + people in parallel
      const [bRes, dRes, peopleRes] = await Promise.all([
        !brokerageId && type === "brokerage" && nameKey
          ? supabase.from("crm_brokerages").select("*").ilike("company_name", companyName).maybeSingle()
          : (brokerageId
              ? supabase.from("crm_brokerages").select("*").eq("id", brokerageId).maybeSingle()
              : Promise.resolve({ data: null }) as any),
        !devRegistryId && type === "developer" && nameKey
          ? supabase.from("crm_developer_registry").select("*").ilike("developer_name", companyName).maybeSingle()
          : (devRegistryId
              ? supabase.from("crm_developer_registry").select("*").eq("id", devRegistryId).maybeSingle()
              : Promise.resolve({ data: null }) as any),
        supabase
          .from("crm_leads")
          .select("id,full_name,email_lower,phone_e164,contact_type,company_name,country_of_residence,created_at")
          .ilike("company_name", companyName)
          .limit(500),
      ]);

      const bId: string | null = (bRes as any)?.data?.id ?? brokerageId ?? null;
      const dId: string | null = (dRes as any)?.data?.id ?? devRegistryId ?? null;
      const people = (peopleRes as any)?.data ?? [];
      const leadIds = people.map((p: any) => p.id);

      // Phase B — every dependent fetch runs in parallel
      const [
        recsRes,
        eventsRes,
        remindersRes,
        actionsRes,
        cardsRes,
        bNotesRes,
        leadNotesRes,
        emailsRes,
        threadsRes,
      ] = await Promise.all([
        leadIds.length
          ? supabase
              .from("crm_campaign_recipients")
              .select("campaign_id, sent_at, status, campaigns:campaign_id(id, name, status)")
              .in("lead_id", leadIds)
              .limit(1000)
          : Promise.resolve({ data: [] }) as any,
        bId
          ? supabase
              .from("crm_brokerage_events")
              .select("id,event_type,event_date,title,notes,created_at")
              .eq("brokerage_id", bId)
              .order("event_date", { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] }) as any,
        (() => {
          if (!bId && !dId) return Promise.resolve({ data: [] }) as any;
          let q = supabase
            .from("crm_relationship_reminders")
            .select("id,kind,title,body,due_at,is_done,created_at,brokerage_id,dev_registry_id")
            .eq("is_done", false)
            .order("due_at", { ascending: true })
            .limit(200);
          if (bId && dId) q = q.or(`brokerage_id.eq.${bId},dev_registry_id.eq.${dId}`);
          else if (bId) q = q.eq("brokerage_id", bId);
          else if (dId) q = q.eq("dev_registry_id", dId);
          return q;
        })(),
        bId
          ? supabase
              .from("crm_brokerage_actions")
              .select("id,action_type,title,body,due_at,created_at")
              .eq("brokerage_id", bId)
              .order("due_at", { ascending: true })
              .limit(200)
          : Promise.resolve({ data: [] }) as any,
        supabase
          .from("admin_scanned_cards")
          .select("id, card_data, scanned_at")
          .ilike("card_data->>company", `%${companyName}%`)
          .limit(50),
        bId
          ? supabase
              .from("crm_brokerage_notes")
              .select("id, body, created_at, author_id")
              .eq("brokerage_id", bId)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }) as any,
        leadIds.length
          ? supabase
              .from("crm_notes")
              .select("id, body, created_at, user_id, lead_id")
              .in("lead_id", leadIds)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }) as any,
        (() => {
          if (!bId && !dId) return Promise.resolve({ data: [] }) as any;
          let q = supabase
            .from("crm_relationship_email_log")
            .select("id, direction, subject, body_snippet, from_email, to_emails, sent_at, entity_type, entity_id")
            .order("sent_at", { ascending: false })
            .limit(200);
          if (bId && dId) {
            q = q.or(
              `and(entity_type.eq.brokerage,entity_id.eq.${bId}),and(entity_type.eq.developer,entity_id.eq.${dId})`
            );
          } else if (bId) {
            q = q.eq("entity_type", "brokerage").eq("entity_id", bId);
          } else if (dId) {
            q = q.eq("entity_type", "developer").eq("entity_id", dId);
          }
          return q;
        })(),
        leadIds.length
          ? supabase
              .from("owner_comm_threads")
              .select("id, channel_type, contact_name, contact_identifier, last_message_preview, last_message_at, unread_count")
              .in("lead_id", leadIds)
              .order("last_message_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }) as any,
      ]);

      // Campaigns — dedupe + sort
      const seen = new Map<string, HubData["campaigns"][number]>();
      for (const r of ((recsRes as any)?.data ?? [])) {
        const c: any = (r as any).campaigns;
        if (!c?.id) continue;
        const existing = seen.get(c.id);
        const sent_at = (r as any).sent_at ?? null;
        if (!existing || (sent_at && (!existing.sent_at || sent_at > existing.sent_at))) {
          seen.set(c.id, { id: c.id, name: c.name, status: c.status, sent_at });
        }
      }
      const campaigns = Array.from(seen.values()).sort((a, b) =>
        String(b.sent_at ?? "").localeCompare(String(a.sent_at ?? ""))
      );

      const followups: any[] = [];
      for (const r of ((remindersRes as any)?.data ?? [])) followups.push({ ...r, _src: "reminder" });
      for (const r of ((actionsRes as any)?.data ?? [])) followups.push({ ...r, _src: "action" });

      const notes: any[] = [];
      for (const n of ((bNotesRes as any)?.data ?? [])) notes.push({ ...n, _src: "brokerage" });
      for (const n of ((leadNotesRes as any)?.data ?? [])) notes.push({ ...n, _src: "lead" });
      notes.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

      setData({
        people,
        campaigns,
        events: ((eventsRes as any)?.data ?? []),
        followups,
        cards: ((cardsRes as any)?.data ?? []),
        notes,
        emails: ((emailsRes as any)?.data ?? []),
        threads: ((threadsRes as any)?.data ?? []),
        brokerageId: bId,
        devRegistryId: dId,
        brokerage: (bRes as any)?.data ?? null,
        developer: (dRes as any)?.data ?? null,
      });
    } catch (err: any) {
      console.error("[CompanyHub] load failed", err);
      toast({ title: "Failed to load company hub", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, companyName, brokerageId, devRegistryId]);

  /* -------------------- Inline add: Note -------------------- */
  async function addNote() {
    if (!noteDraft.trim()) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id ?? null;
      if (data.brokerageId) {
        const { error } = await supabase.from("crm_brokerage_notes").insert({
          brokerage_id: data.brokerageId,
          author_id: userId,
          body: noteDraft.trim(),
        });
        if (error) throw error;
      } else if (data.people[0]?.id) {
        const { error } = await supabase.from("crm_notes").insert({
          lead_id: data.people[0].id,
          user_id: userId,
          body: noteDraft.trim(),
        });
        if (error) throw error;
      } else {
        throw new Error("No org or lead anchor to attach this note to.");
      }
      setNoteDraft("");
      toast({ title: "Note added" });
      await load();
    } catch (err: any) {
      toast({ title: "Could not save note", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- Inline add: Follow-up -------------------- */
  async function addFollowup() {
    if (!foTitle.trim() || !foDue) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id ?? null;
      const due = new Date(foDue).toISOString();
      const payload: any = {
        owner_id: userId,
        kind: "followup",
        title: foTitle.trim(),
        due_at: due,
        is_done: false,
        ai_generated: false,
      };
      if (data.brokerageId) payload.brokerage_id = data.brokerageId;
      if (data.devRegistryId) payload.dev_registry_id = data.devRegistryId;
      const { error } = await supabase.from("crm_relationship_reminders").insert(payload);
      if (error) throw error;
      setFoTitle(""); setFoDue("");
      toast({ title: "Follow-up scheduled" });
      await load();
    } catch (err: any) {
      toast({ title: "Could not save follow-up", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- Render helpers -------------------- */
  const counts = useMemo(() => ({
    people: data.people.length,
    campaigns: data.campaigns.length,
    events: data.events.length,
    followups: data.followups.length,
    cards: data.cards.length,
    notes: data.notes.length,
    emails: data.emails.length,
    threads: data.threads.length,
  }), [data]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-[#1A1A1A]/70">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading company hub…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — single horizontal info bar (no vertical stacking) */}
      {(() => {
        const b: any = data.brokerage || {};
        const d: any = data.developer || {};
        const o = type === "brokerage" ? b : d;
        const name = (type === "brokerage" ? b?.company_name : d?.developer_name) || companyName;
        const logo = o?.logo_url || null;
        const country = o?.country || null;
        const emirate = o?.emirate || o?.region || null;
        const city = o?.city || null;
        const license = o?.rera_license || o?.license_number || null;
        const phone = o?.phone || null;
        const whatsapp = o?.whatsapp_e164 || null;
        const email = o?.email || null;
        const website = o?.website || null;
        const linkedin = o?.linkedin_url || null;
        const instagram = o?.instagram_url || null;
        const address = o?.office_address || o?.office_location || null;
        const mapsHref = address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
          : null;

        const Item = ({ icon, children, href, title }: any) => {
          if (!children) return null;
          const cls = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F2EA] border border-[#B89555]/25 text-[12px] text-[#1A1A1A] whitespace-nowrap";
          const inner = (<>{icon}<span className="truncate max-w-[260px]">{children}</span></>);
          return href
            ? <a href={href} target="_blank" rel="noreferrer" title={title} className={cls + " hover:bg-[#EFE6D6] transition-colors"}>{inner}</a>
            : <span className={cls} title={title}>{inner}</span>;
        };

        return (
          <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap jj-scrollbar-gold">
              <div className="h-12 w-12 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center overflow-hidden flex-none">
                {logo
                  ? <img src={logo} alt="" className="max-w-full max-h-full object-contain"  loading="lazy" decoding="async" />
                  : <Building2 className="h-6 w-6 text-[#1A1A1A]/60" />}
              </div>
              <div className="flex-none">
                <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">
                  {type === "brokerage" ? "Brokerage" : "Developer"}
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A] leading-tight whitespace-nowrap">{name}</h2>
              </div>
              <span aria-hidden className="mx-1 h-8 w-px bg-[#B89555]/25 flex-none" />
              <div className="flex items-center gap-1.5 flex-none">
                <Item icon={<MapPin className="h-3.5 w-3.5" />} title="Country">{country}</Item>
                <Item icon={<MapPin className="h-3.5 w-3.5" />} title="Emirate">{emirate}</Item>
                <Item icon={<MapPin className="h-3.5 w-3.5" />} title="City">{city}</Item>
                <Item icon={<BadgeCheck className="h-3.5 w-3.5" />} title="License">{license}</Item>
                <Item icon={<MapPin className="h-3.5 w-3.5" />} href={mapsHref} title="Office address">{address}</Item>
                <Item icon={<Phone className="h-3.5 w-3.5" />} href={phone ? `tel:${phone}` : undefined} title="Phone">{phone}</Item>
                <Item icon={<MessageCircle className="h-3.5 w-3.5" />} href={whatsapp ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}` : undefined} title="WhatsApp">{whatsapp}</Item>
                <Item icon={<Mail className="h-3.5 w-3.5" />} href={email ? `mailto:${email}` : undefined} title="Email">{email}</Item>
                <Item icon={<Globe className="h-3.5 w-3.5" />} href={website || undefined} title="Website">{website}</Item>
                <Item icon={<Linkedin className="h-3.5 w-3.5" />} href={linkedin || undefined} title="LinkedIn">{linkedin ? "LinkedIn" : null}</Item>
                <Item icon={<Instagram className="h-3.5 w-3.5" />} href={instagram || undefined} title="Instagram">{instagram ? "Instagram" : null}</Item>
              </div>
              <span aria-hidden className="mx-1 h-8 w-px bg-[#B89555]/25 flex-none" />
              <div className="flex items-center gap-1.5 flex-none">
                {data.brokerageId && (
                  <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] whitespace-nowrap">
                    Brokerage linked
                  </Badge>
                )}
                {data.devRegistryId && (
                  <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] whitespace-nowrap">
                    Developer linked
                  </Badge>
                )}
                <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] whitespace-nowrap">
                  {counts.people} people
                </Badge>
              </div>
            </div>
          </div>
        );
      })()}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20 flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#EFE6D6]">Overview</TabsTrigger>
          <TabsTrigger value="people" className="data-[state=active]:bg-[#EFE6D6]">People <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.people}</span></TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#EFE6D6]">Campaigns <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.campaigns}</span></TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-[#EFE6D6]">Events <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.events}</span></TabsTrigger>
          <TabsTrigger value="followups" className="data-[state=active]:bg-[#EFE6D6]">Follow-ups <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.followups}</span></TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-[#EFE6D6]">Cards <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.cards}</span></TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-[#EFE6D6]">Notes <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.notes}</span></TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-[#EFE6D6]">Emails <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.emails}</span></TabsTrigger>
          <TabsTrigger value="comms" className="data-[state=active]:bg-[#EFE6D6]">Comms <span className="ml-1 text-[10px] text-[#1A1A1A]/60">{counts.threads}</span></TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryCard icon={<Users className="h-4 w-4" />} label="People" count={counts.people} onOpen={() => setTab("people")}>
              {data.people.slice(0, 4).map((p) => (
                <li key={p.id} className="truncate">{p.full_name || "—"} <span className="text-[#1A1A1A]/50">· {p.email_lower || p.phone_e164 || ""}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<Megaphone className="h-4 w-4" />} label="Campaigns" count={counts.campaigns} onOpen={() => setTab("campaigns")}>
              {data.campaigns.slice(0, 4).map((c) => (
                <li key={c.id} className="truncate">{c.name} <span className="text-[#1A1A1A]/50">· {c.status ?? "—"} · {fmtDate(c.sent_at)}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<CalendarDays className="h-4 w-4" />} label="Events" count={counts.events} onOpen={() => setTab("events")}>
              {data.events.slice(0, 4).map((e) => (
                <li key={e.id} className="truncate">{e.title || e.event_type} <span className="text-[#1A1A1A]/50">· {fmtDate(e.event_date)}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<Bell className="h-4 w-4" />} label="Follow-ups" count={counts.followups} onOpen={() => setTab("followups")}>
              {data.followups.slice(0, 4).map((f) => (
                <li key={f.id} className="truncate">{f.title || f.action_type || f.kind} <span className="text-[#1A1A1A]/50">· {fmtDateTime(f.due_at)}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<CreditCard className="h-4 w-4" />} label="Cards" count={counts.cards} onOpen={() => setTab("cards")}>
              {data.cards.slice(0, 4).map((c: any) => (
                <li key={c.id} className="truncate">{c.card_data?.name || c.card_data?.full_name || "Scanned card"} <span className="text-[#1A1A1A]/50">· {fmtDate(c.scanned_at)}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<StickyNote className="h-4 w-4" />} label="Notes" count={counts.notes} onOpen={() => setTab("notes")}>
              {data.notes.slice(0, 4).map((n) => (
                <li key={n.id} className="truncate">{n.body}</li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<Mail className="h-4 w-4" />} label="Emails" count={counts.emails} onOpen={() => setTab("emails")}>
              {data.emails.slice(0, 4).map((e: any) => (
                <li key={e.id} className="truncate">{e.subject || "(no subject)"} <span className="text-[#1A1A1A]/50">· {e.direction} · {fmtDate(e.sent_at)}</span></li>
              ))}
            </SummaryCard>
            <SummaryCard icon={<MessagesSquare className="h-4 w-4" />} label="Comms" count={counts.threads} onOpen={() => setTab("comms")}>
              {data.threads.slice(0, 4).map((t: any) => (
                <li key={t.id} className="truncate">{t.contact_name || t.contact_identifier} <span className="text-[#1A1A1A]/50">· {t.channel_type} · {fmtDate(t.last_message_at)}</span></li>
              ))}
            </SummaryCard>
          </div>
        </TabsContent>

        {/* PEOPLE */}
        <TabsContent value="people" className="mt-4">
          <Section empty={data.people.length === 0} emptyText="No people linked to this company.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.people.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1A1A] truncate">{p.full_name || "—"}</div>
                    <div className="text-xs text-[#1A1A1A]/60 truncate">
                      {[p.contact_type, p.email_lower, p.phone_e164].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Link
                    to={`/owner/crm/leads/${p.id}`}
                    className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="mt-4">
          <Section empty={data.campaigns.length === 0} emptyText="No campaigns have targeted this company.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.campaigns.map((c) => (
                <li key={c.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#1A1A1A]">{c.name}</div>
                    <div className="text-xs text-[#1A1A1A]/60">{c.status ?? "—"} · last sent {fmtDate(c.sent_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-4">
          <Section empty={data.events.length === 0} emptyText="No events recorded.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.events.map((e: any) => (
                <li key={e.id} className="py-2">
                  <div className="font-medium text-[#1A1A1A]">{e.title || e.event_type}</div>
                  <div className="text-xs text-[#1A1A1A]/60">{e.event_type} · {fmtDate(e.event_date)}</div>
                  {e.notes && <div className="text-sm text-[#1A1A1A]/80 mt-1">{e.notes}</div>}
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* FOLLOW-UPS */}
        <TabsContent value="followups" className="mt-4 space-y-3">
          <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-3 space-y-2">
            <div className="text-sm font-medium text-[#1A1A1A]">Schedule a follow-up</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={foTitle}
                onChange={(e) => setFoTitle(e.target.value)}
                placeholder="What needs doing?"
                className="bg-[#FDFBF7] border-[#B89555]/25"
              />
              <Input
                type="datetime-local"
                value={foDue}
                onChange={(e) => setFoDue(e.target.value)}
                className="bg-[#FDFBF7] border-[#B89555]/25 sm:w-56"
              />
              <Button
                onClick={addFollowup}
                disabled={saving || !foTitle.trim() || !foDue}
                variant="gold"
              >
                Save
              </Button>
            </div>
          </Card>
          <Section empty={data.followups.length === 0} emptyText="No open follow-ups.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.followups.map((f) => (
                <li key={`${f._src}-${f.id}`} className="py-2">
                  <div className="font-medium text-[#1A1A1A]">{f.title || f.action_type || f.kind}</div>
                  <div className="text-xs text-[#1A1A1A]/60">Due {fmtDateTime(f.due_at)} · {f._src}</div>
                  {f.body && <div className="text-sm text-[#1A1A1A]/80 mt-1">{f.body}</div>}
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* CARDS */}
        <TabsContent value="cards" className="mt-4">
          <Section empty={data.cards.length === 0} emptyText="No business cards mention this company.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.cards.map((c: any) => (
                <li key={c.id} className="py-2">
                  <div className="font-medium text-[#1A1A1A]">
                    {c.card_data?.name || c.card_data?.full_name || "Scanned card"}
                  </div>
                  <div className="text-xs text-[#1A1A1A]/60">
                    {[c.card_data?.title, c.card_data?.company, c.card_data?.email, c.card_data?.phone]
                      .filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-xs text-[#1A1A1A]/50">Scanned {fmtDate(c.scanned_at)}</div>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="mt-4 space-y-3">
          <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-3 space-y-2">
            <div className="text-sm font-medium text-[#1A1A1A]">Add a note</div>
            <Textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Quick note about this company…"
              rows={3}
              className="bg-[#FDFBF7] border-[#B89555]/25"
            />
            <div className="flex justify-end">
              <Button onClick={addNote} disabled={saving || !noteDraft.trim()} variant="gold">
                Save note
              </Button>
            </div>
          </Card>
          <Section empty={data.notes.length === 0} emptyText="No notes yet.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.notes.map((n) => (
                <li key={`${n._src}-${n.id}`} className="py-2">
                  <div className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{n.body}</div>
                  <div className="text-xs text-[#1A1A1A]/60 mt-1">{fmtDateTime(n.created_at)} · {n._src}</div>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* EMAILS */}
        <TabsContent value="emails" className="mt-4">
          <Section empty={data.emails.length === 0} emptyText="No emails logged.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.emails.map((e: any) => (
                <li key={e.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-[#1A1A1A] truncate">{e.subject || "(no subject)"}</div>
                    <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] text-[10px]">
                      {e.direction}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#1A1A1A]/60 truncate">
                    {e.from_email} → {(e.to_emails ?? []).join(", ")} · {fmtDateTime(e.sent_at)}
                  </div>
                  {e.body_snippet && (
                    <div className="text-sm text-[#1A1A1A]/80 mt-1 line-clamp-2">{e.body_snippet}</div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* COMMS */}
        <TabsContent value="comms" className="mt-4">
          <Section empty={data.threads.length === 0} emptyText="No conversations linked to this company.">
            <ul className="divide-y divide-[#B89555]/15">
              {data.threads.map((t: any) => (
                <li key={t.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-[#1A1A1A] truncate">
                      {t.contact_name || t.contact_identifier || "Unknown"}
                    </div>
                    <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] text-[10px]">
                      {t.channel_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#1A1A1A]/60 truncate">
                    {t.last_message_preview || "—"}
                  </div>
                  <div className="text-xs text-[#1A1A1A]/50">{fmtDateTime(t.last_message_at)}</div>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- Internals -------------------- */

function Section({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4">
      {empty ? <div className="text-sm text-[#1A1A1A]/60 text-center py-6">{emptyText}</div> : children}
    </Card>
  );
}

function SummaryCard({
  icon, label, count, onOpen, children,
}: {
  icon: React.ReactNode; label: string; count: number;
  onOpen: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]">
          {icon} {label} <span className="text-[#1A1A1A]/60">({count})</span>
        </div>
        <button onClick={onOpen} className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
          Open →
        </button>
      </div>
      {count === 0 ? (
        <div className="text-xs text-[#1A1A1A]/50">Nothing yet.</div>
      ) : (
        <ul className="text-xs text-[#1A1A1A]/80 space-y-1">{children}</ul>
      )}
    </Card>
  );
}
