import { useState } from "react";
import { Sparkles, Loader2, Check, X, FileText, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectName: string;
  /** Optional section scope: details | amenities | location | payment | specs | faq */
  section?: string;
  onApplied?: () => void;
}

type EnrichField = {
  section: string;
  field: string;
  current: any;
  proposed: any;
  citation?: string | null;
  missing?: boolean;
  reason?: string | null;
};

type EnrichResult = {
  fields: EnrichField[];
  missing: { section: string; reason: string }[];
};

const SECTION_LABELS: Record<string, string> = {
  details: "Project details",
  amenities: "Amenities",
  location: "Location",
  payment: "Payment plan",
  specs: "Specs",
  faq: "FAQ",
};

export default function AIEnrichDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  section,
  onApplied,
}: Props) {
  const [sourceText, setSourceText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);

  const reset = () => {
    setSourceText("");
    setOverwrite(false);
    setResult(null);
    setAccepted({});
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleAnalyze = async () => {
    if (!sourceText.trim()) {
      toast.error("Paste a description, brochure text, or notes first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-enrich-project", {
        body: {
          projectId,
          section,
          sourceText,
          overwrite,
        },
      });
      if (error) throw error;
      if (!data?.fields) throw new Error("AI returned no fields");
      setResult(data as EnrichResult);
      const initial: Record<string, boolean> = {};
      for (const f of data.fields as EnrichField[]) {
        if (!f.missing) initial[`${f.section}:${f.field}`] = true;
      }
      setAccepted(initial);
    } catch (e: any) {
      toast.error(e?.message || "AI enrichment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result) return;
    const toApply = result.fields.filter(
      (f) => !f.missing && accepted[`${f.section}:${f.field}`]
    );
    if (toApply.length === 0) {
      toast.info("Nothing selected to apply");
      return;
    }
    setApplying(true);
    try {
      // Fetch current values for the affected fields (for undo)
      const fieldNames = Array.from(new Set(toApply.map((f) => f.field)));
      const { data: current, error: fetchErr } = await supabase
        .from("projects")
        .select(fieldNames.join(",") + ",updated_at")
        .eq("id", projectId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const patch: Record<string, any> = {};
      const before: Record<string, any> = {};
      const after: Record<string, any> = {};
      for (const f of toApply) {
        patch[f.field] = f.proposed;
        before[f.field] = (current as any)?.[f.field] ?? null;
        after[f.field] = f.proposed;
      }
      patch.import_source = "ai-enrichment";

      const { error: updErr } = await supabase
        .from("projects")
        .update(patch as any)
        .eq("id", projectId);
      if (updErr) throw updErr;

      await supabase.from("admin_edit_log" as any).insert({
        entity_type: "project",
        entity_id: projectId,
        entity_name: projectName,
        action: "ai-enrichment",
        section: section || "multiple",
        changed_fields: fieldNames,
        before_values: before,
        after_values: after,
        summary: `AI enriched ${fieldNames.length} field${fieldNames.length === 1 ? "" : "s"}`,
        source_citation: toApply.reduce(
          (acc, f) => ({ ...acc, [f.field]: f.citation || null }),
          {} as Record<string, any>
        ),
      } as any);

      toast.success(`Applied ${fieldNames.length} field${fieldNames.length === 1 ? "" : "s"}`);
      reset();
      onOpenChange(false);
      onApplied?.();
    } catch (e: any) {
      toast.error(e?.message || "Apply failed");
    } finally {
      setApplying(false);
    }
  };

  const sectionLabel = section ? SECTION_LABELS[section] || section : "all sections";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Describe with AI — {sectionLabel}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Paste a brochure paragraph, fact-sheet text, or notes about <b>{projectName}</b>. AI
            extracts only facts found in your text. It will never invent prices, dates, or photos.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="source" className="text-[#1A1A1A] text-sm font-semibold">
                Source text
              </Label>
              <Textarea
                id="source"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
                placeholder="Paste the brochure / fact sheet text here. Mention amenities, payment milestones, location landmarks, specs — whatever is in the document. AI will only use what's present."
                className="mt-1 bg-white border-[#B89555]/40 text-[#1A1A1A]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <Checkbox
                checked={overwrite}
                onCheckedChange={(v) => setOverwrite(!!v)}
              />
              Overwrite existing values (default: only fill empty fields)
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button variant="primary" onClick={handleAnalyze} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#B89555]/40 bg-[#F7F2EA] p-3 text-xs text-[#1A1A1A]">
              <b>Preview.</b> Toggle the fields you want to accept. Nothing is written until you
              click Apply.
            </div>

            {result.fields.length === 0 && (
              <p className="text-sm text-[#1A1A1A]/70">
                AI couldn't extract any fields from this text.
              </p>
            )}

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {result.fields.map((f) => {
                const key = `${f.section}:${f.field}`;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-[#B89555]/30 bg-white p-3"
                  >
                    <div className="flex items-start gap-2">
                      {!f.missing && (
                        <Checkbox
                          checked={!!accepted[key]}
                          onCheckedChange={(v) =>
                            setAccepted((p) => ({ ...p, [key]: !!v }))
                          }
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-semibold">
                            {f.section}
                          </span>
                          <span className="text-sm font-semibold text-[#1A1A1A]">{f.field}</span>
                          {f.missing && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                              <AlertCircle className="w-3 h-3" /> missing
                            </span>
                          )}
                        </div>

                        {f.missing ? (
                          <p className="text-xs text-[#1A1A1A]/70">
                            {f.reason || "Not found in the provided text. Upload the brochure or paste the relevant section."}
                          </p>
                        ) : (
                          <>
                            {f.current != null && f.current !== "" && (
                              <div className="text-[11px] text-[#1A1A1A]/60 mb-1">
                                <span className="font-semibold">Current:</span>{" "}
                                <span className="line-through">{String(typeof f.current === "object" ? JSON.stringify(f.current) : f.current).slice(0, 200)}</span>
                              </div>
                            )}
                            <div className="text-xs text-[#1A1A1A]">
                              <span className="font-semibold">Proposed:</span>{" "}
                              {typeof f.proposed === "object"
                                ? <pre className="inline whitespace-pre-wrap text-[11px] bg-[#F7F2EA] p-1.5 rounded mt-1">{JSON.stringify(f.proposed, null, 2)}</pre>
                                : String(f.proposed).slice(0, 400)}
                            </div>
                            {f.citation && (
                              <div className="mt-1 text-[10px] text-[#1A1A1A]/60 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> "{f.citation.slice(0, 120)}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {result.missing?.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <b>Couldn't fill:</b>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {result.missing.map((m, i) => (
                    <li key={i}>
                      <b>{m.section}</b>: {m.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#B89555]/30">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={handleApply} disabled={applying} className="flex-1">
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Applying…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Apply selected
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
