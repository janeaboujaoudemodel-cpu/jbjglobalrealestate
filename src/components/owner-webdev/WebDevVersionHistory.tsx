/**
 * Owner-only version history for a single owner_ui_overrides row.
 * - Lists every snapshot (newest first) with relative time + author + #
 * - "Preview" toggles a temporary CSS overlay showing what that version
 *   would look like on the current page (uses the existing
 *   jbj:override-preview event channel that OwnerOverrideLoader listens to).
 * - "Restore" updates the live override row to the picked version's CSS;
 *   the snapshot trigger automatically records the restore as a new version.
 */
import { useEffect, useState } from "react";
import { Eye, EyeOff, RotateCcw, Loader2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Version = {
  id: string;
  override_id: string;
  route_pattern: string;
  selector: string;
  css: Record<string, string>;
  label: string | null;
  status: string;
  version_number: number;
  created_at: string;
  created_by: string;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function cssLines(css: Record<string, string>): string[] {
  return Object.entries(css ?? {}).map(([k, v]) => `${k}: ${v}`);
}

export default function WebDevVersionHistory({
  overrideId,
}: {
  overrideId: string;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("owner_ui_override_versions")
      .select(
        "id, override_id, route_pattern, selector, css, label, status, version_number, created_at, created_by",
      )
      .eq("override_id", overrideId)
      .order("version_number", { ascending: false })
      .limit(20);
    setVersions((data ?? []) as Version[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Clean up any preview overlay when component unmounts
    return () => {
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: [] }),
      );
    };
  }, [overrideId]);

  const togglePreview = (v: Version) => {
    if (previewId === v.id) {
      setPreviewId(null);
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: [] }),
      );
      return;
    }
    setPreviewId(v.id);
    window.dispatchEvent(
      new CustomEvent("jbj:override-preview", {
        detail: [
          {
            id: `preview-${v.id}`,
            route_pattern: v.route_pattern,
            selector: v.selector,
            css: v.css,
            status: "pending",
          },
        ],
      }),
    );
  };

  const restore = async (v: Version) => {
    setRestoringId(v.id);
    try {
      const { error } = await supabase
        .from("owner_ui_overrides")
        .update({
          css: v.css,
          selector: v.selector,
          route_pattern: v.route_pattern,
          label: v.label,
          status: "approved",
        })
        .eq("id", overrideId);
      if (error) throw error;
      toast({
        title: `Restored v${v.version_number}`,
        description: "Earlier version is now live.",
      });
      // Clear preview, refresh list, refresh dock
      setPreviewId(null);
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: [] }),
      );
      window.dispatchEvent(new CustomEvent("jbj:webdev-refresh"));
      await load();
    } catch (e) {
      toast({
        title: "Restore failed",
        description: e instanceof Error ? e.message : "Unknown",
        variant: "destructive",
      });
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-[#1A1A1A]/60 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading history…
      </div>
    );
  }

  if (!versions.length) {
    return (
      <div className="text-[10px] text-[#1A1A1A]/60 py-1">
        No version history yet.
      </div>
    );
  }

  const current = versions[0];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">
        <History className="w-3 h-3" /> Versions ({versions.length})
      </div>
      {versions.map((v) => {
        const isCurrent = v.id === current.id;
        const isPreviewing = previewId === v.id;
        return (
          <div
            key={v.id}
            className={`rounded-md border px-2 py-1.5 ${
              isPreviewing
                ? "border-[#B89555] bg-[#B89555]/10"
                : "border-[#B89555]/25 bg-[#FDFBF7]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-semibold text-[#1A1A1A]">
                  v{v.version_number}
                </span>
                {isCurrent && (
                  <span className="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-emerald-50 text-emerald-700">
                    current
                  </span>
                )}
                <span className="text-[10px] text-[#1A1A1A]/55 truncate">
                  {timeAgo(v.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => togglePreview(v)}
                  className="inline-flex items-center gap-1 h-6 px-1.5 rounded border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6] text-[10px] text-[#1A1A1A]"
                  title={isPreviewing ? "Hide preview" : "Preview"}
                >
                  {isPreviewing ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </button>
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => restore(v)}
                    disabled={restoringId === v.id}
                    className="inline-flex items-center gap-1 h-6 px-1.5 rounded border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6] text-[10px] text-[#1A1A1A] disabled:opacity-60"
                    title={`Restore v${v.version_number}`}
                  >
                    {restoringId === v.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Restore
                  </button>
                )}
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#1A1A1A]/70 leading-snug max-h-16 overflow-auto">
              {cssLines(v.css).slice(0, 6).map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              ))}
              {cssLines(v.css).length > 6 && (
                <div className="text-[#1A1A1A]/40">
                  +{cssLines(v.css).length - 6} more…
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
