/**
 * CandidateFoldersPanel — "Folders" tab.
 * ─────────────────────────────────────────
 * One folder per person (Offer Letter + NDA + uploaded ID/passport/visa scans
 * all live together). Supports:
 *   • Drag-and-drop file upload into a specific folder
 *   • Duplicate-name detection (Replace / Keep both / Cancel)
 *   • Soft delete → Recently Deleted (30-day auto-purge runs server-side)
 *   • Restore from Recently Deleted
 *   • Search by candidate name, folder key or document title
 */
import { useMemo, useRef, useState, type DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderOpen, FileText, Loader2, Paperclip, Search, ChevronRight, ChevronDown,
  Upload, Trash2, RotateCcw, AlertTriangle,
} from "lucide-react";
import {
  useUploadCandidateAttachment, useSoftDeleteAttachment, useRestoreAttachment,
  type CandidateAttachment,
} from "@/hooks/useCandidateAttachments";
import { useSoftDeleteDocument, useRestoreDocument } from "@/hooks/useCrmDocuments";
import { toast } from "sonner";

interface DocRow {
  id: string;
  template_id: string | null;
  title: string | null;
  candidate_folder: string | null;
  candidate_display_name: string | null;
  client_name: string | null;
  updated_at: string | null;
  created_at: string | null;
  deleted_at: string | null;
}

type DuplicateAction = "replace" | "keep_both" | "cancel";

interface DuplicatePrompt {
  file: File;
  folder: string;
  displayName: string;
  existing: CandidateAttachment;
  resolve: (action: DuplicateAction) => void;
}

