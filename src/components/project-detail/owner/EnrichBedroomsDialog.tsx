import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, BedDouble, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectName: string;
  onApplied?: () => void;
}

type Result = {
  before: { bedrooms_min: number | null; bedrooms_max: number | null; bedroom_types: number[] | null };
  proposed: { bedrooms_min: number | null; bedrooms_max: number | null; bedroom_types: number[] };
  hasFinding: boolean;
  citations: string[];
};

const labelTypes = (arr?: number[] | null) =>
  (arr && arr.length) ? arr.map((n) => (n === 0 ? "Studio" : `${n}BR`)).join(" · ") : "—";

export default function EnrichBedroomsDialog({ open, onOpenChange, projectId, projectName, onApplied }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  const runPreview = async () => {
    setLoading(true);
    setRes(null);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-project-bedrooms", {
        body: { projectId },
      });
      if (error) throw error;
      setRes(data as Result);
      if (!(data as Result)?.hasFinding) {
        toast.info("No bedroom mix found on public portals");
      }
    } catch (e: any) {
      toast.error(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!res?.proposed) return;
    setApplying(true);
    try {
      const { error } = await supabase.functions.invoke("enrich-project-bedrooms", {
        body: { projectId, apply: true, proposed: res.proposed },
      });
      if (error) throw error;
      toast.success("Bedroom mix updated");
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      onApplied?.();
      onOpenChange(false);
      setRes(null);
    } catch (e: any) {
      toast.error(e?.message || "Apply failed");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <BedDouble className="w-4 h-4" /> Bedroom enrichment · {projectName}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Scrapes Property Finder, Bayut, Provident and Driven for the real bedroom mix.
            Preview the Before/After then apply.
          </DialogDescription>
        </DialogHeader>

        {!res && (
          <div className="py-4">
            <Button onClick={runPreview} disabled={loading} className="jj-cta-dark w-full" data-cta="dark">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BedDouble className="w-4 h-4 mr-2" />}
              {loading ? "Searching portals…" : "Search public portals"}
            </Button>
          </div>
        )}

        {res && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg p-3" style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.35)" }}>
                <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1">Before</div>
                <div className="font-medium text-[#1A1A1A]">{labelTypes(res.before.bedroom_types as any)}</div>
                <div className="text-[11px] text-[#1A1A1A]/70 mt-1">
                  min {res.before.bedrooms_min ?? "—"} · max {res.before.bedrooms_max ?? "—"}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: "#EFE6D6", border: "1px solid rgba(184,149,85,0.55)" }}>
                <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1">After</div>
                <div className="font-semibold text-[#1A1A1A]">{labelTypes(res.proposed.bedroom_types)}</div>
                <div className="text-[11px] text-[#1A1A1A]/70 mt-1">
                  min {res.proposed.bedrooms_min ?? "—"} · max {res.proposed.bedrooms_max ?? "—"}
                </div>
              </div>
            </div>

            {res.citations.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-1">Sources</div>
                <ul className="text-[11px] text-[#1A1A1A]/75 space-y-0.5">
                  {res.citations.map((c) => (
                    <li key={c} className="truncate"><a href={c} target="_blank" rel="noreferrer" className="underline">{c}</a></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRes(null)} disabled={applying}>Re-run</Button>
              <Button onClick={apply} disabled={applying || !res.hasFinding} className="jj-cta-dark" data-cta="dark">
                {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Apply
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
