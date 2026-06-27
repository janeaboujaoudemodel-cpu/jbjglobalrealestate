/**
 * CandidateFoldersPanel
 * ─────────────────────
 * Per-candidate virtual folders, grouped by `candidate_folder` on `crm_documents`.
 * Lists Offer Letters, NDAs and any other documents saved through the Document
 * Studio. Also lists the archived raw attachments (Emirates ID front/back,
 * passport scans) from `crm_document_attachments` so the user can see one
 * single folder per person, exactly as requested.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, FileText, Loader2, Paperclip, Search, ChevronRight, ChevronDown } from "lucide-react";

interface DocRow {
  id: string;
  template_id: string | null;
  title: string | null;
  candidate_folder: string | null;
  candidate_display_name: string | null;
  client_name: string | null;
  updated_at: string | null;
  created_at: string | null;
}
interface AttachmentRow {
  id: string;
  candidate_folder: string | null;
  file_name: string | null;
  storage_path: string | null;
  created_at: string | null;
}

export function CandidateFoldersPanel({ onOpenDoc }: { onOpenDoc: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const docsQ = useQuery({
    queryKey: ["candidate_folders_docs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_documents")
        .select("id, template_id, title, candidate_folder, candidate_display_name, client_name, updated_at, created_at")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });

  const attachmentsQ = useQuery({
    queryKey: ["candidate_folders_attachments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_document_attachments")
        .select("id, candidate_folder, file_name, storage_path, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return [] as AttachmentRow[]; // table may not exist in some envs
      return (data || []) as AttachmentRow[];
    },
  });

  const folders = useMemo(() => {
    const map = new Map<string, { folder: string; displayName: string; docs: DocRow[]; attachments: AttachmentRow[] }>();
    for (const d of docsQ.data || []) {
      const folder = d.candidate_folder || "_uncategorized";
      const displayName = d.candidate_display_name || d.client_name || "Unfiled Documents";
      if (!map.has(folder)) map.set(folder, { folder, displayName, docs: [], attachments: [] });
      map.get(folder)!.docs.push(d);
    }
    for (const a of attachmentsQ.data || []) {
      const folder = a.candidate_folder || "_uncategorized";
      if (!map.has(folder)) map.set(folder, { folder, displayName: folder, docs: [], attachments: [] });
      map.get(folder)!.attachments.push(a);
    }
    let arr = Array.from(map.values());
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.folder.toLowerCase().includes(q) ||
        f.docs.some((d) => (d.title || "").toLowerCase().includes(q))
      );
    }
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return arr;
  }, [docsQ.data, attachmentsQ.data, search]);

  const loading = docsQ.isLoading || attachmentsQ.isLoading;

  async function downloadAttachment(row: AttachmentRow) {
    if (!row.storage_path) return;
    const { data, error } = await (supabase as any).storage
      .from("candidate-documents")
      .createSignedUrl(row.storage_path, 60);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Per-candidate vaults</div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Candidate Folders</h2>
          <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
            One folder per person — Offer Letters, NDAs and uploaded ID / passport scans are kept together.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/55" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by candidate name…" className="pl-9 bg-[#FDFBF7]" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading candidate folders…
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#B89555]/40 bg-[#FDFBF7] p-8 text-center text-sm text-[#1A1A1A]/70">
          No candidate folders yet. Save an Offer Letter in the Document Studio — it will appear here automatically.
        </div>
      ) : (
        <div className="grid gap-3">
          {folders.map((f) => {
            const isOpen = openFolder === f.folder;
            return (
              <div key={f.folder} className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFolder(isOpen ? null : f.folder)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#EFE6D6] transition text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-[#1A1A1A]/60" /> : <ChevronRight className="w-4 h-4 text-[#1A1A1A]/60" />}
                  <FolderOpen className="w-5 h-5 text-[#B89555]" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#1A1A1A] truncate">{f.displayName}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60">
                      {f.docs.length} document{f.docs.length === 1 ? "" : "s"} · {f.attachments.length} attachment{f.attachments.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[#B89555]/25 p-3 grid gap-2">
                    {f.docs.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 rounded border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2">
                        <FileText className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#1A1A1A] truncate">{d.title || d.template_id || "Untitled"}</div>
                          <div className="text-[10px] text-[#1A1A1A]/55">{d.template_id} · updated {d.updated_at ? new Date(d.updated_at).toLocaleString() : ""}</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => onOpenDoc(d.id)}>Open</Button>
                      </div>
                    ))}
                    {f.attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2">
                        <Paperclip className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#1A1A1A] truncate">{a.file_name || "Attachment"}</div>
                          <div className="text-[10px] text-[#1A1A1A]/55">Archived {a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</div>
                        </div>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => downloadAttachment(a)}>Download</Button>
                      </div>
                    ))}
                    {f.docs.length === 0 && f.attachments.length === 0 && (
                      <div className="text-xs text-[#1A1A1A]/60 py-2 px-1">Empty folder.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default CandidateFoldersPanel;
