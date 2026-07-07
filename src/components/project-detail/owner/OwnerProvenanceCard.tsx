import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Database, History, Undo2, Eye, Sparkles, X, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import AIEnrichDialog from "./AIEnrichDialog";
// Bedroom enrichment moved to background runner — no per-project UI.

interface Props {
  projectId: string;
  projectName: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  importSource?: string | null;
  createdSource?: string | null;
}

interface EditLogRow {
  id: string;
  action: string;
  section: string | null;
  changed_fields: string[] | null;
  summary: string | null;
  before_values: Record<string, any> | null;
  after_values: Record<string, any> | null;
  created_at: string;
  user_id: string | null;
  undo_of: string | null;
}

function formatWhen(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function sourceLabel(s?: string | null) {
  if (!s) return "Manual";
  const v = s.toLowerCase();
  if (v.includes("reelly")) return "Reelly (scraped)";
  if (v.includes("provident")) return "Provident (scraped)";
  if (v.includes("developer")) return "Developer Portal";
  if (v.includes("ai")) return "AI Enrichment";
  if (v.includes("manual") || v.includes("admin")) return "Manual";
  return s;
}

function scrollToSection(section?: string | null) {
  if (!section) return;
  const el =
    document.getElementById(section) ||
    document.querySelector(`[data-section="${section}"]`);
  if (!el) {
    toast.info(`Section "${section}" not on this page`);
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ring-2", "ring-[#B89555]", "ring-offset-2", "transition-all");
  setTimeout(() => {
    el.classList.remove("ring-2", "ring-[#B89555]", "ring-offset-2");
  }, 2400);
}

export default function OwnerProvenanceCard({
  projectId,
  projectName,
  createdAt,
  updatedAt,
  importSource,
  createdSource,
}: Props) {
  const { isOwner } = useIsAppOwner();
  const qc = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [enrichSection, setEnrichSection] = useState<string | undefined>(undefined);
  // Minimized by default — owner clicks the star to expand.
  const [expanded, setExpanded] = useState(false);
  

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["admin-edit-log", projectId],
    enabled: !!isOwner && !!projectId,
    staleTime: 30_000,
    queryFn: async (): Promise<EditLogRow[]> => {
      const { data, error } = await supabase
        .from("admin_edit_log" as any)
        .select("id, action, section, changed_fields, summary, before_values, after_values, created_at, user_id, undo_of")
        .eq("entity_type", "project")
        .eq("entity_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        console.warn("[Provenance] log fetch failed", error);
        return [];
      }
      return (data ?? []) as any;
    },
  });

  if (!isOwner) return null;

  const recent = logs.slice(0, 5);

  const handleUndo = async (row: EditLogRow) => {
    if (!row.before_values || Object.keys(row.before_values).length === 0) {
      toast.error("No previous values stored for this edit — can't undo");
      return;
    }
    try {
      const { error } = await supabase
        .from("projects")
        .update(row.before_values as any)
        .eq("id", projectId);
      if (error) throw error;

      // Log the undo
      await supabase.from("admin_edit_log" as any).insert({
        entity_type: "project",
        entity_id: projectId,
        entity_name: projectName,
        action: "undo",
        section: row.section,
        changed_fields: row.changed_fields,
        before_values: row.after_values,
        after_values: row.before_values,
        summary: `Undid ${row.action} on ${row.section ?? "project"}`,
        undo_of: row.id,
      } as any);

      toast.success("Edit undone");
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Undo failed");
    }
  };

  const openEnrich = (section?: string) => {
    setEnrichSection(section);
    setEnrichOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
            Owner · Provenance
          </span>
          <span data-emerald-action="true" className="allow-white ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#064E3B] px-2 py-0.5 rounded-md border border-transparent">
            <Database className="w-3 h-3" /> Private
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#1A1A1A]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-0.5">Created</div>
            <div className="font-medium">{formatWhen(createdAt)}</div>
            <div className="text-[11px] text-[#1A1A1A]/65">via {sourceLabel(createdSource)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-0.5">Last updated</div>
            <div className="font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatWhen(updatedAt)}
            </div>
            <div className="text-[11px] text-[#1A1A1A]/65">via {sourceLabel(importSource)}</div>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#B89555]/30">
            <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1.5">Recent edits</div>
            <ul className="space-y-1">
              {recent.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 text-[11px] text-[#1A1A1A] bg-white/60 rounded-md px-2 py-1 border border-[#B89555]/20"
                >
                  <span className="font-semibold truncate max-w-[140px]" title={row.summary || row.action}>
                    {row.section || row.action}
                  </span>
                  <span className="text-[#1A1A1A]/60 truncate">{(row.changed_fields ?? []).slice(0, 2).join(", ")}</span>
                  <span className="ml-auto text-[#1A1A1A]/55 whitespace-nowrap">{formatWhen(row.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => scrollToSection(row.section)}
                    className="p-1 rounded hover:bg-[#EFE6D6]"
                    title="View where this changed"
                    aria-label="View change location"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUndo(row)}
                    disabled={!row.before_values}
                    className="p-1 rounded hover:bg-[#EFE6D6] disabled:opacity-40 disabled:cursor-not-allowed"
                    title={row.before_values ? "Undo this edit" : "No previous value to undo"}
                    aria-label="Undo"
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="flex-1 h-8 text-[11px] min-w-[110px]"
          >
            <History className="w-3.5 h-3.5" /> Full history
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openEnrich(undefined)}
            className="flex-1 h-8 text-[11px] min-w-[120px]"
          >
            <Sparkles className="w-3.5 h-3.5" /> Enrich with AI
          </Button>
        </div>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-[#FDFBF7]">
          <SheetHeader>
            <SheetTitle className="text-[#1A1A1A]">Edit history · {projectName}</SheetTitle>
            <SheetDescription className="text-[#1A1A1A]/70">
              Every owner, scraper, and AI change on this project. Visible only to you.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {logs.length === 0 && (
              <p className="text-sm text-[#1A1A1A]/60">No changes logged yet.</p>
            )}
            {logs.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 text-sm text-[#1A1A1A]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{row.section || row.action}</span>
                  <span className="text-xs text-[#1A1A1A]/60">{row.action}</span>
                  <span className="ml-auto text-xs text-[#1A1A1A]/60">{formatWhen(row.created_at)}</span>
                </div>
                {row.changed_fields?.length ? (
                  <div className="text-xs text-[#1A1A1A]/75 mb-1">
                    Fields: <span className="font-medium">{row.changed_fields.join(", ")}</span>
                  </div>
                ) : null}
                {row.summary && (
                  <div className="text-xs text-[#1A1A1A]/85 mb-2">{row.summary}</div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToSection(row.section)}
                    className="h-7 text-[11px]"
                  >
                    <Eye className="w-3 h-3" /> View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUndo(row)}
                    disabled={!row.before_values}
                    className="h-7 text-[11px]"
                  >
                    <Undo2 className="w-3 h-3" /> Undo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <AIEnrichDialog
        open={enrichOpen}
        onOpenChange={setEnrichOpen}
        projectId={projectId}
        projectName={projectName}
        section={enrichSection}
        onApplied={() => {
          refetch();
          qc.invalidateQueries({ queryKey: ["project"] });
        }}
      />

    </>
  );
}
