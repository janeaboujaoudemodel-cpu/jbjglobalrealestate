/**
 * Broker personal tasks — premium kanban with bulk actions, soft-delete,
 * recently-deleted tab and navy/champagne styling (no light blue).
 */
import { useMemo, useState } from "react";
import {
  useBrokerPersonalTasks, useCreateBrokerTask, useUpdateBrokerTask,
  useSoftDeleteBrokerTasks, useRestoreBrokerTasks, useDeleteBrokerTask,
  useBulkUpdateBrokerTasks,
  type BrokerTask, type TaskStatus,
} from "@/hooks/useBrokerPersonalTasks";
import {
  Plus, Trash2, Calendar as CalIcon, CheckCircle2, RotateCcw,
  Circle, ListChecks, Inbox,
} from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { id: TaskStatus; label: string; accent: string }[] = [
  { id: "todo",  label: "To Do",       accent: "#064E3B" },
  { id: "doing", label: "In Progress", accent: "#064E3B" },
  { id: "done",  label: "Done",        accent: "#064E3B" },
];

const PRIORITY_RING: Record<string, string> = {
  low:    "border-l-[#1A1A1A]/25",
  normal: "border-l-[#B89555]",
  high:   "border-l-amber-500",
  urgent: "border-l-red-500",
};

