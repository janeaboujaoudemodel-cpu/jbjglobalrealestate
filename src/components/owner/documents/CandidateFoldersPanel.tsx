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
 *   • Auto-dedup: only the LATEST version of each template / file is shown by
 *     default — older versions collapse into a "Previous versions" disclosure.
 *   • Multi-select with Select all / Unselect all + bulk Delete / Restore +
 *     Undo (works for every template, every folder).
 */
import { useMemo, useRef, useState, type DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderOpen, FileText, Loader2, Paperclip, Search, ChevronRight, ChevronDown,
  Upload, Trash2, RotateCcw, AlertTriangle, History,
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

type SelKind = "doc" | "att";
interface SelKey { kind: SelKind; id: string }
const selKey = (k: SelKind, id: string) => `${k}:${id}`;

/** Normalize "Offer Letter (copy).pdf" → "offer letter.pdf" so versioned
 *  uploads (which we suffix " (copy)") collapse under one group. */
function normalizeFileBase(name: string | null | undefined): string {
  if (!name) return "";
  const lower = name.toLowerCase().trim();
  const dot = lower.lastIndexOf(".");
  const base = dot > 0 ? lower.slice(0, dot) : lower;
  const ext = dot > 0 ? lower.slice(dot) : "";
  return base.replace(/\s*\(copy(?:\s*\d+)?\)\s*$/i, "").trim() + ext;
}

export function CandidateFoldersPanel({ onOpenDoc }: { onOpenDoc: (id: string) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [dragFolder, setDragFolder] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicatePrompt | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  type DocGroup = { key: string; latest: DocRow; previous: DocRow[] };
  type AttGroup = { key: string; latest: CandidateAttachment; previous: CandidateAttachment[] };
  type Folder = {
    folder: string;
    displayName: string;
    docGroups: DocGroup[];
    attGroups: AttGroup[];
    totalDocs: number;
    totalAtts: number;
  };

  const folders: Folder[] = useMemo(() => {
    const map = new Map<string, {
      folder: string; displayName: string;
      docBuckets: Map<string, DocRow[]>;
      attBuckets: Map<string, CandidateAttachment[]>;
    }>();
    const ensure = (folder: string, displayName: string) => {
      if (!map.has(folder)) map.set(folder, { folder, displayName, docBuckets: new Map(), attBuckets: new Map() });
      return map.get(folder)!;
    };
    for (const d of docsQ.data || []) {
      const folder = d.candidate_folder || "_uncategorized";
      const displayName = d.candidate_display_name || d.client_name || "Unfiled Documents";
      const entry = ensure(folder, displayName);
      const key = `${d.template_id || d.title || "doc"}`;
      if (!entry.docBuckets.has(key)) entry.docBuckets.set(key, []);
      entry.docBuckets.get(key)!.push(d);
    }
    for (const a of attachmentsQ.data || []) {
      const folder = a.candidate_folder || "_uncategorized";
      const displayName = a.candidate_display_name || folder;
      const entry = ensure(folder, displayName);
      const key = normalizeFileBase(a.original_filename) || a.id;
      if (!entry.attBuckets.has(key)) entry.attBuckets.set(key, []);
      entry.attBuckets.get(key)!.push(a);
    }
    let arr: Folder[] = Array.from(map.values()).map((e) => {
      const docGroups: DocGroup[] = Array.from(e.docBuckets.entries()).map(([key, rows]) => {
        const sorted = [...rows].sort((a, b) => (b.updated_at || b.created_at || "").localeCompare(a.updated_at || a.created_at || ""));
        return { key, latest: sorted[0], previous: sorted.slice(1) };
      });
      const attGroups: AttGroup[] = Array.from(e.attBuckets.entries()).map(([key, rows]) => {
        const sorted = [...rows].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        return { key, latest: sorted[0], previous: sorted.slice(1) };
      });
      const totalDocs = docGroups.reduce((n, g) => n + 1 + g.previous.length, 0);
      const totalAtts = attGroups.reduce((n, g) => n + 1 + g.previous.length, 0);
      return { folder: e.folder, displayName: e.displayName, docGroups, attGroups, totalDocs, totalAtts };
    });

    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.folder.toLowerCase().includes(q) ||
        f.docGroups.some((g) => (g.latest.title || g.latest.template_id || "").toLowerCase().includes(q)) ||
        f.attGroups.some((g) => (g.latest.original_filename || "").toLowerCase().includes(q))
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

  /* ─────────────── multi-select helpers ─────────────── */
  function toggleOne(k: SelKind, id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = selKey(k, id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function allKeysFor(f: Folder): string[] {
    const keys: string[] = [];
    for (const g of f.docGroups) {
      keys.push(selKey("doc", g.latest.id));
      for (const p of g.previous) keys.push(selKey("doc", p.id));
    }
    for (const g of f.attGroups) {
      keys.push(selKey("att", g.latest.id));
      for (const p of g.previous) keys.push(selKey("att", p.id));
    }
    return keys;
  }
  function folderSelState(f: Folder): "none" | "some" | "all" {
    const keys = allKeysFor(f);
    if (!keys.length) return "none";
    let hit = 0;
    for (const k of keys) if (selected.has(k)) hit++;
    if (hit === 0) return "none";
    if (hit === keys.length) return "all";
    return "some";
  }
  function toggleFolderAll(f: Folder) {
    const keys = allKeysFor(f);
    const state = folderSelState(f);
    setSelected((prev) => {
      const next = new Set(prev);
      if (state === "all") keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  }
  function selectAllGlobal() {
    const next = new Set<string>();
    for (const f of folders) for (const k of allKeysFor(f)) next.add(k);
    setSelected(next);
  }
  function clearSelection() { setSelected(new Set()); }

  async function runBulk(action: "delete" | "restore") {
    if (!selected.size) return;
    const items = Array.from(selected).map((k) => {
      const [kind, id] = k.split(":") as [SelKind, string];
      return { kind, id };
    });
    const verb = action === "delete" ? "Moving to Recently Deleted" : "Restoring";
    const t = toast.loading(`${verb} ${items.length} item${items.length === 1 ? "" : "s"}…`);
    let ok = 0, fail = 0;
    for (const it of items) {
      try {
        if (action === "delete") {
          if (it.kind === "doc") await softDelDoc.mutateAsync(it.id);
          else await softDelAtt.mutateAsync(it.id);
        } else {
          if (it.kind === "doc") await restoreDoc.mutateAsync(it.id);
          else await restoreAtt.mutateAsync(it.id);
        }
        ok++;
      } catch { fail++; }
    }
    const undoLabel = action === "delete" ? "Undo" : "Re-delete";
    const reverse: "delete" | "restore" = action === "delete" ? "restore" : "delete";
    const snapshot = items.slice();
    clearSelection();
    qc.invalidateQueries({ queryKey: ["candidate_folders_docs"] });
    qc.invalidateQueries({ queryKey: ["candidate_folders_attachments"] });
    toast.success(`${ok} done${fail ? ` · ${fail} failed` : ""}`, {
      id: t,
      action: {
        label: undoLabel,
        onClick: async () => {
          const tu = toast.loading(`${reverse === "delete" ? "Undoing restore" : "Undoing delete"}…`);
          for (const it of snapshot) {
            try {
              if (reverse === "delete") {
                if (it.kind === "doc") await softDelDoc.mutateAsync(it.id);
                else await softDelAtt.mutateAsync(it.id);
              } else {
                if (it.kind === "doc") await restoreDoc.mutateAsync(it.id);
                else await restoreAtt.mutateAsync(it.id);
              }
            } catch {}
          }
          qc.invalidateQueries({ queryKey: ["candidate_folders_docs"] });
          qc.invalidateQueries({ queryKey: ["candidate_folders_attachments"] });
          toast.success("Reverted", { id: tu });
        },
      },
    });
  }

  const selCount = selected.size;

  /* ─────────────── row renderers ─────────────── */
  const renderDocRow = (d: DocRow, opts: { previous?: boolean } = {}) => {
    const k = selKey("doc", d.id);
    const checked = selected.has(k);
    return (
      <div key={d.id} className={["flex items-center gap-2 rounded border px-3 py-2",
        opts.previous ? "border-[#B89555]/15 bg-[#FDFBF7]" : "border-[#B89555]/25 bg-[#F7F2EA]",
        checked ? "ring-1 ring-[#064E3B]/40" : "",
      ].join(" ")}>
        <Checkbox checked={checked} onCheckedChange={() => toggleOne("doc", d.id)} aria-label="Select document" />
        <FileText className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#1A1A1A] truncate">
            {d.title || d.template_id || "Untitled"}
            {opts.previous && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/45">prev</span>}
          </div>
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
              onClick={() => softDelDoc.mutate(d.id)}
              title="Move to Recently Deleted"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  };

  const renderAttRow = (a: CandidateAttachment, opts: { previous?: boolean } = {}) => {
    const k = selKey("att", a.id);
    const checked = selected.has(k);
    return (
      <div key={a.id} className={["flex items-center gap-2 rounded border px-3 py-2",
        opts.previous ? "border-[#B89555]/15 bg-[#FDFBF7]" : "border-[#B89555]/25 bg-[#F7F2EA]",
        checked ? "ring-1 ring-[#064E3B]/40" : "",
      ].join(" ")}>
        <Checkbox checked={checked} onCheckedChange={() => toggleOne("att", a.id)} aria-label="Select attachment" />
        <Paperclip className="w-4 h-4 text-[#1A1A1A]/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#1A1A1A] truncate">
            {a.original_filename || "Attachment"}
            {opts.previous && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/45">prev</span>}
          </div>
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
              onClick={() => softDelAtt.mutate(a.id)}
              title="Move to Recently Deleted"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
      <div className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Per-user vaults</div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Folders</h2>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5 max-w-2xl">
              One folder per person — only the latest version of each document is shown. Drag &amp; drop files onto a folder to add them; expand "Previous versions" to see history.
            </p>
          </div>
          <Button
            type="button"
            variant={showDeleted ? "primary" : "outline"}
            size="sm"
            style={{ width: 180, minWidth: 180 }}
            className="h-10 shrink-0 whitespace-nowrap !overflow-visible"
            onClick={() => { clearSelection(); setShowDeleted((v) => !v); }}
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

        {/* Selection toolbar */}
        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 py-2">
          <span className="text-xs text-[#1A1A1A]/70">
            {selCount > 0 ? <><span className="font-semibold text-[#1A1A1A]">{selCount}</span> selected</> : "Bulk actions"}
          </span>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-8" onClick={selectAllGlobal} disabled={!folders.length}>Select all</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={clearSelection} disabled={!selCount}>Unselect all</Button>
            {showDeleted ? (
              <Button size="sm" variant="primary" className="h-8" disabled={!selCount} onClick={() => runBulk("restore")}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore selected
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-8 text-red-700 border-red-200 hover:bg-red-50" disabled={!selCount} onClick={() => runBulk("delete")}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete selected
              </Button>
            )}
          </div>
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
            const selState = folderSelState(f);
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
                <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#EFE6D6] transition">
                  <Checkbox
                    checked={selState === "all" ? true : selState === "some" ? "indeterminate" : false}
                    onCheckedChange={() => toggleFolderAll(f)}
                    aria-label="Select all in folder"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={() => setOpenFolder(isOpen ? null : f.folder)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#1A1A1A]/60" /> : <ChevronRight className="w-4 h-4 text-[#1A1A1A]/60" />}
                    <FolderOpen className="w-5 h-5 text-[#B89555]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#1A1A1A] truncate">{f.displayName}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60">
                        {f.docGroups.length} document{f.docGroups.length === 1 ? "" : "s"} · {f.attGroups.length} attachment{f.attGroups.length === 1 ? "" : "s"}
                        {f.totalDocs + f.totalAtts > f.docGroups.length + f.attGroups.length ? ` · ${f.totalDocs + f.totalAtts} total versions` : ""}
                        {isDragOver ? " — drop to upload" : ""}
                      </div>
                    </div>
                  </button>
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
                </div>
                {isOpen && (
                  <div className="border-t border-[#B89555]/25 p-3 grid gap-2">
                    {f.docGroups.map((g) => {
                      const exKey = `doc:${f.folder}:${g.key}`;
                      const expanded = !!expandedVersions[exKey];
                      return (
                        <div key={g.key} className="grid gap-1.5">
                          {renderDocRow(g.latest)}
                          {g.previous.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpandedVersions((s) => ({ ...s, [exKey]: !expanded }))}
                                className="text-[11px] text-[#064E3B] hover:underline inline-flex items-center gap-1 ml-9"
                              >
                                <History className="w-3 h-3" />
                                {expanded ? "Hide" : "Show"} {g.previous.length} previous version{g.previous.length === 1 ? "" : "s"}
                              </button>
                              {expanded && (
                                <div className="grid gap-1.5 ml-9">
                                  {g.previous.map((p) => renderDocRow(p, { previous: true }))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                    {f.attGroups.map((g) => {
                      const exKey = `att:${f.folder}:${g.key}`;
                      const expanded = !!expandedVersions[exKey];
                      return (
                        <div key={g.key} className="grid gap-1.5">
                          {renderAttRow(g.latest)}
                          {g.previous.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpandedVersions((s) => ({ ...s, [exKey]: !expanded }))}
                                className="text-[11px] text-[#064E3B] hover:underline inline-flex items-center gap-1 ml-9"
                              >
                                <History className="w-3 h-3" />
                                {expanded ? "Hide" : "Show"} {g.previous.length} previous version{g.previous.length === 1 ? "" : "s"}
                              </button>
                              {expanded && (
                                <div className="grid gap-1.5 ml-9">
                                  {g.previous.map((p) => renderAttRow(p, { previous: true }))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                    {f.docGroups.length === 0 && f.attGroups.length === 0 && (
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
