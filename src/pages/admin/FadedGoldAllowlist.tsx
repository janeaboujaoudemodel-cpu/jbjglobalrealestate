/**
 * Faded-Gold Allowlist — Owner admin page.
 *
 * Lets the owner manage which files are permitted to keep faded-gold
 * styling (e.g. branded video watermarks) without editing CI scripts
 * directly. The CI guard reads scripts/contrast/faded-gold-allowlist.json,
 * so after editing here, use "Export JSON" and commit the file to keep
 * CI in sync.
 *
 * Owner-only. RLS-protected. Presentation + simple CRUD only.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Entry = {
  id: string;
  file_path: string;
  reason: string;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

const FILE_PATH_RE = /^src\/[\w\-./@]+\.(tsx?|jsx?)$/;

export default function FadedGoldAllowlist() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faded_gold_allowlist")
      .select("*")
      .order("file_path", { ascending: true });
    if (error) {
      toast.error(`Failed to load allowlist: ${error.message}`);
    } else {
      setRows((data || []) as Entry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.file_path.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const jsonExport = useMemo(() => {
    return JSON.stringify(
      {
        $comment:
          "Owner-managed allowlist for files permitted to use faded gold (text-[#1A1A1A]/XX where XX < 80). Synced from /admin/faded-gold-allowlist.",
        files: rows.map((r) => r.file_path).sort(),
      },
      null,
      2,
    ) + "\n";
  }, [rows]);

  const addEntry = async () => {
    const path = newPath.trim();
    if (!path) {
      toast.error("File path is required");
      return;
    }
    if (!FILE_PATH_RE.test(path)) {
      toast.error("Path must start with src/ and end with .ts(x) or .js(x)");
      return;
    }
    if (rows.some((r) => r.file_path === path)) {
      toast.error("That file is already on the allowlist");
      return;
    }
    setAdding(true);
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase.from("faded_gold_allowlist").insert({
      file_path: path,
      reason: newReason.trim(),
      added_by: userResp.user?.id ?? null,
    });
    setAdding(false);
    if (error) {
      toast.error(`Failed to add: ${error.message}`);
      return;
    }
    toast.success("Added to allowlist");
    setNewPath("");
    setNewReason("");
    load();
  };

  const updateReason = async (id: string, reason: string) => {
    const { error } = await supabase
      .from("faded_gold_allowlist")
      .update({ reason })
      .eq("id", id);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success("Reason updated");
    load();
  };

  const removeEntry = async (id: string, file: string) => {
    if (!window.confirm(`Remove ${file} from the allowlist?`)) return;
    const { error } = await supabase
      .from("faded_gold_allowlist")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success("Removed");
    load();
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonExport);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faded-gold-allowlist.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              to="/admin"
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
              aria-label="Back to admin"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/60">
                Design QA · CI guards
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                Faded-Gold Allowlist
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Files listed here are exempt from the faded-gold guard
                (<code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">text-[#1A1A1A]/XX</code> where{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">XX &lt; 80</code>). Only add
                legitimate branded watermarks. After saving, export the JSON and
                commit{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                  scripts/contrast/faded-gold-allowlist.json
                </code>{" "}
                so CI picks it up.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        {/* Add card */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#1A1A1A]/60" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">
              Add an exemption
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[2fr_3fr_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                File path
              </label>
              <Input
                placeholder="src/components/video-meet/JBJMeetRoom.tsx"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Reason (visible to auditors)
              </label>
              <Input
                placeholder="Branded watermark over dark video"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addEntry} disabled={adding} className="gap-2">
                <Plus className="h-4 w-4" />
                {adding ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Path must start with{" "}
            <code className="rounded bg-amber-50 px-1">src/</code> and end with{" "}
            <code className="rounded bg-amber-50 px-1">.tsx</code>,{" "}
            <code className="rounded bg-amber-50 px-1">.ts</code>,{" "}
            <code className="rounded bg-amber-50 px-1">.jsx</code>, or{" "}
            <code className="rounded bg-amber-50 px-1">.js</code>.
          </p>
        </section>

        {/* Entries table */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Current allowlist
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {rows.length}
                </span>
              </h2>
            </div>
            <Input
              placeholder="Filter by path or reason…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-[#FDFBF7]">
            {loading ? (
              <div className="p-10 text-center text-sm text-[#1A1A1A]/60">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#1A1A1A]/60">
                {rows.length === 0
                  ? "No exemptions yet. The guard rejects all faded-gold usage."
                  : "No entries match your filter."}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50">
                  <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/60">
                    <th className="px-4 py-3 font-semibold">File</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                    <th className="px-4 py-3 font-semibold">Added</th>
                    <th className="w-24 px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <Row key={r.id} entry={r} onSave={updateReason} onDelete={removeEntry} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Export */}
        <section className="rounded-2xl border border-zinc-200 bg-[#FDFBF7] p-6 text-zinc-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/70">
                Sync to CI
              </p>
              <h2 className="text-lg font-semibold text-white">Export to repository</h2>
              <p className="mt-1 text-xs text-[#1A1A1A]/70">
                Copy or download the JSON, then replace{" "}
                <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 text-[11px]">
                  scripts/contrast/faded-gold-allowlist.json
                </code>{" "}
                and commit. CI reads that file directly.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyJson}
                className="gap-2 border-[#B89555]/30 bg-[#FDFBF7] text-zinc-100 hover:bg-[#F7F2EA]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button
                size="sm"
                onClick={downloadJson}
                className="gap-2 bg-[#FDFBF7] text-zinc-900 hover:bg-zinc-200"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
          <pre className="max-h-72 overflow-auto rounded-lg bg-[#1A1A1A]/40 p-4 font-mono text-[11px] leading-relaxed text-zinc-200">
            {jsonExport}
          </pre>
        </section>
      </div>
    </div>
  );
}

function Row({
  entry,
  onSave,
  onDelete,
}: {
  entry: Entry;
  onSave: (id: string, reason: string) => void;
  onDelete: (id: string, file: string) => void;
}) {
  const [reason, setReason] = useState(entry.reason);
  const dirty = reason !== entry.reason;
  return (
    <tr className="border-b border-zinc-100 last:border-0 align-top">
      <td className="px-4 py-3 font-mono text-xs text-zinc-900">{entry.file_path}</td>
      <td className="px-4 py-3">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="min-h-[44px] resize-y text-xs"
          placeholder="Why is this file exempt?"
        />
      </td>
      <td className="px-4 py-3 text-xs text-[#1A1A1A]/60 whitespace-nowrap">
        {new Date(entry.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty}
            onClick={() => onSave(entry.id, reason)}
            className="h-8 gap-1.5"
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(entry.id, entry.file_path)}
            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
            aria-label={`Remove ${entry.file_path}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
