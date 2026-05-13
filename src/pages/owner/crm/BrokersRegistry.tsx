import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile } from "@/components/ui/icon-tile";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Users, Search, Plus, Building2, BadgeCheck, Clock, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useCRMSectionCounts } from "@/hooks/useCRMSectionCounts";
import { useEntityTotal } from "@/hooks/useEntityTotal";
import { ViewSwitch, useCRMViewMode } from "@/components/crm/ViewSwitch";
import { ExcelGridView, type ExcelGridColumn } from "@/components/crm/ExcelGridView";
import { RelationalHubTabs } from "@/components/crm/RelationalHubTabs";
import { PersonHub } from "@/components/crm/PersonHub";
import { UnifiedCRMExportModal } from "@/components/crm/UnifiedCRMExportModal";
import { BrokerageCombobox } from "@/components/crm/BrokerageCombobox";
import {
  SourceFilterChips,
  EMPTY_SOURCE_FILTER,
  rowMatchesSourceFilter,
  useSourceFilterContext,
  type SourceFilterValue,
} from "@/components/crm/SourceFilterChips";

type BrokerRow = {
  source: "registered" | "external";
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  current_company: string | null;
  rera: string | null;
  tier: string | null;
  last_active_at: string | null;
  user_id: string | null;
  photo_url?: string | null;
  verification_status?: string | null;
  broker_type?: "sales" | "leasing" | "both" | null;
};

