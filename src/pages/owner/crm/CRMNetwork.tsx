/**
 * CRMNetwork
 * --------------------------------------------------------------------------
 * Single relational view across the CRM with five role tabs:
 *   Investors · Developers · Brokers · Brokerage Agencies · Partners
 *
 * - Sources from `crm_leads` only; each tab applies its own role predicate.
 * - SourceFilterChips state is shared across tabs ("stacking" filters) so
 *   country/upload/database/team/campaign carry over when you switch role.
 * - Each row shows relationship counters for the other four tabs. Clicking a
 *   counter jumps to that tab and pre-applies a "related to" cross-filter
 *   (matched by email, phone, or company name).
 * --------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  SourceFilterChips,
  EMPTY_SOURCE_FILTER,
  rowMatchesSourceFilter,
  useSourceFilterContext,
  type SourceFilterValue,
} from "@/components/crm/SourceFilterChips";
import { Loader2, Search, Link2, X, Building2 } from "lucide-react";
import { CompanyHubDrawer } from "@/components/crm/CompanyHubDrawer";
import { PersonDetailDrawer } from "@/components/crm/PersonDetailDrawer";
import { ScopedExportMenu } from "@/components/crm/ScopedExportMenu";

/* -------------------- Role definitions -------------------- */

type RoleKey = "investors" | "developers" | "brokers" | "agencies" | "partners";

const ROLE_TABS: { key: RoleKey; label: string }[] = [
  { key: "investors", label: "Investors" },
  { key: "developers", label: "Developers" },
  { key: "brokers", label: "Brokers" },
  { key: "agencies", label: "Brokerage Agencies" },
  { key: "partners", label: "Partners" },
];

interface Lead {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  contact_type: string | null;
  lead_intent: string | null;
  partner_service_type: string | null;
  company_name: string | null;
  buying_purpose: string | null;
  tags: string[] | null;
  country_of_residence: string | null;
  current_location_country: string | null;
  upload_source: string | null;
  database_source: string | null;
  region: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
}

const lower = (s: any) => String(s ?? "").toLowerCase();
const tagSet = (l: Lead) => new Set((l.tags ?? []).map((t) => lower(t)));

function isBroker(l: Lead) {
  return (
    lower(l.contact_type) === "broker" ||
    lower(l.partner_service_type).startsWith("broker") ||
    tagSet(l).has("broker")
  );
}
function isDeveloper(l: Lead) {
  return (
    lower(l.lead_intent).includes("develop") ||
    lower(l.partner_service_type).startsWith("developer") ||
    lower(l.company_name).includes("develop") ||
    tagSet(l).has("developer")
  );
}
function isInvestor(l: Lead) {
  return (
    lower(l.contact_type) === "client" ||
    lower(l.lead_intent).includes("invest") ||
    lower(l.buying_purpose) === "investment" ||
    tagSet(l).has("investor")
  );
}
function isAgency(l: Lead) {
  // Brokerage agency = broker rows that carry a company name
  return isBroker(l) && !!(l.company_name && l.company_name.trim());
}
function isPartner(l: Lead) {
  if (!l.partner_service_type) return tagSet(l).has("partner");
  const v = lower(l.partner_service_type);
  return v.length > 0 && !v.startsWith("broker") && !v.startsWith("developer");
}

const ROLE_PREDICATES: Record<RoleKey, (l: Lead) => boolean> = {
  investors: isInvestor,
  developers: isDeveloper,
  brokers: isBroker,
  agencies: isAgency,
  partners: isPartner,
};

/* -------------------- Cross-tab relation -------------------- */

interface CrossFilter {
  email?: string;
  phone?: string;
  company?: string;
  label: string;
}

function rowMatchesCross(l: Lead, cf: CrossFilter | null): boolean {
  if (!cf) return true;
  if (cf.email && lower(l.email_lower) === lower(cf.email)) return true;
  if (cf.phone && l.phone_e164 === cf.phone) return true;
  if (cf.company && lower(l.company_name).trim() === lower(cf.company).trim()) return true;
  return false;
}

function relatedKeys(l: Lead) {
  return {
    email: l.email_lower ? lower(l.email_lower) : null,
    phone: l.phone_e164 || null,
    company: l.company_name ? lower(l.company_name).trim() : null,
  };
}

/* -------------------- Page -------------------- */

