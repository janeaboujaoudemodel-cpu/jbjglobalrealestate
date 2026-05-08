/**
 * UnifiedContactsPanel — single source-of-truth view of every CRM contact
 * (brokers, agents, developer reps, investors, partners) drawn from
 * `vw_crm_contacts`. Includes intersection filters (department, language,
 * nationality, country, city, source), saved segments, and one-click
 * scoped export via the `crm-export` edge function.
 *
 * Reuses existing canonical tables — no parallel CRM DB.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Download, Filter, Save, Bookmark, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContactRow = {
  id: string;
  kind: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  company_kind: string | null;
  company_name: string | null;
  source: string | null;
  labels: string[] | null;
  last_interaction_at: string | null;
  created_at: string | null;
  department: string | null;
  seniority: string | null;
  role_title: string | null;
  languages: string[] | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  is_global_broker: boolean | null;
};

type Segment = {
  id: string;
  name: string;
  filter: Record<string, unknown>;
};

const KIND_LABEL: Record<string, string> = {
  broker: "Individual Brokers",
  brokerage_agent: "Brokerage Agents",
  developer_rep: "Developer Representatives",
  investor: "Investors",
  partner: "Channel Partners",
  investor_lead: "Investor Leads",
  broker_lead: "Broker Leads",
  developer_lead: "Developer Leads",
  partner_lead: "Partner Leads",
  contact_lead: "Contacts",
};

const DEPARTMENTS = [
  "channel_relations","sales","marketing","admin","owner",
  "operations","hr","events","partnerships","management","other",
];
const DEPARTMENT_LABEL: Record<string,string> = {
  channel_relations: "Channel Relations",
  sales: "Sales",
  marketing: "Marketing",
  admin: "Admin",
  owner: "Owner",
  operations: "Operations",
  hr: "HR",
  events: "Events",
  partnerships: "Partnerships",
  management: "Management",
  other: "Other",
};

export function UnifiedContactsPanel() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeKind, setActiveKind] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [activeNationality, setActiveNationality] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [savingSegment, setSavingSegment] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("vw_crm_contacts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error(error.message);
          setRows([]);
        } else {
          setRows((data || []) as unknown as ContactRow[]);
        }
        setLoading(false);
      });
    supabase
      .from("crm_segments" as any)
      .select("id,name,filter")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (active) setSegments((data || []) as unknown as Segment[]);
      });
    return () => { active = false; };
  }, []);

  const distinct = (key: keyof ContactRow): string[] => {
    const set = new Set<string>();
    for (const r of rows) {
      const v = r[key];
      if (Array.isArray(v)) v.forEach((x) => x && set.add(String(x)));
      else if (v) set.add(String(v));
    }
    return Array.from(set).sort();
  };

  const sources = useMemo(() => distinct("source"), [rows]);
  const kinds = useMemo(() => distinct("kind"), [rows]);
  const languages = useMemo(() => distinct("languages"), [rows]);
  const nationalities = useMemo(() => distinct("nationality"), [rows]);
  const countries = useMemo(() => distinct("country"), [rows]);
  const cities = useMemo(() => distinct("city"), [rows]);
  const departments = useMemo(() => {
    const present = new Set(distinct("department"));
    return DEPARTMENTS.filter((d) => present.has(d));
  }, [rows]);

  const currentFilter: Record<string, unknown> = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (activeKind) f.kind = [activeKind];
    if (activeSource) f.source = [activeSource];
    if (activeDept) f.department = [activeDept];
    if (activeLanguage) f.languages = [activeLanguage];
    if (activeNationality) f.nationality = [activeNationality];
    if (activeCountry) f.country = [activeCountry];
    if (activeCity) f.city = [activeCity];
    if (search.trim()) f.q = search.trim();
    return f;
  }, [activeKind, activeSource, activeDept, activeLanguage, activeNationality, activeCountry, activeCity, search]);

  const hasFilter = Object.keys(currentFilter).length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (activeKind && r.kind !== activeKind) return false;
      if (activeSource && r.source !== activeSource) return false;
      if (activeDept && r.department !== activeDept) return false;
      if (activeLanguage && !(r.languages || []).includes(activeLanguage)) return false;
      if (activeNationality && r.nationality !== activeNationality) return false;
      if (activeCountry && r.country !== activeCountry) return false;
      if (activeCity && r.city !== activeCity) return false;
      if (!q) return true;
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.company_name || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, activeKind, activeSource, activeDept, activeLanguage, activeNationality, activeCountry, activeCity]);

  const clearAll = () => {
    setActiveKind(null); setActiveSource(null); setActiveDept(null);
    setActiveLanguage(null); setActiveNationality(null);
    setActiveCountry(null); setActiveCity(null); setSearch("");
  };

  const applySegment = (seg: Segment) => {
    const f = seg.filter || {};
    const get = (k: string): string | null => {
      const v = (f as any)[k];
      if (Array.isArray(v) && v.length) return String(v[0]);
      if (typeof v === "string") return v;
      return null;
    };
    setActiveKind(get("kind"));
    setActiveSource(get("source"));
    setActiveDept(get("department"));
    setActiveLanguage(get("languages"));
    setActiveNationality(get("nationality"));
    setActiveCountry(get("country"));
    setActiveCity(get("city"));
    setSearch(typeof (f as any).q === "string" ? (f as any).q : "");
    toast.success(`Loaded segment "${seg.name}"`);
  };

  const saveSegment = async () => {
    if (!hasFilter) {
      toast.error("Apply at least one filter to save a segment.");
      return;
    }
    const name = prompt("Name this segment:");
    if (!name) return;
    setSavingSegment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("crm_segments" as any)
        .insert({ name, filter: currentFilter as any, created_by: user?.id })
        .select("id,name,filter")
        .single();
      if (error) throw error;
      setSegments((s) => [data as unknown as Segment, ...s]);
      toast.success(`Segment "${name}" saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save segment");
    } finally {
      setSavingSegment(false);
    }
  };

  const exportFiltered = async () => {
    setExporting(true);
    try {
      const body: Record<string, unknown> = {
        format: "csv",
        scope: hasFilter ? "filter" : "all",
        filter: currentFilter,
      };
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-export`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Exported ${filtered.length} contacts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const SectionSelect = ({ value, onChange, options, placeholder }: {
    value: string | null;
    onChange: (v: string | null) => void;
    options: string[];
    placeholder: string;
  }) => (
    <Select value={value ?? "__all"} onValueChange={(v) => onChange(v === "__all" ? null : v)}>
      <SelectTrigger className="h-8 w-[160px] bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] max-h-72">
        <SelectItem value="__all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">Unified Contacts Network</h3>
          <p className="text-xs text-[#1A1A1A]/70">
            Every contact across brokers, agencies, developers, channel partners, investors and clients — one relational view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveSegment} disabled={savingSegment || !hasFilter}>
            {savingSegment ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save segment
          </Button>
          <Button variant="gold" size="sm" onClick={exportFiltered} disabled={exporting || filtered.length === 0}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            Export {filtered.length > 0 ? `(${filtered.length})` : ""}
          </Button>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Bookmark className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
          <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Saved</span>
          {segments.map((s) => (
            <Badge
              key={s.id}
              variant="outline"
              onClick={() => applySegment(s)}
              className="cursor-pointer border-[#B89555]/40"
            >
              {s.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="pl-8 bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]"
          />
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-[#1A1A1A]/70">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {kinds.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
          <Badge
            variant={activeKind === null ? "default" : "outline"}
            onClick={() => setActiveKind(null)}
            className="cursor-pointer"
          >
            All sections
          </Badge>
          {kinds.map((k) => (
            <Badge
              key={k}
              variant={activeKind === k ? "default" : "outline"}
              onClick={() => setActiveKind(activeKind === k ? null : k)}
              className="cursor-pointer"
            >
              {KIND_LABEL[k] ?? k}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <SectionSelect value={activeDept} onChange={setActiveDept}
          options={departments.map((d) => DEPARTMENT_LABEL[d] ?? d)}
          placeholder="Department" />
        {/* department options come back as labels — translate back when applied */}
        <SectionSelect value={activeLanguage} onChange={setActiveLanguage}
          options={languages} placeholder="Language" />
        <SectionSelect value={activeNationality} onChange={setActiveNationality}
          options={nationalities} placeholder="Nationality" />
        <SectionSelect value={activeCountry} onChange={setActiveCountry}
          options={countries} placeholder="Country" />
        <SectionSelect value={activeCity} onChange={setActiveCity}
          options={cities} placeholder="City" />
        <SectionSelect value={activeSource} onChange={setActiveSource}
          options={sources} placeholder="Source" />
      </div>

      <div className="border border-[#B89555]/20 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#B89555]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#1A1A1A]/60">
            No contacts match the current filters.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#EFE6D6] text-[#1A1A1A]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Section</th>
                  <th className="px-3 py-2 font-semibold">Company</th>
                  <th className="px-3 py-2 font-semibold">Department</th>
                  <th className="px-3 py-2 font-semibold">Country</th>
                  <th className="px-3 py-2 font-semibold">Languages</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-t border-[#B89555]/10 hover:bg-[#F7F2EA]">
                    <td className="px-3 py-2 text-[#1A1A1A]">
                      <div>{r.name || "—"}</div>
                      {r.role_title && <div className="text-[10px] text-[#1A1A1A]/60">{r.role_title}</div>}
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{KIND_LABEL[r.kind] ?? r.kind}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{r.company_name || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">
                      {r.department ? (DEPARTMENT_LABEL[r.department] ?? r.department) : "—"}
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">
                      {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">
                      {(r.languages || []).slice(0, 3).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-[#1A1A1A]/70 text-xs">{r.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div className="px-3 py-2 text-xs text-[#1A1A1A]/60 border-t border-[#B89555]/20 bg-[#F7F2EA]">
                Showing first 500 of {filtered.length}. Refine filters or export to see all.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
