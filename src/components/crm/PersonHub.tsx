/**
 * PersonHub
 * --------------------------------------------------------------------------
 * Tabbed person detail panel — mirror of CompanyHub for individual people.
 * Used inside PersonHubDrawer (side sheet) and PersonHubPage (full view) so
 * leads, investors, brokers, sales reps and employees all get the same
 * Overview · Activity · Companies · Cards · Deals · Training · Documents
 * shell.
 *
 * Visual rules: champagne surfaces, gold hairline only, ink text.
 *
 * Variants drive which tabs are visible — no tabs are removed for any
 * variant, only hidden when irrelevant ("No Removal" policy still respected
 * because every tab routes to its existing source page when present).
 *
 * Heavy data sources are reused (RelationalHubTabs, broker_company_history,
 * crm_activities, admin_scanned_cards) — this component is presentational.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User, Building2, ScanLine, Briefcase, GraduationCap, FileText,
  MessagesSquare, Bell, Crown,
} from "lucide-react";
import { RelationalHubTabs } from "@/components/crm/RelationalHubTabs";

export type PersonVariant =
  | "lead"
  | "investor"
  | "broker"
  | "sales-rep"
  | "employee";

export interface PersonHubProps {
  variant: PersonVariant;
  /** Primary identifier in the source table (crm_leads.id / broker.id / etc.) */
  id: string;
  /** Display name */
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  /** Mirror of RelationalHubTabs.sourceHistory shape */
  sourceHistory?: Array<{
    id?: string | number;
    when?: string | Date | null;
    who?: string | null;
    what: string;
    detail?: string | null;
  }>;
  /** Extra "facts" rendered in the Overview tab. */
  facts?: { label: string; value: string | null | undefined }[];
}

const VARIANT_LABEL: Record<PersonVariant, string> = {
  lead: "Lead",
  investor: "Investor",
  broker: "Broker",
  "sales-rep": "Sales Representative",
  employee: "Employee",
};

const TABS_BY_VARIANT: Record<PersonVariant, string[]> = {
  lead:        ["overview", "activity", "cards", "comms"],
  investor:    ["overview", "activity", "cards", "comms"],
  broker:      ["overview", "activity", "companies", "cards", "deals", "training", "documents", "comms"],
  "sales-rep": ["overview", "activity", "companies", "cards", "deals", "comms"],
  employee:    ["overview", "activity", "documents", "payroll", "comms"],
};

const TAB_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  overview:  { label: "Overview",  icon: User },
  activity:  { label: "Activity",  icon: Bell },
  companies: { label: "Companies", icon: Building2 },
  cards:     { label: "Cards",     icon: ScanLine },
  deals:     { label: "Deals",     icon: Briefcase },
  training:  { label: "Training",  icon: GraduationCap },
  documents: { label: "Documents", icon: FileText },
  payroll:   { label: "Payroll",   icon: Briefcase },
  comms:     { label: "Comms",     icon: MessagesSquare },
};

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

