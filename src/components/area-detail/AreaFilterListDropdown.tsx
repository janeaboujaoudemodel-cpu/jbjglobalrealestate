/**
 * AreaFilterListDropdown — real list-based scope dropdown.
 * Shows all Areas / Emirates / Communities / Developers (with logos) / Projects.
 * Selecting an item either navigates (areas/developers/projects) or sets the
 * search query + scope so the projects grid filters immediately.
 */
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, MapPin, Building2, Users, Layers, Home } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { filterPillBase, pillInactive, filterPillActive } from "@/components/filters/filterStyles";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";

export type Scope = "area" | "emirate" | "community" | "developer" | "project";

interface Props {
  scope: Scope;
  label: string;
  active: boolean;
  onScope: (s: Scope) => void;
  onQuery: (q: string) => void;
}

const ICONS = {
  area: MapPin,
  emirate: Layers,
  community: Home,
  developer: Building2,
  project: Users,
} as const;

function useScopeItems(scope: Scope, open: boolean) {
  return useQuery({
    queryKey: ["area-filter-scope", scope],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (scope === "area") {
        const { data } = await supabase
          .from("areas")
          .select("id,name,slug,emirate,image_url,hero_image_url")
          .order("name")
          .limit(500);
        return (data || []).map((a) => ({
          key: a.id,
          label: a.name,
          sub: a.emirate,
          img: a.image_url || a.hero_image_url || null,
          href: a.slug ? `/area/${a.slug}` : null,
          value: a.name,
        }));
      }
      if (scope === "emirate") {
        const { data } = await supabase.from("areas").select("emirate").not("emirate", "is", null);
        const set = new Set<string>();
        (data || []).forEach((r) => r.emirate && set.add(r.emirate));
        return Array.from(set).sort().map((e) => ({ key: e, label: e, sub: null, img: null, href: null, value: e }));
      }
      if (scope === "community") {
        const { data } = await supabase
          .from("projects")
          .select("community, area_name")
          .not("community", "is", null)
          .limit(2000);
        const map = new Map<string, string | null>();
        (data || []).forEach((r: any) => { if (r.community) map.set(r.community, r.area_name || null); });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([c, a]) => ({
          key: c, label: c, sub: a, img: null, href: null, value: c,
        }));
      }
      if (scope === "developer") {
        const { data } = await supabase
          .from("developers")
          .select("id,name,slug,logo_url,website_url")
          .order("name")
          .limit(1000);
        return (data || []).map((d: any) => ({
          key: d.id,
          label: d.name,
          sub: null,
          img: getDeveloperLogoUrl(d) || null,
          href: d.slug ? `/developer/${d.slug}` : null,
          value: d.name,
          isDev: true,
        }));
      }
      // project
      const { data } = await supabase
        .from("projects")
        .select("id,name,slug,developer_name,cover_image_url,area_name")
        .order("name")
        .limit(1500);
      return (data || []).map((p: any) => ({
        key: p.id,
        label: p.name,
        sub: p.developer_name || p.area_name,
        img: p.cover_image_url || null,
        href: p.slug ? `/project/${p.slug}` : null,
        value: p.name,
      }));
    },
  });
}

export const AreaFilterListDropdown = ({ scope, label, active, onScope, onQuery }: Props) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data: items = [], isLoading } = useScopeItems(scope, open);
  const navigate = useNavigate();

  useEffect(() => { if (!open) setQ(""); }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 200);
    return items.filter((i: any) =>
      i.label.toLowerCase().includes(term) || (i.sub || "").toLowerCase().includes(term)
    ).slice(0, 200);
  }, [items, q]);

  const Icon = ICONS[scope];

  const pick = (item: any) => {
    onScope(scope);
    onQuery(item.value);
    setOpen(false);
    if (item.href) navigate(item.href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-active={active ? "true" : "false"}
          data-no-contrast-guard
          className={`${filterPillBase} ${active ? filterPillActive : pillInactive("dark")}`}
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <span>{label}</span>
          <ChevronDown className="w-3 h-3" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        data-no-contrast-guard
        className="w-[360px] p-0 border border-white/20 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 60%, #010806 100%)", color: "#FFFFFF" }}
      >
        <div className="p-3 border-b border-white/15">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4" style={{ color: "#E8CF8A" }} />
            <span className="text-xs uppercase tracking-[0.14em] font-bold" style={{ color: "#E8CF8A" }}>
              Search by {label}
            </span>
          </div>
          <div className="relative h-9 rounded-lg" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              data-no-contrast-guard
              className="w-full h-full bg-transparent border-0 pl-9 pr-3 text-sm font-medium focus:outline-none placeholder:text-white/50"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", caretColor: "#FFFFFF" }}
            />
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto py-1">
          {isLoading && (
            <div className="px-4 py-6 text-sm text-white/70">Loading…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-white/70">No matches</div>
          )}
          {filtered.map((item: any) => (
            <button
              key={item.key}
              type="button"
              onClick={() => pick(item)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors"
            >
              {item.isDev ? (
                <DeveloperLogo src={item.img} alt={item.label} name={item.label} className="w-8 h-8 flex-none" renderFallback />
              ) : item.img ? (
                <img src={item.img} alt="" loading="lazy" className="w-8 h-8 rounded object-cover flex-none" />
              ) : (
                <div className="w-8 h-8 rounded flex items-center justify-center flex-none" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#E8CF8A" }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{item.label}</div>
                {item.sub && (
                  <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.65)", WebkitTextFillColor: "rgba(255,255,255,0.65)" }}>{item.sub}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AreaFilterListDropdown;