const PRIORITY_LABEL: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40" },
  normal: { label: "Normal", cls: "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40" },
  high:   { label: "High",   cls: "bg-amber-50 text-amber-900 border border-amber-300" },
  urgent: { label: "Urgent", cls: "bg-red-50 text-red-800 border border-red-300" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export default function BrokerTasks() {
  const tasks = useBrokerPersonalTasks();
  const create = useCreateBrokerTask();
  const update = useUpdateBrokerTask();
  const softDel = useSoftDeleteBrokerTasks();
  const restore = useRestoreBrokerTasks();
  const hardDel = useDeleteBrokerTask();
  const bulk = useBulkUpdateBrokerTasks();

  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState({ title: "", priority: "normal", due_at: "" });

  const all = tasks.data ?? [];
  const active = useMemo(() => all.filter((t) => !t.deleted_at), [all]);
  const deleted = useMemo(() => all.filter((t) => !!t.deleted_at), [all]);
  const visible = tab === "active" ? active : deleted;

  const toggleOne = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSel = () => setSelected(new Set());
  const allVisibleSelected = visible.length > 0 && visible.every((t) => selected.has(t.id));
  const toggleAllVisible = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) visible.forEach((t) => n.delete(t.id));
      else visible.forEach((t) => n.add(t.id));
      return n;
    });

  const submit = async () => {
    if (!draft.title.trim()) return;
    await create.mutateAsync({
      title: draft.title.trim(),
      priority: draft.priority as any,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
    });
    setDraft({ title: "", priority: "normal", due_at: "" });
  };

  const selectedIds = Array.from(selected);
  const selCount = selectedIds.length;

  const doBulk = async (kind: "complete" | "uncomplete" | "delete" | "restore" | "purge") => {
    if (selCount === 0) return;
    try {
      if (kind === "complete")   await bulk.mutateAsync({ ids: selectedIds, patch: { status: "done" } });
      if (kind === "uncomplete") await bulk.mutateAsync({ ids: selectedIds, patch: { status: "todo" } });
      if (kind === "delete")     await softDel.mutateAsync(selectedIds);
      if (kind === "restore")    await restore.mutateAsync(selectedIds);
      if (kind === "purge")      await hardDel.mutateAsync(selectedIds);
      toast.success("Done");
      clearSel();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Tasks</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Track your personal follow-ups. Private to you and the owner.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-1">
          <TabBtn active={tab === "active"} onClick={() => { setTab("active"); clearSel(); }} icon={ListChecks}>
            Active <span className="ml-1 text-[#1A1A1A]/60">({active.length})</span>
          </TabBtn>
          <TabBtn active={tab === "deleted"} onClick={() => { setTab("deleted"); clearSel(); }} icon={Trash2}>
            Recently Deleted <span className="ml-1 text-[#1A1A1A]/60">({deleted.length})</span>
          </TabBtn>
        </div>
      </header>

      {/* Composer — active tab only */}
      {tab === "active" && (
        <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/30 p-3 flex flex-col md:flex-row gap-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="New task title…"
            className="flex-1 bg-[#FDFBF7] border border-[#B89555]/30 rounded-md px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 focus:outline-none focus:border-[color:var(--emerald-1)]"
          />
          <select
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
            className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-md px-3 py-2 text-sm text-[#1A1A1A]"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={draft.due_at}
            onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
            className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-md px-3 py-2 text-sm text-[#1A1A1A]"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.title.trim() || create.isPending}
            data-allow-dark-cta
            className="jj-surface-emerald allow-white inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="h-4 w-4" /> Add task
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {visible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30 px-3 py-2">
          <button
            type="button"
            onClick={toggleAllVisible}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1A1A] hover:text-[color:var(--emerald-1)]"
          >
            {allVisibleSelected ? <CheckCircle2 className="h-4 w-4 text-[color:var(--emerald-1)]" /> : <Circle className="h-4 w-4" />}
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs text-[#1A1A1A]/55">
            {selCount > 0 ? `${selCount} selected` : `${visible.length} ${tab === "active" ? "active" : "deleted"} tasks`}
          </span>
          {selCount > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {tab === "active" ? (
                <>
                  <BulkBtn onClick={() => doBulk("complete")}>Mark completed</BulkBtn>
                  <BulkBtn onClick={() => doBulk("uncomplete")}>Mark not completed</BulkBtn>
                  <BulkBtn onClick={() => doBulk("delete")} danger>Delete</BulkBtn>
                </>
              ) : (
                <>
                  <BulkBtn onClick={() => doBulk("restore")}>Restore</BulkBtn>
                  <BulkBtn
                    onClick={() => {
                      if (confirm(`Permanently delete ${selCount} task(s)? This cannot be undone.`)) doBulk("purge");
                    }}
                    danger
                  >
                    Delete permanently
                  </BulkBtn>
                </>
              )}
              <button onClick={clearSel} className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-2">Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {tab === "active" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const items = active.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/30 min-h-[420px] flex flex-col">
                <div className="jj-surface-emerald allow-white px-4 py-3 border-b border-white/15 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: col.accent }} />
                    <span className="text-xs uppercase tracking-[0.18em] font-semibold text-white">{col.label}</span>
                  </div>
                  <span className="text-[11px] text-white/85 tabular-nums">{items.length}</span>
                </div>
                <div className="p-3 space-y-2 flex-1">
                  {items.map((t) => (
                    <TaskCard
                      key={t.id} task={t}
                      selected={selected.has(t.id)}
                      onToggle={() => toggleOne(t.id)}
                      onStatus={(s) => update.mutate({ id: t.id, status: s })}
                      onDelete={() => softDel.mutate([t.id])}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-[#1A1A1A]/45 text-center py-10">No tasks here.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/30">
          {deleted.length === 0 ? (
            <div className="text-center py-16 text-[#1A1A1A]/65">
              <Inbox className="h-8 w-8 mx-auto mb-3 text-[#1A1A1A]/50" />
              <p className="font-semibold text-[#1A1A1A]">Nothing here</p>
              <p className="text-xs mt-1">Deleted tasks will appear here for restoration.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#B89555]/25">
              {deleted.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleOne(t.id)} aria-label="Select task">
                    {selected.has(t.id)
                      ? <CheckCircle2 className="h-4 w-4 text-[color:var(--emerald-1)]" />
                      : <Circle className="h-4 w-4 text-[#1A1A1A]/45" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1A1A1A] line-through truncate">{t.title}</div>
                    <div className="text-[11px] text-[#1A1A1A]/55">
                      Deleted {fmtDate(t.deleted_at)}{t.due_at ? ` · was due ${fmtDate(t.due_at)}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => restore.mutate([t.id])}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete permanently?")) hardDel.mutate(t.id); }}
                    className="p-1.5 rounded hover:bg-red-50 text-[#1A1A1A]/60 hover:text-red-600"
                    aria-label="Delete permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task: t, selected, onToggle, onStatus, onDelete,
}: {
  task: BrokerTask;
  selected: boolean;
  onToggle: () => void;
  onStatus: (s: TaskStatus) => void;
  onDelete: () => void;
}) {
  const pr = PRIORITY_LABEL[t.priority] ?? PRIORITY_LABEL.normal;
  return (
    <div
      className={`bg-[#FDFBF7] rounded-md p-3 border border-[#B89555]/25 border-l-4 ${PRIORITY_RING[t.priority]} ${
        selected ? "ring-2 ring-[color:var(--emerald-1)]/45" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5 shrink-0" aria-label="Select task">
          {selected
            ? <CheckCircle2 className="h-4 w-4 text-[color:var(--emerald-1)]" />
            : <Circle className="h-4 w-4 text-[#1A1A1A]/40" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium text-[#1A1A1A] ${t.status === "done" ? "line-through opacity-70" : ""}`}>
            {t.title}
          </div>
          {t.description && <p className="text-xs text-[#1A1A1A]/70 mt-1">{t.description}</p>}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${pr.cls}`}>{pr.label}</span>
            {t.due_at && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#1A1A1A]/75 bg-[#EFE6D6] border border-[#B89555]/35 px-1.5 py-0.5 rounded">
                <CalIcon className="h-3 w-3" /> {fmtDate(t.due_at)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#B89555]/20">
        <select
          value={t.status}
          onChange={(e) => onStatus(e.target.value as TaskStatus)}
          className="text-[11px] bg-[#FDFBF7] border border-[#B89555]/35 rounded px-2 py-1 text-[#1A1A1A] focus:outline-none focus:border-[color:var(--emerald-1)]"
        >
          <option value="todo">To Do</option>
          <option value="doing">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-[#1A1A1A]/60 hover:text-red-600 hover:bg-red-50"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-surface={active ? "emerald" : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
        active
          ? "jj-surface-emerald allow-white text-white [&_svg]:text-white [&_svg]:stroke-white border border-white/20 shadow-[0_10px_22px_-14px_rgba(6,78,59,0.75)]"
          : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );

}

function BulkBtn({
  onClick, danger, children,
}: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
        danger
          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          : "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#E6DAC2]"
      }`}
    >
      {children}
    </button>
  );
}
