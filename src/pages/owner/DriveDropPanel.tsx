import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, PlusCircle, GitCompare, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type EntityType = "auto" | "project" | "developer" | "area" | "emirate" | "community";

interface Submission {
  id: string;
  folder_url: string;
  entity_type: string;
  status: string;
  before_after: any[];
  summary: any;
  error_message: string | null;
  created_at: string;
  notes: string | null;
}

export default function DriveDropPanel() {
  const [url, setUrl] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("auto");
  const [entityNames, setEntityNames] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Submission[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("drive_drop_submissions")
      .select("id,folder_url,entity_type,status,before_after,summary,error_message,created_at,notes")
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const clean = url.trim();
    if (!clean) { toast.error("Paste a Google Drive folder link above first"); return; }
    if (!/drive\.google\.com|docs\.google\.com/.test(clean)) {
      toast.error("That doesn't look like a Google Drive link");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("drive-drop-classify", {
        body: {
          folder_url: clean,
          entity_type: entityType,
          entity_names: entityNames.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
          notes: notes.trim() || null,
        },
      });
      if (error) throw error;
      toast.success(`Analyzed — ${data?.summary?.matched ?? 0} matched · ${data?.summary?.new ?? 0} new`);
      setEntityNames(""); setNotes("");
      load();
      if (data?.submission_id) setOpenId(data.submission_id);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#B89555]/50 bg-[#FDFBF7] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#064E3B]" />
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Drop a Google Drive link — extraction review engine</h2>
      </div>
      <p className="text-sm text-[#1A1A1A]/70 mb-4">
        Paste a Drive folder link. The engine records candidates, deep-searches the platform for existing matches, and only shows
        <strong> Before → After</strong> where a real existing record is found. Unmatched candidates stay separate for owner approval.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 mb-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/…"
          className="border-[#B89555]/50 bg-white text-[#1A1A1A]"
        />
        <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
          <SelectTrigger className="border-[#B89555]/50 bg-white text-[#1A1A1A]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="developer">Developers</SelectItem>
            <SelectItem value="area">Areas</SelectItem>
            <SelectItem value="emirate">Emirates</SelectItem>
            <SelectItem value="community">Communities</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        value={entityNames}
        onChange={(e) => setEntityNames(e.target.value)}
        placeholder="Optional — hint names (one per line) so the engine knows what to look for"
        rows={2}
        className="border-[#B89555]/50 bg-white text-[#1A1A1A] mb-2"
      />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes / context (optional)"
        rows={2}
        className="border-[#B89555]/50 bg-white text-[#1A1A1A] mb-3"
      />
      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={submitting} className="bg-[#064E3B] hover:bg-[#042c1c] text-white rounded-md">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Analyze & Match
        </Button>
        <span className="text-xs text-[#1A1A1A]/70">No automatic publishing — owner review is required.</span>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-[#1A1A1A]/70">Recent submissions</h3>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#B89555]/40 p-6 text-center text-sm text-[#1A1A1A]/60">
            No submissions yet — drop your first Drive link above.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li key={s.id} className="rounded-lg border border-[#B89555]/25 bg-[#FDFBF7]">
                <button
                  onClick={() => setOpenId(openId === s.id ? null : s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left"
                >
                  <StatusIcon status={s.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.folder_url}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60">
                      {s.entity_type} · {new Date(s.created_at).toLocaleString()}
                      {s.summary?.total ? ` · ${s.summary.matched}/${s.summary.total} matched` : ""}
                    </div>
                  </div>
                  <a href={s.folder_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-800">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </button>
                {openId === s.id && (
                  <div className="border-t border-[#B89555]/20 p-3 bg-white">
                    {s.error_message && (
                      <div className="text-xs text-red-700 mb-2">{s.error_message}</div>
                    )}
                    {(!s.before_after || s.before_after.length === 0) ? (
                      <div className="text-xs text-[#1A1A1A]/60">
                        No entities were classified. Add hint names above and re-submit for better matches.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {s.before_after.map((row: any, i: number) => (
                          <div key={i} className="rounded border border-[#B89555]/20 p-2">
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span
                                data-no-contrast-guard
                                className="allow-white inline-flex items-center px-2 py-0.5 rounded-full bg-[#064E3B] text-white border border-[#064E3B] uppercase tracking-wide text-[10px] font-semibold"
                              >
                                {row.type}
                              </span>
                              <span className="font-medium text-[#1A1A1A]">{row.name}</span>
                              {row.matched ? (
                                <span className="ml-auto inline-flex items-center gap-1 text-emerald-800 text-[11px]">
                                  <GitCompare className="w-3 h-3" /> Match found
                                </span>
                              ) : (
                                <span className="ml-auto inline-flex items-center gap-1 text-amber-800 text-[11px]">
                                  <PlusCircle className="w-3 h-3" /> New Drive candidate — approval required
                                </span>
                              )}
                            </div>
                            {row.matched ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                <DiffPanel title="Before" tone="neutral" data={row.before} />
                                <DiffPanel title="Proposed from Drive" tone="emerald" data={row.after} />
                              </div>
                            ) : (
                              <div className="rounded-md bg-[#F7F2EA] p-3 border border-[#B89555]/35 text-xs text-[#1A1A1A] flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 text-[#064E3B] mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold">No existing platform record matched.</div>
                                  <div className="mt-1 text-[#1A1A1A]/75">This stays as a Drive candidate only. It is not shown as a Before → After change and it is not published until reviewed.</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function DiffPanel({ title, data, tone }: { title: string; data: any; tone: "neutral" | "emerald" }) {
  const entries = Object.entries(data ?? {})
    .filter(([key, value]) => value !== null && value !== undefined && value !== "" && !["id", "updated_at", "created_at"].includes(key))
    .slice(0, 8);
  return (
    <div className={`rounded p-2 border ${tone === "emerald" ? "bg-[#F7F2EA] border-[#B89555]/40" : "bg-white border-[#B89555]/25"}`}>
      <div className="text-[#064E3B] uppercase tracking-wider text-[10px] mb-1 font-semibold">{title}</div>
      {entries.length ? (
        <dl className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="text-[#1A1A1A]/55 capitalize">{key.replace(/_/g, " ")}</dt>
              <dd className="text-[#1A1A1A] break-words">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="text-[#1A1A1A]/50">No safe fields to display</div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "ready_for_review" || s === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
  if (s === "processing" || s === "pending") return <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />;
  if (s === "failed" || s === "error") return <AlertCircle className="w-4 h-4 text-red-700" />;
  return <CheckCircle2 className="w-4 h-4 text-neutral-400" />;
}
