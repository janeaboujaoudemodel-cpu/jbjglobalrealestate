/**
 * Owner picks ONE project as the developer's spotlight and tags it with a
 * marketing label (Latest launch / Featured / Trending / High demand).
 *
 * Persists to `developers.focus_project_id` and `developers.focus_project_label`.
 * Editable by any user that passes `has_developer_edit_access` — enforced by
 * the existing developer RLS policies on the row itself.
 */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const FOCUS_PROJECT_LABELS = [
  { value: "latest_launch", label: "Latest launch" },
  { value: "featured", label: "Featured" },
  { value: "trending", label: "Trending" },
  { value: "high_demand", label: "High demand" },
] as const;

interface Project {
  id: string;
  name: string;
  status?: string | null;
}

interface Props {
  developerId: string;
  canEdit: boolean;
  projects: Project[];
  currentFocusProjectId: string | null | undefined;
  currentFocusProjectLabel: string | null | undefined;
}

export default function DeveloperFocusProjectCard({
  developerId,
  canEdit,
  projects,
  currentFocusProjectId,
  currentFocusProjectLabel,
}: Props) {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState<string>(currentFocusProjectId ?? "");
  const [label, setLabel] = useState<string>(currentFocusProjectLabel ?? "latest_launch");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setProjectId(currentFocusProjectId ?? "");
    setLabel(currentFocusProjectLabel ?? "latest_launch");
    setDirty(false);
  }, [currentFocusProjectId, currentFocusProjectLabel, developerId]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("developers")
        .update({
          focus_project_id: projectId || null,
          focus_project_label: projectId ? label : null,
        } as any)
        .eq("id", developerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Focus project saved");
      setDirty(false);
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "dev-profile" });
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  const clear = () => {
    setProjectId("");
    setLabel("latest_launch");
    setDirty(true);
  };

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-[#B89555]" />
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
          Focus project
        </p>
        <span className="text-[10px] text-[#1A1A1A]/50">
          · pin the developer's spotlight project and tag it
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold">
            Project
          </Label>
          <select
            disabled={!canEdit || projects.length === 0}
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setDirty(true);
            }}
            className="w-full h-9 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-2 text-sm"
          >
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status ? ` (${p.status})` : ""}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="text-[10px] text-[#1A1A1A]/50 mt-1 italic">
              This developer has no projects yet. Add or link projects first.
            </p>
          )}
        </div>

        <div>
          <Label className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold">
            Label
          </Label>
          <select
            disabled={!canEdit || !projectId}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setDirty(true);
            }}
            className="w-full h-9 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-2 text-sm"
          >
            {FOCUS_PROJECT_LABELS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center justify-between pt-1 border-t border-[#B89555]/20">
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline underline-offset-2 disabled:opacity-40"
            disabled={!projectId && !currentFocusProjectId}
          >
            Clear focus
          </button>
          <Button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
            className="bg-[#064E3B] text-white hover:bg-[#064E3B]/90"
            style={{ color: "#FFFFFF" }}
          >
            {save.isPending ? "Saving…" : dirty ? "Save focus project" : "Saved"}
          </Button>
        </div>
      )}
    </div>
  );
}
