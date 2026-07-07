/**
 * CompareProjectPicker — searchable dialog for the /compare page.
 *
 * Users search by project name, developer, location, or emirate and choose the
 * exact projects to compare. This does not mutate shortlist; shortlist is only
 * shown as a starting suggestion.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Check, Building2, MapPin, Sparkles, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatPriceShort } from "@/lib/formatPrice";
import comparePropertyFallback from "@/assets/compare-property-fallback.jpg";

interface Row {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  price_from: number | null;
  emirate?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  developer: { name: string; slug: string | null; logo_url?: string | null } | null;
  images?: { image_url: string | null; display_order?: number | null }[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  maxSelect?: number;
  selectedIds?: string[];
  /** Called after user confirms; receives final selected ids. */
  onConfirm?: (ids: string[]) => void;
}

export default function CompareProjectPicker({
  open,
  onOpenChange,
  maxSelect = 10,
  selectedIds = [],
  onConfirm,
}: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set(selectedIds));
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [emirateFilter, setEmirateFilter] = useState("all");

  const { data: dbShortlist } = useShortlist();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuest } =
    useGuestShortlist();

  useEffect(() => {
    if (open) setPending(new Set(selectedIds));
  }, [open, selectedIds]);

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
        .select("id, name, slug, location, emirate, price_from, cover_image_url, image_url, developer:developers(name, slug, logo_url), images:project_images(image_url, display_order)")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1000);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const togglePick = (id: string) => {
    setPending((prev) => {
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
    if (ids.length < 2) {
      toast.error("Pick at least 2 projects to compare.");
      return;
    }
    toast.success(`Comparing ${ids.length} project${ids.length === 1 ? "" : "s"}`);
    setQuery("");
    onOpenChange(false);
    onConfirm?.(ids);
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesTerm = !term || [r.name, r.location, r.emirate, r.developer?.name].some((v) =>
        (v || "").toLowerCase().includes(term)
      );
      const matchesDeveloper = developerFilter === "all" || r.developer?.name === developerFilter;
      const matchesEmirate = emirateFilter === "all" || (r.emirate || "UAE") === emirateFilter;
      return matchesTerm && matchesDeveloper && matchesEmirate;
    });
  }, [rows, query, developerFilter, emirateFilter]);

  const developers = useMemo(() => Array.from(new Set(rows.map((r) => r.developer?.name).filter(Boolean) as string[])).sort(), [rows]);
  const emirates = useMemo(() => Array.from(new Set(rows.map((r) => r.emirate || "UAE").filter(Boolean))).sort(), [rows]);

  const totalPicked = pending.size;
  const shortlistRows = rows.filter((r) => alreadyShortlisted.has(r.id)).slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden border-[#064E3B]/45"
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
            Pick the projects you want to compare
          </DialogTitle>
          <DialogDescription className="text-sm text-[#1A1A1A]/70">
            Search by project, developer, area, or emirate. Choose any 2–{maxSelect} projects for the table.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2 grid gap-3 md:grid-cols-[1fr_180px_160px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1A1A1A]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, developer or area…"
              className="pl-9 h-11 bg-white/80 border-[#064E3B]/25 focus-visible:ring-[#064E3B]"
            />
          </div>
          <select value={developerFilter} onChange={(e) => setDeveloperFilter(e.target.value)} className="h-11 rounded-md bg-white/80 border border-[#064E3B]/25 px-3 text-sm text-[#1A1A1A] outline-none">
            <option value="all">All developers</option>
            {developers.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={emirateFilter} onChange={(e) => setEmirateFilter(e.target.value)} className="h-11 rounded-md bg-white/80 border border-[#064E3B]/25 px-3 text-sm text-[#1A1A1A] outline-none">
            <option value="all">All emirates</option>
            {emirates.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
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
            <div className="p-8 text-center text-sm text-[#1A1A1A]/60">
              No projects match "{query}".
            </div>
          ) : (
            <ul className="divide-y divide-[#064E3B]/15">
              {filtered.map((r) => {
                const picked = pending.has(r.id);
                const already = alreadyShortlisted.has(r.id);
                const coverSrc = r.cover_image_url || r.image_url || r.images?.find((img) => !!img?.image_url)?.image_url || comparePropertyFallback;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => togglePick(r.id)}
                      className={
                        "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition " +
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
                          {already && <span className="font-semibold text-[#064E3B]">Shortlisted</span>}
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
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#064E3B]/35 text-[#1A1A1A] hover:bg-[#EAF4EF]"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={confirm}
              disabled={totalPicked < 2}
              data-surface="emerald"
              data-no-contrast-guard
              className="allow-white inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.24)",
                boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>
                Compare {totalPicked} project{totalPicked === 1 ? "" : "s"}
              </span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
