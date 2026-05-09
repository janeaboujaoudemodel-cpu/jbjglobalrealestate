import { useMemo, useState } from "react";
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
import { RelationalHubTabs } from "@/components/crm/RelationalHubTabs";
import { UnifiedCRMExportModal } from "@/components/crm/UnifiedCRMExportModal";
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
};

export default function BrokersRegistry() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "registered" | "external">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [openBroker, setOpenBroker] = useState<BrokerRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>(EMPTY_SOURCE_FILTER);
  const [exportOpen, setExportOpen] = useState(false);
  const sourceFilterCtx = useSourceFilterContext(sourceFilter);

  const { data: registered = [], isLoading: loading1 } = useQuery({
    queryKey: ["brokers-registered"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("broker_profiles")
        .select("id, user_id, display_name, email, phone, current_tier, photo_url, verification_status, custom_label, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: external = [], isLoading: loading2 } = useQuery({
    queryKey: ["brokers-external"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_brokers")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

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
    }));
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
      if (tab !== "all" && r.source !== tab) return false;
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

  const counts = useMemo(() => ({
    total: allRows.length,
    registered: registered.length,
    external: external.length,
    pending: registered.filter((b: any) => b.verification_status === "pending").length,
    companies: companies.length,
  }), [allRows, registered, external, companies]);

  const Stat = ({ icon: Icon, label, value }: any) => (
    <Card className="bg-[#F7F2EA] border-[#B89555]/20">
      <CardContent className="p-4 flex items-center gap-3">
        <IconTile icon={Icon} tone="gold" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">{label}</div>
          <div className="text-2xl font-bold text-[#1A1A1A]">{value}</div>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = loading1 || loading2;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="Brokers Registry | JBJ Global"
        description="Every broker, every company they work for. Searchable, filterable, exportable."
        canonicalPath="/owner/crm/brokers"
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <IconTile icon={Users} tone="gold" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Brokers Registry</h1>
            <p className="text-sm text-[#1A1A1A]/70">Every broker, every company they work for.</p>
          </div>
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon={Users} label="Total brokers" value={counts.total} />
          <Stat icon={BadgeCheck} label="Registered" value={counts.registered} />
          <Stat icon={Users} label="External / CRM" value={counts.external} />
          <Stat icon={Clock} label="Pending" value={counts.pending} />
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
            <TabsTrigger value="registered">Registered ({counts.registered})</TabsTrigger>
            <TabsTrigger value="external">External ({counts.external})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-3">
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : filtered.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
                No brokers match your filters.
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
                        <th className="text-left px-4 py-3 font-semibold">RERA / Tier</th>
                        <th className="text-left px-4 py-3 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={`${r.source}:${r.id}`} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7] cursor-pointer" onClick={() => setOpenBroker(r)}>
                          <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.full_name}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{r.email || "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{r.phone || "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{r.current_company || "—"}</td>
                          <td className="px-4 py-3 text-[#1A1A1A]/80">{r.rera || r.tier || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                              {r.source === "registered" ? "Registered" : "External"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={!!openBroker} onOpenChange={(o) => !o && setOpenBroker(null)}>
        <SheetContent className="bg-[#FDFBF7] sm:max-w-lg overflow-y-auto">
          {openBroker && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#1A1A1A]">{openBroker.full_name}</SheetTitle>
                <SheetDescription className="text-[#1A1A1A]/70">
                  {openBroker.source === "registered" ? "Registered broker profile" : "External broker (CRM only)"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm text-[#1A1A1A]">
                <div><span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">Email</span><div>{openBroker.email || "—"}</div></div>
                <div><span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">Phone</span><div>{openBroker.phone || "—"}</div></div>
                <div><span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">Current company</span><div>{openBroker.current_company || "—"}</div></div>
                {openBroker.rera && <div><span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">RERA</span><div>{openBroker.rera}</div></div>}
                {openBroker.tier && <div><span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">Tier</span><div>{openBroker.tier}</div></div>}

                <div className="pt-3 border-t border-[#B89555]/20">
                  <span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider">Companies worked for</span>
                  <BrokerCompanyTimeline brokerId={openBroker.id} brokerName={openBroker.full_name} history={history} currentCompany={openBroker.current_company} />
                </div>

                <div className="pt-3 border-t border-[#B89555]/20">
                  <span className="text-[#1A1A1A]/60 text-xs uppercase tracking-wider mb-2 block">Relational hub</span>
                  <RelationalHubTabs
                    kind="broker"
                    entityId={openBroker.id}
                    name={openBroker.full_name}
                    aliases={[openBroker.current_company]}
                    email={openBroker.email}
                    phone={openBroker.phone}
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
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AddBrokerSheet open={addOpen} onOpenChange={setAddOpen} onAdded={() => qc.invalidateQueries({ queryKey: ["brokers-external"] })} />
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
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", current_company: "", rera_license: "", notes: "" });

  const reset = () => setForm({ full_name: "", email: "", phone: "", current_company: "", rera_license: "", notes: "" });

  const submit = async () => {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await (supabase as any).from("crm_brokers").insert({
        owner_id: user.id,
        full_name: form.full_name.trim(),
        email_lower: form.email.trim().toLowerCase() || null,
        phone_e164: form.phone.trim() || null,
        current_company: form.current_company.trim() || null,
        rera_license: form.rera_license.trim() || null,
        notes: form.notes.trim() || null,
      });
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

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent className="bg-[#FDFBF7] sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A]">Add broker manually</SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">External broker — added to your CRM only.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {([
            ["full_name", "Full name *"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["current_company", "Current company"],
            ["rera_license", "RERA license"],
            ["notes", "Notes"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <Label className="text-xs text-[#1A1A1A]/70">{label}</Label>
              <Input
                value={(form as any)[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] mt-1"
              />
            </div>
          ))}
          <Button onClick={submit} disabled={saving} variant="gold" className="w-full">
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : "Add broker"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
