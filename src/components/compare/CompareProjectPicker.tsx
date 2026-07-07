/**
 * CompareProjectPicker — searchable dialog for the /compare page.
 *
 * Users search by project name, developer, or location, pick up to N projects,
 * and everything selected is pushed into their shortlist so the comparison
 * table renders it immediately. Premium champagne + pearl + gold styling
 * (LOCKED brand: minimal emerald accents only for CTA).
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useShortlist, useToggleShortlist } from "@/hooks/useFavorites";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Check, Building2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  price_from: number | null;
  developer: { name: string; slug: string | null } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  maxSelect?: number;
  /** Called after user confirms; receives final selected ids. */
  onConfirm?: (ids: string[]) => void;
}

const isUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default function CompareProjectPicker({
  open,
  onOpenChange,
  maxSelect = 5,
  onConfirm,
}: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState<number>(3);

  const { data: dbShortlist } = useShortlist();
  const toggleDb = useToggleShortlist();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuest } =
    useGuestShortlist();

  const alreadyShortlisted = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (user && dbShortlist) dbShortlist.forEach((r) => s.add(r.project_id));
    guestShortlist.forEach((g) => s.add(g.project_id));
    return s;
  }, [user, dbShortlist, guestShortlist]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["compare-picker-search", query],
    enabled: open,
    staleTime: 60_000,
    queryFn: async (): Promise<Row[]> => {
      const q = supabase
        .from("projects")
        .select("id, name, slug, location, price_from, developer:developers(name, slug)")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(60);
      const term = query.trim();
      if (term) {
        // name / location / developer.name — combine with `.or`
        q.or(`name.ilike.%${term}%,location.ilike.%${term}%`);
      }
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
        if (alreadyShortlisted.size + next.size >= limit) {
          toast.info(`You can compare up to ${limit} projects — deselect one first.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const confirm = async () => {
    const ids = Array.from(pending);
    if (ids.length === 0 && alreadyShortlisted.size < 2) {
      toast.error("Pick at least 2 projects to compare.");
      return;
    }
    // Persist selections into shortlist so /compare picks them up
    for (const id of ids) {
      if (user && isUUID(id)) {
        try {
          await toggleDb.mutateAsync({ projectId: id, isShortlisted: false });
        } catch (_e) {}
      } else {
        toggleGuest(id);
      }
    }
    toast.success(
      `Comparing ${alreadyShortlisted.size + ids.length} ${
        alreadyShortlisted.size + ids.length === 1 ? "project" : "projects"
      }`
    );
    setPending(new Set());
    setQuery("");
    onOpenChange(false);
    onConfirm?.([...Array.from(alreadyShortlisted), ...ids]);
  };

  const removeShortlisted = async (id: string) => {
    if (user && isUUID(id)) {
      try {
        await removeDb.mutateAsync(id);
      } catch (_e) {}
    } else {
      toggleGuest(id); // guest toggle removes if present
    }
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.name, r.location, r.developer?.name].some((v) =>
        (v || "").toLowerCase().includes(term)
      )
    );
  }, [rows, query]);

  const totalPicked = alreadyShortlisted.size + pending.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden border-[#B89555]/60"
        style={{
          background:
            "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%)",
          boxShadow:
            "0 30px 80px -30px rgba(0,0,0,0.35), 0 0 0 1px rgba(184,149,85,0.35)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-[#B89555]/40">
          <div className="flex items-center gap-2 mb-1">
            <span
              data-surface="emerald"
              data-no-contrast-guard
              className="allow-white inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                background:
                  "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
                color: "#F5E7C4",
                border: "1px solid rgba(245,231,196,0.4)",
              }}
            >
              <Sparkles className="w-3 h-3" style={{ color: "#F5E7C4" }} />
              Project Comparison
            </span>
          </div>
          <DialogTitle className="text-2xl md:text-3xl text-[#1A1A1A] font-brochure">
            Pick the projects you want to compare
          </DialogTitle>
          <DialogDescription className="text-sm text-[#1A1A1A]/70">
            Search by name, developer or area. Choose 2–{maxSelect} and we'll
            build a side-by-side premium comparison you can download or share.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1A1A1A]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, developer or area…"
              className="pl-9 h-11 bg-white/70 border-[#B89555]/50 focus-visible:ring-[#B89555]"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#1A1A1A]/70">
            <span className="uppercase tracking-[0.14em] font-semibold mr-1">
              Compare
            </span>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLimit(n)}
                className={
                  "w-8 h-8 rounded-md text-sm font-bold border transition " +
                  (limit === n
                    ? "bg-[#064E3B] text-white border-[#064E3B]"
                    : "bg-white/70 text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6]")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {alreadyShortlisted.size > 0 && (
          <div className="px-6 pb-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-semibold mb-1.5">
              Already in your shortlist
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rows
                .filter((r) => alreadyShortlisted.has(r.id))
                .map((r) => (
                  <Badge
                    key={r.id}
                    className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50 hover:bg-[#E5D8B8] gap-1 pl-2 pr-1 py-1"
                  >
                    {r.name}
                    <button
                      type="button"
                      onClick={() => removeShortlisted(r.id)}
                      className="w-4 h-4 rounded-full hover:bg-black/10 inline-flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
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
            <ul className="divide-y divide-[#B89555]/25">
              {filtered.map((r) => {
                const picked = pending.has(r.id);
                const already = alreadyShortlisted.has(r.id);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => !already && togglePick(r.id)}
                      disabled={already}
                      className={
                        "w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition " +
                        (already
                          ? "opacity-60 cursor-not-allowed"
                          : picked
                            ? "bg-[#EFE6D6]"
                            : "hover:bg-white/60")
                      }
                    >
                      <div
                        className={
                          "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 " +
                          (picked || already
                            ? "bg-[#064E3B] border-[#064E3B]"
                            : "bg-white border-[#B89555]/50")
                        }
                      >
                        {(picked || already) && (
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
                            <span className="font-semibold text-[#B89555]">
                              from AED {(r.price_from / 1_000_000).toFixed(2)}M
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#B89555]/40 bg-[#F7F2EA]/60 flex items-center justify-between gap-3">
          <div className="text-xs text-[#1A1A1A]/70">
            <span className="font-bold text-[#1A1A1A]">{totalPicked}</span> of{" "}
            <span className="font-bold text-[#1A1A1A]">{limit}</span> selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#B89555]/60 text-[#1A1A1A] hover:bg-[#EFE6D6]"
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
                border: "1px solid rgba(245,231,196,0.4)",
                boxShadow: "0 10px 24px -12px rgba(6,78,59,0.7)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#F5E7C4" }} />
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