export default function BrokersRegistry() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "sales" | "leasing" | "pending">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [openBroker, setOpenBroker] = useState<BrokerRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>(EMPTY_SOURCE_FILTER);
  const [exportOpen, setExportOpen] = useState(false);
  const sourceFilterCtx = useSourceFilterContext(sourceFilter);

  const [viewMode, setViewMode] = useCRMViewMode("brokers", "cards");

  const { data: registered = [], isLoading: loading1 } = useQuery({
    queryKey: ["brokers-registered"],
    queryFn: async () => {
      // Page through broker_profiles instead of capping at 1000 — the directory
      // must show every registered broker, not the first page.
      const PAGE = 1000;
      const out: any[] = [];
      for (let from = 0; from < 200_000; from += PAGE) {
        const { data, error } = await (supabase as any)
          .from("broker_profiles")
          .select("id, user_id, display_name, email, phone, current_tier, photo_url, verification_status, custom_label, updated_at, created_at")
          .order("updated_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = data || [];
        out.push(...batch);
        if (batch.length < PAGE) break;
      }
      return out;
    },
  });

  // Stream crm_brokers in 1k pages so the UI renders the first page immediately
  // and progressively fills as more pages arrive (32k+ rows otherwise = blank screen).
  const [external, setExternal] = useState<any[]>([]);
  const [externalLoadedPages, setExternalLoadedPages] = useState(0);
  const [externalDone, setExternalDone] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalReloadKey, setExternalReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const PAGE = 1000;
    setExternal([]);
    setExternalLoadedPages(0);
    setExternalDone(false);
    setExternalError(null);

    (async () => {
      try {
        for (let from = 0; from < 500_000; from += PAGE) {
          if (cancelled) return;
          const { data, error } = await (supabase as any)
            .from("crm_brokers")
            .select("*")
            .order("updated_at", { ascending: false })
            .range(from, from + PAGE - 1);
          if (cancelled) return;
          if (error) throw error;
          const batch = data || [];
          setExternal((prev) => prev.concat(batch));
          setExternalLoadedPages((p) => p + 1);
          if (batch.length < PAGE) break;
        }
        if (!cancelled) setExternalDone(true);
      } catch (e: any) {
        if (!cancelled) {
          setExternalError(e?.message || "Failed to load brokers");
          setExternalDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [externalReloadKey]);

  const loading2 = external.length === 0 && !externalDone;

  const { data: history = [] } = useQuery({
    queryKey: ["broker-company-history-all"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("broker_company_history")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(2000);
      return data || [];
    },
  });

  const allRows: BrokerRow[] = useMemo(() => {
    const r: BrokerRow[] = registered.map((b: any) => ({
      source: "registered",
      id: b.id,
      full_name: b.display_name || "Unnamed",
      email: b.email,
      phone: b.phone,
      current_company: b.custom_label || null,
      rera: null,
      tier: b.current_tier,
      last_active_at: b.updated_at,
      user_id: b.user_id,
      photo_url: b.photo_url,
      verification_status: b.verification_status,
    }));
    const e: BrokerRow[] = external.map((b: any) => ({
      source: "external",
      id: b.id,
      full_name: b.full_name,
      email: b.email_lower,
      phone: b.phone_e164,
      current_company: b.current_company,
      rera: b.rera_license,
      tier: null,
      last_active_at: b.last_active_at,
      user_id: null,
      broker_type: b.broker_type ?? null,
    } as BrokerRow));
    return [...r, ...e];
  }, [registered, external]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.current_company && set.add(r.current_company));
    history.forEach((h: any) => h.company_name && set.add(h.company_name));
    return Array.from(set).sort();
  }, [allRows, history]);

  const externalById = useMemo(() => {
    const m = new Map<string, any>();
    for (const e of (external as any[])) m.set(e.id, e);
    return m;
  }, [external]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allRows.filter((r) => {
      if (tab === "sales" && !(r.broker_type === "sales" || r.broker_type === "both")) return false;
      if (tab === "leasing" && !(r.broker_type === "leasing" || r.broker_type === "both")) return false;
      if (tab === "pending" && !(r.source === "registered" && r.verification_status === "pending")) return false;
      if (companyFilter && r.current_company !== companyFilter) return false;
      // Source-axis predicate uses the raw external row when available so the
      // upload_source / database_source / country fields resolve correctly.
      const raw = r.source === "external" ? externalById.get(r.id) ?? r : r;
      if (!rowMatchesSourceFilter(raw, sourceFilter, sourceFilterCtx)) return false;
      if (!term) return true;
      return (
        r.full_name?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.phone?.toLowerCase().includes(term) ||
        r.current_company?.toLowerCase().includes(term)
      );
    });
  }, [allRows, q, tab, companyFilter, sourceFilter, sourceFilterCtx, externalById]);

  // Authoritative DB total (head-count, not capped by row pagination, live via realtime).
  const { counts: sectionCounts } = useCRMSectionCounts();
  const { total: brokersHeadCount, loading: countLoading } = useEntityTotal("crm_brokers");
  const dbTotal: number | null =
    brokersHeadCount != null ? brokersHeadCount + (registered?.length || 0)
    : sectionCounts.brokers ? sectionCounts.brokers + (registered?.length || 0)
    : null;

  const counts = useMemo(() => ({
    total: dbTotal,
    sales: allRows.filter(r => r.broker_type === "sales" || r.broker_type === "both").length,
    leasing: allRows.filter(r => r.broker_type === "leasing" || r.broker_type === "both").length,
    pending: registered.filter((b: any) => b.verification_status === "pending").length,
    companies: companies.length,
  }), [allRows, registered, companies, dbTotal]);

  const fmtTotal = (n: number | null) =>
    n == null ? "…" : n.toLocaleString();
  const Stat = ({ icon: Icon, label, value, onClick, active }: any) => (
    <Card
      onClick={onClick}
      className={`bg-[#F7F2EA] border-[#B89555]/20 ${onClick ? "cursor-pointer hover:bg-[#EFE6D6] transition-colors" : ""} ${active ? "ring-1 ring-[#B89555]" : ""}`}
    >
      <CardContent className="p-4 flex items-center gap-3 min-w-0">
        <div className="flex-none"><IconTile icon={Icon} tone="gold" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 truncate whitespace-nowrap">{label}</div>
          <div className="text-2xl font-bold text-[#1A1A1A] leading-tight">
            {value == null ? <Skeleton className="h-7 w-16 inline-block align-middle" /> : (typeof value === "number" ? value.toLocaleString() : value)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = (loading1 && registered.length === 0) && loading2;
  const stillStreaming = !externalDone;

  // Cap rendered rows so the DOM doesn't choke on 30k+ <tr>.
  const [renderLimit, setRenderLimit] = useState(500);
  useEffect(() => { setRenderLimit(500); }, [q, tab, companyFilter, sourceFilter]);
  const visible = useMemo(() => filtered.slice(0, renderLimit), [filtered, renderLimit]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="Brokers | JBJ Global"
        description="Every broker in the market, every company they work for. Searchable, filterable, exportable."
        canonicalPath="/owner/crm/brokers"
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <IconTile icon={Users} tone="gold" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Brokers</h1>
            <p className="text-sm text-[#1A1A1A]/70">Every broker in the market, every company they work for.</p>
          </div>
          <ViewSwitch value={viewMode} onChange={setViewMode} />
          <Button variant="outline" onClick={() => setExportOpen(true)} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button variant="gold" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add broker
          </Button>
        </div>

        <UnifiedCRMExportModal
          open={exportOpen}
          onOpenChange={setExportOpen}
          kind="brokers"
          rows={filtered}
          filenameStem="crm-brokers"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          <Stat icon={Users} label="Total brokers" value={counts.total}
            onClick={() => setTab("all")} active={tab === "all"} />
          <Stat icon={BadgeCheck} label="Sales" value={counts.sales}
            onClick={() => setTab("sales")} active={tab === "sales"} />
          <Stat icon={Users} label="Leasing" value={counts.leasing}
            onClick={() => setTab("leasing")} active={tab === "leasing"} />
          <Stat icon={Clock} label="Pending" value={counts.pending}
            onClick={() => setTab("pending")} active={tab === "pending"} />
          <Stat icon={Building2} label="Companies" value={counts.companies} />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone, company…"
              className="pl-10 bg-[#FDFBF7] border-[#B89555]/30"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] text-sm"
          >
            <option value="">All companies</option>
            {companies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        {/* Source filter chips — upload_source / database_source / country / team / campaign */}
        <SourceFilterChips
          rows={external as any[]}
          axes={["upload_source", "database_source", "country", "team", "campaign"]}
          value={sourceFilter}
          onChange={setSourceFilter}
        />
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-[#EFE6D6]">
            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            <TabsTrigger value="sales">Sales ({counts.sales})</TabsTrigger>
            <TabsTrigger value="leasing">Leasing ({counts.leasing})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-3 space-y-3">
            {externalError && (
              <Card className="border-red-300 bg-red-50/40">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-[#1A1A1A]">
                    <div className="font-semibold">Couldn't load all brokers.</div>
                    <div className="text-[#1A1A1A]/70 text-xs mt-0.5">{externalError}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setExternalReloadKey((k) => k + 1)}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
            {stillStreaming && (
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70 px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading brokers… {external.length.toLocaleString()} of {counts.total.toLocaleString()} loaded
              </div>
            )}
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : filtered.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
                {stillStreaming ? "Loading brokers…" : "No brokers match your filters."}
              </CardContent></Card>
            ) : (
              <Card className="bg-[#F7F2EA] border-[#B89555]/20">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Broker</th>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold">Company</th>
                        <th className="text-left px-4 py-3 font-semibold">Type</th>
                        <th className="text-left px-4 py-3 font-semibold">RERA / Tier</th>
                        <th className="text-left px-4 py-3 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r) => {
                        const raw = r.source === "external" ? externalById.get(r.id) : null;
                        const dbSource = raw?.database_source || raw?.upload_source || (r.source === "registered" ? "Registered" : "Manual");
                        return (
                          <tr key={`${r.source}:${r.id}`} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7] cursor-pointer" onClick={() => setOpenBroker(r)}>
                            <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.full_name}</td>
                            <td className="px-4 py-3 text-[#1A1A1A]/80">
                              {r.email ? <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{r.email}</a> : "—"}
                            </td>
                            <td className="px-4 py-3 text-[#1A1A1A]/80">
                              {r.phone ? <a href={`tel:${r.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{r.phone}</a> : "—"}
                            </td>
                            <td className="px-4 py-3 text-[#1A1A1A]/80">{r.current_company || "—"}</td>
                            <td className="px-4 py-3 text-[#1A1A1A]/80 capitalize">{r.broker_type || "—"}</td>
                            <td className="px-4 py-3 text-[#1A1A1A]/80">{r.rera || r.tier || "—"}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] capitalize">
                                {dbSource}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length > visible.length && (
                    <div className="p-3 border-t border-[#B89555]/20 flex items-center justify-between text-xs text-[#1A1A1A]/70">
                      <span>Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()} matching brokers</span>
                      <Button variant="outline" size="sm" onClick={() => setRenderLimit((n) => n + 1000)}>
                        Show more
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={!!openBroker} onOpenChange={(o) => !o && setOpenBroker(null)}>
        <SheetContent className="bg-[#FDFBF7] sm:max-w-2xl overflow-y-auto border-l border-[#B89555]/20">
          {openBroker && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#1A1A1A] flex items-center justify-between gap-3 pr-8">
                  <span>Person Hub</span>
                  <a
                    href={`/owner/crm/person/broker/${encodeURIComponent(openBroker.id)}`}
                    className="text-xs font-normal text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1"
                  >
                    Open full view
                  </a>
                </SheetTitle>
                <SheetDescription className="text-[#1A1A1A]/70">
                  {openBroker.source === "registered" ? "Registered broker profile" : "External broker (CRM only)"}
                </SheetDescription>
              </SheetHeader>
              <PersonHub
                variant="broker"
                id={openBroker.id}
                name={openBroker.full_name}
                email={openBroker.email}
                phone={openBroker.phone}
                company={openBroker.current_company}
                title={openBroker.tier ? `Tier ${openBroker.tier}` : null}
                facts={openBroker.rera ? [{ label: "RERA", value: openBroker.rera }] : []}
                sourceHistory={(history ?? [])
                  .filter((h: any) => h.broker_id === openBroker.id)
                  .map((h: any) => ({
                    id: h.id,
                    when: h.started_at,
                    who: null,
                    what: `Worked at ${h.company_name}`,
                    detail: h.ended_at ? `Ended ${new Date(h.ended_at).toLocaleDateString()}` : "Current",
                  }))}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      <AddBrokerSheet open={addOpen} onOpenChange={setAddOpen} onAdded={() => { qc.invalidateQueries({ queryKey: ["brokers-registered"] }); setExternalReloadKey((k) => k + 1); }} />
    </div>
  );
}

function BrokerCompanyTimeline({ brokerId, brokerName, history, currentCompany }: { brokerId: string; brokerName: string; history: any[]; currentCompany: string | null }) {
  const rows = useMemo(() => history.filter((h) => h.broker_id === brokerId), [history, brokerId]);
  const items = rows.length ? rows : (currentCompany ? [{ company_name: currentCompany, started_at: null, ended_at: null }] : []);
  if (!items.length) return <div className="text-xs text-[#1A1A1A]/60 mt-1">No company history recorded.</div>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((h: any, i: number) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-[#B89555]" />
          <span className="font-medium">{h.company_name}</span>
          <span className="text-xs text-[#1A1A1A]/60">
            {h.started_at ? new Date(h.started_at).toLocaleDateString() : "—"}
            {" → "}
            {h.ended_at ? new Date(h.ended_at).toLocaleDateString() : "Present"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AddBrokerSheet({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);
  const initial = {
    full_name: "", email: "", phone: "", whatsapp: "",
    personal_email: "", company_email: "", personal_phone: "", company_phone: "",
    current_company: "", current_brokerage_id: null as string | null,
    rera_license: "", nationality: "", languages: "",
    experience_years: "", broker_type: "" as "" | "sales" | "leasing" | "both",
    birthday: "", linkedin_url: "", bayut_url: "", pf_url: "", instagram_url: "",
    notes: "",
  };
  const [form, setForm] = useState(initial);
  const reset = () => setForm(initial);

  const submit = async () => {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const langs = form.languages
        .split(",").map(s => s.trim()).filter(Boolean);
      const exp = form.experience_years.trim() ? Number(form.experience_years) : null;
      const payload: any = {
        owner_id: user.id,
        full_name: form.full_name.trim(),
        email_lower: form.email.trim().toLowerCase() || null,
        phone_e164: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        personal_email: form.personal_email.trim().toLowerCase() || null,
        company_email: form.company_email.trim().toLowerCase() || null,
        personal_phone: form.personal_phone.trim() || null,
        company_phone: form.company_phone.trim() || null,
        current_company: form.current_company.trim() || null,
        current_brokerage_id: form.current_brokerage_id || null,
        rera_license: form.rera_license.trim() || null,
        nationality: form.nationality.trim() || null,
        languages: langs.length ? langs : null,
        experience_years: Number.isFinite(exp as number) ? exp : null,
        broker_type: form.broker_type || null,
        birthday: form.birthday || null,
        linkedin_url: form.linkedin_url.trim() || null,
        bayut_url: form.bayut_url.trim() || null,
        pf_url: form.pf_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        notes: form.notes.trim() || null,
        upload_source: "manual",
        database_source: "manual",
      };
      const { error } = await (supabase as any).from("crm_brokers").insert(payload);
      if (error) throw error;
      toast.success("Broker added");
      reset();
      onAdded();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to add broker");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ k, label, type = "text" }: { k: keyof typeof initial; label: string; type?: string }) => (
    <div>
      <Label className="text-xs text-[#1A1A1A]/70">{label}</Label>
      <Input
        type={type}
        value={(form as any)[k]}
        onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
        className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent className="bg-[#FDFBF7] sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A]">Add broker manually</SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">All fields except name are optional — fill what you have, update later.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Field k="full_name" label="Full name *" />
          <div className="grid grid-cols-2 gap-3">
            <Field k="email" label="Primary email" />
            <Field k="phone" label="Primary phone" />
            <Field k="personal_email" label="Personal email" />
            <Field k="company_email" label="Company email" />
            <Field k="personal_phone" label="Personal phone" />
            <Field k="company_phone" label="Company phone" />
            <Field k="whatsapp" label="WhatsApp" />
            <Field k="birthday" label="Birthday" type="date" />
            <Field k="nationality" label="Nationality" />
            <Field k="experience_years" label="Experience (years)" type="number" />
          </div>
          <Field k="languages" label="Languages (comma-separated)" />
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Broker type</Label>
            <select
              value={form.broker_type}
              onChange={(e) => setForm((f) => ({ ...f, broker_type: e.target.value as any }))}
              className="mt-1 w-full h-10 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] px-3 text-sm"
            >
              <option value="">— select —</option>
              <option value="sales">Sales</option>
              <option value="leasing">Leasing</option>
              <option value="both">Both</option>
            </select>
          </div>
          <BrokerageCombobox
            value={form.current_company}
            brokerageId={form.current_brokerage_id}
            onChange={({ value, brokerageId }) =>
              setForm((f) => ({ ...f, current_company: value, current_brokerage_id: brokerageId }))
            }
          />
          <Field k="rera_license" label="RERA license" />
          <div className="grid grid-cols-2 gap-3">
            <Field k="linkedin_url" label="LinkedIn URL" />
            <Field k="instagram_url" label="Instagram URL" />
            <Field k="bayut_url" label="Bayut profile" />
            <Field k="pf_url" label="Property Finder profile" />
          </div>
          <Field k="notes" label="Notes" />
          <Button onClick={submit} disabled={saving} variant="gold" className="w-full">
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : "Add broker"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