export function CandidateFoldersPanel({ onOpenDoc }: { onOpenDoc: (id: string) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [dragFolder, setDragFolder] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicatePrompt | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = useUploadCandidateAttachment();
  const softDelAtt = useSoftDeleteAttachment();
  const restoreAtt = useRestoreAttachment();
  const softDelDoc = useSoftDeleteDocument();
  const restoreDoc = useRestoreDocument();

  const docsQ = useQuery({
    queryKey: ["candidate_folders_docs", showDeleted],
    queryFn: async () => {
      const q = (supabase as any)
        .from("crm_documents")
        .select("id, template_id, title, candidate_folder, candidate_display_name, client_name, updated_at, created_at, deleted_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      const { data, error } = showDeleted ? await q.not("deleted_at", "is", null) : await q.is("deleted_at", null);
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });

  const attachmentsQ = useQuery({
    queryKey: ["candidate_folders_attachments", showDeleted],
    queryFn: async () => {
      const q = (supabase as any)
        .from("crm_document_attachments")
        .select("id, owner_user_id, candidate_folder, candidate_display_name, file_path, mime_type, original_filename, kind, deleted_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const { data, error } = showDeleted ? await q.not("deleted_at", "is", null) : await q.is("deleted_at", null);
      if (error) return [] as CandidateAttachment[];
      return (data || []) as CandidateAttachment[];
    },
  });

  const folders = useMemo(() => {
    const map = new Map<string, { folder: string; displayName: string; docs: DocRow[]; attachments: CandidateAttachment[] }>();
    for (const d of docsQ.data || []) {
      const folder = d.candidate_folder || "_uncategorized";
      const displayName = d.candidate_display_name || d.client_name || "Unfiled Documents";
      if (!map.has(folder)) map.set(folder, { folder, displayName, docs: [], attachments: [] });
      map.get(folder)!.docs.push(d);
    }
    for (const a of attachmentsQ.data || []) {
      const folder = a.candidate_folder || "_uncategorized";
      const displayName = a.candidate_display_name || folder;
      if (!map.has(folder)) map.set(folder, { folder, displayName, docs: [], attachments: [] });
      map.get(folder)!.attachments.push(a);
    }
    let arr = Array.from(map.values());
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.folder.toLowerCase().includes(q) ||
        f.docs.some((d) => (d.title || "").toLowerCase().includes(q)) ||
        f.attachments.some((a) => (a.original_filename || "").toLowerCase().includes(q))
      );
    }
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return arr;
  }, [docsQ.data, attachmentsQ.data, search]);

  const loading = docsQ.isLoading || attachmentsQ.isLoading;

  async function downloadAttachment(row: CandidateAttachment) {
    if (!row.file_path) return;
    const { data, error } = await (supabase as any).storage
      .from("candidate-documents")
      .createSignedUrl(row.file_path, 60);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  /** Resolve duplicate via modal — returns the chosen action. */
  function askDuplicate(file: File, folder: string, displayName: string, existing: CandidateAttachment): Promise<DuplicateAction> {
    return new Promise((resolve) => setDuplicate({ file, folder, displayName, existing, resolve }));
  }

  async function handleFiles(folder: string, displayName: string, files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    const existingByName = new Map<string, CandidateAttachment>();
    for (const a of attachmentsQ.data || []) {
      if (a.candidate_folder === folder && a.original_filename) {
        existingByName.set(a.original_filename.toLowerCase(), a);
      }
    }
    for (const file of list) {
      let toUpload: File = file;
      const dup = existingByName.get(file.name.toLowerCase());
      if (dup) {
        const action = await askDuplicate(file, folder, displayName, dup);
        if (action === "cancel") continue;
        if (action === "replace") {
          await softDelAtt.mutateAsync(dup.id).catch(() => {});
        } else if (action === "keep_both") {
          const dot = file.name.lastIndexOf(".");
          const base = dot > 0 ? file.name.slice(0, dot) : file.name;
          const ext = dot > 0 ? file.name.slice(dot) : "";
          toUpload = new File([file], `${base} (copy)${ext}`, { type: file.type });
        }
      }
      try {
        await upload.mutateAsync({ file: toUpload, candidate_display_name: displayName });
        toast.success(`Uploaded ${toUpload.name}`);
      } catch (e: any) {
        toast.error(e?.message || `Upload failed for ${toUpload.name}`);
      }
    }
    qc.invalidateQueries({ queryKey: ["candidate_folders_attachments"] });
  }

  function onDrop(e: DragEvent<HTMLDivElement>, folder: string, displayName: string) {
    e.preventDefault();
    setDragFolder(null);
    const files = e.dataTransfer?.files;
    if (files && files.length) void handleFiles(folder, displayName, files);
  }

  return (
    <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
      <div className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Per-user vaults</div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Folders</h2>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5 max-w-2xl">
              One folder per person — Offer Letters, NDAs and uploaded ID / passport scans kept together. Drag &amp; drop files onto a folder to add them.
            </p>
          </div>
          <Button
            type="button"
            variant={showDeleted ? "primary" : "outline"}
            size="sm"
            className="h-10 shrink-0 whitespace-nowrap"
            onClick={() => setShowDeleted((v) => !v)}
            title="Toggle Recently Deleted (auto-purges after 30 days)"
          >
            {showDeleted ? <RotateCcw className="w-4 h-4 mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
            {showDeleted ? "Show Active" : "Recently Deleted"}
          </Button>
        </div>
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/55" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, folder or file…" className="pl-9 bg-[#FDFBF7]" />
        </div>
      </div>

      {showDeleted && (
        <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>Items here are permanently removed automatically after 30 days. Restore anytime before then.</div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading folders…
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#B89555]/40 bg-[#FDFBF7] p-8 text-center text-sm text-[#1A1A1A]/70">
          {showDeleted
            ? "Recently Deleted is empty."
            : "No folders yet. Save an Offer Letter or NDA in the Document Studio — it will appear here automatically."}
        </div>
      ) : (
        <div className="grid gap-3">
          {folders.map((f) => {
            const isOpen = openFolder === f.folder;
            const isDragOver = dragFolder === f.folder;
            return (
              <div
                key={f.folder}
                className={[
                  "rounded-lg border bg-[#FDFBF7] overflow-hidden transition",
                  isDragOver ? "border-[#064E3B] ring-2 ring-[#064E3B]/30 bg-[#F0FBF6]" : "border-[#B89555]/30",
                ].join(" ")}
                onDragOver={(e) => { if (!showDeleted) { e.preventDefault(); setDragFolder(f.folder); } }}
                onDragLeave={() => setDragFolder((cur) => (cur === f.folder ? null : cur))}
                onDrop={(e) => !showDeleted && onDrop(e, f.folder, f.displayName)}
              >
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
                      {isDragOver ? " — drop to upload" : ""}
                    </div>
                  </div>
                  {!showDeleted && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); fileInputRefs.current[f.folder]?.click(); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          fileInputRefs.current[f.folder]?.click();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#064E3B] hover:underline cursor-pointer select-none px-2 py-1 rounded"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </span>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[f.folder] = el; }}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) void handleFiles(f.folder, f.displayName, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#B89555]/25 p-3 grid gap-2">
                    {f.docs.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 rounded border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2">
                        <FileText className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#1A1A1A] truncate">{d.title || d.template_id || "Untitled"}</div>
                          <div className="text-[10px] text-[#1A1A1A]/55">
                            {d.template_id} · {showDeleted && d.deleted_at ? `deleted ${new Date(d.deleted_at).toLocaleString()}` : `updated ${d.updated_at ? new Date(d.updated_at).toLocaleString() : ""}`}
                          </div>
                        </div>
                        {showDeleted ? (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => restoreDoc.mutate(d.id)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => onOpenDoc(d.id)}>Open</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Move "${d.title || d.template_id}" to Recently Deleted?`)) softDelDoc.mutate(d.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {f.attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2">
                        <Paperclip className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#1A1A1A] truncate">{a.original_filename || "Attachment"}</div>
                          <div className="text-[10px] text-[#1A1A1A]/55">
                            {showDeleted && a.deleted_at ? `Deleted ${new Date(a.deleted_at).toLocaleString()}` : `Archived ${a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}`}
                          </div>
                        </div>
                        {showDeleted ? (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => restoreAtt.mutate(a.id)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => downloadAttachment(a)}>Download</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Move "${a.original_filename || "this file"}" to Recently Deleted?`)) softDelAtt.mutate(a.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {f.docs.length === 0 && f.attachments.length === 0 && (
                      <div className="text-xs text-[#1A1A1A]/60 py-2 px-1">Empty folder. Drop files here to add them.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Duplicate-name resolution dialog */}
      <Dialog open={!!duplicate} onOpenChange={(open) => { if (!open && duplicate) { duplicate.resolve("cancel"); setDuplicate(null); } }}>
        <DialogContent className="bg-[#FDFBF7] border-[#B89555]/40">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              File already exists
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/75">
              <span className="font-semibold">{duplicate?.file.name}</span> already exists in folder
              {" "}<span className="font-semibold">{duplicate?.displayName}</span>.
              How would you like to handle it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { duplicate?.resolve("cancel"); setDuplicate(null); }}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => { duplicate?.resolve("keep_both"); setDuplicate(null); }}>
              Keep both
            </Button>
            <Button variant="primary" onClick={() => { duplicate?.resolve("replace"); setDuplicate(null); }}>
              Replace existing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CandidateFoldersPanel;
