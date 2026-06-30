/**
 * Admin queue: Developers missing a logo image.
 *
 * Lists every developer where `logo_url` is null/empty, ranked by how many
 * published projects they have so the highest-impact gaps get fixed first.
 * From here the owner can:
 *   - Upload a logo file (→ `developer-logos` storage bucket, then save url)
 *   - Auto-find logo candidates via the `auto-find-developer-logos` edge fn
 *   - Promote a candidate to the canonical `developers.logo_url`
 *   - Mark a developer as "no logo available" so it stops showing in the queue
 *
 * Public project cards render the developer NAME as a nameplate fallback,
 * so attribution is always shown even before a logo is approved.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ArrowLeft,
} from "lucide-react";

type Row = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  logo_status: "missing" | "pending_review" | "approved" | "unavailable";
  logo_candidates: Array<{ url: string; source?: string; fetched_at?: string }> | null;
  logo_last_attempt_at: string | null;
  project_count: number;
};

type Tab = "needs_logo" | "pending_review" | "unavailable" | "approved";

const TAB_FILTER: Record<Tab, Row["logo_status"][]> = {
  needs_logo: ["missing"],
  pending_review: ["pending_review"],
  unavailable: ["unavailable"],
  approved: ["approved"],
};

export default function MissingLogosQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("needs_logo");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [runAll, setRunAll] = useState(false);
  const [runAllProgress, setRunAllProgress] = useState<{ approved: number; unavailable: number; remaining: number } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["missing-developer-logos", tab, search],
    queryFn: async (): Promise<Row[]> => {
      // Use the published-project count to rank impact.
      let q = supabase
        .from("developers")
        .select(
          "id, name, slug, logo_url, logo_status, logo_candidates, logo_last_attempt_at, projects:projects(count)",
          { count: "exact" },
        )
        .in("logo_status", TAB_FILTER[tab])
        .order("name", { ascending: true })
        .limit(500);

      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);

      const { data: rows, error } = await q;
      if (error) throw error;

      return (rows ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        logo_url: r.logo_url,
        logo_status: r.logo_status,
        logo_candidates: r.logo_candidates ?? [],
        logo_last_attempt_at: r.logo_last_attempt_at,
        project_count: Array.isArray(r.projects)
          ? r.projects[0]?.count ?? 0
          : 0,
      }));
    },
  });

  const counts = useQuery({
    queryKey: ["missing-developer-logos-counts"],
    queryFn: async () => {
      const all = await Promise.all(
        (Object.keys(TAB_FILTER) as Tab[]).map(async (t) => {
          const { count } = await supabase
            .from("developers")
            .select("id", { count: "exact", head: true })
            .in("logo_status", TAB_FILTER[t]);
          return [t, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(all) as Record<Tab, number>;
    },
  });

  async function uploadLogo(devId: string, file: File) {
    setBusyId(devId);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${devId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("developer-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from("developer-logos")
        .getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("developers")
        .update({ logo_url: url, logo_status: "approved" })
        .eq("id", devId);
      if (updErr) throw updErr;
      toast({ title: "Logo saved", description: "Developer logo updated." });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function autoFind(devIds: string[]) {
    if (devIds.length === 0) return;
    if (devIds.length > 1) setBulkBusy(true);
    else setBusyId(devIds[0]);
    try {
      const { data: res, error } = await supabase.functions.invoke(
        "auto-find-developer-logos",
        { body: { developer_ids: devIds, batch_size: devIds.length } },
      );
      if (error) throw error;
      toast({
        title: "Auto-find complete",
        description: `Reviewed ${res?.processed ?? devIds.length} developer(s) • ${
          res?.with_candidates ?? 0
        } now have candidates.`,
      });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
    } catch (e: any) {
      toast({
        title: "Auto-find failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
      setBulkBusy(false);
    }
  }

  async function promoteCandidate(devId: string, url: string) {
    setBusyId(devId);
    try {
      const { error } = await supabase
        .from("developers")
        .update({ logo_url: url, logo_status: "approved" })
        .eq("id", devId);
      if (error) throw error;
      toast({ title: "Logo approved", description: "Now live on project cards." });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
    } catch (e: any) {
      toast({
        title: "Approve failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function markUnavailable(devId: string) {
    setBusyId(devId);
    try {
      const { error } = await supabase
        .from("developers")
        .update({ logo_status: "unavailable" })
        .eq("id", devId);
      if (error) throw error;
      toast({ title: "Marked as unavailable" });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function reopen(devId: string) {
    setBusyId(devId);
    try {
      const { error } = await supabase
        .from("developers")
        .update({ logo_status: "missing" })
        .eq("id", devId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
      queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
    } finally {
      setBusyId(null);
    }
  }

  async function runUntilDone() {
    setRunAll(true);
    setRunAllProgress({ approved: 0, unavailable: 0, remaining: 0 });
    let approvedTotal = 0;
    let unavailableTotal = 0;
    try {
      // Hard cap to prevent infinite loops if anything goes wrong
      for (let i = 0; i < 40; i++) {
        const { data: res, error } = await supabase.functions.invoke(
          "auto-find-developer-logos",
          { body: { batch_size: 10 } },
        );
        if (error) throw error;
        approvedTotal += res?.approved ?? 0;
        unavailableTotal += res?.unavailable ?? 0;
        const remaining = res?.still_missing ?? 0;
        setRunAllProgress({ approved: approvedTotal, unavailable: unavailableTotal, remaining });
        queryClient.invalidateQueries({ queryKey: ["missing-developer-logos"] });
        queryClient.invalidateQueries({ queryKey: ["missing-developer-logos-counts"] });
        if (!res?.processed || remaining === 0) break;
        // small breather between batches
        await new Promise((r) => setTimeout(r, 1500));
      }
      toast({
        title: "Auto-find run finished",
        description: `Approved ${approvedTotal} • Marked unavailable ${unavailableTotal}.`,
      });
    } catch (e: any) {
      toast({
        title: "Run stopped",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunAll(false);
    }
  }

  // Manual only. Auto-starting this sweep caused background edge-function
  // failures to pop over the owner console before the owner clicked anything.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    autoStartedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isLoading, counts.data?.needs_logo]);

  const rows = data ?? [];
  const visibleIds = rows.slice(0, 25).map((r) => r.id);

  return (
    <div className="bg-[#FDFBF7] pb-8 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/owner/developers"
          className="inline-flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Developers
        </Link>

        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A]">
            Missing Developer Logos
          </h1>
          <p className="mt-2 text-[#1A1A1A]/70 max-w-2xl">
            Every developer below needs a logo so their project cards display
            the brand instead of just the name plate. Upload a file, auto-find
            from the developer's official site, or mark as unavailable.
          </p>
        </header>

        {/* Tab strip */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(TAB_FILTER) as Tab[]).map((t) => {
            const active = tab === t;
            const count = counts.data?.[t] ?? 0;
            const label =
              t === "needs_logo"
                ? "Needs Logo"
                : t === "pending_review"
                ? "Pending Review"
                : t === "unavailable"
                ? "Unavailable"
                : "Approved";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                data-no-contrast-guard
                className={
                  "px-4 py-2 rounded-full text-sm font-medium border transition-colors " +
                  (active
                    ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                    : "bg-[#FDFBF7] text-[#1A1A1A]/70 border-[#B89555]/30 hover:border-[#B89555]/70")
                }
              >
                {label}
                <span className="ml-2 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search developer name…"
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/30"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {tab === "needs_logo" && (
            <>
              <Button
                variant="gold"
                onClick={() => autoFind(visibleIds)}
                disabled={bulkBusy || runAll || visibleIds.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {bulkBusy
                  ? "Auto-finding…"
                  : `Auto-find next ${visibleIds.length}`}
              </Button>
              <Button
                variant="gold"
                onClick={runUntilDone}
                disabled={runAll || bulkBusy}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {runAll
                  ? `Running… ${runAllProgress?.approved ?? 0} approved · ${runAllProgress?.remaining ?? "?"} left`
                  : "Run continuously"}
              </Button>
            </>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-[#1A1A1A]/60">Loading…</p>
        ) : rows.length === 0 ? (
          <div
            data-surface="champagne"
            className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-10 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-[color:var(--emerald-1)] mx-auto mb-3" />
            <p className="text-[#1A1A1A] font-medium">
              Nothing in this queue. Nice work.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                data-surface="champagne"
                className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Preview */}
                <div className="shrink-0">
                  <DeveloperLogo
                    src={r.logo_url}
                    alt={`${r.name} logo`}
                    name={r.name}
                    variant="tile"
                    renderFallback
                    className="size-16 rounded-xl border-[#B89555]/40 bg-[#FDFBF7]"
                  />
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A1A] truncate">
                      {r.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs border-[#B89555]/50"
                    >
                      {r.project_count} project
                      {r.project_count === 1 ? "" : "s"}
                    </Badge>
                    {r.logo_status !== "missing" && (
                      <Badge
                        variant="outline"
                        className="text-xs border-[#B89555]/50"
                      >
                        {r.logo_status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  {r.slug && (
                    <Link to={`/owner/developers/${r.slug}`} className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline truncate mt-0.5 block">
                      /owner/developers/{r.slug}
                    </Link>
                  )}
                  {r.logo_last_attempt_at && (
                    <p className="text-xs text-[#1A1A1A]/50 mt-0.5">
                      Last auto-find:{" "}
                      {new Date(r.logo_last_attempt_at).toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "short", timeStyle: "short" })}
                    </p>
                  )}

                  {/* Candidates */}
                  {r.logo_candidates && r.logo_candidates.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.logo_candidates.slice(0, 6).map((c, i) => (
                        <button
                          key={i}
                          onClick={() => promoteCandidate(r.id, c.url)}
                          disabled={busyId === r.id}
                          title={`Approve (source: ${c.source ?? "?"})`}
                          className="group inline-flex flex-col items-center gap-1 p-2 rounded-lg border border-[#B89555]/40 bg-white hover:border-[#B89555] transition"
                        >
                          <img
                            src={c.url}
                            alt={`${r.name} candidate ${i + 1}`}
                            className="h-10 w-14 object-contain"
                            loading="lazy"
                           decoding="async" />
                          <span className="text-[10px] text-[#1A1A1A]/70 group-hover:text-[#1A1A1A]">
                            Approve
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo(r.id, f);
                        e.target.value = "";
                      }}
                    />
                    <span
                      className={
                        "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer " +
                        "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60 hover:border-[#B89555]"
                      }
                    >
                      <Upload className="w-4 h-4" />
                      {busyId === r.id ? "Working…" : "Upload"}
                    </span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => autoFind([r.id])}
                    disabled={busyId === r.id || bulkBusy}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Auto-find
                  </Button>
                  {r.logo_status === "unavailable" ? (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => reopen(r.id)}
                      disabled={busyId === r.id}
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => markUnavailable(r.id)}
                      disabled={busyId === r.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Unavailable
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
