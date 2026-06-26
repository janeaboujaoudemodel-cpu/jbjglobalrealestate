import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileText, CheckCircle2, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface Match {
  developer_id: string | null;
  developer_name: string | null;
  confidence: number;
}

interface Extracted {
  developer_name?: string;
  contract_type?: string;
  effective_date?: string;
  expiry_date?: string;
  commission_pct?: number;
  summary?: string;
}

interface DeveloperOpt { id: string; name: string }

export function AgreementUploadDrawer({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [devSearch, setDevSearch] = useState("");
  const [devOptions, setDevOptions] = useState<DeveloperOpt[]>([]);

  const reset = () => {
    setFile(null); setExtracted(null); setMatch(null);
    setDeveloperId(null); setDevSearch(""); setDevOptions([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (f: File) => {
    if (f.size > 25 * 1024 * 1024) { toast.error("Max 25 MB"); return; }
    if (f.type !== "application/pdf" && !f.type.startsWith("image/")) {
      toast.error("PDF or image only"); return;
    }
    setFile(f); setExtracted(null); setMatch(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("match-developer-agreement", {
        body: { file_base64: base64, file_type: file.type, file_name: file.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExtracted(data.extracted);
      setMatch(data.match);
      setDeveloperId(data.match?.developer_id ?? null);
      if (!data.match?.developer_id) {
        toast.warning("AI couldn't auto-match the developer. Pick one below.");
      } else {
        toast.success(`Matched to ${data.match.developer_name} (${Math.round(data.match.confidence * 100)}%)`);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const searchDevs = async (term: string) => {
    setDevSearch(term);
    if (term.length < 2) { setDevOptions([]); return; }
    const { data } = await supabase
      .from("developers")
      .select("id, name")
      .ilike("name", `%${term}%`)
      .limit(10);
    setDevOptions(data ?? []);
  };

  const fileAndSave = async () => {
    if (!file || !extracted) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${user.id}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("developer-agreements")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // We no longer store a long-lived signed URL on the row — the file_path is
      // the source of truth; the UI resolves a short-lived signed URL on click.

      // Auto-create developer if needed
      let finalDeveloperId = developerId;
      const devName = (extracted.developer_name || "").trim();
      if (!finalDeveloperId && devName) {
        const { data: existing } = await supabase
          .from("developers")
          .select("id, name")
          .ilike("name", devName)
          .limit(1)
          .maybeSingle();
        if (existing?.id) {
          finalDeveloperId = existing.id;
        } else {
          const slug = devName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || `dev-${Date.now()}`;
          const { data: created, error: createErr } = await supabase
            .from("developers")
            .insert({ name: devName, slug })
            .select("id")
            .single();
          if (createErr) {
            // Don't silently swallow — owner needs to know they'll have to fix it.
            console.error("developers.insert failed:", createErr);
            toast.error(`Could not auto-link "${devName}" — filed for review. Edit the row to assign a developer.`);
          } else if (created?.id) {
            finalDeveloperId = created.id;
            toast.success(`New developer "${devName}" added to your directory`);
          }
        }
      }

      const { error: insErr } = await supabase.from("external_agreements").insert({
        owner_user_id: user.id,
        developer_id: finalDeveloperId,
        developer_name_raw: extracted.developer_name ?? null,
        contract_type: extracted.contract_type ?? null,
        file_url: "", // legacy column — resolved on click from file_path
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        effective_date: extracted.effective_date || null,
        expiry_date: extracted.expiry_date || null,
        commission_pct: extracted.commission_pct ?? null,
        ai_confidence: match?.confidence ?? null,
        ai_extracted: extracted as any,
        status: finalDeveloperId ? "filed" : "pending_review",
      });
      if (insErr) throw insErr;


      toast.success("Agreement filed");
      qc.invalidateQueries({ queryKey: ["external_agreements"] });
      qc.invalidateQueries({ queryKey: ["developers"] });
      qc.invalidateQueries({ queryKey: ["all-developers"] });
      qc.invalidateQueries({ queryKey: ["projects-developers"] });
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <SheetContent className="bg-[#FDFBF7] sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--gold))]" />
            Upload Developer Agreement
          </SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70">
            Drop the contract — AI reads it and files it under the right developer automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition",
                dragging ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]" : "border-[#B89555]/30 hover:border-[#B89555]/60 bg-[#F7F2EA]",
              )}
            >
              <Upload className="h-8 w-8 mx-auto text-[#1A1A1A]/60 mb-2" />
              <p className="text-sm text-[#1A1A1A]">Drop PDF or image here</p>
              <p className="text-xs text-[#1A1A1A]/60 mt-1">or click to browse — max 25 MB</p>
              <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {file && (
            <div className="bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl p-3 flex items-center gap-3">
              <FileText className="h-5 w-5 text-[hsl(var(--gold))] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{file.name}</p>
                <p className="text-xs text-[#1A1A1A]/60">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={reset} className="p-1 rounded hover:bg-[#EFE6D6]">
                <X className="h-4 w-4 text-[#1A1A1A]/60" />
              </button>
            </div>
          )}

          {file && !extracted && (
            <Button onClick={analyze} disabled={analyzing} variant="gold" className="w-full">
              {analyzing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reading contract…</>)
                : (<><Sparkles className="h-4 w-4 mr-2" />Analyze with AI</>)}
            </Button>
          )}

          {extracted && (
            <div className="space-y-3">
              <div className="bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#1A1A1A]/60">AI Match</span>
                  {match?.developer_id ? (
                    <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {Math.round((match?.confidence ?? 0) * 100)}% confident
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-700">No auto-match</Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-[#1A1A1A]/70">Developer</Label>
                  {match?.developer_id && developerId === match.developer_id ? (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{match.developer_name}</p>
                      <button onClick={() => { setDeveloperId(null); setDevSearch(""); }}
                        className="text-xs text-[hsl(var(--gold))] underline">Change</button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-1">
                      <Input
                        placeholder="Search developer by name…"
                        value={devSearch}
                        onChange={(e) => searchDevs(e.target.value)}
                        className="bg-[#FDFBF7] border-[#B89555]/30"
                      />
                      {devOptions.length > 0 && (
                        <div className="border border-[#B89555]/20 rounded-lg bg-[#FDFBF7] max-h-40 overflow-auto">
                          {devOptions.map((d) => (
                            <button key={d.id} data-developer-option onClick={() => { setDeveloperId(d.id); setDevSearch(d.name); setDevOptions([]); }}
                              className="flex w-full items-start text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F7F2EA] overflow-visible">
                              <span data-developer-name className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{d.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs text-[#1A1A1A]/70">Type</Label>
                    <p className="text-sm text-[#1A1A1A]">{extracted.contract_type ?? "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#1A1A1A]/70">Commission</Label>
                    <p className="text-sm text-[#1A1A1A]">{extracted.commission_pct != null ? `${extracted.commission_pct}%` : "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#1A1A1A]/70">Effective</Label>
                    <p className="text-sm text-[#1A1A1A]">{extracted.effective_date ?? "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#1A1A1A]/70">Expires</Label>
                    <p className="text-sm text-[#1A1A1A]">{extracted.expiry_date ?? "—"}</p>
                  </div>
                </div>

                {extracted.summary && (
                  <div className="pt-2 border-t border-[#B89555]/15">
                    <p className="text-xs text-[#1A1A1A]/70 mb-1">Summary</p>
                    <p className="text-xs text-[#1A1A1A]/80 leading-relaxed">{extracted.summary}</p>
                  </div>
                )}
              </div>

              <Button onClick={fileAndSave} disabled={saving} variant="gold" className="w-full">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Filing…</>)
                  : (<><CheckCircle2 className="h-4 w-4 mr-2" />Confirm & file{developerId ? "" : " for review"}</>)}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