export default function CRMNetwork() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeRole, setActiveRole] = useState<RoleKey>("investors");
  const [search, setSearch] = useState("");
  // Cross-tab persistent filter state
  const [filter, setFilter] = useState<SourceFilterValue>(EMPTY_SOURCE_FILTER);
  const [cross, setCross] = useState<CrossFilter | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [hubTarget, setHubTarget] = useState<{ type: "brokerage" | "developer"; companyName: string } | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [personOpen, setPersonOpen] = useState(false);

  function openHubFor(role: RoleKey, l: Lead) {
    const name = (l.company_name || l.full_name || "").trim();
    if (!name) return;
    const type: "brokerage" | "developer" = role === "developers" ? "developer" : "brokerage";
    setHubTarget({ type, companyName: name });
    setHubOpen(true);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all: Lead[] = [];
      let from = 0;
      const PAGE = 1000;
      for (let i = 0; i < 20; i++) {
        const { data, error } = await supabase
          .from("crm_leads")
          .select(
            "id, full_name, email_lower, phone_e164, contact_type, lead_intent, partner_service_type, company_name, buying_purpose, tags, country_of_residence, current_location_country, upload_source, database_source, region, assigned_to_user_id, created_at",
          )
          .is("deleted_at", null)
          .range(from, from + PAGE - 1);
        if (error) {
          console.error(error);
          break;
        }
        const rows = (data as unknown as Lead[]) ?? [];
        all.push(...rows);
        if (rows.length < PAGE) break;
        from += PAGE;
      }
      setLeads(all);
      setLoading(false);
    })();
  }, []);

  // Normalize a country field for the source filter (chip uses `country`).
  const enrichedLeads = useMemo(
    () =>
      leads.map((l) => ({
        ...l,
        country: l.country_of_residence || l.current_location_country || l.region || "",
        assigned_to: l.assigned_to_user_id,
      })),
    [leads],
  );

  // Classify each lead into role buckets (a lead can belong to multiple).
  const byRole = useMemo(() => {
    const out: Record<RoleKey, typeof enrichedLeads> = {
      investors: [], developers: [], brokers: [], agencies: [], partners: [],
    };
    for (const l of enrichedLeads) {
      for (const tab of ROLE_TABS) {
        if (ROLE_PREDICATES[tab.key](l)) out[tab.key].push(l);
      }
    }
    return out;
  }, [enrichedLeads]);

  // Build cross-role lookup maps for counter badges
  const lookups = useMemo(() => {
    const byEmail = new Map<string, Set<RoleKey>>();
    const byPhone = new Map<string, Set<RoleKey>>();
    const byCompany = new Map<string, Set<RoleKey>>();
    for (const tab of ROLE_TABS) {
      for (const l of byRole[tab.key]) {
        const k = relatedKeys(l);
        if (k.email) {
          (byEmail.get(k.email) ?? byEmail.set(k.email, new Set()).get(k.email)!).add(tab.key);
        }
        if (k.phone) {
          (byPhone.get(k.phone) ?? byPhone.set(k.phone, new Set()).get(k.phone)!).add(tab.key);
        }
        if (k.company) {
          (byCompany.get(k.company) ?? byCompany.set(k.company, new Set()).get(k.company)!).add(tab.key);
        }
      }
    }
    return { byEmail, byPhone, byCompany };
  }, [byRole]);

  // Counts of related entities per other role for a given row
  function relatedCountsFor(l: Lead): Record<RoleKey, number> {
    const k = relatedKeys(l);
    const counts: Record<RoleKey, number> = {
      investors: 0, developers: 0, brokers: 0, agencies: 0, partners: 0,
    };
    for (const tab of ROLE_TABS) {
      let n = 0;
      for (const candidate of byRole[tab.key]) {
        if (candidate.id === l.id) continue;
        const ck = relatedKeys(candidate);
        if (
          (k.email && ck.email && k.email === ck.email) ||
          (k.phone && ck.phone && k.phone === ck.phone) ||
          (k.company && ck.company && k.company === ck.company)
        ) {
          n++;
        }
      }
      counts[tab.key] = n;
    }
    return counts;
  }

  const sourceCtx = useSourceFilterContext(filter);
  const tabRows = byRole[activeRole];

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabRows.filter((l) => {
      if (!rowMatchesSourceFilter(l, filter, sourceCtx)) return false;
      if (!rowMatchesCross(l, cross)) return false;
      if (!q) return true;
      return (
        lower(l.full_name).includes(q) ||
        lower(l.email_lower).includes(q) ||
        lower(l.phone_e164).includes(q) ||
        lower(l.company_name).includes(q)
      );
    });
  }, [tabRows, filter, sourceCtx, cross, search]);

  function jumpToRole(role: RoleKey, lead: Lead) {
    const k = relatedKeys(lead);
    const cf: CrossFilter = {
      email: k.email ?? undefined,
      phone: k.phone ?? undefined,
      company: k.company ?? undefined,
      label: lead.full_name || lead.company_name || lead.email_lower || "row",
    };
    setCross(cf);
    setActiveRole(role);
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] px-6 pb-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">CRM Network</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Investors, developers, brokers, agencies and partners — independent
            views, relationally connected. Filters stack across tabs.
          </p>
        </div>

        <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-[#1A1A1A]/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, company…"
              className="h-9 max-w-md bg-[#FDFBF7] border-[#B89555]/25"
            />
            {cross && (
              <Badge
                variant="outline"
                className="ml-2 border-[#B89555]/50 bg-[#EFE6D6] text-[#1A1A1A] gap-2"
              >
                <Link2 className="h-3 w-3" />
                Related to: <strong>{cross.label}</strong>
                <button onClick={() => setCross(null)} aria-label="Clear relation">
                  <X className="h-3 w-3" />
              </button>
              </Badge>
            )}
            <div className="ml-auto">
              <ScopedExportMenu
                currentRows={visibleRows}
                filenameBase={`crm-${activeRole}`}
              />
            </div>
          </div>
          <SourceFilterChips
            rows={enrichedLeads}
            value={filter}
            onChange={setFilter}
            hideWhenEmpty={false}
          />
        </Card>

        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as RoleKey)}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20">
            {ROLE_TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]"
              >
                {t.label}
                <span className="ml-2 text-[11px] text-[#1A1A1A]/60">
                  {byRole[t.key].length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLE_TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4">
              <Card className="bg-[#F7F2EA] border-[#B89555]/20 p-0 overflow-hidden">
                {loading ? (
                  <div className="p-12 flex items-center justify-center text-[#1A1A1A]/70">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
                  </div>
                ) : visibleRows.length === 0 ? (
                  <div className="p-12 text-center text-[#1A1A1A]/70">
                    No {t.label.toLowerCase()} match the current filters.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Related</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleRows.slice(0, 500).map((l) => {
                        const counts = relatedCountsFor(l);
                        return (
                          <TableRow key={l.id}>
                            <TableCell>
                              <button
                                onClick={() => { setPersonId(l.id); setPersonOpen(true); }}
                                className="font-medium text-[#1A1A1A] hover:underline text-left"
                                title="Open person details"
                              >
                                {l.full_name || "—"}
                              </button>
                              <div className="text-xs text-[#1A1A1A]/60">
                                {l.email_lower || l.phone_e164 || ""}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-[#1A1A1A]/80">
                              {(t.key === "agencies" || t.key === "developers") && l.company_name ? (
                                <button
                                  onClick={() => openHubFor(t.key, l)}
                                  className="inline-flex items-center gap-1 text-[#1A1A1A] hover:underline"
                                  title="Open company hub"
                                >
                                  <Building2 className="h-3.5 w-3.5" />
                                  {l.company_name}
                                </button>
                              ) : (
                                l.company_name || "—"
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-[#1A1A1A]/80">
                              {(l as any).country || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-[#1A1A1A]/70">
                              {[l.upload_source, l.database_source]
                                .filter(Boolean).join(" · ") || "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {ROLE_TABS.filter((r) => r.key !== t.key).map((r) => {
                                  const n = counts[r.key];
                                  if (!n) return null;
                                  return (
                                    <button
                                      key={r.key}
                                      onClick={() => jumpToRole(r.key, l)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
                                      title={`Show ${n} related ${r.label.toLowerCase()}`}
                                    >
                                      {r.label}
                                      <span className="text-[#1A1A1A]/60">{n}</span>
                                    </button>
                                  );
                                })}
                                {ROLE_TABS.every((r) => r.key === t.key || counts[r.key] === 0) && (
                                  <span className="text-xs text-[#1A1A1A]/40">—</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
              {visibleRows.length > 500 && (
                <p className="text-xs text-[#1A1A1A]/60 text-right mt-2">
                  Showing first 500 of {visibleRows.length} matches.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      {hubTarget && (
        <CompanyHubDrawer
          open={hubOpen}
          onOpenChange={setHubOpen}
          type={hubTarget.type}
          companyName={hubTarget.companyName}
        />
      )}
      <PersonDetailDrawer
        open={personOpen}
        onOpenChange={setPersonOpen}
        leadId={personId}
      />
    </div>
  );
}
