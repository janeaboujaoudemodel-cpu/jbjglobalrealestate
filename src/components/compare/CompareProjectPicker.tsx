/**
 * CompareProjectPicker — searchable dialog for the /compare page.
 *
 * Users search by project name, developer, location, country, or emirate and
 * choose the exact projects to compare. This does not mutate shortlist;
 * shortlist is only shown as a starting suggestion.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Check, Building2, MapPin, Sparkles, ImageIcon, ChevronDown, Globe2, Send, Plus, Replace } from "lucide-react";
import { toast } from "sonner";
import { formatPriceShort } from "@/lib/formatPrice";
import comparePropertyFallback from "@/assets/compare-property-fallback.jpg";

type PickerMode = "multi" | "replace";

interface DeveloperRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url?: string | null;
}

interface Row {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  price_from: number | null;
  emirate?: string | null;
  cover_image_url?: string | null;
  card_image_url?: string | null;
  gallery_start_image_url?: string | null;
  developer: { id?: string | null; name: string; slug: string | null; logo_url?: string | null } | null;
  images?: { image_url: string | null; display_order?: number | null }[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  maxSelect?: number;
  selectedIds?: string[];
  disabledIds?: string[];
  mode?: PickerMode;
  replaceProjectName?: string;
  /** Called after user confirms; receives final selected ids. */
  onConfirm?: (ids: string[]) => void;
}

const UAE_EMIRATES = ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"];
const BASE_COUNTRIES = ["United Arab Emirates", "Cyprus"];

const deriveCountry = (row: Pick<Row, "location" | "emirate">) => {
  const text = `${row.location || ""} ${row.emirate || ""}`.toLowerCase();
  if (text.includes("cyprus") || text.includes("limassol") || text.includes("paphos") || text.includes("larnaca") || text.includes("nicosia")) return "Cyprus";
  if (text.includes("oman") || text.includes("muscat")) return "Oman";
  if (text.includes("qatar") || text.includes("doha")) return "Qatar";
  if (text.includes("saudi") || text.includes("riyadh") || text.includes("jeddah")) return "Saudi Arabia";
  return "United Arab Emirates";
};

