/**
 * BrokerMergeReviewPanel — duplicate review screen used by the broker upload
 * flow. Shows side-by-side existing vs new with confidence + reasons, and lets
 * the user choose Merge / Keep Separate / Edit Before Merge / Skip per row.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitMerge, UserPlus, Pencil, X, AlertTriangle } from "lucide-react";

export interface StagingRow {
  id: string;
  batch_id: string;
  raw: any;
  normalized: any;
  edited?: any;
  match_agent_id: string | null;
  match_confidence: number;
  match_reasons: string[];
  decision: "pending" | "merge" | "keep" | "edit" | "skip";
  matched_agent?: {
    id: string; name?: string | null; email?: string | null;
    phone?: string | null; whatsapp?: string | null;
    brokerage_id?: string | null; specialty_labels?: string[];
  } | null;
}

interface Props {
  rows: StagingRow[];
  onChange: (rows: StagingRow[]) => void;
}

export default function BrokerMergeReviewPanel({ rows, onChange }: Props) {
  const [filter, setFilter] = useState<"all" | "duplicates" | "new">("duplicates");
  const filtered = useMemo(() => {
    if (filter === "duplicates") return rows.filter((r) => r.match_agent_id);
    if (filter === "new") return rows.filter((r) => !r.match_agent_id);
    return rows;
  }, [rows, filter]);

  const counts = useMemo(() => ({
    total: rows.length,
    duplicates: rows.filter((r) => r.match_agent_id).length,
    fresh: rows.filter((r) => !r.match_agent_id).length,
    pending: rows.filter((r) => r.decision === "pending").length,
  }), [rows]);

  const setDecision = (id: string, decision: StagingRow["decision"]) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, decision } : r)));

  const bulk = (decision: StagingRow["decision"]) =>
    onChange(rows.map((r) => (r.match_agent_id ? { ...r, decision } : r)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3">
        <div className="flex flex-wrap gap-2 text-xs text-[#1A1A1A]">
          <Tag label="Total" value={counts.total} />
          <Tag label="Duplicates" value={counts.duplicates} tone="amber" />
          <Tag label="New" value={counts.fresh} tone="emerald" />
          {counts.pending > 0 && <Tag label="Pending" value={counts.pending} tone="red" />}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={filter === "duplicates" ? "gold" : "outline"} onClick={() => setFilter("duplicates")}>Duplicates</Button>
          <Button size="sm" variant={filter === "new" ? "gold" : "outline"} onClick={() => setFilter("new")}>New</Button>
          <Button size="sm" variant={filter === "all" ? "gold" : "outline"} onClick={() => setFilter("all")}>All</Button>
        </div>
      </div>

      {counts.duplicates > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Button size="sm" variant="outline" onClick={() => bulk("merge")}>Merge all duplicates</Button>
          <Button size="sm" variant="outline" onClick={() => bulk("keep")}>Keep all separate</Button>
        </div>
      )}

      <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-[#B89555]/30 bg-white">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-[#1A1A1A]/60 py-8">No rows in this view.</div>
        )}
        {filtered.map((r) => (
          <RowCard key={r.id} row={r} onDecision={(d) => setDecision(r.id, d)} onEdit={(field, value) => {
            onChange(rows.map((x) => x.id === r.id ? { ...x, edited: { ...(x.edited ?? x.normalized), [field]: value }, decision: x.decision === "pending" ? "edit" : x.decision } : x));
          }} />
        ))}
      </div>
    </div>
  );
}

function RowCard({ row, onDecision, onEdit }: { row: StagingRow; onDecision: (d: StagingRow["decision"]) => void; onEdit: (field: string, value: string) => void }) {
  const [editMode, setEditMode] = useState(false);
  const incoming = row.edited ?? row.normalized ?? row.raw ?? {};
  const existing = row.matched_agent;
  const conf = Math.round((row.match_confidence || 0) * 100);
  const recommended: StagingRow["decision"] = row.match_confidence >= 0.95 ? "merge"
    : row.match_confidence >= 0.6 ? "merge" : "keep";

  return (
    <div className="border-b border-[#B89555]/15 p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs">
          {existing ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-semibold text-[#1A1A1A]">Possible duplicate · {conf}%</span>
              <span className="text-[#1A1A1A]/60">{row.match_reasons.join(" · ")}</span>
              <span className="text-[#1A1A1A]/60">· recommended: <b>{recommended === "merge" ? "Merge" : "Keep"}</b></span>
            </>
          ) : (
            <span className="text-emerald-700 font-semibold">New broker</span>
          )}
        </div>
        <div className="flex gap-1">
          {existing && (
            <Button size="sm" variant={row.decision === "merge" ? "gold" : "outline"} onClick={() => onDecision("merge")}>
              <GitMerge className="w-3 h-3 mr-1" /> Merge
            </Button>
          )}
          <Button size="sm" variant={row.decision === "keep" ? "gold" : "outline"} onClick={() => onDecision("keep")}>
            <UserPlus className="w-3 h-3 mr-1" /> Keep separate
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditMode((v) => !v)}>
            <Pencil className="w-3 h-3 mr-1" /> {editMode ? "Done" : "Edit"}
          </Button>
          <Button size="sm" variant={row.decision === "skip" ? "gold" : "outline"} onClick={() => onDecision("skip")}>
            <X className="w-3 h-3 mr-1" /> Skip
          </Button>
        </div>
      </div>

      <div className={`grid ${existing ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
        {existing && (
          <Column title="Existing" tone="champagne">
            <Field k="Name" v={existing.name} />
            <Field k="Phone" v={existing.phone} />
            <Field k="WhatsApp" v={existing.whatsapp} />
            <Field k="Email" v={existing.email} />
            <Field k="Labels" v={(existing.specialty_labels ?? []).join(", ")} />
          </Column>
        )}
        <Column title="New (this upload)" tone="white">
          {editMode ? (
            <>
              <EditField k="Name" v={incoming.name} onChange={(v) => onEdit("name", v)} />
              <EditField k="Phone" v={incoming.phone} onChange={(v) => onEdit("phone", v)} />
              <EditField k="WhatsApp" v={incoming.whatsapp} onChange={(v) => onEdit("whatsapp", v)} />
              <EditField k="Email" v={incoming.email} onChange={(v) => onEdit("email", v)} />
            </>
          ) : (
            <>
              <Field k="Name" v={incoming.name} />
              <Field k="Phone" v={incoming.phone} />
              <Field k="WhatsApp" v={incoming.whatsapp} />
              <Field k="Email" v={incoming.email} />
              <Field k="Source" v={incoming.file} />
            </>
          )}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, tone, children }: { title: string; tone: "champagne" | "white"; children: React.ReactNode }) {
  return (
    <div className={`rounded-md border border-[#B89555]/25 ${tone === "champagne" ? "bg-[#F7F2EA]" : "bg-[#FDFBF7]"} p-2 space-y-1`}>
      <div className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/60">{title}</div>
      {children}
    </div>
  );
}
function Field({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-16 text-[#1A1A1A]/60">{k}</span>
      <span className="text-[#1A1A1A] truncate">{v || "—"}</span>
    </div>
  );
}
function EditField({ k, v, onChange }: { k: string; v: any; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-[#1A1A1A]/60">{k}</span>
      <Input className="h-7 text-xs" value={v ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Tag({ label, value, tone = "ink" }: { label: string; value: number; tone?: "ink" | "amber" | "emerald" | "red" }) {
  const map: Record<string, string> = {
    ink: "bg-white border-[#B89555]/30 text-[#1A1A1A]",
    amber: "bg-amber-50 border-amber-300 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-900",
    red: "bg-red-50 border-red-300 text-red-900",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border ${map[tone]}`}>
      {label}: <b>{value}</b>
    </span>
  );
}