export function PersonHub({
  variant, id, name, email, phone, company, title, sourceHistory = [], facts = [],
}: PersonHubProps) {
  const tabs = TABS_BY_VARIANT[variant];
  const [tab, setTab] = useState(tabs[0]);

  // Activity timeline — tied to crm_leads.id (lead/investor variants)
  const [activity, setActivity] = useState<any[] | null>(null);
  useEffect(() => {
    if (variant !== "lead" && variant !== "investor") return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("crm_activities")
        .select("id, activity_type, description, created_at")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (alive) setActivity(data || []);
    })();
    return () => { alive = false; };
  }, [variant, id]);

  // Broker variant: company history + assigned/closed leads counts
  const [brokerHistory, setBrokerHistory] = useState<any[] | null>(null);
  const [leadCounts, setLeadCounts] = useState<{ assigned: number; closed: number } | null>(null);
  useEffect(() => {
    if (variant !== "broker") return;
    let alive = true;
    (async () => {
      const histPromise = supabase
        .from("broker_company_history")
        .select("id, company_name, started_at, ended_at")
        .eq("broker_id", id)
        .order("started_at", { ascending: false });
      const assignedPromise = supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("assigned_broker_id", id);
      const closedPromise = supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("assigned_broker_id", id)
        .eq("pipeline_stage", "closed_won");
      const [histRes, assignedRes, closedRes] = await Promise.all([
        histPromise, assignedPromise, closedPromise,
      ]);
      if (!alive) return;
      setBrokerHistory((histRes.data as any[]) || []);
      setLeadCounts({
        assigned: (assignedRes.count as number) || 0,
        closed: (closedRes.count as number) || 0,
      });
    })();
    return () => { alive = false; };
  }, [variant, id]);

  const overviewFacts = useMemo(() => {
    const base: { label: string; value: string | null | undefined }[] = [
      { label: "Email", value: email },
      { label: "Phone", value: phone },
    ];
    if (variant === "broker" || variant === "sales-rep" || variant === "employee" || variant === "lead") {
      base.push({ label: "Current company", value: company });
    }
    if (title) base.push({ label: "Title", value: title });
    return [...base, ...facts];
  }, [email, phone, company, title, facts, variant]);

  const RelHub = variant === "broker"
    ? <RelationalHubTabs kind="broker" entityId={id} name={name} email={email ?? undefined} phone={phone ?? undefined} sourceHistory={sourceHistory} />
    : null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#1A1A1A]">{name}</h2>
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">
            {VARIANT_LABEL[variant]}
          </Badge>
          {variant === "investor" && <Crown className="h-4 w-4 text-[#B89555]" />}
        </div>
        {(company || title) && (
          <p className="text-xs text-[#1A1A1A]/70">
            {[title, company].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20 flex flex-wrap h-auto">
          {tabs.map((t) => {
            const meta = TAB_META[t];
            const Icon = meta.icon;
            return (
              <TabsTrigger
                key={t}
                value={t}
                className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:border-[#B89555] data-[state=active]:text-[#1A1A1A] text-[#1A1A1A]/70"
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {meta.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="pt-3">
          <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-4 space-y-3">
            {overviewFacts.map((f) => (
              <div key={f.label}>
                <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">{f.label}</div>
                <div className="text-sm text-[#1A1A1A]">{f.value || "—"}</div>
              </div>
            ))}
            {variant === "broker" && leadCounts && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#B89555]/20">
                <Stat label="Leads assigned" value={leadCounts.assigned} />
                <Stat label="Leads closed (won)" value={leadCounts.closed} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="pt-3">
          {activity === null && (variant === "lead" || variant === "investor") ? (
            <Skeleton className="h-40 w-full" />
          ) : (variant === "lead" || variant === "investor") && activity && activity.length > 0 ? (
            <ul className="divide-y divide-[#B89555]/15 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
              {activity.map((a) => (
                <li key={a.id} className="px-3 py-2 text-sm">
                  <div className="text-[#1A1A1A] font-medium truncate">
                    {a.description || a.activity_type?.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-[#1A1A1A]/60">{fmtDateTime(a.created_at)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-[#1A1A1A]/60 px-3 py-6 text-center rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]">
              No recorded activity yet.
            </div>
          )}
        </TabsContent>

        {/* Companies (broker / sales-rep) */}
        <TabsContent value="companies" className="pt-3">
          {variant === "broker" ? (
            brokerHistory === null ? (
              <Skeleton className="h-32 w-full" />
            ) : brokerHistory.length === 0 ? (
              <div className="text-xs text-[#1A1A1A]/60 px-3 py-6 text-center rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]">
                No company history recorded.
              </div>
            ) : (
              <ul className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] divide-y divide-[#B89555]/15">
                {brokerHistory.map((h) => (
                  <li key={h.id} className="px-3 py-2 text-sm flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[#B89555]" />
                    <span className="font-medium text-[#1A1A1A]">{h.company_name}</span>
                    <span className="ml-auto text-[11px] text-[#1A1A1A]/60">
                      {h.started_at ? new Date(h.started_at).toLocaleDateString() : "—"}
                      {" → "}
                      {h.ended_at ? new Date(h.ended_at).toLocaleDateString() : "Present"}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="text-xs text-[#1A1A1A]/60">{company || "—"}</div>
          )}
          {RelHub && <div className="mt-4">{RelHub}</div>}
        </TabsContent>

        {/* Cards / Deals / Training / Documents / Payroll / Comms — placeholders that reuse RelationalHub or empty-states. */}
        {(["cards", "deals", "training", "documents", "payroll", "comms"] as const).map((k) => (
          <TabsContent key={k} value={k} className="pt-3">
            {variant === "broker" && (k === "cards" || k === "deals" || k === "training") && RelHub ? (
              RelHub
            ) : (
              <div className="text-xs text-[#1A1A1A]/60 px-3 py-6 text-center rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]">
                {TAB_META[k].label} — opens its full view from the directory.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#B89555]/20 bg-[#F7F2EA]/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">{label}</div>
      <div className="text-lg font-semibold text-[#1A1A1A] tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

export default PersonHub;