const deriveRegion = (row: Pick<Row, "location" | "emirate">) => {
  const emirate = (row.emirate || "").trim();
  if (emirate) return emirate;
  const location = (row.location || "").split(",")[0]?.trim();
  return location || "Unspecified";
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "D";

export default function CompareProjectPicker({
  open,
  onOpenChange,
  maxSelect = 10,
  selectedIds = [],
  disabledIds = [],
  mode = "multi",
  replaceProjectName,
  onConfirm,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner } = useIsAppOwner();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set(selectedIds));
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [developerSearch, setDeveloperSearch] = useState("");
  const [emirateFilter, setEmirateFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ projectName: "", developerName: "", country: "", emirate: "", email: "", notes: "" });
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const { data: dbShortlist } = useShortlist();
  const { shortlist: guestShortlist } = useGuestShortlist();

  useEffect(() => {
    if (open) {
      setPending(mode === "replace" ? new Set() : new Set(selectedIds));
      setRequestOpen(false);
    }
  }, [open, selectedIds, mode]);

  const alreadyShortlisted = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    dbShortlist?.forEach((r) => s.add(r.project_id));
    guestShortlist.forEach((g) => s.add(g.project_id));
    return s;
  }, [dbShortlist, guestShortlist]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["compare-picker-search", query],
    enabled: open,
    staleTime: 60_000,
    queryFn: async (): Promise<Row[]> => {
      const q = supabase
        .from("projects")
        .select("id, name, slug, location, emirate, price_from, cover_image_url, card_image_url, gallery_start_image_url, developer:developers(id, name, slug, logo_url), images:project_images(image_url, display_order)")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1000);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const { data: developerRows = [] } = useQuery({
    queryKey: ["compare-picker-developers"],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DeveloperRow[]> => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug, logo_url")
        .order("name", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds]);

  const togglePick = (id: string) => {
    if (disabledSet.has(id)) return;
    setPending((prev) => {
      if (mode === "replace") return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxSelect) {
          toast.info(`You can compare up to ${maxSelect} projects — deselect one first.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const confirm = async () => {
    const ids = Array.from(pending);
    if (mode === "replace" && ids.length < 1) {
      toast.error("Pick one replacement project.");
      return;
    }
    if (mode === "multi" && ids.length < 2) {
      toast.error("Pick at least 2 projects to compare.");
      return;
    }
    toast.success(mode === "replace" ? "Project replaced." : `Comparing ${ids.length} project${ids.length === 1 ? "" : "s"}`);
    setQuery("");
    onOpenChange(false);
    onConfirm?.(ids);
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesTerm = !term || [r.name, r.location, r.emirate, r.developer?.name].some((v) =>
        (v || "").toLowerCase().includes(term)
      ) || deriveCountry(r).toLowerCase().includes(term);
      const matchesDeveloper = developerFilter === "all" || r.developer?.id === developerFilter || r.developer?.name === developerFilter;
      const matchesEmirate = emirateFilter === "all" || deriveRegion(r) === emirateFilter;
      const matchesCountry = countryFilter === "all" || deriveCountry(r) === countryFilter;
      return matchesTerm && matchesDeveloper && matchesEmirate && matchesCountry;
    });
  }, [rows, query, developerFilter, emirateFilter, countryFilter]);

  const developerOptions = useMemo<DeveloperRow[]>(() => {
    const byKey = new Map<string, DeveloperRow>();
    developerRows.forEach((d) => byKey.set(d.id || d.name, d));
    rows.forEach((r) => {
      if (!r.developer?.name) return;
      const key = r.developer.id || r.developer.name;
      if (!byKey.has(key)) byKey.set(key, { id: key, name: r.developer.name, slug: r.developer.slug, logo_url: r.developer.logo_url });
    });
    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [developerRows, rows]);
  const visibleDeveloperOptions = useMemo(() => {
    const term = developerSearch.trim().toLowerCase();
    if (!term) return developerOptions;
    return developerOptions.filter((d) => d.name.toLowerCase().includes(term));
  }, [developerOptions, developerSearch]);
  const selectedDeveloper = developerOptions.find((d) => d.id === developerFilter || d.name === developerFilter);
  const countries = useMemo(() => Array.from(new Set([...BASE_COUNTRIES, ...rows.map(deriveCountry)])).filter(Boolean).sort(), [rows]);
  const emirates = useMemo(() => Array.from(new Set([...UAE_EMIRATES, ...rows.map(deriveRegion)])).filter(Boolean).sort(), [rows]);

  const totalPicked = pending.size;
  const shortlistRows = rows.filter((r) => alreadyShortlisted.has(r.id)).slice(0, 4);
  const activeDeveloperName = selectedDeveloper?.name || "";
  const effectiveRequestProjectName = requestForm.projectName || query.trim();
  const effectiveRequestDeveloperName = requestForm.developerName || activeDeveloperName;

  const openOwnerAddProject = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("name", query.trim());
    if (activeDeveloperName) params.set("developer", activeDeveloperName);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (emirateFilter !== "all") params.set("emirate", emirateFilter);
    navigate(`/owner/developers/new-project${params.toString() ? `?${params}` : ""}`);
    onOpenChange(false);
  };

  const submitProjectRequest = async () => {
    const projectName = effectiveRequestProjectName.trim();
    const developerName = effectiveRequestDeveloperName.trim();
    const email = (requestForm.email || user?.email || "").trim();
    if (!projectName) {
      toast.error("Enter the project name to request.");
      return;
    }
    if (!developerName) {
      toast.error("Enter the developer name to request.");
      return;
    }
    if (!email) {
      toast.error("Enter your email so the team can follow up.");
      return;
    }
    setRequestSubmitting(true);
    try {
      const payload = {
        type: "project_catalog_request",
        project_name: projectName,
        developer_name: developerName,
        country: requestForm.country || (countryFilter !== "all" ? countryFilter : ""),
        emirate_or_region: requestForm.emirate || (emirateFilter !== "all" ? emirateFilter : ""),
        search_query: query.trim(),
        notes: requestForm.notes.trim(),
        requested_from: "property_comparison_picker",
      };
      const { error } = await supabase.from("evaluation_requests").insert({
        user_id: user?.id ?? null,
        user_email: email,
        user_name: null,
        user_phone: null,
        project_ids: [],
        ai_comparison: JSON.stringify(payload),
        status: "project_requested",
      } as any);
      if (error) throw error;
      toast.success("Project request sent to the team.");
      setRequestOpen(false);
      setRequestForm({ projectName: "", developerName: "", country: "", emirate: "", email: "", notes: "" });
    } catch (error) {
      console.error(error);
      toast.error("Could not submit the request. Please try again.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const filterButtonStyle = {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(6,78,59,0.35)",
    color: "#1A1A1A",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-compare-picker
        className="sm:!max-w-5xl p-0 overflow-hidden border-[#064E3B]/45"
        style={{
          background:
            "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 62%, #EEF7F3 100%)",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.35), 0 0 0 1px rgba(6,78,59,0.25)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-[#064E3B]/20">
          <div className="flex items-center gap-2 mb-1">
            <span
              data-surface="emerald"
              data-no-contrast-guard
              className="allow-white inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                background:
                  "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.24)",
              }}
            >
              <Sparkles className="w-3 h-3" style={{ color: "#FFFFFF" }} />
              Project Comparison
            </span>
          </div>
          <DialogTitle className="text-2xl md:text-3xl text-[#1A1A1A] font-brochure">
            {mode === "replace" ? "Replace project in the comparison" : "Pick the projects you want to compare"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#1A1A1A]/70">
            {mode === "replace"
              ? `Choose one project to replace${replaceProjectName ? ` ${replaceProjectName}` : " the selected column"}.`
              : `Search by project, developer, area, country, or emirate. Choose any 2–${maxSelect} projects for the table.`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.15fr_210px_180px_190px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1A1A1A]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, developer or area…"
              className="pl-9 h-12 rounded-lg bg-white/80 border-[#064E3B]/35 focus-visible:ring-[#064E3B]"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="h-12 w-full rounded-lg px-3 text-sm font-semibold inline-flex items-center justify-between gap-2" style={filterButtonStyle}>
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-[#064E3B] shrink-0" />
                  <span className="truncate">{selectedDeveloper?.name || "All developers"}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#064E3B] shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] p-2 border-[#064E3B]/35">
              <Input value={developerSearch} onChange={(e) => setDeveloperSearch(e.target.value)} placeholder="Search developers…" className="h-10 mb-2 border-[#064E3B]/30" />
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                <button type="button" onClick={() => setDeveloperFilter("all")} className="w-full min-h-11 rounded-lg px-2 text-left text-sm font-semibold hover:bg-[#EAF4EF]" style={{ color: "#1A1A1A" }}>All developers</button>
                {visibleDeveloperOptions.map((developer) => (
                  <button key={developer.id || developer.name} type="button" onClick={() => setDeveloperFilter(developer.id || developer.name)} className="w-full min-h-12 rounded-lg px-2 text-left text-sm hover:bg-[#EAF4EF] flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                    <Avatar className="h-8 w-8 border border-[#064E3B]/20 bg-white">
                      {developer.logo_url && <AvatarImage src={developer.logo_url} alt={`${developer.name} logo`} />}
                      <AvatarFallback className="text-[10px] font-bold bg-[#EAF4EF] text-[#064E3B]">{initials(developer.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate font-semibold">{developer.name}</span>
                    {(developerFilter === developer.id || developerFilter === developer.name) && <Check className="w-4 h-4 text-[#064E3B]" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="h-12 w-full rounded-lg px-3 text-sm font-semibold inline-flex items-center justify-between gap-2" style={filterButtonStyle}>
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Globe2 className="w-4 h-4 text-[#064E3B] shrink-0" />
                  <span className="truncate">{countryFilter === "all" ? "All countries" : countryFilter}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#064E3B] shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[260px] p-2 border-[#064E3B]/35">
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                <button type="button" onClick={() => setCountryFilter("all")} className="w-full min-h-11 rounded-lg px-3 text-left text-sm font-semibold hover:bg-[#EAF4EF]" style={{ color: "#1A1A1A" }}>All countries</button>
                {countries.map((country) => (
                  <button key={country} type="button" onClick={() => setCountryFilter(country)} className="w-full min-h-11 rounded-lg px-3 text-left text-sm hover:bg-[#EAF4EF] flex items-center justify-between gap-2" style={{ color: "#1A1A1A" }}>
                    <span className="font-semibold">{country}</span>
                    {countryFilter === country && <Check className="w-4 h-4 text-[#064E3B]" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="h-12 w-full rounded-lg px-3 text-sm font-semibold inline-flex items-center justify-between gap-2" style={filterButtonStyle}>
                <span className="inline-flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#064E3B] shrink-0" />
                  <span className="truncate">{emirateFilter === "all" ? "All emirates" : emirateFilter}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#064E3B] shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[280px] p-2 border-[#064E3B]/35">
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                <button type="button" onClick={() => setEmirateFilter("all")} className="w-full min-h-11 rounded-lg px-3 text-left text-sm font-semibold hover:bg-[#EAF4EF]" style={{ color: "#1A1A1A" }}>All emirates / regions</button>
                {emirates.map((emirate) => (
                  <button key={emirate} type="button" onClick={() => setEmirateFilter(emirate)} className="w-full min-h-11 rounded-lg px-3 text-left text-sm hover:bg-[#EAF4EF] flex items-center justify-between gap-2" style={{ color: "#1A1A1A" }}>
                    <span className="font-semibold">{emirate}</span>
                    {emirateFilter === emirate && <Check className="w-4 h-4 text-[#064E3B]" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {shortlistRows.length > 0 && (
          <div className="px-6 pb-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-semibold mb-1.5">
              Based on your shortlist — showing first 4 suggestions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shortlistRows
                .map((r) => (
                  <Badge
                    key={r.id}
                    className="bg-[#EAF4EF] text-[#1A1A1A] border border-[#064E3B]/25 hover:bg-[#DDEEE7] gap-1 pl-2 pr-1 py-1"
                  >
                    {r.name}
                    <button
                      type="button"
                      onClick={() => togglePick(r.id)}
                      className="w-4 h-4 rounded-full hover:bg-black/10 inline-flex items-center justify-center"
                      aria-label={pending.has(r.id) ? "Remove from comparison" : "Add to comparison"}
                    >
                      {pending.has(r.id) ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </button>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-2 max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#1A1A1A]/60">
              Loading projects…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5 md:p-8 text-center text-sm text-[#1A1A1A]/70">
              {!requestOpen ? (
                <div className="mx-auto max-w-xl space-y-4">
                  <p>No projects match "{query || activeDeveloperName || countryFilter || emirateFilter}".</p>
                  {isOwner ? (
                    <button type="button" onClick={openOwnerAddProject} className="allow-white mx-auto inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold" data-no-contrast-guard style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.24)", boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)" }}>
                      <Plus className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>Add project as owner</span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => {
                      setRequestOpen(true);
                      setRequestForm((prev) => ({ ...prev, projectName: prev.projectName || query.trim(), developerName: prev.developerName || activeDeveloperName, country: prev.country || (countryFilter !== "all" ? countryFilter : ""), emirate: prev.emirate || (emirateFilter !== "all" ? emirateFilter : ""), email: prev.email || user?.email || "" }));
                    }} className="allow-white mx-auto inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold" data-no-contrast-guard style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.24)", boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)" }}>
                      <Send className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>Request this project</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-2xl text-left rounded-xl p-4" style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(6,78,59,0.22)" }}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={requestForm.projectName} onChange={(e) => setRequestForm((prev) => ({ ...prev, projectName: e.target.value }))} placeholder="Project name" className="h-11 border-[#064E3B]/30" />
                    <Input value={requestForm.developerName} onChange={(e) => setRequestForm((prev) => ({ ...prev, developerName: e.target.value }))} placeholder="Developer name" className="h-11 border-[#064E3B]/30" />
                    <Input value={requestForm.country} onChange={(e) => setRequestForm((prev) => ({ ...prev, country: e.target.value }))} placeholder="Country" className="h-11 border-[#064E3B]/30" />
                    <Input value={requestForm.emirate} onChange={(e) => setRequestForm((prev) => ({ ...prev, emirate: e.target.value }))} placeholder="Emirate / region" className="h-11 border-[#064E3B]/30" />
                    {!user?.email && <Input value={requestForm.email} onChange={(e) => setRequestForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Your email" className="h-11 border-[#064E3B]/30 md:col-span-2" />}
                    <Textarea value={requestForm.notes} onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes for the team" className="md:col-span-2 border-[#064E3B]/30" />
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => setRequestOpen(false)} className="h-11 min-w-[150px] rounded-lg px-4 text-sm font-bold" style={{ background: "rgba(255,255,255,0.72)", color: "#1A1A1A", border: "1px solid rgba(6,78,59,0.35)" }}>Cancel</button>
                    <button type="button" onClick={submitProjectRequest} disabled={requestSubmitting} className="allow-white h-11 min-w-[150px] rounded-lg px-4 text-sm font-bold disabled:opacity-60" data-no-contrast-guard style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.24)" }}>{requestSubmitting ? "Sending…" : "Submit request"}</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-[#064E3B]/15">
              {filtered.map((r) => {
                const picked = pending.has(r.id);
                const already = alreadyShortlisted.has(r.id);
                const coverSrc = r.cover_image_url || r.card_image_url || r.gallery_start_image_url || r.images?.find((img) => !!img?.image_url)?.image_url || comparePropertyFallback;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => togglePick(r.id)}
                      disabled={disabledSet.has(r.id)}
                      className={
                        "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition disabled:cursor-not-allowed disabled:opacity-55 " +
                        (picked ? "bg-[#EAF4EF]" : "hover:bg-white/70")
                      }
                    >
                      <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-[#EAF4EF] border border-[#064E3B]/15 shrink-0">
                        {coverSrc ? (
                          <img src={coverSrc} alt={r.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <ImageIcon className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#064E3B]" />
                        )}
                        {r.developer?.logo_url && (
                          <span className="absolute left-1 bottom-1 h-7 w-7 rounded bg-white/92 p-0.5 shadow-sm">
                            <img src={r.developer.logo_url} alt={`${r.developer.name} logo`} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                          </span>
                        )}
                      </div>
                      <div
                        className={
                          "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 " +
                          (picked
                            ? "bg-[#064E3B] border-[#064E3B]"
                            : "bg-white border-[#064E3B]/35")
                        }
                      >
                        {picked && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                          {r.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#1A1A1A]/65">
                          {r.developer?.name && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {r.developer.name}
                            </span>
                          )}
                          {r.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.location}
                            </span>
                          )}
                          {r.price_from ? (
                            <span className="font-semibold text-[#064E3B]">
                              from {formatPriceShort(r.price_from)}
                            </span>
                          ) : null}
                          <span>{deriveCountry(r)}</span>
                          {already && <span className="font-semibold text-[#064E3B]">Shortlisted</span>}
                          {disabledSet.has(r.id) && <span className="font-semibold text-[#064E3B]">Already in table</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#064E3B]/20 bg-[#F7F2EA]/60 flex items-center justify-between gap-3">
          <div className="text-xs text-[#1A1A1A]/70">
            <span className="font-bold text-[#1A1A1A]">{totalPicked}</span> of{" "}
            <span className="font-bold text-[#1A1A1A]">{maxSelect}</span> selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-surface="emerald"
              data-no-contrast-guard
              className="allow-white inline-flex h-12 min-w-[172px] items-center justify-center rounded-lg px-4 text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.24)", boxShadow: "0 10px 24px -12px rgba(6,78,59,0.62)" }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Cancel</span>
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={mode === "replace" ? totalPicked < 1 : totalPicked < 2}
              data-surface="emerald"
              data-no-contrast-guard
              className="allow-white inline-flex h-12 min-w-[172px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.24)",
                boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)",
              }}
            >
              {mode === "replace" ? <Replace className="w-4 h-4" style={{ color: "#FFFFFF" }} /> : <Sparkles className="w-4 h-4" style={{ color: "#FFFFFF" }} />}
              <span style={{ color: "#FFFFFF" }}>
                {mode === "replace" ? "Replace Project" : `Compare ${totalPicked} project${totalPicked === 1 ? "" : "s"}`}
              </span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
